'use client';

import { useState } from 'react';
import { Copy, Download, Check, FileCheck } from 'lucide-react';
import { MeetingInsights } from '@/types/insights';

interface Props {
  insights: MeetingInsights;
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

export function ExportButtons({ insights }: Props) {
  const [copied, setCopied] = useState(false);
  const [pdfState, setPdfState] = useState<PDFState>('idle');

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
    <div className="flex gap-2">
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
    </div>
  );
}
