import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: 'mediscan_auth_token',
  SELECTED_PROFILE_ID: 'mediscan_profile_id',
  SELECTED_PROFILE_NAME: 'mediscan_profile_name',
  FCM_TOKEN: 'mediscan_fcm_token',
};

export const storageService = {
  // ─── Auth Token ────────────────────────────────
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
  },

  // ─── Selected Profile ───────────────────────────
  async saveProfile(id: number, name: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SELECTED_PROFILE_ID, String(id));
    await AsyncStorage.setItem(KEYS.SELECTED_PROFILE_NAME, name);
  },

  async getProfileId(): Promise<number | null> {
    const val = await AsyncStorage.getItem(KEYS.SELECTED_PROFILE_ID);
    return val ? parseInt(val) : null;
  },

  async getProfileName(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SELECTED_PROFILE_NAME);
  },

  async clearProfile(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.SELECTED_PROFILE_ID);
    await AsyncStorage.removeItem(KEYS.SELECTED_PROFILE_NAME);
  },

  // ─── FCM Token ──────────────────────────────────
  async saveFCMToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.FCM_TOKEN, token);
  },

  async getFCMToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.FCM_TOKEN);
  },

  async removeFCMToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.FCM_TOKEN);
  },

  // ─── Full Logout Cleanup ─────────────────────────
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
