import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  console.warn('expo-notifications is not available here (Expo Go). Reminders need a development build.');
}
export const notificationsAvailable = () => Notifications !== null;

export type Reminder = { enabled: boolean; hour: number; minute: number };

export async function getReminder(): Promise<Reminder> {
  const raw = await AsyncStorage.getItem('reminder');
  return raw ? JSON.parse(raw) : { enabled: false, hour: 19, minute: 0 };
}

export async function scheduleDaily(hour: number, minute: number): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily', {
        name: 'Daily practice',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Time to practise', body: 'Answer a few questions to keep your streak alive.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'daily' },
    });
    await AsyncStorage.setItem('reminder', JSON.stringify({ enabled: true, hour, minute }));
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminder() {
  try { await Notifications?.cancelAllScheduledNotificationsAsync(); } catch {}
  const r = await getReminder();
  await AsyncStorage.setItem('reminder', JSON.stringify({ ...r, enabled: false }));
}