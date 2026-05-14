# My Notes — Secret Chat App

A React Native (Expo) notes app that secretly hides an end-to-end encrypted, ephemeral chat between 2 people.

## Project Structure

```
chat app/
├── mobile/          # React Native Expo app
│   ├── app/         # Expo Router screens
│   │   ├── index.tsx           # Notes home screen (disguise)
│   │   ├── note/new.tsx        # New note
│   │   ├── note/edit.tsx       # Edit note
│   │   └── secret/
│   │       ├── unlock.tsx      # Secret code entry
│   │       └── chat.tsx        # Hidden chat screen
│   ├── components/
│   │   ├── NoteCard.tsx        # Note card UI
│   │   └── CallScreen.tsx      # Voice/video call UI
│   ├── hooks/
│   │   ├── useSocket.ts        # Socket.io hook
│   │   └── useWebRTC.ts        # WebRTC P2P hook
│   ├── utils/
│   │   ├── storage.ts          # AsyncStorage for notes
│   │   ├── crypto.ts           # AES-256 encryption
│   │   └── session.ts          # SecureStore session
│   ├── constants/index.ts
│   └── types/index.ts
├── server/          # Node.js + Express + Socket.io backend
│   ├── src/
│   │   ├── index.js            # Entry point
│   │   ├── socket.js           # Socket event handlers + WebRTC relay
│   │   └── supabase.js         # Supabase client
│   └── render.yaml             # Render.com deploy config
└── supabase/
    ├── migrations/
    │   └── 001_create_messages.sql
    └── functions/
        └── delete-expired-messages/index.ts   # Deno Edge Function
```

---

## How the Disguise Works

1. App opens as **"My Notes"** — a normal, fully functional notes app
2. User creates a note with title `.ghost` (the secret trigger code)
3. Tapping that note silently opens the **secret code entry screen** (no UI hint)
4. Both users enter the **same shared secret code** — this derives the room ID + encryption key
5. Chat opens: fully black UI, end-to-end encrypted, messages vanish after 10 minutes

> **Change the trigger code:** Edit `SECRET_TRIGGER_CODE` in `mobile/constants/index.ts`

---

## Setup Instructions

### 1. Install Mobile Dependencies

```bash
cd mobile
npm install
```

### 2. Setup Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
npm run dev
```

### 3. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_create_messages.sql` in the SQL editor
3. Copy your **Project URL** and **service_role key** to `server/.env`
4. Deploy the Edge Function:
   ```bash
   supabase functions deploy delete-expired-messages
   ```
5. Schedule it via Supabase Dashboard → Edge Functions → Cron: `*/10 * * * *`

### 4. Update Server URL in Mobile App

Edit `mobile/constants/index.ts`:
```ts
export const SERVER_URL = 'https://your-render-app.onrender.com';
```

### 5. Deploy Backend to Render.com

1. Push `server/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service → Connect repo
3. Set env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
4. Deploy — free tier, auto-sleeps after 15 min inactivity (wakes on request)

### 6. Run the App

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) or run on emulator.

---

## Security Notes

- **No real identities** — only a shared secret code
- **Room ID** is derived from `SHA256('room:' + secretCode)` — two users with the same code automatically join the same room
- **Messages** are AES-256 encrypted client-side before sending; server never sees plaintext
- **Auto-delete** — messages expire after 10 minutes via both server-side timers and Supabase Edge Function
- **No message history** — Supabase only stores `encrypted_text`, never plaintext
- **App appearance** — looks 100% like a notes app; secret section has no icon, label, or hint

---

## WebRTC Calling

- Fully peer-to-peer via WebRTC (no relay server cost)
- STUN servers: Google's free public STUN (`stun.l.google.com:19302`)
- Backend only relays signaling (offer/answer/ICE candidates) via Socket.io
- Media streams are direct device-to-device — zero cost

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo 51 |
| Routing | Expo Router |
| Realtime | Socket.io client |
| P2P Calls | react-native-webrtc (WebRTC) |
| Encryption | CryptoJS (AES-256) |
| Session | expo-secure-store |
| Backend | Node.js + Express + Socket.io |
| Database | Supabase (PostgreSQL, free tier) |
| Auto-delete | Supabase Edge Function (Deno) |
| Hosting | Render.com (free tier) |
