export interface ActionItem {
  task: string;
  owner: string | null;
}

export interface MeetingInsights {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  tone: string;
}

export type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'done' | 'error';
