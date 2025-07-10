export interface ElectronAPI {
  storeApiKey: (apiKey: string) => Promise<boolean>;
  getApiKey: () => Promise<string | null>;
  startAudioCapture: () => Promise<void>;
  stopAudioCapture: () => Promise<string>; // Returns path to audio file
  saveFile: (path: string, content: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  show?: () => void;
  quit?: () => void;
  updateTrayMenu?: (options: { isRecording: boolean }) => void;
  updateApplicationMenu?: (options: { isRecording: boolean }) => void;
  onTrayToggleRecording?: (callback: () => void) => (() => void);
  onNavigateTo?: (callback: (event: any, path: string) => void) => (() => void);
  setupSystemTray?: (options: { 
    isRecording: boolean; 
    onToggleRecording: () => void; 
    onOpenApp: () => void; 
    onQuit: () => void; 
  }) => void;
  
  // Meeting detection APIs
  startMeetingDetection: () => Promise<boolean>;
  stopMeetingDetection: () => Promise<boolean>;
  onMeetingDetectionUpdate: (callback: (event: any, meetings: Array<{
    id: string;
    platform: string;
    confidence: number;
    isActive: boolean;
  }>) => void) => void;
  onMeetingDetectedNotificationClicked: (callback: (event: any, meeting: any) => void) => void;
  onStartRecordingFromNotification: (callback: (event: any, meeting: any) => void) => void;
  
  // Native notifications
  showNotification: (options: {
    title: string;
    body: string;
    icon?: string;
    sound?: string;
    tag?: string;
    actions?: Array<{ type: string; text: string; }>;
  }) => Promise<boolean>;
  onNotificationClicked: (callback: (event: any, tag: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}