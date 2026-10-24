import {
  json,
  error,
  parseBody,
  HttpError,
  require,
  round6,
  WEEKLY_PAYMENT,
  WEEKDAYS,
} from "./lib.js";
import { pool, withTransaction } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  userIdFromRequest,
  publicUser,
} from "./auth.js";
import {
  createOnrampOrder,
  createOfframpOrder,
  DEPOSIT_ADDRESS,
  PAYCREST_LIVE,
} from "./paycrest.js";
import * as store from "./store.js";

const CRON_SECRET = process.env.CRON_SECRET;

async function settleAutopayFor(userId) {
  await withTransaction((client) => store.settleDueAutoPay(client, userId));
}

async function getAutopay(userId) {
  const { rows } = await pool.query(
    `SELECT amount, weekday, last_debited_at, created_at FROM autopay_schedules WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) return null;
  return {
    amount: Number(rows[0].amount),
    weekday: rows[0].weekday,
    lastDebitedAt: rows[0].last_debited_at,
    createdAt: rows[0].created_at,
  };
}

async function register(body) {
  const { firstName, lastName, phone, email, password, pin } = body;
  require(firstName && lastName, "First and last name are required");
  require(phone, "Phone number is required");
  require(password && password.length >= 6, "Password must be at least 6 characters");
  const passwordHash = await hashPassword(password);
  const pinHash = pin ? await hashPassword(pin) : null;
  const { rows } = await pool.query(
    `INSERT INTO users
       (first_name, last_name, phone, email, password_hash, withdrawal_pin, verification_status, eligible_score)
     VALUES ($1, $2, $3, $4, $5, $6, 'not_started', $7)
     ON CONFLICT (phone) DO NOTHING
     RETURNING id, first_name, last_name, phone, email, withdrawal_pin, verification_status, eligible_score`,
    [
      firstName,
      lastName,
      phone,
      email || null,
      passwordHash,
      pinHash,
      store.initialScore(),
    ]
  );
  if (!rows[0]) {
    throw new HttpError("An account with that phone number already exists", 409, "phone_taken");
  }
  await store.ensureBalanceRow(pool, rows[0].id);
  return json({
    token: signToken(rows[0].id),
    user: publicUser(rows[0]),
    balance: 0,
  });
}

async function login(body) {
  const { identifier, password } = body;
  require(identifier && password, "Phone or email and password are required");
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE phone = $1 OR email = $2 LIMIT 1`,
    [identifier, identifier]
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError("Invalid credentials", 401, "invalid_credentials");
  }
  const balance = await store.getBalance(pool, user.id);
  return json({ token: signToken(user.id), user: publicUser(user), balance });
}

async function me(ctx) {
  const userId = userIdFromRequest(ctx.request);
  await settleAutopayFor(userId);
  const user = await store.getUserById(pool, userId);
  require(user, "Account not found", 404, "not_found");
  const balance = await store.getBalance(pool, userId);
  const autopay = await getAutopay(userId);
  return json({ user: publicUser(user), balance, autopay });
}

async function setPin(ctx) {
  const userId = userIdFromRequest(ctx.request);
  const { pin } = ctx.body;
  require(pin && /^\d{4}$/.test(pin), "PIN must be 4 digits");
  await pool.query(`UPDATE users SET withdrawal_pin = $2 WHERE id = $1`, [
    userId,
    await hashPassword(pin),
  ]);
  return json({ ok: true });
}

async function getVerification(ctx) {
  const userId = userIdFromRequest(ctx.request);
  const user = await store.getUserById(pool, userId);
  require(user, "Account not found", 404, "not_found");
  return json({ status: user.verification_status });
}

async function submitVerification(ctx) {
  const userId = userIdFromRequest(ctx.request);
  await pool.query(
    `UPDATE users SET verification_status = 'in_progress' WHERE id = $1`,
    [userId]
  );
  return json({ status: "in_progress" });
}

