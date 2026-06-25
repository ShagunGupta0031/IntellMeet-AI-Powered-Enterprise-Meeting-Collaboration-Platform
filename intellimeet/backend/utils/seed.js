/**
 * Seeds the database with a demo user, meeting, and a few action items —
 * useful for quickly testing the API without going through full signup flows.
 * Run with: npm run seed
 */
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const ActionItem = require('../models/ActionItem');

async function seed() {
  await connectDB();

  console.log('[Seed] Clearing existing demo data...');
  await User.deleteMany({ email: { $in: ['shagun@intellimeet.app', 'aditya@intellimeet.app', 'priya@intellimeet.app'] } });
  await Meeting.deleteMany({ roomCode: 'MTG-8472-XQ' });

  console.log('[Seed] Creating users...');
  const shagun = await User.create({ name: 'Shagun Gupta', email: 'shagun@intellimeet.app', password: 'password123', title: 'Team Lead', avatarColor: '#6366F1' });
  const aditya = await User.create({ name: 'Aditya Rao', email: 'aditya@intellimeet.app', password: 'password123', title: 'Backend Dev', avatarColor: '#10B981' });
  const priya = await User.create({ name: 'Priya Mehta', email: 'priya@intellimeet.app', password: 'password123', title: 'UI/UX Designer', avatarColor: '#EC4899' });

  console.log('[Seed] Creating demo meeting...');
  const meeting = await Meeting.create({
    title: 'IntelliMeet Planning — Sprint 1',
    roomCode: 'MTG-8472-XQ',
    host: shagun._id,
    participants: [shagun._id, aditya._id, priya._id],
    status: 'live',
    startedAt: new Date(),
    summary: 'Discussing IntelliMeet — Month 1 submission. Stack confirmed: React + Node.js + Claude API + WebRTC.',
    keyDecisions: ['Claude API for AI summarization', 'WebRTC for video, Socket.IO for real-time sync', 'Vercel for deployment'],
    keyTopics: ['WebRTC', 'Claude API', 'Deadline', 'Deployment'],
  });

  console.log('[Seed] Creating action items...');
  await ActionItem.insertMany([
    { meeting: meeting._id, text: 'Set up Claude API key & summarization', assignee: shagun._id, dueDate: new Date(), createdBy: 'ai' },
    { meeting: meeting._id, text: 'Implement WebRTC peer connection', assignee: aditya._id, createdBy: 'ai' },
    { meeting: meeting._id, text: 'Design scheduling UI + calendar', assignee: priya._id, createdBy: 'ai' },
  ]);

  console.log('[Seed] Done!');
  console.log(`Room code: ${meeting.roomCode}`);
  console.log('Demo login -> email: shagun@intellimeet.app | password: password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
