export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: Date;
  endTime?: Date;
  participants: string[];
  platform: 'zoom' | 'teams' | 'meet' | 'slack' | 'other';
  isRecording?: boolean;
  audioPath?: string;
}

export interface Note {
  id: string;
  meetingId: string;
  rawTranscript: string;
  enhancedNotes: string;
  summary: string;
  actionItems: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: string;
  meetingId: string;
  date: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Settings {
  openAIApiKey?: string;
  defaultTemplate?: string;
  audioQuality: 'low' | 'medium' | 'high';
  autoStartRecording: boolean;
}