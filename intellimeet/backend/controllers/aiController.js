const Meeting = require('../models/Meeting');
const TranscriptEntry = require('../models/TranscriptEntry');
const { askClaude, buildMeetingContext, buildCoachContext } = require('../utils/claudeClient');

// POST /api/meetings/:meetingId/ai/ask
// Body: { question }
async function askAboutMeeting(req, res, next) {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'A question is required' });

    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const transcriptEntries = await TranscriptEntry.find({ meeting: meeting._id })
      .sort({ timestamp: 1 })
      .populate('speaker', 'name');

    const system = buildMeetingContext(meeting, transcriptEntries);
    const answer = await askClaude({
      system,
      messages: [{ role: 'user', content: question }],
    });

    res.json({ answer });
  } catch (err) {
    next(err);
  }
}

// POST /api/ai/coach
// Body: { question, wpm, clarityScore, fillerWords }
async function askCoach(req, res, next) {
  try {
    const { question, wpm, clarityScore, fillerWords } = req.body;
    if (!question) return res.status(400).json({ message: 'A question is required' });

    const system = buildCoachContext({ wpm, clarityScore, fillerWords });
    const answer = await askClaude({
      system,
      messages: [{ role: 'user', content: question }],
    });

    res.json({ answer });
  } catch (err) {
    next(err);
  }
}

// POST /api/meetings/:meetingId/ai/summarize
// Generates a fresh summary + key decisions from the transcript collected so far,
// and persists it onto the Meeting document.
async function generateSummary(req, res, next) {
  try {
    const meeting = await Meeting.findById(req.params.meetingId);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const transcriptEntries = await TranscriptEntry.find({ meeting: meeting._id })
      .sort({ timestamp: 1 })
      .populate('speaker', 'name');

    if (transcriptEntries.length === 0) {
      return res.status(400).json({ message: 'No transcript available yet to summarize' });
    }

    const transcriptText = transcriptEntries
      .map((t) => `${t.speaker?.name || 'Unknown'}: ${t.text}`)
      .join('\n');

    const system = [
      'You summarize live meeting transcripts for a meeting platform called IntelliMeet.',
      'Return ONLY valid JSON (no markdown, no preamble) in this exact shape:',
      '{"summary": "2-3 sentence summary", "decisions": ["short decision 1", "short decision 2"], "topics": ["topic1", "topic2"]}',
    ].join(' ');

    const raw = await askClaude({
      system,
      messages: [{ role: 'user', content: transcriptText }],
      maxTokens: 500,
    });

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      parsed = { summary: raw, decisions: [], topics: [] };
    }

    meeting.summary = parsed.summary || meeting.summary;
    meeting.keyDecisions = parsed.decisions?.length ? parsed.decisions : meeting.keyDecisions;
    meeting.keyTopics = parsed.topics?.length ? parsed.topics : meeting.keyTopics;
    meeting.summaryHistory.push({ text: meeting.summary });
    await meeting.save();

    res.json({ summary: meeting.summary, decisions: meeting.keyDecisions, topics: meeting.keyTopics });
  } catch (err) {
    next(err);
  }
}

module.exports = { askAboutMeeting, askCoach, generateSummary };
