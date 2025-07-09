export interface ElectronAPI {
  storeApiKey: (apiKey: string) => Promise<boolean>;
  getApiKey: () => Promise<string | null>;
  startAudioCapture: () => Promise<void>;
  stopAudioCapture: () => Promise<string>; // Returns path to audio file
  saveFile: (path: string, content: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}