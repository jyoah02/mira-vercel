import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
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
    const insights = JSON.parse(raw);

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Insights extraction failed" }, { status: 500 });
  }
}
