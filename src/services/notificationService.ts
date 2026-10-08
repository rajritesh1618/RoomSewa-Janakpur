import { isNativeApp } from './nativeAndroid';

export interface NotificationPayload {
  title: string;
  body: string;
  id?: number;
  data?: Record<string, unknown>;
}

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async checkPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
      return this.permissionGranted;
    }
    return false;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if ('Notification' in window) {
        const status = await Notification.requestPermission();
        this.permissionGranted = status === 'granted';
        return this.permissionGranted;
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
    return false;
  }

  public async sendNotification(payload: NotificationPayload): Promise<void> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/assets/icons/icon-192x192.png',
          badge: '/assets/icons/icon-72x72.png',
          data: payload.data
        });
      }
    } catch (err) {
      console.warn('Error showing notification:', err);
    }
  }

  public isNative(): boolean {
    return isNativeApp();
  }
}

export const notificationService = NotificationService.getInstance();
