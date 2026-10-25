import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  max: 4,
  connectionTimeoutMillis: 8000,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

function error(message, status = 400, code) {
  return json({ error: message, code }, status);
}

async function ensureTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS waitlist_emails (
       id bigserial PRIMARY KEY,
       email text NOT NULL UNIQUE,
       created_at timestamptz NOT NULL DEFAULT now()
     )`
  );
}

async function subscribe(email) {
  await ensureTable();
  await pool.query(
    `INSERT INTO waitlist_emails (email) VALUES ($1)
     ON CONFLICT (email) DO NOTHING`,
    [email]
  );
  return json({ ok: true });
}

async function health() {
  let db = "up";
  try {
    await pool.query("SELECT 1");
  } catch {
    db = "down";
  }
  return json({ ok: true, db });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (request.method === "POST" && path === "/api/waitlist") {
        const body = await request.json().catch(() => ({}));
        const raw = body && typeof body.email === "string" ? body.email : "";
        const email = raw.trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
          return error("Enter a valid email address", 400, "invalid_email");
        }
        return await subscribe(email);
      }
      if (request.method === "GET" && path === "/api/health") {
        return await health();
      }
      return error("Not found", 404, "not_found");
    } catch (e) {
      console.error(e);
      return error("Internal error", 500, "internal");
    }
  },
};