async function approveVerification(ctx) {
  const userId = userIdFromRequest(ctx.request);
  await pool.query(
    `UPDATE users SET verification_status = 'approved' WHERE id = $1`,
    [userId]
  );
  return json({ status: "approved" });
}

async function getBalance(ctx) {
  const userId = userIdFromRequest(ctx.request);
  await settleAutopayFor(userId);
  const balance = await store.getBalance(pool, userId);
  return json({ balance, usdc: balance });
}

async function getDepositAddress(ctx) {
  userIdFromRequest(ctx.request);
  return json({ address: DEPOSIT_ADDRESS });
}

async function deposit(ctx) {
  const userId = userIdFromRequest(ctx.request);
  const { amount, method } = ctx.body;
  require(amount > 0, "Enter a valid amount");
  require(method === "bank" || method === "crypto", "Invalid deposit method");

  const order = await createOnrampOrder({ amount });
  const completed = order.status === "completed";

  const result = await withTransaction(async (client) => {
    await store.ensureBalanceRow(client, userId);
    if (completed) {
      await store.creditBalance(client, userId, amount);
    }
    const tx = await store.insertTransaction(client, {
      userId,
      type: "deposit",
      amount,
      status: completed ? "completed" : "pending",
      source: method,
      externalRef: order.id,
      meta: { direction: "onramp", mode: order.mode },
    });
    const balance = await store.getBalance(client, userId);
    return { transaction: tx, balance };
  });

  return json({
    ...result,
    paycrest: order.mode === "live" ? { id: order.id, status: order.status } : undefined,
    live: PAYCREST_LIVE,
  });
}

async function withdraw(ctx) {
  const userId = userIdFromRequest(ctx.request);
  const { amount, method, destination, pin } = ctx.body;
  require(amount > 0, "Enter a valid amount");
  require(method === "bank" || method === "crypto", "Invalid withdrawal method");

  const user = await store.getUserById(pool, userId);
  require(user, "Account not found", 404, "not_found");
  if (!user.withdrawal_pin) {
    throw new HttpError("Set your withdrawal PIN first", 400, "pin_not_set");
  }
  require(pin && (await verifyPassword(pin, user.withdrawal_pin)), "Incorrect PIN", 400, "invalid_pin");

  const result = await withTransaction(async (client) => {
    await store.ensureBalanceRow(client, userId);
    const balance = await store.getBalance(client, userId);
    if (amount > balance) {
      const err = new Error("Insufficient balance");
      err.code = "insufficient_balance";
      throw err;
    }
    const order = await createOfframpOrder({ amount, destination });
    const completed = order.status === "completed";
    await store.debitBalance(client, userId, amount);
    const tx = await store.insertTransaction(client, {
      userId,
      type: "withdrawal",
      amount,
      status: completed ? "completed" : "pending",
      source: method,
      externalRef: order.id,
      meta: { direction: "offramp", mode: order.mode, destination },
    });
    const newBalance = await store.getBalance(client, userId);
    return { transaction: tx, balance: newBalance };
  });

  return json({ ...result, live: PAYCREST_LIVE });
}

async function listPayments(ctx) {
  const userId = userIdFromRequest(ctx.request);
  await settleAutopayFor(userId);
  const payments = await store.listPayments(pool, userId);
  return json({ payments });
}

async function payNow(ctx) {
  const userId = userIdFromRequest(ctx.request);
  const { amount } = ctx.body;
  require(amount > 0, "Enter a valid amount");

  const result = await withTransaction(async (client) => {
    const tx = await store.payTowards3rike(client, userId, amount, "manual");
    const balance = await store.getBalance(client, userId);
    const user = await store.getUserById(client, userId);
    return { transaction: tx, balance, score: Number(user.eligible_score) };
  });
  return json(result);
}

async function getAutoPay(ctx) {
  const userId = userIdFromRequest(ctx.request);
  return json({ autopay: await getAutopay(userId) });
}

