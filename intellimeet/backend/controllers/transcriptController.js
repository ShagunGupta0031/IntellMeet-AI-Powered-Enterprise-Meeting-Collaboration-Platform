const TranscriptEntry = require('../models/TranscriptEntry');

// GET /api/meetings/:meetingId/transcript
async function listTranscript(req, res, next) {
  try {
    const entries = await TranscriptEntry.find({ meeting: req.params.meetingId })
      .sort({ timestamp: 1 })
      .populate('speaker', 'name initials avatarColor');
    res.json({ entries });
  } catch (err) {
    next(err);
  }
}

// POST /api/meetings/:meetingId/transcript
// Normally called by the real-time pipeline (Socket.IO) rather than directly by the client,
// but exposed here too for manual entry / testing / non-realtime clients.
async function addTranscriptEntry(req, res, next) {
  try {
    const { text, wpm } = req.body;
    if (!text) return res.status(400).json({ message: 'Transcript text is required' });

    const entry = await TranscriptEntry.create({
      meeting: req.params.meetingId,
      speaker: req.user._id,
      text,
      wpm,
    });

    const populated = await entry.populate('speaker', 'name initials avatarColor');
    res.status(201).json({ entry: populated });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTranscript, addTranscriptEntry };
