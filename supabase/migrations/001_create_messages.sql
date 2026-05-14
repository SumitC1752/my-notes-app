-- Create messages table for temporary encrypted message storage
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  encrypted_text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'text'
);

-- Index for fast room lookups
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);

-- Index for fast expiry queries
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (backend uses service key)
CREATE POLICY "service_role_only" ON messages
  USING (true)
  WITH CHECK (true);
