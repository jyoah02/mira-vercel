'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Download, Check, FileCheck, Send, X, Loader2 } from 'lucide-react';
import { MeetingInsights } from '@/types/insights';

interface Props {
  insights: MeetingInsights;
  filename?: string;
}

function formatAsText(insights: MeetingInsights): string {
  const lines: string[] = ['MEETING INSIGHTS REPORT', '========================\n'];
  lines.push('SUMMARY');
  lines.push(insights.summary);
  lines.push('\nDECISIONS MADE');
  insights.decisions.length === 0 ? lines.push('• None recorded') : insights.decisions.forEach(d => lines.push(`• ${d}`));
  lines.push('\nACTION ITEMS');
  insights.actionItems.length === 0 ? lines.push('• None') : insights.actionItems.forEach(a => lines.push(`• ${a.task}${a.owner ? ` (${a.owner})` : ''}`));
  lines.push('\nOPEN QUESTIONS');
  insights.openQuestions.length === 0 ? lines.push('• None') : insights.openQuestions.forEach(q => lines.push(`? ${q}`));
  lines.push(`\nSENTIMENT: ${insights.sentiment.toUpperCase()} | TONE: ${insights.tone}`);
  return lines.join('\n');
}

async function generatePDF(insights: MeetingInsights) {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = W - margin * 2;

  pdf.setFillColor(9, 9, 11);
  pdf.rect(0, 0, W, H, 'F');

  pdf.setFillColor(24, 24, 27);
  pdf.rect(0, 0, W, 22, 'F');

  pdf.setDrawColor(124, 58, 237);
  pdf.setLineWidth(0.5);
  pdf.line(0, 22, W, 22);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Meeting Insights Report', margin, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(113, 113, 122);
  pdf.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, W - margin, 14, { align: 'right' });

  let y = 34;

  const drawSection = (title: string, content: () => number) => {
    if (y > H - 30) { pdf.addPage(); pdf.setFillColor(9, 9, 11); pdf.rect(0, 0, W, H, 'F'); y = 20; }
    const startY = y - 5;
    pdf.setFillColor(24, 24, 27);
    pdf.roundedRect(margin, startY, contentWidth, 8, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(167, 139, 250);
    pdf.text(title.toUpperCase(), margin + 4, y + 1);
    y += 10;
    const endY = content();
    pdf.setDrawColor(39, 39, 42);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, startY, contentWidth, endY - startY + 4, 2, 2, 'S');
    y = endY + 10;
  };

  const writeWrapped = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number): number => {
    pdf.setTextColor(212, 212, 216);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, startY);
    return startY + (lines.length * lineHeight);
  };

  drawSection('Meeting Summary', () => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    return writeWrapped(insights.summary, margin + 4, y, contentWidth - 8, 5.5);
  });

  if (insights.decisions.length > 0) {
    drawSection('Decisions Made', () => {
      let dy = y;
      insights.decisions.forEach(d => {
        pdf.setFillColor(124, 58, 237);
        pdf.circle(margin + 7, dy - 1, 1, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        dy = writeWrapped(d, margin + 12, dy, contentWidth - 16, 5.5) + 2;
      });
      return dy - 2;
    });
  }

  if (insights.actionItems.length > 0) {
    drawSection('Action Items', () => {
      let dy = y;
      insights.actionItems.forEach(item => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        dy = writeWrapped(`• ${item.task}`, margin + 4, dy, contentWidth - 8, 5.5);
        if (item.owner) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.setTextColor(167, 139, 250);
          pdf.text(`  Owner: ${item.owner}`, margin + 4, dy);
          pdf.setTextColor(212, 212, 216);
          dy += 6;
        }
        dy += 2;
      });
      return dy - 2;
    });
  }

  if (insights.openQuestions.length > 0) {
    drawSection('Open Questions', () => {
      let dy = y;
      insights.openQuestions.forEach(q => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(251, 146, 60);
        pdf.text('?', margin + 5, dy);
        pdf.setTextColor(212, 212, 216);
        dy = writeWrapped(q, margin + 12, dy, contentWidth - 16, 5.5) + 2;
      });
      return dy - 2;
    });
  }

  drawSection('Sentiment & Tone', () => {
    const sentimentColors: Record<string, [number, number, number]> = {
      positive: [16, 185, 129], negative: [239, 68, 68],
      neutral: [113, 113, 122], mixed: [245, 158, 11],
    };
    const [r, g, b] = sentimentColors[insights.sentiment] ?? sentimentColors.neutral;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(r, g, b);
    const sentLabel = insights.sentiment.charAt(0).toUpperCase() + insights.sentiment.slice(1);
    pdf.text(sentLabel, margin + 4, y);
    if (insights.tone) {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(113, 113, 122);
      pdf.text(`  ·  ${insights.tone}`, margin + 4 + pdf.getTextWidth(sentLabel), y);
    }
    const barY = y + 5;
    const scoreMap: Record<string, number> = { positive: 0.85, neutral: 0.5, negative: 0.2, mixed: 0.6 };
    const score = scoreMap[insights.sentiment] ?? 0.5;
    pdf.setFillColor(39, 39, 42);
    pdf.roundedRect(margin + 4, barY, contentWidth - 8, 3, 1, 1, 'F');
    pdf.setFillColor(r, g, b);
    pdf.roundedRect(margin + 4, barY, (contentWidth - 8) * score, 3, 1, 1, 'F');
    return barY + 8;
  });

  pdf.setFillColor(24, 24, 27);
  pdf.rect(0, H - 12, W, 12, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(63, 63, 70);
  pdf.text('Generated by MIRA — Meeting Insights & Report Aggregator', margin, H - 7);
  pdf.setFontSize(7);
  pdf.setTextColor(39, 39, 42);
  pdf.text('PDF supports Latin-based scripts. For other languages, use Copy to clipboard.', margin, H - 3);
  pdf.setFontSize(8);
  pdf.setTextColor(63, 63, 70);
  pdf.text('Page 1', W - margin, H - 7, { align: 'right' });

  pdf.save('mira-insights.pdf');
}

