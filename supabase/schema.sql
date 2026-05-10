-- ============================================================
-- Personal Finance Tracker — Supabase Schema
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

-- transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL CHECK (type IN ('expense', 'income', 'savings')),
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category    TEXT        NOT NULL,
  date        DATE        NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Generated columns for efficient year/month filtering
  year        INTEGER     GENERATED ALWAYS AS (EXTRACT(YEAR  FROM date)::INTEGER) STORED,
  month       INTEGER     GENERATED ALWAYS AS (EXTRACT(MONTH FROM date)::INTEGER) STORED
);

CREATE INDEX IF NOT EXISTS transactions_year_month_idx ON transactions (year, month);
CREATE INDEX IF NOT EXISTS transactions_type_idx        ON transactions (type);
CREATE INDEX IF NOT EXISTS transactions_date_idx        ON transactions (date DESC);

-- categories table
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL CHECK (type IN ('expense', 'income', 'savings')),
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, name)
);

-- ============================================================
-- Seed: default categories
-- ============================================================
INSERT INTO categories (type, name) VALUES
  -- Expenses
  ('expense', 'Food & Dining'),
  ('expense', 'Rent & Housing'),
  ('expense', 'Transport'),
  ('expense', 'Utilities'),
  ('expense', 'Entertainment'),
  ('expense', 'Healthcare'),
  ('expense', 'Shopping'),
  ('expense', 'Education'),
  ('expense', 'Subscriptions'),
  ('expense', 'Other'),
  -- Income
  ('income', 'Salary'),
  ('income', 'Freelance'),
  ('income', 'Dividends'),
  ('income', 'Rental Income'),
  ('income', 'Bonus'),
  ('income', 'Other Income'),
  -- Savings
  ('savings', 'Emergency Fund'),
  ('savings', 'Investments'),
  ('savings', 'Holiday'),
  ('savings', 'Retirement'),
  ('savings', 'Other Savings')
ON CONFLICT (type, name) DO NOTHING;

-- ============================================================
-- Row Level Security
-- No auth yet — allow all operations via the anon key.
-- Tighten these policies when auth is added.
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Migration: recurring transactions
-- Run in the Supabase SQL editor after the initial schema.
-- ============================================================
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS recurrence          TEXT CHECK (recurrence IN ('weekly', 'monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID,
  ADD COLUMN IF NOT EXISTS split_group_id      UUID;

CREATE INDEX IF NOT EXISTS transactions_recurrence_group_idx
  ON transactions (recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_split_group_idx
  ON transactions (split_group_id)
  WHERE split_group_id IS NOT NULL;

-- ============================================================
-- Migration: import mappings
-- Run in the Supabase SQL editor after the initial schema.
-- ============================================================
CREATE TABLE IF NOT EXISTS import_mappings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  triggers    TEXT[]      NOT NULL,
  category    TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('expense', 'income', 'savings')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_import_mappings" ON import_mappings
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Migration: Phase 3 — Net Worth
-- Run in the Supabase SQL editor after the initial schema.
-- ============================================================

-- Expand transactions.type to include 'investment'
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('expense', 'income', 'savings', 'investment'));

-- Status field for auto-generated vs user-confirmed investment contribution records
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status TEXT
    CHECK (status IN ('auto', 'confirmed'));

-- Net worth accounts (cash, savings, investments, retirement funds, debts)
CREATE TABLE IF NOT EXISTS net_worth_accounts (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT           NOT NULL,
  type        TEXT           NOT NULL CHECK (type IN ('cash', 'savings', 'investment', 'retirement', 'debt')),
  active      BOOLEAN        NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Balance snapshots — latest per account is the authoritative current balance
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID           NOT NULL REFERENCES net_worth_accounts(id) ON DELETE CASCADE,
  balance       NUMERIC(14, 2) NOT NULL,
  snapshot_date DATE           NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nw_snapshots_account_date_idx
  ON net_worth_snapshots (account_id, snapshot_date DESC);

-- Recurring contribution schedules (for investment / retirement accounts)
CREATE TABLE IF NOT EXISTS investment_contributions (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID           NOT NULL REFERENCES net_worth_accounts(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  frequency   TEXT           NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'annual')),
  start_date  DATE           NOT NULL,
  end_date    DATE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- RLS: anon full access (tighten when auth is added)
ALTER TABLE net_worth_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_net_worth_accounts"
  ON net_worth_accounts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_net_worth_snapshots"
  ON net_worth_snapshots FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_investment_contributions"
  ON investment_contributions FOR ALL USING (true) WITH CHECK (true);
