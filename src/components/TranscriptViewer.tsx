'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';

interface Props {
  transcript: string;
}

export function TranscriptViewer({ transcript }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTranscript = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-all duration-300">
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-zinc-800/40 transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 text-base font-semibold text-white">
          <FileText className="w-4 h-4 text-zinc-400" />
          Raw transcript
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={copyTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-violet-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-zinc-800">
          <div
            className="mt-4 p-4 rounded-lg text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
            style={{ background: 'rgba(9,9,11,0.5)', scrollbarWidth: 'thin', scrollbarColor: '#52525b #27272a' }}
          >
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}
