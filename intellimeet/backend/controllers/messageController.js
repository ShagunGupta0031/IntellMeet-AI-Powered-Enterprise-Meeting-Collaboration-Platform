const Message = require('../models/Message');

// GET /api/meetings/:meetingId/messages
async function listMessages(req, res, next) {
  try {
    const messages = await Message.find({ meeting: req.params.meetingId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name initials avatarColor');
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

// POST /api/meetings/:meetingId/messages
async function sendMessage(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Message text is required' });

    const message = await Message.create({
      meeting: req.params.meetingId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate('sender', 'name initials avatarColor');
    res.status(201).json({ message: populated });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMessages, sendMessage };
