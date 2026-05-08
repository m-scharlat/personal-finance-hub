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
