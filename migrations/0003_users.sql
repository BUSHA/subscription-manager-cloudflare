CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO users (id, email, display_name, created_at, updated_at)
SELECT
  user_id,
  user_id,
  trim(replace(replace(substr(user_id, 1, instr(user_id || '@', '@') - 1), '.', ' '), '_', ' ')),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT user_id FROM subscriptions
  UNION
  SELECT user_id FROM user_configuration
)
WHERE user_id IS NOT NULL AND user_id != '';
