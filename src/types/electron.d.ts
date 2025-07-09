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
  onTrayToggleRecording?: (callback: () => void) => void;
  setupSystemTray?: (options: { 
    isRecording: boolean; 
    onToggleRecording: () => void; 
    onOpenApp: () => void; 
    onQuit: () => void; 
  }) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}