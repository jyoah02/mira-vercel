"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { exportToPDF } from "@/lib/export";

interface ActionItem {
  task: string;
  owner: string | null;
}

interface Insights {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
  sentiment: "positive" | "neutral" | "negative";
  tone: string;
}

type Stage = "idle" | "transcribing" | "analyzing" | "done" | "error";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-700",
  negative: "bg-red-100 text-red-800",
};

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  async function handleFile(file: File) {
    setFileName(file.name);
    setStage("transcribing");
    setProgress(20);
    setError("");
    setInsights(null);

    try {
      const fd = new FormData();
      fd.append("audio", file);
      const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!tRes.ok) throw new Error("Transcription failed");
      const { transcript: text } = await tRes.json();
      setTranscript(text);
      setProgress(55);

      setStage("analyzing");
      const iRes = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      if (!iRes.ok) throw new Error("Insights extraction failed");
      const { insights: data } = await iRes.json();
      setInsights(data);
      setProgress(100);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStage("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function copyToClipboard() {
    if (!insights) return;
    const text = [
      `MEETING SUMMARY\n${insights.summary}`,
      `\nKEY DECISIONS\n${insights.decisions.map((d) => `• ${d}`).join("\n")}`,
      `\nACTION ITEMS\n${insights.actionItems.map((a) => `• ${a.task}${a.owner ? ` (${a.owner})` : ""}`).join("\n")}`,
      `\nOPEN QUESTIONS\n${insights.openQuestions.map((q) => `• ${q}`).join("\n")}`,
      `\nSENTIMENT: ${insights.sentiment} | TONE: ${insights.tone}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Meeting Insights</h1>
          <p className="text-sm text-gray-500">AI-powered transcription and analysis</p>
        </div>
        {insights && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              Copy to Clipboard
            </Button>
            <Button size="sm" onClick={() => exportToPDF(dashboardRef)}>
              Download PDF
            </Button>
          </div>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {(stage === "idle" || stage === "error") && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-white transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-4xl mb-3">🎙️</div>
            <p className="text-lg font-medium text-gray-700">Drop your meeting audio here</p>
            <p className="text-sm text-gray-400 mt-1">MP3 or WAV — click to browse</p>
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,.wav,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {stage === "error" && (
              <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
            )}
          </div>
        )}

        {(stage === "transcribing" || stage === "analyzing") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">
                {stage === "transcribing" ? "Transcribing audio..." : "Extracting insights..."}
              </span>
              <span className="text-gray-400">{fileName}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-400">
              {stage === "transcribing"
                ? "Sending to Groq Whisper — this takes a few seconds"
                : "Claude is reading the transcript"}
            </p>
          </div>
        )}

        {stage === "done" && insights && (
          <div ref={dashboardRef} className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800">Analysis complete</h2>
              <span className="text-sm text-gray-400">{fileName}</span>
              <span
                className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full capitalize ${SENTIMENT_COLOR[insights.sentiment]}`}
              >
                {insights.sentiment} sentiment
              </span>
              <Badge variant="secondary" className="capitalize">
                {insights.tone}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Meeting Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 leading-relaxed">{insights.summary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Key Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.decisions.length === 0 ? (
                      <li className="text-gray-400 text-sm italic">None recorded</li>
                    ) : (
                      insights.decisions.map((d, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-blue-500 mt-0.5">✓</span>
                          {d}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.actionItems.length === 0 ? (
                      <li className="text-gray-400 text-sm italic">None recorded</li>
                    ) : (
                      insights.actionItems.map((a, i) => (
                        <li key={i} className="text-sm">
                          <span className="text-gray-700">{a.task}</span>
                          {a.owner && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {a.owner}
                            </Badge>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Open Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.openQuestions.length === 0 ? (
                      <li className="text-gray-400 text-sm italic">None recorded</li>
                    ) : (
                      insights.openQuestions.map((q, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-amber-500">?</span>
                          {q}
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>

              <details className="md:col-span-2">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-600">
                  View raw transcript
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg border text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {transcript}
                </div>
              </details>
            </div>

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400"
                onClick={() => {
                  setStage("idle");
                  setInsights(null);
                  setTranscript("");
                  setFileName("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                ← Analyze another recording
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
