y# IntelliMeet — Full Stack (Frontend + Backend)

This is the complete IntelliMeet project: the original frontend prototype, now wired to a real Node.js + Express + Socket.IO + MongoDB backend with server-side Claude API calls.

```
intellimeet-fullstack/
├── frontend/
│   └── index.html       # The full UI — same design as the original prototype
└── backend/
    ├── server.js, app.js, models/, routes/, controllers/, sockets/, ...
    └── README.md         # Full backend API + Socket.IO reference
```

## How it fits together

`backend/app.js` serves the `frontend/` folder as static files **and** exposes the `/api/*` REST routes **and** runs the Socket.IO server — all from one process, one port. That means:

- No CORS headaches — frontend and API share the same origin.
- One command starts the whole app.
- The zip you download is "just run it" — no separate frontend build step.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/intellimeet     # or your MongoDB Atlas URL
JWT_SECRET=some_long_random_string
ANTHROPIC_API_KEY=your_real_claude_api_key
```

You need MongoDB running — either install it locally, or get a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and paste its connection string into `MONGO_URI`.

Then:
```bash
npm run dev
```

Open **http://localhost:5000** in your browser. You'll see the IntelliMeet login screen.

- **Register** a new account, or
- **"Continue in demo mode"** — runs the exact same UI with simulated data and no backend required (useful if MongoDB isn't set up yet, or for quick demos).

### Optional: seed demo data
```bash
npm run seed
```
Creates 3 demo users (Shagun/Aditya/Priya) and a live meeting with room code `MTG-8472-XQ`.
Login: `shagun@intellimeet.app` / `password123`

## What's real vs. simulated now

| Feature | Status |
|---|---|
| Login / register (JWT) | ✅ Real |
| Meeting creation & room codes | ✅ Real (MongoDB) |
| Chat | ✅ Real-time via Socket.IO, persisted to MongoDB |
| Private notes | ✅ Real, persisted to MongoDB |
| Action items / tasks | ✅ Real, persisted to MongoDB, syncs live across participants |
| Live transcript | ✅ Pushed/stored via Socket.IO + MongoDB (still needs a real speech-to-text source — see below) |
| "Ask AI" | ✅ Real Claude API call, made server-side, grounded in actual meeting data |
| "Ask Coach" | ✅ Real Claude API call, made server-side |
| AI summary | ✅ Real — click "↻ Refresh" in the AI panel to regenerate from the live transcript via Claude |
| Mood / sentiment / engagement heatmap / filler-word tracker / talk-time bars | ⚠️ Still simulated (randomized) — no real audio/video analysis pipeline yet |
| Video calling | ⚠️ Signaling endpoints exist (Socket.IO `webrtc-offer`/`webrtc-answer`/`webrtc-ice-candidate`) but no `getUserMedia()`/`RTCPeerConnection` wiring yet — see `backend/README.md` §5 for the next step |

## Demo Mode

If the backend can't be reached (wrong `.env`, MongoDB down, or you just open `frontend/index.html` directly as a file), the app **automatically falls back** to demo mode: same UI, same simulated data behavior as the original static prototype, so it never looks broken.

## Full API & Socket.IO Reference

See `backend/README.md` for the complete REST endpoint list, Socket.IO event reference, folder structure, and notes on adding real video (WebRTC) and real transcription.

## Deployment

- **Backend (with frontend bundled in)** → Render or Railway (needs a persistent Node process for Socket.IO; Vercel's serverless functions don't hold WebSocket connections well).
- **Database** → MongoDB Atlas free tier.
- Set the same variables from `.env.example` as environment variables on your host.
