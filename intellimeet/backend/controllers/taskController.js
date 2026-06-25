const ActionItem = require('../models/ActionItem');

// GET /api/meetings/:meetingId/tasks
async function listTasks(req, res, next) {
  try {
    const tasks = await ActionItem.find({ meeting: req.params.meetingId })
      .populate('assignee', 'name initials avatarColor')
      .sort({ createdAt: 1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

// POST /api/meetings/:meetingId/tasks
async function createTask(req, res, next) {
  try {
    const { text, assignee, dueDate, createdBy } = req.body;
    if (!text) return res.status(400).json({ message: 'Task text is required' });

    const task = await ActionItem.create({
      meeting: req.params.meetingId,
      text,
      assignee: assignee || null,
      dueDate: dueDate || null,
      createdBy: createdBy || 'user',
    });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/tasks/:id  (toggle done, edit text/assignee/dueDate)
async function updateTask(req, res, next) {
  try {
    const allowed = ['text', 'assignee', 'dueDate', 'done'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const task = await ActionItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const task = await ActionItem.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, createTask, updateTask, deleteTask };
