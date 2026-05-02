-- Add subscription expiry to users table
-- If users table already exists, run this migration to add the expire_at column.
-- Adjust the table/column names to match your actual schema.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS expire_at TIMESTAMPTZ DEFAULT NULL;

-- Index for fast lookup by username
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- ── Example: manually grant a user Pro access for 30 days ──────────────────
-- UPDATE users
--   SET type = 1,
--       expire_at = NOW() + INTERVAL '30 days'
--   WHERE username = '<hashed_username>';
