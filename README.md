# MIRA — Meeting Insights and Report Aggregator

Upload a meeting recording and get a structured insights dashboard in seconds. Built with Next.js, Groq Whisper, and Claude.

**Live demo:** [mira-vercel.vercel.app](https://mira-vercel.vercel.app)

---

## What it does

1. **Upload** an MP3 or WAV recording (drag-and-drop or click to browse)
2. **Transcribe** — audio is sent to Groq's Whisper API (free, fast)
3. **Analyze** — Claude reads the transcript and extracts:
   - Meeting summary (3–5 sentences)
   - Key decisions made
   - Action items with owner names
   - Open questions / unresolved items
   - Sentiment and tone
4. **Export** — copy to clipboard or download as PDF

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 15, React, Tailwind CSS, shadcn/ui |
| Transcription | Groq Whisper API (`whisper-large-v3`) |
| LLM | Anthropic Claude (`claude-sonnet-4-6`) |
| Hosting | Vercel |

---

## Local setup

```bash
git clone https://github.com/jyoah02/mira-vercel.git
cd mira-vercel
npm install
cp .env.example .env.local
# fill in your API keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API keys needed

- **Groq API key** — free at [console.groq.com](https://console.groq.com)
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)

---

## Demo recording

Upload any MP3 or WAV recording to test the app. A short voice memo works fine.
