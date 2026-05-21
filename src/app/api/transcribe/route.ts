import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { checkRateLimit } from "@/lib/rateLimit";

const MOCK_TRANSCRIPT = `Sarah: Okay everyone, let's dive into the Q2 roadmap. I know we've got a lot on our plate.

Mike: Yeah, I'm a bit concerned about the timeline. We're supposed to launch API v3 by May 15, but the dashboard redesign is also marked as critical.

Alex: The design team finished the mockups last week. They look great, but implementation is going to take at least 6 weeks with our current team size.

Sarah: That's what I was afraid of. We can't do both well with the resources we have. What if we brought in two more frontend engineers?

Jordan: I support that. We've been stretched thin for months. But hiring takes time. Even if we post today, it's probably 4-6 weeks before someone starts.

Mike: So we need to push the API launch. Let's say late June, maybe June 28?

Sarah: I think that's realistic. Alex, can you schedule a design review for the dashboard next week?

Alex: Absolutely. I'll get that on the calendar.

Jordan: What about contractor support in the interim? I can research some agencies.

Sarah: Good idea. Let's allocate maybe $50k for short-term help. We can revisit if needed.

Mike: I'll update the roadmap and send out a note to stakeholders. This is going to shift a few things downstream.

Sarah: Okay. So dashboard is top priority, API moves to late June, we're hiring, and we'll bring in contractor support. Any other concerns?

Alex: Just one — if we delay API v3, what happens to the mobile app timeline? They're dependent on it.

Mike: Good point. I'll need to sync with the mobile team and see if they can adjust.

Sarah: Alright, let's reconvene on Friday to review progress. Thanks everyone.`;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/ogg', 'audio/webm', 'audio/mp4', 'video/mp4',
];

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
    await new Promise(r => setTimeout(r, 1500));
    return NextResponse.json({ transcript: MOCK_TRANSCRIPT });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 25 MB." }, { status: 413 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Please upload an audio file (MP3, WAV, OGG, WebM, MP4)." }, { status: 415 });
    }

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    return NextResponse.json({
      transcript: transcription.text,
      language: (transcription as unknown as { language?: string }).language ?? null,
    });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
