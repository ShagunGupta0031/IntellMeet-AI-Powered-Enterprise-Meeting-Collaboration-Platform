# IntelliMeet — Backend

Node.js + Express + Socket.IO + MongoDB backend for the IntelliMeet AI-powered meeting platform. This powers authentication, meetings, chat, action items, private notes, live transcript storage, WebRTC signaling, and server-side Claude API calls for the frontend prototype.

## Stack

- **Express** — REST API
- **MongoDB + Mongoose** — data storage
- **Socket.IO** — real-time chat, presence, transcript push, reactions, and WebRTC signaling
- **JWT + bcryptjs** — authentication
- **Claude API** — called server-side only, so the API key is never exposed to the browser

## 1. Setup

```bash
cd intellimeet-backend
npm install
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://localhost:27017/intellimeet     # or a MongoDB Atlas URI
JWT_SECRET=some_long_random_string
ANTHROPIC_API_KEY=your_real_key_here
CLIENT_URL=http://localhost:3000                     # your frontend's origin, for CORS
```

You need a MongoDB instance — either run one locally (`mongod`) or create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and paste its connection string into `MONGO_URI`.

## 2. Run

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

Server starts on `http://localhost:5000` by default. Health check: `GET /api/health`.

## 3. (Optional) Seed demo data

```bash
npm run seed
```

Creates 3 demo users (Shagun/Aditya/Priya), one live meeting with room code `MTG-8472-XQ`, and 3 action items — handy for testing the frontend against real data immediately.

Demo login: `shagun@intellimeet.app` / `password123`

## 4. REST API Reference

All routes below (except `/api/health`, `/api/auth/register`, `/api/auth/login`) require:
`Authorization: Bearer <token>`

### Auth
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, title? }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Get JWT |
| GET | `/api/auth/me` | — | Current user profile |

### Meetings
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/meetings` | `{ title, scheduledFor?, participantIds? }` | Create meeting |
| GET | `/api/meetings` | — | List my meetings (dashboard/history) |
| GET | `/api/meetings/:id` | — | Get one meeting |
| GET | `/api/meetings/room/:roomCode` | — | Get meeting by room code (for joining) |
| PATCH | `/api/meetings/:id` | `{ summary?, keyDecisions?, keyTopics?, sentiment?, status? }` | Update meeting |
| POST | `/api/meetings/:id/end` | — | Mark meeting ended, compute duration |
| GET | `/api/meetings/:id/report` | — | Post-meeting report (talk-time, sentiment, decisions, interruptions, tasks) |

### Chat
| Method | Route | Body |
|---|---|---|
| GET | `/api/meetings/:meetingId/messages` | — |
| POST | `/api/meetings/:meetingId/messages` | `{ text }` |

### Action items / Tasks
| Method | Route | Body |
|---|---|---|
| GET | `/api/meetings/:meetingId/tasks` | — |
| POST | `/api/meetings/:meetingId/tasks` | `{ text, assignee?, dueDate? }` |
| PATCH | `/api/tasks/:id` | `{ done?, text?, assignee?, dueDate? }` |
| DELETE | `/api/tasks/:id` | — |

### Private notes
| Method | Route | Body |
|---|---|---|
| GET | `/api/meetings/:meetingId/notes` | — |
| PUT | `/api/meetings/:meetingId/notes` | `{ content }` |

### Transcript
| Method | Route | Body |
|---|---|---|
| GET | `/api/meetings/:meetingId/transcript` | — |
| POST | `/api/meetings/:meetingId/transcript` | `{ text, wpm? }` |

### AI (live Claude API calls)
| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/meetings/:meetingId/ai/ask` | `{ question }` | "Ask AI" — grounded in this meeting's real transcript/decisions |
| POST | `/api/meetings/:meetingId/ai/summarize` | — | Regenerate summary + decisions + topics from transcript so far |
| POST | `/api/ai/coach` | `{ question, wpm?, clarityScore?, fillerWords? }` | "Ask Coach" — personal speaking coach |

## 5. Socket.IO Events

