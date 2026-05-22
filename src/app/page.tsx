'use client';

import { useState } from 'react';
import { AudioUploader } from '@/components/AudioUploader';
import { TranscriptViewer } from '@/components/TranscriptViewer';
import { InsightsDashboard } from '@/components/InsightsDashboard';
import { ExportButtons } from '@/components/ExportButtons';
import { LoadingSteps } from '@/components/LoadingSteps';
import { Button } from '@/components/ui/button';
import { MeetingInsights, ProcessingStep } from '@/types/insights';
import { Mic, Sparkles, AlertCircle, RotateCcw, Zap, Brain, Target, ArrowRight, ShieldCheck } from 'lucide-react';

type View = 'landing' | 'upload' | 'results';

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('too large') || m.includes('413')) return "Your file is too large. Please use a recording under 25 MB.";
  if (m.includes('unsupported') || m.includes('415') || m.includes('file type')) return "We couldn't read that file type. Try MP3, WAV, or M4A.";
  if (m.includes('too many') || m.includes('429') || m.includes('rate')) return "You've made too many requests. Please wait a minute and try again.";
  if (m.includes('transcript') && m.includes('long')) return "Your recording produced a very long transcript. Try a shorter clip (under 2 hours).";
  if (m.includes('transcri')) return "We had trouble reading your audio. Make sure it's a clear recording and try again.";
  if (m.includes('analy') || m.includes('insight')) return "We couldn't analyze the transcript. Please try again in a moment.";
  if (m.includes('network') || m.includes('fetch')) return "Connection issue. Check your internet and try again.";
  return "Something went wrong. Please try again.";
}

