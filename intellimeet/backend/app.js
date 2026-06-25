const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- Core middleware ----
// CSP is relaxed (no contentSecurityPolicy) because the bundled frontend prototype
// uses inline <script>/<style> tags and a CDN font import. If you split the frontend
// out to its own host/CDN in production, re-enable a strict CSP here.
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ---- Rate limiting (protects auth + AI endpoints from abuse) ----
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ---- Health check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'intellimeet-backend', time: new Date().toISOString() });
});

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// ---- Serve the bundled frontend prototype ----
// The frontend's index.html (plus any assets) lives in ../frontend relative to this
// backend folder when both are unzipped side by side as part of the fullstack project.
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// SPA fallback: any non-API GET request that doesn't match a static file gets index.html,
// so the frontend's own client-side page switching (Meeting/Dashboard/History tabs) still works.
app.get(/^\/(?!api\/).*/, (req, res, next) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'), (err) => {
    if (err) next();
  });
});

// ---- 404 + error handler (must be last) ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
