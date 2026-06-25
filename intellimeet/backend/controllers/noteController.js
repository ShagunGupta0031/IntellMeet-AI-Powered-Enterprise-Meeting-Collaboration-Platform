const Note = require('../models/Note');

// GET /api/meetings/:meetingId/notes  (the logged-in user's own private note)
async function getMyNote(req, res, next) {
  try {
    const note = await Note.findOne({ meeting: req.params.meetingId, user: req.user._id });
    res.json({ note: note || { content: '' } });
  } catch (err) {
    next(err);
  }
}

// PUT /api/meetings/:meetingId/notes  (upsert — create or overwrite)
async function saveMyNote(req, res, next) {
  try {
    const { content = '' } = req.body;
    const note = await Note.findOneAndUpdate(
      { meeting: req.params.meetingId, user: req.user._id },
      { content },
      { new: true, upsert: true }
    );
    res.json({ note });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyNote, saveMyNote };
