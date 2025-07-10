// Mock MediaDevices API for testing audio recording
export class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  stream: MediaStream;

  constructor(stream: MediaStream, options?: any) {
    this.stream = stream;
  }

  start(timeslice?: number) {
    this.state = 'recording';
    // Simulate data available after a delay
    setTimeout(() => {
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock audio data'], { type: 'audio/webm' })
        });
      }
    }, 100);
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) {
      this.onstop();
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }

  static isTypeSupported(mimeType: string) {
    return mimeType === 'audio/webm' || mimeType === 'audio/ogg';
  }
}

export const mockGetUserMedia = jest.fn().mockImplementation(() => {
  const mockStream = {
    getTracks: () => [{
      stop: jest.fn(),
      kind: 'audio',
    }],
    active: true,
  };
  return Promise.resolve(mockStream as unknown as MediaStream);
});

// Set up global mocks
global.MediaRecorder = MockMediaRecorder as any;
global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia,
} as any;