const LANGUAGE_MAP: Record<string, { flag: string; name: string }> = {
  english:    { flag: '🇺🇸', name: 'English' },
  spanish:    { flag: '🇪🇸', name: 'Spanish' },
  french:     { flag: '🇫🇷', name: 'French' },
  german:     { flag: '🇩🇪', name: 'German' },
  portuguese: { flag: '🇧🇷', name: 'Portuguese' },
  chinese:    { flag: '🇨🇳', name: 'Chinese' },
  japanese:   { flag: '🇯🇵', name: 'Japanese' },
  korean:     { flag: '🇰🇷', name: 'Korean' },
  italian:    { flag: '🇮🇹', name: 'Italian' },
  arabic:     { flag: '🇸🇦', name: 'Arabic' },
  dutch:      { flag: '🇳🇱', name: 'Dutch' },
  russian:    { flag: '🇷🇺', name: 'Russian' },
};

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [landingExiting, setLandingExiting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [transcript, setTranscript] = useState('');
  const [insights, setInsights] = useState<MeetingInsights | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setInsights(null);
    setTranscript('');
    setError('');
    setStep('idle');
  };

  const handleProcess = async () => {
    if (!file) return;
    setError('');
    setInsights(null);

    try {
      setStep('uploading');
      await new Promise(r => setTimeout(r, 400));
      const formData = new FormData();
      formData.append('audio', file);

      setStep('transcribing');
      const tRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!tRes.ok) {
        const err = await tRes.json();
        throw new Error(err.error || 'Transcription failed');
      }
      const { transcript: rawTranscript, language } = await tRes.json();
      setTranscript(rawTranscript);
      setDetectedLanguage(language ?? null);

      setStep('analyzing');
      const aRes = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: rawTranscript }),
      });
      if (!aRes.ok) {
        const err = await aRes.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const { insights: extracted } = await aRes.json();
      setInsights(extracted);
      setStep('done');
      setView('results');
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Something went wrong';
      setError(friendlyError(raw));
      setStep('error');
    }
  };

  const reset = () => {
    setFile(null);
    setStep('idle');
    setTranscript('');
    setInsights(null);
    setDetectedLanguage(null);
    setError('');
    setView('upload');
  };

  const isProcessing = ['uploading', 'transcribing', 'analyzing'].includes(step);

  // Landing Page
  if (view === 'landing') {
    return (
      <div className={`min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 relative overflow-hidden ${landingExiting ? 'animate-fade-out-landing' : ''}`}>
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 60%)',
            animation: 'pulse-glow 8s ease-in-out infinite',
          }}
        />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Logo */}
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-8"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              boxShadow: '0 20px 40px rgba(124,58,237,0.35)',
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            <Mic className="w-10 h-10 text-white" />
          </div>

          <h1
            className="text-6xl font-extrabold tracking-tight mb-4"
            style={{
              background: 'linear-gradient(135deg, white, #c4b5fd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            MIRA
          </h1>

          <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
            Transform your meeting recordings into structured insights with AI-powered transcription and analysis.
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-5 mb-12">
            {[
              { icon: <Zap className="w-6 h-6 text-violet-400" />, title: 'Fast Transcription', desc: 'Powered by Whisper for accurate, lightning-fast audio-to-text' },
              { icon: <Brain className="w-6 h-6 text-violet-400" />, title: 'Smart Analysis', desc: 'Claude extracts decisions, action items, and sentiment automatically' },
              { icon: <Target className="w-6 h-6 text-violet-400" />, title: 'Actionable Reports', desc: 'Get structured insights you can share and act on immediately' },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm text-left">
                <div className="mb-3">{f.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
            setLandingExiting(true);
            setTimeout(() => setView('upload'), 500);
          }}
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: '#7c3aed',
              boxShadow: '0 8px 20px rgba(124,58,237,0.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#8b5cf6';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(124,58,237,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#7c3aed';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(124,58,237,0.35)';
            }}
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white animate-fade-in-app">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-50" style={{ background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Mic className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">MIRA</h1>
              <p className="text-xs text-zinc-500 leading-none mt-0.5">Meeting Intelligence & Report Aggregator</p>
            </div>
          </div>

          {view === 'results' && insights && (
            <div className="flex items-center gap-2">
              <ExportButtons insights={insights} filename={file?.name} />
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="relative group text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 px-3 text-sm"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                New
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 text-xs bg-zinc-900 text-white border border-zinc-700 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                  Start new analysis
                </span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className={`max-w-5xl mx-auto px-6 relative z-10 ${view === 'upload' ? 'flex flex-col items-center justify-center min-h-[calc(100vh-73px)] py-8' : 'py-12'}`}>

        {/* Upload view */}
        {view === 'upload' && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight leading-tight">
                Turn meetings into
                <span className="text-violet-400"> actionable insights</span>
              </h2>
              <p className="text-base text-zinc-500 max-w-lg mx-auto leading-relaxed">
                Upload a recording. Get a transcript, key decisions, action items, and sentiment — powered by Whisper and Claude.
              </p>
            </div>

            <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 p-7 space-y-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(24,24,27,0.6), rgba(18,18,21,0.8))' }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.05) 0%, transparent 50%)' }}
              />
              <div className="relative z-10 space-y-5">
                <AudioUploader onFileSelect={handleFileSelect} disabled={isProcessing} />

                {isProcessing && <LoadingSteps currentStep={step} />}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={!file || isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#7c3aed' }}
                  onMouseEnter={e => { if (!isProcessing && file) (e.currentTarget as HTMLElement).style.background = '#8b5cf6'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#7c3aed'; }}
                >
                  <Sparkles className="w-5 h-5" />
                  {isProcessing ? 'Processing...' : 'Generate insights'}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
                  Your audio is processed in real-time and never stored on our servers.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Results view */}
        {view === 'results' && insights && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Extracted Insights</h2>
              <div className="flex items-center gap-3">
                {detectedLanguage && (() => {
                  const lang = LANGUAGE_MAP[detectedLanguage.toLowerCase()];
                  return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
                      <span>{lang?.flag ?? '🌐'}</span>
                      <span>{lang?.name ?? detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1)}</span>
                    </span>
                  );
                })()}
                <span className="text-sm text-zinc-500">{file?.name}</span>
              </div>
            </div>
            <InsightsDashboard insights={insights} onChange={setInsights} />
            {transcript && <TranscriptViewer transcript={transcript} />}
          </div>
        )}

      </main>
    </div>
  );
}
