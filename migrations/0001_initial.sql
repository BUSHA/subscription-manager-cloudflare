CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL,
  billing_date TEXT,
  category TEXT,
  payment_method TEXT,
  url TEXT,
  notes TEXT,
  icon TEXT,
  color TEXT,
  tags TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_configuration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'USD',
  locale TEXT,
  show_currency_symbol INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_active ON subscriptions(user_id, is_active);
