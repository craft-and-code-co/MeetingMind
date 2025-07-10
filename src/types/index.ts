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
  templateId?: string;
  folderId?: string;
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
  defaultMeetingTemplate?: string;
  audioQuality: 'low' | 'medium' | 'high';
  autoStartRecording: boolean;
  enableKeyboardShortcuts?: boolean;
  enableNotifications?: boolean;
  meetingNotifications?: boolean;
  transcriptionNotifications?: boolean;
  meetingDetectionNotifications?: boolean;
  actionItemNotifications?: boolean;
  reminderNotifications?: boolean;
  theme?: 'light' | 'dark';
  openAIModel?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo-preview';
  showMenuBar?: boolean;
  menuBarAlwaysVisible?: boolean;
}

export interface Reminder {
  id: string;
  meetingId: string;
  actionItemId?: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate: string;
  status: 'pending' | 'sent' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}