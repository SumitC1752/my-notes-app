const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      console.warn('Supabase credentials not set. Messages will not be persisted.');
      return null;
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

async function persistMessage(msg) {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('messages').insert({
      id: msg.id,
      room_id: msg.roomId,
      sender_id: msg.senderId,
      encrypted_text: msg.encryptedText,
      timestamp: new Date(msg.timestamp).toISOString(),
      expires_at: new Date(msg.expiresAt).toISOString(),
      type: msg.type,
    });
  } catch (err) {
    console.error('Failed to persist message:', err.message);
  }
}

async function getRoomMessages(roomId) {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .gt('expires_at', new Date().toISOString())
      .order('timestamp', { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      roomId: row.room_id,
      senderId: row.sender_id,
      encryptedText: row.encrypted_text,
      timestamp: new Date(row.timestamp).getTime(),
      expiresAt: new Date(row.expires_at).getTime(),
      type: row.type,
    }));
  } catch (err) {
    console.error('Failed to get messages:', err.message);
    return [];
  }
}

async function deleteExpiredMessages() {
  const client = getSupabase();
  if (!client) return;
  try {
    await client
      .from('messages')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (err) {
    console.error('Failed to delete expired messages:', err.message);
  }
}

module.exports = { persistMessage, getRoomMessages, deleteExpiredMessages };
