import { notificationService } from './notifications';

export interface MeetingDetectionResult {
  id: string;
  platform: string;
  meetingTitle?: string;
  confidence: number;
  isActive: boolean;
}

export class MeetingDetectionService {
  private static instance: MeetingDetectionService;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastDetectedMeetings: Set<string> = new Set();
  private onMeetingDetectedCallback?: (meeting: MeetingDetectionResult) => void;
  private cleanupFunctions: Array<() => void> = [];

  private constructor() {
    // Set up Electron event listeners if available
    if (window.electronAPI) {
      const cleanup1 = window.electronAPI.onMeetingDetectedNotificationClicked?.((event, meeting) => {
        this.onMeetingDetectedCallback?.(meeting);
      });
      
      const cleanup2 = window.electronAPI.onStartRecordingFromNotification?.((event, meeting) => {
        this.onMeetingDetectedCallback?.(meeting);
      });

      if (cleanup1) this.cleanupFunctions.push(cleanup1);
      if (cleanup2) this.cleanupFunctions.push(cleanup2);
    }
  }

  static getInstance(): MeetingDetectionService {
    if (!MeetingDetectionService.instance) {
      MeetingDetectionService.instance = new MeetingDetectionService();
    }
    return MeetingDetectionService.instance;
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // Start native meeting detection if available
    if (window.electronAPI?.startMeetingDetection) {
      try {
        await window.electronAPI.startMeetingDetection();
        
        // Listen for meeting updates from native detection
        const cleanup = window.electronAPI.onMeetingDetectionUpdate((event, meetings) => {
          meetings.forEach(meeting => {
            if (!this.lastDetectedMeetings.has(meeting.id) && meeting.isActive) {
              this.lastDetectedMeetings.add(meeting.id);
              this.onMeetingDetected(meeting);
            }
          });
          
          // Clean up ended meetings
          const currentIds = new Set(meetings.map(m => m.id));
          const lastDetectedArray = Array.from(this.lastDetectedMeetings);
          lastDetectedArray.forEach(id => {
            if (!currentIds.has(id)) {
              this.lastDetectedMeetings.delete(id);
            }
          });
        });
        
        if (cleanup) this.cleanupFunctions.push(cleanup);
      } catch (error) {
        console.error('Failed to start native meeting detection:', error);
      }
    }
    
    // Also start browser-based detection as fallback
    this.monitoringInterval = setInterval(async () => {
      const results = await this.detectBrowserMeetings();
      
      results.forEach(result => {
        if (result.isActive && result.confidence > 0.7) {
          if (!this.lastDetectedMeetings.has(result.id)) {
            this.lastDetectedMeetings.add(result.id);
            this.onMeetingDetected(result);
          }
        }
      });
    }, 5000); // Check every 5 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Stop native meeting detection if available
    if (window.electronAPI?.stopMeetingDetection) {
      window.electronAPI.stopMeetingDetection();
    }
    
    // Clean up all event listeners
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
    
    this.isMonitoring = false;
    this.lastDetectedMeetings.clear();
  }

  setOnMeetingDetectedCallback(callback: (meeting: MeetingDetectionResult) => void): void {
    this.onMeetingDetectedCallback = callback;
  }

  private async detectBrowserMeetings(): Promise<MeetingDetectionResult[]> {
    const detectedMeetings: MeetingDetectionResult[] = [];

    // Check current page URL for meeting platforms
    const currentUrl = window.location.href;
    const hostname = window.location.hostname;
    
    // Zoom
    if (hostname.includes('zoom.us') || currentUrl.includes('zoom.us/j/')) {
      detectedMeetings.push({
        id: 'zoom-browser',
        platform: 'Zoom',
        confidence: 0.9,
        isActive: this.isZoomMeetingActive(),
        meetingTitle: this.extractZoomMeetingTitle()
      });
    }

    // Microsoft Teams
    if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) {
      detectedMeetings.push({
        id: 'teams-browser',
        platform: 'Microsoft Teams',
        confidence: 0.9,
        isActive: this.isTeamsMeetingActive(),
        meetingTitle: this.extractTeamsMeetingTitle()
      });
    }

    // Google Meet
    if (hostname.includes('meet.google.com')) {
      detectedMeetings.push({
        id: 'google-meet-browser',
        platform: 'Google Meet',
        confidence: 0.9,
        isActive: this.isGoogleMeetActive(),
        meetingTitle: this.extractGoogleMeetTitle()
      });
    }

    // Slack
    if (hostname.includes('slack.com') && currentUrl.includes('/huddle/')) {
      detectedMeetings.push({
        id: 'slack-browser',
        platform: 'Slack',
        confidence: 0.8,
        isActive: this.isSlackHuddleActive(),
        meetingTitle: this.extractSlackHuddleTitle()
      });
    }

    return detectedMeetings;
  }


  private isZoomMeetingActive(): boolean {
    // Check for Zoom meeting indicators
    const meetingContainer = document.querySelector('[data-test-id="meeting-container"]');
    const videoContainer = document.querySelector('.video-container');
    return !!(meetingContainer || videoContainer);
  }

  private isTeamsMeetingActive(): boolean {
    // Check for Teams meeting indicators
    const meetingStage = document.querySelector('[data-tid="meeting-stage"]');
    const callControls = document.querySelector('[data-tid="call-controls"]');
    return !!(meetingStage || callControls);
  }

  private isGoogleMeetActive(): boolean {
    // Check for Google Meet indicators
    const meetingContainer = document.querySelector('[data-meeting-title]');
    const videoContainer = document.querySelector('[data-self-name]');
    return !!(meetingContainer || videoContainer);
  }

  private isSlackHuddleActive(): boolean {
    // Check for Slack huddle indicators
    const huddleContainer = document.querySelector('[data-qa="huddle_container"]');
    return !!huddleContainer;
  }

  private extractZoomMeetingTitle(): string {
    const titleElement = document.querySelector('[data-test-id="meeting-title"]');
    return titleElement?.textContent?.trim() || 'Zoom Meeting';
  }

  private extractTeamsMeetingTitle(): string {
    const titleElement = document.querySelector('[data-tid="meeting-title"]');
    return titleElement?.textContent?.trim() || 'Teams Meeting';
  }

  private extractGoogleMeetTitle(): string {
    const titleElement = document.querySelector('[data-meeting-title]');
    return titleElement?.getAttribute('data-meeting-title') || 'Google Meet';
  }

  private extractSlackHuddleTitle(): string {
    const titleElement = document.querySelector('[data-qa="huddle_title"]');
    return titleElement?.textContent?.trim() || 'Slack Huddle';
  }

  private async onMeetingDetected(result: MeetingDetectionResult): Promise<void> {
    // Send notification about detected meeting
    await notificationService.notifyMeetingDetected(result.platform);
    
    // Call the callback if set
    this.onMeetingDetectedCallback?.(result);
    
    // Dispatch custom event that the app can listen to
    const event = new CustomEvent('meetingDetected', {
      detail: result
    });
    window.dispatchEvent(event);
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  getLastDetectedMeetings(): string[] {
    return Array.from(this.lastDetectedMeetings);
  }
}

export const meetingDetectionService = MeetingDetectionService.getInstance();