import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a meeting analyst. Given a meeting transcript, extract structured insights and return them as valid JSON only — no markdown, no explanation, just the JSON object.

Return this exact shape:
{
  "summary": "string (3-5 sentences summarizing the meeting)",
  "decisions": ["string", ...],
  "actionItems": [{ "task": "string", "owner": "string or null" }, ...],
  "openQuestions": ["string", ...],
  "sentiment": "positive | neutral | negative",
  "tone": "string (e.g. collaborative, tense, focused, casual)"
}`;

const MOCK_INSIGHTS = {
  summary: "The team reviewed Q2 roadmap priorities and identified a conflict between the dashboard redesign and the API v3 launch. Given current resource constraints, decisions were made to delay the API launch and bring in additional engineering support to keep both tracks moving.",
  decisions: [
    "Hire two additional frontend engineers by end of May",
    "Push API v3 launch from May 15 to June 28",
    "Allocate $50k additional budget for contractor support",
    "Dashboard redesign becomes the top priority for Q2",
  ],
  actionItems: [
    { task: "Draft job descriptions and post on LinkedIn", owner: "Sarah" },
    { task: "Update roadmap timeline and communicate to stakeholders", owner: "Mike" },
    { task: "Schedule design review session for dashboard mockups", owner: "Alex" },
    { task: "Research contractor agencies for short-term support", owner: "Jordan" },
  ],
  openQuestions: [
    "Do we have budget approval for the additional headcount?",
    "What happens to the mobile app timeline if we delay API v3?",
    "Should we consider outsourcing the dashboard implementation?",
  ],
  sentiment: "mixed",
  tone: "concerned but constructive",
};

const MAX_TRANSCRIPT_LENGTH = 50_000;

const InsightsSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(z.object({ task: z.string(), owner: z.string().nullable() })),
  openQuestions: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),
  tone: z.string(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  if (process.env.MOCK_MODE === 'true') {
    await new Promise(r => setTimeout(r, 2000));
    return NextResponse.json({ insights: MOCK_INSIGHTS });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json({ error: "Transcript too long. Maximum is 50,000 characters." }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the meeting transcript:\n\n${transcript}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const insights = InsightsSchema.parse(JSON.parse(raw));

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Insights extraction failed" }, { status: 500 });
  }
}
