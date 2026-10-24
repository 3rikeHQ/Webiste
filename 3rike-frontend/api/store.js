import { MAX_SCORE, round6, STARTING_SCORE, WEEKDAYS, WEEKLY_PAYMENT } from "./lib.js";

export async function ensureBalanceRow(client, userId) {
  await client.query(
    `INSERT INTO balances (user_id, usdc) VALUES ($1, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

export async function getBalance(client, userId) {
  const { rows } = await client.query(
    `SELECT usdc FROM balances WHERE user_id = $1`,
    [userId]
  );
  return round6(rows[0] ? Number(rows[0].usdc) : 0);
}

export async function getUserById(client, userId) {
  const { rows } = await client.query(
    `SELECT id, first_name, last_name, phone, email, withdrawal_pin,
            verification_status, eligible_score, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function insertTransaction(client, tx) {
  const { rows } = await client.query(
    `INSERT INTO transactions
       (user_id, type, amount, status, source, external_ref, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, created_at`,
    [
      tx.userId,
      tx.type,
      round6(tx.amount),
      tx.status || "completed",
      tx.source || null,
      tx.externalRef || null,
      JSON.stringify(tx.meta || {}),
    ]
  );
  return rows[0];
}

export async function creditBalance(client, userId, amount) {
  await client.query(
    `UPDATE balances SET usdc = usdc + $2, updated_at = now() WHERE user_id = $1`,
    [userId, round6(amount)]
  );
}

export async function debitBalance(client, userId, amount) {
  await client.query(
    `UPDATE balances SET usdc = usdc - $2, updated_at = now() WHERE user_id = $1`,
    [userId, round6(amount)]
  );
}

export async function bumpScore(client, userId, weeks) {
  if (!(weeks > 0)) return;
  await client.query(
    `UPDATE users SET eligible_score = LEAST($2, eligible_score + $3) WHERE id = $1`,
    [userId, MAX_SCORE, weeks * 10]
  );
}

export async function payTowards3rike(client, userId, amount, source) {
  await ensureBalanceRow(client, userId);
  const balance = await getBalance(client, userId);
  if (!(amount > 0) || amount > balance) {
    const err = new Error("Insufficient balance");
    err.code = "insufficient_balance";
    err.status = 400;
    throw err;
  }
  await debitBalance(client, userId, amount);
  const tx = await insertTransaction(client, {
    userId,
    type: "payment",
    amount,
    status: "completed",
    source,
    meta: {},
  });
  const weeks = Math.floor(amount / WEEKLY_PAYMENT);
  await bumpScore(client, userId, weeks);
  return tx;
}

function mostRecentWeekday(weekday, today) {
  const target = WEEKDAYS.indexOf(weekday);
  if (target < 0) return null;
  const date = new Date(today);
  date.setHours(0, 0, 0, 0);
  const targetJsDay = target === 6 ? 0 : target + 1;
  const diff = (date.getDay() - targetJsDay + 7) % 7;
  date.setDate(date.getDate() - diff);
  return date;
}

function toDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function settleDueAutoPay(client, userId) {
  const { rows } = await client.query(
    `SELECT amount, weekday, last_debited_at FROM autopay_schedules WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) return [];
  const schedule = rows[0];
  const amount = Number(schedule.amount);
  const weekday = schedule.weekday;
  const today = new Date();
  const due = mostRecentWeekday(weekday, today);
  if (!due) return [];

  const lastKey = schedule.last_debited_at
    ? toDateKey(schedule.last_debited_at)
    : null;
  const dueKey = toDateKey(due);
  if (lastKey === dueKey) return [];

  await ensureBalanceRow(client, userId);
  const balance = await getBalance(client, userId);

  const entries = [];
  if (balance >= amount) {
    await debitBalance(client, userId, amount);
    const tx = await insertTransaction(client, {
      userId,
      type: "autopay",
      amount,
      status: "completed",
      source: "auto",
      meta: { weekday, due: dueKey },
    });
    const weeks = Math.floor(amount / WEEKLY_PAYMENT);
    await bumpScore(client, userId, weeks);
    entries.push({ id: tx.id, amount, status: "completed", due: dueKey });
  } else {
    await insertTransaction(client, {
      userId,
      type: "autopay",
      amount,
      status: "missed",
      source: "auto",
      meta: { weekday, due: dueKey },
    });
    entries.push({ amount, status: "missed", due: dueKey });
  }

  await client.query(
    `UPDATE autopay_schedules SET last_debited_at = $2 WHERE user_id = $1`,
    [userId, dueKey]
  );
  return entries;
}

export async function listPayments(client, userId, limit = 50) {
  const { rows } = await client.query(
    `SELECT id, type, amount, status, source, external_ref, meta, created_at
     FROM transactions
     WHERE user_id = $1 AND type IN ('payment', 'autopay')
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    status: r.status,
    source: r.source,
    createdAt: r.created_at,
    meta: r.meta,
  }));
}

export async function listActivity(client, userId, limit = 50) {
  const { rows } = await client.query(
    `SELECT id, type, amount, status, source, external_ref, meta, created_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    status: r.status,
    source: r.source,
    externalRef: r.external_ref,
    createdAt: r.created_at,
    meta: r.meta,
  }));
}

export function initialScore() {
  return STARTING_SCORE;
}
