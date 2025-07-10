// Mock Electron API for testing
export const mockElectronAPI = {
  storeApiKey: jest.fn().mockResolvedValue(true),
  getApiKey: jest.fn().mockResolvedValue(null),
  startAudioCapture: jest.fn().mockResolvedValue(undefined),
  stopAudioCapture: jest.fn().mockResolvedValue('/path/to/audio.webm'),
  saveFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('file content'),
  show: jest.fn(),
  quit: jest.fn(),
  updateTrayMenu: jest.fn(),
  updateApplicationMenu: jest.fn(),
  onTrayToggleRecording: jest.fn().mockReturnValue(() => {}),
  onNavigateTo: jest.fn().mockReturnValue(() => {}),
  setupSystemTray: jest.fn(),
  startMeetingDetection: jest.fn().mockResolvedValue(true),
  stopMeetingDetection: jest.fn().mockResolvedValue(true),
  onMeetingDetectionUpdate: jest.fn().mockReturnValue(() => {}),
  onMeetingDetectedNotificationClicked: jest.fn().mockReturnValue(() => {}),
  onStartRecordingFromNotification: jest.fn().mockReturnValue(() => {}),
  showNotification: jest.fn().mockResolvedValue(true),
  onNotificationClicked: jest.fn().mockReturnValue(() => {}),
};

// Set up global mock
global.window = Object.create(window);
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});