type PDFState = 'idle' | 'generating' | 'saved';
type SendState = 'idle' | 'sending' | 'sent' | 'error';

const N8N_KEY = 'mira_n8n_webhook_url';

export function ExportButtons({ insights, filename }: Props) {
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<PDFState>('idle');
  const [showWebhook, setShowWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const webhookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWebhookUrl(localStorage.getItem(N8N_KEY) ?? '');
  }, []);

  useEffect(() => {
    if (!showWebhook) return;
    const handler = (e: MouseEvent) => {
      if (webhookRef.current && !webhookRef.current.contains(e.target as Node)) {
        setShowWebhook(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showWebhook]);

  const handleSend = async () => {
    if (!webhookUrl.trim() || sendState === 'sending') return;
    localStorage.setItem(N8N_KEY, webhookUrl.trim());
    setSendState('sending');
    try {
      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights,
          filename: filename ?? null,
          generatedAt: new Date().toISOString(),
          source: 'MIRA',
        }),
      });
      if (!res.ok) throw new Error('Bad response');
      setSendState('sent');
      setTimeout(() => { setSendState('idle'); setShowWebhook(false); }, 2500);
    } catch {
      setSendState('error');
      setTimeout(() => setSendState('idle'), 3000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatAsText(insights));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePDF = async () => {
    if (pdfState !== 'idle') return;
    setPdfState('generating');
    // Small delay so the button state is visible before the browser blocks on PDF generation
    await new Promise(r => setTimeout(r, 300));
    try {
      await generatePDF(insights);
      setPdfState('saved');
      setTimeout(() => setPdfState('idle'), 3000);
    } catch {
      setPdfState('idle');
    }
  };

  const btnClass = "relative group flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-all h-9";

  return (
    <div className="flex gap-2 relative">
      <button onClick={handleCopy} className={`${btnClass} border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white`}>
        {copied ? <Check className="w-3.5 h-3.5 text-violet-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 text-xs bg-zinc-900 text-white border border-zinc-700 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
          Copy to clipboard
        </span>
      </button>

      <button
        onClick={handlePDF}
        disabled={pdfState !== 'idle'}
        className={`${btnClass} ${
          pdfState === 'saved'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        } disabled:cursor-not-allowed`}
      >
        {pdfState === 'generating' && (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        {pdfState === 'saved' && <FileCheck className="w-3.5 h-3.5" />}
        {pdfState === 'idle' && <Download className="w-3.5 h-3.5" />}
        {pdfState === 'generating' ? 'Generating...' : pdfState === 'saved' ? 'Saved!' : 'PDF'}
        {pdfState === 'idle' && (
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 text-xs bg-zinc-900 text-white border border-zinc-700 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
            Download as PDF
          </span>
        )}
      </button>
      {/* Send to n8n */}
      <div className="relative" ref={webhookRef}>
        <button
          onClick={() => setShowWebhook(v => !v)}
          className={`${btnClass} ${showWebhook ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-zinc-700 bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
        >
          <Send className="w-3.5 h-3.5" />
          Send
          {!showWebhook && (
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 text-xs bg-zinc-900 text-white border border-zinc-700 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
              Send to n8n webhook
            </span>
          )}
        </button>

        {showWebhook && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-4 z-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Send to n8n</p>
              <button onClick={() => setShowWebhook(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              Paste your n8n webhook URL to send insights to Notion, Slack, Google Sheets, and more.
            </p>
            <input
              type="url"
              placeholder="https://your-n8n-instance/webhook/..."
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 mb-3"
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button
              onClick={handleSend}
              disabled={!webhookUrl.trim() || sendState === 'sending'}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed
                ${sendState === 'sent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  sendState === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-violet-600 hover:bg-violet-500 text-white'}`}
            >
              {sendState === 'sending' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {sendState === 'sent' && <Check className="w-3.5 h-3.5" />}
              {sendState === 'sending' ? 'Sending...' : sendState === 'sent' ? 'Sent!' : sendState === 'error' ? 'Send failed — check URL' : 'Send insights'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
