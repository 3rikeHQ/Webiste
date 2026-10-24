CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text UNIQUE,
  password_hash text NOT NULL,
  withdrawal_pin text,
  verification_status text NOT NULL DEFAULT 'not_started',
  eligible_score integer NOT NULL DEFAULT 200,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS balances (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  usdc numeric(18, 6) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(18, 6) NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  source text,
  external_ref text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS autopay_schedules (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(18, 6) NOT NULL,
  weekday text NOT NULL,
  last_debited_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
