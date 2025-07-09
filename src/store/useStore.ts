import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Meeting, Note, ActionItem, Settings, Reminder } from '../types';

interface AppState {
  // User
  userId: string | null;
  setUserId: (userId: string | null) => void;
  
  // Settings
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  
  // Meetings
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  
  // Notes
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  getNotesByMeetingId: (meetingId: string) => Note | undefined;
  
  // Action Items
  actionItems: ActionItem[];
  addActionItem: (item: ActionItem) => void;
  updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  getActionItemsByDate: (date: string) => ActionItem[];
  
  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  getRemindersByMeetingId: (meetingId: string) => Reminder[];
  getPendingReminders: () => Reminder[];
  
  // Recording state
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  recordingStartTime: Date | null;
  setRecordingStartTime: (time: Date | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User
      userId: null,
      setUserId: (userId) => set({ userId }),
      
      // Settings
      settings: {
        audioQuality: 'medium',
        autoStartRecording: false,
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // Meetings
      meetings: [],
      currentMeeting: null,
      addMeeting: (meeting) =>
        set((state) => ({
          meetings: [...state.meetings, meeting],
        })),
      updateMeeting: (id, updates) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      deleteMeeting: (id) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
          // Also remove related notes, action items, and reminders
          notes: state.notes.filter((n) => n.meetingId !== id),
          actionItems: state.actionItems.filter((a) => a.meetingId !== id),
          reminders: state.reminders.filter((r) => r.meetingId !== id),
        })),
      setCurrentMeeting: (meeting) =>
        set({ currentMeeting: meeting }),
      
      // Notes
      notes: [],
      addNote: (note) =>
        set((state) => ({
          notes: [...state.notes, note],
        })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),
      getNotesByMeetingId: (meetingId) => {
        const notes = get().notes;
        return notes.find((n) => n.meetingId === meetingId);
      },
      
      // Action Items
      actionItems: [],
      addActionItem: (item) =>
        set((state) => ({
          actionItems: [...state.actionItems, item],
        })),
      updateActionItem: (id, updates) =>
        set((state) => ({
          actionItems: state.actionItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      getActionItemsByDate: (date) => {
        const items = get().actionItems;
        return items.filter((item) => item.date === date);
      },
      
      // Reminders
      reminders: [],
      addReminder: (reminder) =>
        set((state) => ({
          reminders: [...state.reminders, reminder],
        })),
      updateReminder: (id, updates) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      deleteReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),
      getRemindersByMeetingId: (meetingId) => {
        const reminders = get().reminders;
        return reminders.filter((r) => r.meetingId === meetingId);
      },
      getPendingReminders: () => {
        const reminders = get().reminders;
        const now = new Date();
        return reminders.filter(
          (r) => r.status === 'pending' && new Date(r.reminderDate) <= now
        );
      },
      
      // Recording state
      isRecording: false,
      setIsRecording: (isRecording) => set({ isRecording }),
      recordingStartTime: null,
      setRecordingStartTime: (time) => set({ recordingStartTime: time }),
    }),
    {
      name: 'meetingmind-storage',
      partialize: (state) => ({
        settings: {
          ...state.settings,
          openAIApiKey: undefined, // Don't persist API key in regular storage
        },
        meetings: state.meetings,
        notes: state.notes,
        actionItems: state.actionItems,
        reminders: state.reminders,
      }),
    }
  )
);