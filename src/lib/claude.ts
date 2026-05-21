import Anthropic from '@anthropic-ai/sdk';
import { MeetingInsights } from '@/types/insights';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert meeting analyst. Extract structured insights from meeting transcripts.

Return ONLY a valid JSON object — no markdown, no code fences, no explanation. Just raw JSON.

Schema:
{
  "summary": "3-5 sentence summary of the meeting",
  "decisions": ["decisions made during the meeting"],
  "actionItems": [{ "task": "task description", "owner": "person name or null" }],
  "openQuestions": ["unresolved questions or issues"],
  "sentiment": "positive | neutral | negative | mixed",
  "tone": "one word description e.g. collaborative, tense, focused, casual"
}

Rules:
- Return empty arrays if nothing was found for that field
- owner is a name string if mentioned, null otherwise
- Extract only what is present — do not invent content`;

export async function analyzeMeeting(transcript: string): Promise<MeetingInsights> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze this meeting transcript:\n\n${transcript}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response from Claude');

  return JSON.parse(content.text.trim()) as MeetingInsights;
}
