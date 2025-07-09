import { notificationService } from './notifications';

export interface MeetingDetectionResult {
  platform: string;
  meetingTitle?: string;
  confidence: number;
  isActive: boolean;
}

export class MeetingDetectionService {
  private static instance: MeetingDetectionService;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastDetectedMeeting: MeetingDetectionResult | null = null;

  private constructor() {}

  static getInstance(): MeetingDetectionService {
    if (!MeetingDetectionService.instance) {
      MeetingDetectionService.instance = new MeetingDetectionService();
    }
    return MeetingDetectionService.instance;
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      const result = await this.detectMeeting();
      
      if (result && result.isActive && result.confidence > 0.7) {
        // Only notify if this is a new meeting detection
        if (!this.lastDetectedMeeting || 
            this.lastDetectedMeeting.platform !== result.platform ||
            !this.lastDetectedMeeting.isActive) {
          
          await this.onMeetingDetected(result);
        }
        this.lastDetectedMeeting = result;
      } else if (this.lastDetectedMeeting?.isActive) {
        // Meeting ended
        this.lastDetectedMeeting = null;
      }
    }, 5000); // Check every 5 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.lastDetectedMeeting = null;
  }

  private async detectMeeting(): Promise<MeetingDetectionResult | null> {
    try {
      // Check for common meeting platforms in browser tabs
      const platforms = await this.detectBrowserMeetings();
      
      if (platforms.length > 0) {
        return platforms[0]; // Return the first detected platform
      }

      // Check for desktop meeting apps (would need Electron APIs)
      const desktopMeeting = await this.detectDesktopMeetings();
      if (desktopMeeting) {
        return desktopMeeting;
      }

      return null;
    } catch (error) {
      console.error('Meeting detection error:', error);
      return null;
    }
  }

  private async detectBrowserMeetings(): Promise<MeetingDetectionResult[]> {
    const detectedMeetings: MeetingDetectionResult[] = [];

    // Check current page URL for meeting platforms
    const currentUrl = window.location.href;
    const hostname = window.location.hostname;
    
    // Zoom
    if (hostname.includes('zoom.us') || currentUrl.includes('zoom.us/j/')) {
      detectedMeetings.push({
        platform: 'Zoom',
        confidence: 0.9,
        isActive: this.isZoomMeetingActive(),
        meetingTitle: this.extractZoomMeetingTitle()
      });
    }

    // Microsoft Teams
    if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) {
      detectedMeetings.push({
        platform: 'Microsoft Teams',
        confidence: 0.9,
        isActive: this.isTeamsMeetingActive(),
        meetingTitle: this.extractTeamsMeetingTitle()
      });
    }

    // Google Meet
    if (hostname.includes('meet.google.com')) {
      detectedMeetings.push({
        platform: 'Google Meet',
        confidence: 0.9,
        isActive: this.isGoogleMeetActive(),
        meetingTitle: this.extractGoogleMeetTitle()
      });
    }

    // Slack
    if (hostname.includes('slack.com') && currentUrl.includes('/huddle/')) {
      detectedMeetings.push({
        platform: 'Slack',
        confidence: 0.8,
        isActive: this.isSlackHuddleActive(),
        meetingTitle: this.extractSlackHuddleTitle()
      });
    }

    return detectedMeetings;
  }

  private async detectDesktopMeetings(): Promise<MeetingDetectionResult | null> {
    // This would require Electron APIs to detect running applications
    // For now, we'll return null as this is a browser-based detection
    return null;
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
    
    // Dispatch custom event that the app can listen to
    const event = new CustomEvent('meetingDetected', {
      detail: result
    });
    window.dispatchEvent(event);
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  getLastDetectedMeeting(): MeetingDetectionResult | null {
    return this.lastDetectedMeeting;
  }
}

export const meetingDetectionService = MeetingDetectionService.getInstance();