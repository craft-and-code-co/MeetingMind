export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: NotificationAction[];
}

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.requestPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        this.permission = await Notification.requestPermission();
      } else {
        this.permission = Notification.permission;
      }
    }
    return this.permission;
  }

  async show(options: NotificationOptions): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    if ('Notification' in window) {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        data: options.data
      });

      return notification;
    }

    return null;
  }

  // Meeting-specific notifications
  async notifyMeetingStarted(meetingTitle: string): Promise<void> {
    await this.show({
      title: 'Meeting Started',
      body: `Recording started for "${meetingTitle}"`,
      tag: 'meeting-start',
      icon: '/favicon.ico',
      requireInteraction: false
    });
  }

  async notifyMeetingEnded(meetingTitle: string): Promise<void> {
    await this.show({
      title: 'Meeting Ended',
      body: `Recording completed for "${meetingTitle}"`,
      tag: 'meeting-end',
      icon: '/favicon.ico',
      requireInteraction: false
    });
  }

  async notifyTranscriptionReady(meetingTitle: string): Promise<void> {
    await this.show({
      title: 'Transcription Ready',
      body: `Transcription completed for "${meetingTitle}"`,
      tag: 'transcription-ready',
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  async notifyActionItemDue(actionItem: string, dueDate: string): Promise<void> {
    await this.show({
      title: 'Action Item Due',
      body: `"${actionItem}" is due ${dueDate}`,
      tag: 'action-item-due',
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  async notifyReminderDue(title: string, description: string): Promise<void> {
    await this.show({
      title: 'Reminder',
      body: `${title}: ${description}`,
      tag: 'reminder-due',
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  async notifyMeetingDetected(platform: string): Promise<void> {
    await this.show({
      title: 'Meeting Detected',
      body: `${platform} meeting detected. Click to start recording.`,
      tag: 'meeting-detected',
      icon: '/favicon.ico',
      requireInteraction: true
    });
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = NotificationService.getInstance();