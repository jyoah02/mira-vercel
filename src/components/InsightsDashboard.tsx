'use client';

import { useState } from 'react';
import { MeetingInsights } from '@/types/insights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Lightbulb, HelpCircle, TrendingUp, FileText, Pencil, Check, Trash2, Plus } from 'lucide-react';

interface Props {
  insights: MeetingInsights;
  onChange: (updated: MeetingInsights) => void;
}

const sentimentConfig = {
  positive: { label: 'Positive', bar: 'linear-gradient(to right, #10b981, #34d399)', shadow: 'rgba(16,185,129,0.4)', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  negative: { label: 'Negative', bar: 'linear-gradient(to right, #ef4444, #f87171)', shadow: 'rgba(239,68,68,0.4)', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  neutral:  { label: 'Neutral',  bar: 'linear-gradient(to right, #71717a, #a1a1aa)', shadow: 'none',                  badge: 'bg-zinc-700/50 text-zinc-400 border-zinc-600' },
  mixed:    { label: 'Mixed',    bar: 'linear-gradient(to right, #f59e0b, #fbbf24)', shadow: 'rgba(245,158,11,0.4)', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

const scoreMap = { positive: 85, neutral: 50, negative: 20, mixed: 60 };

const ownerColors = [
  'bg-violet-500/15 text-violet-300 border-violet-500/30 hover:bg-violet-500/25',
  'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
  'bg-pink-500/15 text-pink-300 border-pink-500/30 hover:bg-pink-500/25',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
];

const cardStyle = { background: 'linear-gradient(135deg, rgba(24,24,27,0.95), rgba(24,24,27,0.85))' };
const cardHoverClass = 'transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700 relative overflow-hidden group';

const inputClass = 'w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors';

function CardTopBorder() {
  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)' }}
    />
  );
}

function EditToggle({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`ml-auto p-1.5 rounded-md transition-colors ${editing ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
      title={editing ? 'Done editing' : 'Edit'}
    >
      {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
    </button>
  );
}

export function InsightsDashboard({ insights, onChange }: Props) {
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingDecisions, setEditingDecisions] = useState(false);
  const [editingActions, setEditingActions] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [editingSentiment, setEditingSentiment] = useState(false);

  const config = sentimentConfig[insights.sentiment] ?? sentimentConfig.neutral;
  const score = scoreMap[insights.sentiment] ?? 50;

  const update = (patch: Partial<MeetingInsights>) => onChange({ ...insights, ...patch });

  return (
    <div id="insights-dashboard" className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Summary */}
      <Card className={`md:col-span-2 border-zinc-800 ${cardHoverClass}`} style={cardStyle}>
        <CardTopBorder />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-violet-400" />
            Meeting summary
            <EditToggle editing={editingSummary} onToggle={() => setEditingSummary(v => !v)} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingSummary ? (
            <textarea
              className={`${inputClass} resize-none leading-relaxed font-dm-sans`}
              rows={4}
              value={insights.summary}
              onChange={e => update({ summary: e.target.value })}
              autoFocus
            />
          ) : (
            <p className="text-base text-zinc-300 leading-relaxed font-dm-sans">{insights.summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Decisions */}
      <Card className={`border-zinc-800 ${cardHoverClass}`} style={cardStyle}>
        <CardTopBorder />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Decisions made
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{insights.decisions.length}</Badge>
            <EditToggle editing={editingDecisions} onToggle={() => setEditingDecisions(v => !v)} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.decisions.length === 0 && !editingDecisions ? (
            <p className="text-sm text-zinc-600 italic">No decisions recorded</p>
          ) : (
            <ul className="space-y-2">
              {insights.decisions.map((d, i) => (
                <li key={i} className="flex gap-3 text-base p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors items-start">
                  {editingDecisions ? (
                    <>
                      <input
                        className={`${inputClass} flex-1`}
                        value={d}
                        onChange={e => {
                          const next = [...insights.decisions];
                          next[i] = e.target.value;
                          update({ decisions: next });
                        }}
                      />
                      <button onClick={() => update({ decisions: insights.decisions.filter((_, j) => j !== i) })}
                        className="flex-shrink-0 p-1 text-zinc-600 hover:text-red-400 transition-colors mt-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-amber-400 flex-shrink-0 mt-0.5 text-lg leading-none">•</span>
                      <span className="text-zinc-300 leading-relaxed font-dm-sans">{d}</span>
                    </>
                  )}
                </li>
              ))}
              {editingDecisions && (
                <li>
                  <button
                    onClick={() => update({ decisions: [...insights.decisions, ''] })}
                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors px-3 py-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add decision
                  </button>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className={`border-zinc-800 ${cardHoverClass}`} style={cardStyle}>
        <CardTopBorder />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            Action items
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{insights.actionItems.length}</Badge>
            <EditToggle editing={editingActions} onToggle={() => setEditingActions(v => !v)} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.actionItems.length === 0 && !editingActions ? (
            <p className="text-sm text-zinc-600 italic">No action items identified</p>
          ) : (
            <div className="space-y-3">
              {insights.actionItems.map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-all hover:translate-x-1 duration-200">
                  {editingActions ? (
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <input
                          className={inputClass}
                          placeholder="Task description"
                          value={item.task}
                          onChange={e => {
                            const next = [...insights.actionItems];
                            next[i] = { ...next[i], task: e.target.value };
                            update({ actionItems: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          placeholder="Owner (optional)"
                          value={item.owner ?? ''}
                          onChange={e => {
                            const next = [...insights.actionItems];
                            next[i] = { ...next[i], owner: e.target.value || null };
                            update({ actionItems: next });
                          }}
                        />
                      </div>
                      <button onClick={() => update({ actionItems: insights.actionItems.filter((_, j) => j !== i) })}
                        className="flex-shrink-0 p-1 text-zinc-600 hover:text-red-400 transition-colors mt-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-base text-zinc-300 leading-relaxed font-dm-sans">{item.task}</span>
                      {item.owner && (
                        <Badge className={`w-fit text-xs border transition-all cursor-default ${ownerColors[i % ownerColors.length]}`}>
                          {item.owner}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              ))}
              {editingActions && (
                <button
                  onClick={() => update({ actionItems: [...insights.actionItems, { task: '', owner: null }] })}
                  className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors px-3 py-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Add action item
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Questions */}
      <Card className={`border-zinc-800 ${cardHoverClass}`} style={cardStyle}>
        <CardTopBorder />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-orange-400" />
            Open questions
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{insights.openQuestions.length}</Badge>
            <EditToggle editing={editingQuestions} onToggle={() => setEditingQuestions(v => !v)} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.openQuestions.length === 0 && !editingQuestions ? (
            <p className="text-sm text-zinc-600 italic">No open questions</p>
          ) : (
            <ul className="space-y-2">
              {insights.openQuestions.map((q, i) => (
                <li key={i} className="flex gap-3 text-base p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors items-start">
                  {editingQuestions ? (
                    <>
                      <input
                        className={`${inputClass} flex-1`}
                        value={q}
                        onChange={e => {
                          const next = [...insights.openQuestions];
                          next[i] = e.target.value;
                          update({ openQuestions: next });
                        }}
                      />
                      <button onClick={() => update({ openQuestions: insights.openQuestions.filter((_, j) => j !== i) })}
                        className="flex-shrink-0 p-1 text-zinc-600 hover:text-red-400 transition-colors mt-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-orange-400 flex-shrink-0 mt-0.5 text-lg leading-none font-bold">?</span>
                      <span className="text-zinc-300 leading-relaxed font-dm-sans">{q}</span>
                    </>
                  )}
                </li>
              ))}
              {editingQuestions && (
                <li>
                  <button
                    onClick={() => update({ openQuestions: [...insights.openQuestions, ''] })}
                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors px-3 py-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add question
                  </button>
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Sentiment */}
      <Card className={`border-zinc-800 ${cardHoverClass}`} style={cardStyle}>
        <CardTopBorder />
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            Sentiment & tone
            <EditToggle editing={editingSentiment} onToggle={() => setEditingSentiment(v => !v)} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingSentiment ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Sentiment</label>
                <select
                  className={`${inputClass} cursor-pointer`}
                  value={insights.sentiment}
                  onChange={e => update({ sentiment: e.target.value as MeetingInsights['sentiment'] })}
                >
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Tone</label>
                <input
                  className={inputClass}
                  placeholder="e.g. collaborative, tense, focused"
                  value={insights.tone ?? ''}
                  onChange={e => update({ tone: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Badge className={`text-sm border px-3 py-1 ${config.badge}`}>{config.label}</Badge>
                {insights.tone && (
                  <Badge className="text-sm bg-zinc-800 text-zinc-400 border-zinc-700 capitalize px-3 py-1">{insights.tone}</Badge>
                )}
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: config.bar, boxShadow: config.shadow !== 'none' ? `0 0 16px ${config.shadow}` : 'none' }}
                />
                <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', animation: 'shimmer 2s infinite' }} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
