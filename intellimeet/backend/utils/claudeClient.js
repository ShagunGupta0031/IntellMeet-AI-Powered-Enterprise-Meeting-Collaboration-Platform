/**
 * Server-side wrapper around the Anthropic Claude API.
 * Keeping this call on the backend (instead of the browser) keeps the API key secret
 * and lets us ground every answer in the meeting's real, server-stored context.
 */
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function askClaude({ system, messages, maxTokens = 400 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server');
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

/** Build a grounding system prompt from real meeting data stored in MongoDB. */
function buildMeetingContext(meeting, transcriptEntries = []) {
  const transcriptText = transcriptEntries
    .slice(-30) // last 30 lines keeps the prompt small
    .map((t) => `${t.speaker?.name || 'Unknown'}: ${t.text}`)
    .join('\n');

  return [
    `You are IntelliMeet's in-meeting AI assistant.`,
    `Meeting title: ${meeting.title}`,
    meeting.keyDecisions?.length ? `Decisions so far: ${meeting.keyDecisions.join('; ')}` : '',
    meeting.keyTopics?.length ? `Key topics: ${meeting.keyTopics.join(', ')}` : '',
    transcriptText ? `Recent transcript:\n${transcriptText}` : '',
    `Answer the question in 2-3 concise sentences, grounded only in this context. If the question is unrelated to the meeting, say so briefly.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildCoachContext({ wpm, clarityScore, fillerWords }) {
  const fillerSummary = Object.entries(fillerWords || {})
    .map(([word, count]) => `"${word}" ${count}x`)
    .join(', ');

  return [
    `You are an expert AI speaking coach inside IntelliMeet.`,
    wpm ? `Current pace: ~${wpm} wpm.` : '',
    clarityScore ? `Clarity score: ${clarityScore}/100.` : '',
    fillerSummary ? `Filler words used: ${fillerSummary}.` : '',
    `Give one short, specific, actionable coaching tip in 2-3 sentences. Be encouraging but direct.`,
  ]
    .filter(Boolean)
    .join('\n');
}

module.exports = { askClaude, buildMeetingContext, buildCoachContext };
