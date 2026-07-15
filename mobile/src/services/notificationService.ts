import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import api from './api';
import { storageService } from './storageService';

export const notificationService = {
  /**
   * Request permission and get the FCM token.
   * Registers it with the backend and saves locally.
   */
  async init(): Promise<void> {
    try {
      // Request permission on iOS; on Android 13+ request POST_NOTIFICATIONS
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      } else if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) return;
      }

      // Get FCM token
      const token = await messaging().getToken();
      if (!token) return;

      await storageService.saveFCMToken(token);

      // Register with backend
      await api.post('/api/notifications/token', {
        token,
        platform: Platform.OS,
      });

      console.log('[FCM] Token registered:', token);
    } catch (err) {
      console.warn('[FCM] Init failed:', err);
    }
  },

  /**
   * Unregister FCM token on logout.
   */
  async unregister(): Promise<void> {
    try {
      const token = await storageService.getFCMToken();
      if (token) {
        await api.delete(`/api/notifications/token?token=${token}`);
        await storageService.removeFCMToken();
      }
    } catch (err) {
      console.warn('[FCM] Unregister failed:', err);
    }
  },

  /**
   * Listen for foreground messages and display them.
   * Call this once in App root.
   */
  listenForeground(onMessage: (title: string, body: string) => void): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? 'Mediscan';
      const body = remoteMessage.notification?.body ?? '';
      onMessage(title, body);
    });
  },

  /**
   * Handle notification tap when app was in background/quit.
   */
  onNotificationOpenedApp(
    callback: (data: Record<string, string>) => void
  ): void {
    messaging().onNotificationOpenedApp((remoteMessage) => {
      if (remoteMessage.data) {
        callback(remoteMessage.data as Record<string, string>);
      }
    });
  },
};
