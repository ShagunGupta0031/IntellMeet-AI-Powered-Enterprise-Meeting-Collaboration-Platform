const express = require('express');
const {
  createMeeting,
  listMeetings,
  getMeeting,
  getMeetingByRoomCode,
  updateMeeting,
  endMeeting,
  getMeetingReport,
} = require('../controllers/meetingController');
const { listMessages, sendMessage } = require('../controllers/messageController');
const { listTasks, createTask } = require('../controllers/taskController');
const { getMyNote, saveMyNote } = require('../controllers/noteController');
const { listTranscript, addTranscriptEntry } = require('../controllers/transcriptController');
const { askAboutMeeting, generateSummary } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every meeting route requires a logged-in user

router.post('/', createMeeting);
router.get('/', listMeetings);
router.get('/room/:roomCode', getMeetingByRoomCode);
router.get('/:id', getMeeting);
router.patch('/:id', updateMeeting);
router.post('/:id/end', endMeeting);
router.get('/:id/report', getMeetingReport);

// Nested resources
router.get('/:meetingId/messages', listMessages);
router.post('/:meetingId/messages', sendMessage);

router.get('/:meetingId/tasks', listTasks);
router.post('/:meetingId/tasks', createTask);

router.get('/:meetingId/notes', getMyNote);
router.put('/:meetingId/notes', saveMyNote);

router.get('/:meetingId/transcript', listTranscript);
router.post('/:meetingId/transcript', addTranscriptEntry);

router.post('/:meetingId/ai/ask', askAboutMeeting);
router.post('/:meetingId/ai/summarize', generateSummary);

module.exports = router;
