const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');
const ActionItem = require('../models/ActionItem');
const TranscriptEntry = require('../models/TranscriptEntry');

function generateRoomCode() {
  const part = uuidv4().split('-')[0].toUpperCase().slice(0, 4);
  return `MTG-${Math.floor(1000 + Math.random() * 9000)}-${part.slice(0, 2)}`;
}

// POST /api/meetings
async function createMeeting(req, res, next) {
  try {
    const { title, scheduledFor, participantIds = [] } = req.body;
    if (!title) return res.status(400).json({ message: 'Meeting title is required' });

    const meeting = await Meeting.create({
      title,
      roomCode: generateRoomCode(),
      host: req.user._id,
      participants: [req.user._id, ...participantIds],
      scheduledFor: scheduledFor || null,
      status: scheduledFor ? 'scheduled' : 'live',
      startedAt: scheduledFor ? null : new Date(),
    });

    res.status(201).json({ meeting });
  } catch (err) {
    next(err);
  }
}

// GET /api/meetings  (history / dashboard list for the logged-in user)
async function listMeetings(req, res, next) {
  try {
    const meetings = await Meeting.find({ participants: req.user._id })
      .sort({ createdAt: -1 })
      .populate('host', 'name initials')
      .limit(50);
    res.json({ meetings });
  } catch (err) {
    next(err);
  }
}

// GET /api/meetings/:id
async function getMeeting(req, res, next) {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name initials avatarColor')
      .populate('participants', 'name initials avatarColor title');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ meeting });
  } catch (err) {
    next(err);
  }
}

// GET /api/meetings/room/:roomCode  (join by room code)
async function getMeetingByRoomCode(req, res, next) {
  try {
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode })
      .populate('host', 'name initials avatarColor')
      .populate('participants', 'name initials avatarColor title');
    if (!meeting) return res.status(404).json({ message: 'No meeting found with that room code' });
    res.json({ meeting });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/meetings/:id  (update summary, decisions, topics, sentiment snapshot, etc.)
async function updateMeeting(req, res, next) {
  try {
    const allowed = ['summary', 'keyDecisions', 'keyTopics', 'recordingUrl', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (req.body.summary) {
      updates.$push = { summaryHistory: { text: req.body.summary } };
    }
    if (req.body.sentiment) {
      updates.$push = { ...(updates.$push || {}), sentimentHistory: req.body.sentiment };
    }

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { $set: updates, ...(updates.$push ? { $push: updates.$push } : {}) },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    res.json({ meeting });
  } catch (err) {
    next(err);
  }
}

// POST /api/meetings/:id/end
async function endMeeting(req, res, next) {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    if (meeting.startedAt) {
      meeting.durationSeconds = Math.round((meeting.endedAt - meeting.startedAt) / 1000);
    }
    await meeting.save();

    res.json({ meeting });
  } catch (err) {
    next(err);
  }
}

// GET /api/meetings/:id/report  (talk-time, sentiment, decisions, interruptions, tasks)
async function getMeetingReport(req, res, next) {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('talkTime.user', 'name initials')
      .populate('interruptions.from interruptions.target', 'name initials');
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const actionItems = await ActionItem.find({ meeting: meeting._id });
    const transcriptCount = await TranscriptEntry.countDocuments({ meeting: meeting._id });

    res.json({
      meeting: {
        title: meeting.title,
        durationSeconds: meeting.durationSeconds,
        summary: meeting.summary,
        keyDecisions: meeting.keyDecisions,
      },
      talkTime: meeting.talkTime,
      sentimentHistory: meeting.sentimentHistory,
      interruptions: meeting.interruptions,
      actionItems,
      transcriptEntryCount: transcriptCount,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createMeeting,
  listMeetings,
  getMeeting,
  getMeetingByRoomCode,
  updateMeeting,
  endMeeting,
  getMeetingReport,
};
