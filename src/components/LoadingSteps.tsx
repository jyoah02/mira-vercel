'use client';

import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { ProcessingStep } from '@/types/insights';

interface Props {
  currentStep: ProcessingStep;
}

const steps = [
  { key: 'uploading', label: 'Uploading audio', desc: 'Securely sending your file for processing — never stored' },
  { key: 'transcribing', label: 'Transcribing with Whisper', desc: "Converting speech to text using OpenAI's Whisper model" },
  { key: 'analyzing', label: 'Analyzing with Claude', desc: 'Extracting key insights, decisions, action items, and sentiment' },
];

export function LoadingSteps({ currentStep }: Props) {
  const stepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex flex-col gap-6">
        {steps.map((step, i) => {
          const isDone = stepIndex > i || currentStep === 'done';
          const isActive = steps[i].key === currentStep;
          const isPending = !isDone && !isActive;

          return (
            <div key={step.key} className="flex items-start gap-4 relative">
              {i < steps.length - 1 && (
                <div className="absolute left-2.5 top-7 w-0.5 bg-zinc-800" style={{ height: 'calc(100% + 1.5rem)' }} />
              )}
              <div className="relative z-10 flex-shrink-0 w-5 h-5 mt-0.5">
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-violet-400" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-700" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-base font-semibold mb-1 ${isActive ? 'text-white' : isDone ? 'text-zinc-500' : 'text-zinc-700'}`}>
                  {step.label}
                </p>
                <p className={`text-sm leading-relaxed ${isActive ? 'text-zinc-400' : isPending ? 'text-zinc-700' : 'text-zinc-600'}`}>
                  {step.desc}
                </p>
                {isActive && (
                  <div className="mt-2.5 w-full h-1.5 rounded-full overflow-hidden relative" style={{ background: '#27272a' }}>
                    <div
                      className="absolute inset-y-0 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        animation: 'indeterminate 1.6s ease-in-out infinite',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
