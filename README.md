# MIRA — Meeting Intelligence & Report Aggregator

Transform meeting recordings into structured, actionable insights through AI-powered transcription and analysis.

**[Try the Live Demo](https://mira-vercel.vercel.app)**

---

## What is MIRA?

MIRA automatically processes meeting recordings and extracts the information that matters. Upload an audio file, and within seconds you get a structured breakdown of everything discussed — no manual note-taking required.

---

## Features

**AI Pipeline**
- Transcribes audio using Whisper via Groq — accurate, fast, multilingual
- Analyzes transcripts with Claude to extract structured insights
- Detects spoken language and displays a country flag indicator

**Structured Outputs**
- Meeting summary
- Decisions made
- Action items with optional owner assignment
- Open questions
- Sentiment & tone analysis

**Editing & Export**
- Inline editing on every insight card — fix Claude's output before exporting
- Copy to clipboard as plain text
- Export as a dark-mode PDF
- Send to Notion and/or email via n8n webhook integration

**Security**
- File size validation (25MB max)
- MIME type validation
- Per-IP rate limiting
- Transcript length cap
- Files are never stored — processed in memory only

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui |
| Transcription | Whisper Large v3 via Groq API |
| Analysis | Claude Sonnet via Anthropic API |
| PDF Export | jsPDF |
| Automation | n8n (self-hosted via Docker) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/jyoah02/mira-vercel.git
cd mira-vercel
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
GROQ_API_KEY=your_groq_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional: set to true to skip real API calls during UI development
MOCK_MODE=false

# Optional: n8n webhook URL for Notion + email integrations
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/mira-insights
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## n8n Integration (Optional)

MIRA supports sending insights directly to Notion and via email through an n8n automation workflow.

**Requirements**
- n8n self-hosted (Docker recommended)
- Notion API token
- Gmail OAuth credentials

**Setup**

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

In n8n, build a workflow with:
1. **Webhook** node — receives the payload from MIRA
2. **IF** node — routes to Notion or Gmail based on `destinations`
3. **HTTP Request** node — creates a Notion page via the Notion API
4. **Code** node — builds the HTML email body
5. **Gmail** node — sends the formatted email with insights

Set `NEXT_PUBLIC_N8N_WEBHOOK_URL` in your environment to the webhook URL.

---

## Supported Languages

EN · ES · FR · DE · PT · ZH · JA · KO · IT · AR · NL · RU

Language is auto-detected by Whisper. Claude responds in the same language as the transcript.

---

## Roadmap

| Status | Feature |
|---|---|
| ✅ Done | Core transcription & analysis pipeline |
| ✅ Done | Inline editing & export (PDF, clipboard) |
| ✅ Done | Notion & email integration via n8n |
| 🔄 Next | Real-time transcription during live meetings |
| 📊 Later | Multi-meeting aggregation & trend tracking |
| 🔗 Future | Native calendar & task manager integrations |

---

## License

MIT
