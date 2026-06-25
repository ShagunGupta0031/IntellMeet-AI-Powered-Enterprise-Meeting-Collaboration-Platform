# 🧠 IntelliMeet — AI-Powered Enterprise Meeting & Collaboration Platform

> Full-stack platform: React frontend + Node.js/Express backend + Socket.IO real-time + MongoDB + Claude AI

---

## 📁 Project Structure

```
intellimeet-fullstack/
├── frontend/
│   └── index.html          # Complete UI (no build step needed)
├── backend/
│   ├── server.js           # Entry point — starts HTTP + Socket.IO
│   ├── app.js              # Express app setup, middleware, routes
│   ├── models/             # Mongoose schemas (User, Meeting, Message, etc.)
│   ├── routes/             # REST API route definitions
│   ├── controllers/        # Business logic for each route
│   ├── middleware/         # Auth (JWT), error handling, rate limiting
│   ├── sockets/            # Socket.IO event handlers
│   ├── utils/              # Helper functions
│   ├── uploads/            # File upload storage
│   ├── .env.example        # Environment variable template
│   └── README.md           # Backend API reference (this file)
└── package.json
```

---

## ⚙️ How It Works

`backend/app.js` serves the `frontend/` folder as **static files** AND exposes `/api/*` REST routes AND runs the Socket.IO server — all from **one process, one port**.

✅ No CORS headaches — frontend and API share the same origin  
✅ One command starts the whole app  
✅ The zip you download is "just run it" — no separate frontend build step

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Setup environment variables

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/intellimeet   # or your MongoDB Atlas URL
JWT_SECRET=some_long_random_string
ANTHROPIC_API_KEY=your_real_claude_api_key
PORT=5000
```

### 3. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Open the app

Visit → [http://localhost:5000](http://localhost:5000)

---

## 🔌 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/meetings` | List all meetings |
| POST | `/api/meetings` | Create new meeting |
| GET | `/api/meetings/:id` | Get meeting details |
| DELETE | `/api/meetings/:id` | Delete a meeting |
| POST | `/api/ai/summarize` | AI-powered meeting summary |
| POST | `/api/ai/action-items` | Extract action items via Claude |

> Full endpoint reference: see [Backend API Docs](./routes/README.md)

---

## 🔴 Real-Time Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-meeting` | Client → Server | Join a meeting room |
| `leave-meeting` | Client → Server | Leave a meeting room |
| `send-message` | Client → Server | Send chat message |
| `new-message` | Server → Client | Receive chat message |
| `user-joined` | Server → Client | Notify when user joins |
| `ai-response` | Server → Client | Stream Claude AI response |

---

## 🤖 AI Features (Powered by Claude)

- **Meeting Summaries** — Auto-generates concise summaries after meetings
- **Action Item Extraction** — Identifies tasks, owners, and deadlines
- **Real-time Q&A** — Ask questions about meeting content mid-session
- **Transcription Analysis** — Deep insights from meeting transcripts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT (JSON Web Tokens) |
| AI | Anthropic Claude API |
| File Upload | Multer |

---

## 🔒 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing (min 32 chars) |
| `ANTHROPIC_API_KEY` | ✅ | Your Claude API key from console.anthropic.com |
| `PORT` | ❌ | Server port (default: `5000`) |
| `NODE_ENV` | ❌ | `development` or `production` |

---

## 📦 Scripts

```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
npm test           # Run tests
```

---

## 🐛 Common Issues

**MongoDB connection failed?**
- Make sure MongoDB is running locally: `mongod --dbpath /data/db`
- Or use MongoDB Atlas and paste the connection string in `MONGO_URI`

**Claude API not working?**
- Get your API key at [console.anthropic.com](https://console.anthropic.com)
- Make sure `ANTHROPIC_API_KEY` is set correctly in `.env`

**Port already in use?**
- Change `PORT` in `.env` to another value like `3000` or `8080`

---

## 📄 License

MIT © 2025 Shagun Gupta
