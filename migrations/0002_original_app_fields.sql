ALTER TABLE subscriptions ADD COLUMN due_date TEXT;
ALTER TABLE subscriptions ADD COLUMN account TEXT;
ALTER TABLE subscriptions ADD COLUMN autopay INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN interval_value INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subscriptions ADD COLUMN interval_unit TEXT NOT NULL DEFAULT 'months';
ALTER TABLE subscriptions ADD COLUMN included INTEGER NOT NULL DEFAULT 1;