async function setAutoPay(ctx) {
  const userId = userIdFromRequest(ctx.request);
  const { amount, weekday } = ctx.body;
  require(amount >= WEEKLY_PAYMENT, `Minimum is your weekly fee of $${WEEKLY_PAYMENT}`);
  require(WEEKDAYS.includes(weekday), "Invalid weekday");
  await pool.query(
    `INSERT INTO autopay_schedules (user_id, amount, weekday, last_debited_at)
     VALUES ($1, $2, $3, CURRENT_DATE)
     ON CONFLICT (user_id) DO UPDATE SET amount = EXCLUDED.amount, weekday = EXCLUDED.weekday, updated_at = now()`,
    [userId, round6(amount), weekday]
  );
  return json({ autopay: await getAutopay(userId) });
}

async function clearAutoPay(ctx) {
  const userId = userIdFromRequest(ctx.request);
  await pool.query(`DELETE FROM autopay_schedules WHERE user_id = $1`, [userId]);
  return json({ autopay: null });
}

async function cronAutoPay(ctx) {
  if (CRON_SECRET) {
    require(
      ctx.request.headers.get("x-cron-secret") === CRON_SECRET,
      "Unauthorized",
      401,
      "unauthorized"
    );
  }
  const { rows } = await pool.query(`SELECT user_id FROM autopay_schedules`);
  let settled = 0;
  let missed = 0;
  for (const row of rows) {
    const entries = await withTransaction((client) =>
      store.settleDueAutoPay(client, row.user_id)
    );
    for (const e of entries) {
      if (e.status === "missed") missed += 1;
      else settled += 1;
    }
  }
  return json({ ok: true, settled, missed });
}

async function health() {
  let db = "up";
  try {
    await pool.query("SELECT 1");
  } catch {
    db = "down";
  }
  return json({ ok: true, db, live: PAYCREST_LIVE });
}

async function paycrestWebhook(ctx) {
  const { orderId, status, type } = ctx.body || {};
  require(orderId, "orderId required");
  const { rows } = await pool.query(
    `SELECT id, user_id, type, amount, status FROM transactions WHERE external_ref = $1 LIMIT 1`,
    [orderId]
  );
  if (rows.length === 0) return json({ ok: true, ignored: true });
  const tx = rows[0];
  if (status === "completed" && tx.status !== "completed") {
    await withTransaction(async (client) => {
      if (tx.type === "deposit") {
        await store.creditBalance(client, tx.user_id, Number(tx.amount));
      }
      await client.query(
        `UPDATE transactions SET status = 'completed' WHERE id = $1`,
        [tx.id]
      );
    });
  }
  return json({ ok: true, type });
}

const ROUTES = {
  "POST /api/auth/register": register,
  "POST /api/auth/login": login,
  "GET /api/me": me,
  "POST /api/me/pin": setPin,
  "GET /api/verification": getVerification,
  "POST /api/verification/submit": submitVerification,
  "POST /api/verification/approve": approveVerification,
  "GET /api/balance": getBalance,
  "GET /api/deposit/address": getDepositAddress,
  "POST /api/deposit": deposit,
  "POST /api/withdraw": withdraw,
  "GET /api/payments": listPayments,
  "POST /api/payments/pay": payNow,
  "GET /api/autopay": getAutoPay,
  "POST /api/autopay": setAutoPay,
  "DELETE /api/autopay": clearAutoPay,
  "POST /api/cron/autopay": cronAutoPay,
  "POST /api/paycrest/webhook": paycrestWebhook,
  "GET /api/health": health,
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const key = `${request.method} ${path}`;
    const handler = ROUTES[key];
    if (!handler) {
      return error("Not found", 404, "not_found");
    }
    const ctx = { request, body: await parseBody(request) };
    try {
      return await handler(ctx);
    } catch (e) {
      if (e instanceof HttpError) return error(e.message, e.status, e.code);
      if (e.code === "insufficient_balance") return error(e.message, 400, e.code);
      console.error(e);
      return error("Internal error", 500, "internal");
    }
  },
};