Connect with the JWT in the handshake:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", { auth: { token: jwtToken } });
```

| Event (client → server) | Payload | Purpose |
|---|---|---|
| `join-room` | `{ roomCode }` | Join a meeting room |
| `leave-room` | — | Leave current room |
| `webrtc-offer` | `{ to, offer }` | WebRTC signaling — send offer to a peer's socket id |
| `webrtc-answer` | `{ to, answer }` | WebRTC signaling — answer |
| `webrtc-ice-candidate` | `{ to, candidate }` | WebRTC signaling — ICE candidate |
| `media-state-change` | `{ kind: 'mic'\|'cam'\|'screen', enabled }` | Broadcast mute/camera/screen-share toggles |
| `chat-message` | `{ meetingId, text }` | Send + persist a chat message |
| `transcript-line` | `{ meetingId, text, wpm }` | Push a live transcript line (persisted) |
| `reaction` | `{ emoji }` | Broadcast an emoji reaction |
| `raise-hand` | `{ raised }` | Broadcast raise-hand state |
| `task-updated` | task object | Broadcast a task change to the room |

| Event (server → client) | Payload |
|---|---|
| `room-roster` | array of `{ id, name, initials }` currently in the room |
| `user-joined` / `user-left` | `{ id, name, initials }` |
| `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate` | relayed signaling payloads |
| `media-state-change` | `{ userId, kind, enabled }` |
| `chat-message` | persisted message |
| `transcript-line` | persisted transcript entry |
| `reaction` | `{ userId, emoji }` |
| `raise-hand` | `{ userId, raised }` |
| `task-updated` | task object |
| `error-message` | `{ message }` |

### WebRTC connection flow (mesh, good for small meetings)
1. Client A calls `join-room`. Server replies with `room-roster` (existing peers).
2. For each existing peer, Client A creates an `RTCPeerConnection`, creates an offer, and emits `webrtc-offer` targeted at that peer's socket id.
3. The target peer receives `webrtc-offer`, creates an answer, emits `webrtc-answer` back.
4. Both sides exchange `webrtc-ice-candidate` events as ICE candidates are discovered.
5. For meetings with many participants, swap this mesh approach for an SFU (e.g. mediasoup, LiveKit) — this signaling server still works as the control channel.

## 6. Folder Structure

```
intellimeet-backend/
├── server.js              # entrypoint — HTTP + Socket.IO bootstrap
├── app.js                 # Express app, middleware, route mounting
├── config/
│   └── db.js              # MongoDB connection
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── Meeting.js
│   ├── Message.js
│   ├── ActionItem.js
│   ├── Note.js
│   └── TranscriptEntry.js
├── controllers/           # business logic per resource
│   ├── authController.js
│   ├── meetingController.js
│   ├── messageController.js
│   ├── taskController.js
│   ├── noteController.js
│   ├── transcriptController.js
│   └── aiController.js
├── routes/                 # Express routers
│   ├── authRoutes.js
│   ├── meetingRoutes.js
│   ├── taskRoutes.js
│   └── aiRoutes.js
├── middleware/
│   ├── auth.js             # JWT protect + role guard
│   └── errorHandler.js
├── sockets/
│   └── meetingSocket.js     # Socket.IO events + WebRTC signaling
├── utils/
│   ├── generateToken.js
│   ├── claudeClient.js      # server-side Claude API wrapper
│   └── seed.js              # demo data seeder
├── uploads/recordings/      # local storage for recordings (swap for S3 in production)
├── .env.example
└── package.json
```

## 7. Connecting the Existing Frontend Prototype

The current `index.html` prototype calls the Claude API directly from the browser and stores notes/tasks in `localStorage`. To wire it to this backend:

1. Replace the direct `fetch('https://api.anthropic.com/...')` calls in `askAI()` / `askCoach()` with calls to this backend instead (e.g. `POST /api/meetings/:id/ai/ask`), sending the JWT in the `Authorization` header.
2. Replace `localStorage` reads/writes for notes and tasks with `GET/PUT /api/meetings/:id/notes` and `GET/POST/PATCH /api/meetings/:id/tasks`.
3. Add a login screen that calls `/api/auth/login` and stores the returned JWT (in memory or a secure cookie — avoid `localStorage` for tokens in production).
4. Connect a Socket.IO client on page load (`join-room`) to receive live chat, transcript, and presence events instead of the current `setInterval`-based simulation.
5. For real video, replace the static video tiles with `<video>` elements bound to `MediaStream` objects from `getUserMedia()` and the WebRTC peer connections established via the signaling events above.

## 8. Deployment Notes

- **Render / Railway** are good fits for this server (long-running Socket.IO connections need a persistent process — unlike Vercel's serverless functions).
- Set all `.env` values as environment variables in your hosting dashboard; never commit `.env`.
- Use a managed MongoDB (Atlas free tier is enough for a prototype).
- For production video at scale (4+ participants per call), introduce an SFU (mediasoup/LiveKit) rather than relying purely on mesh WebRTC.
