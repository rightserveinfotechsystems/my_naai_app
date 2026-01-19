import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { Alert, Linking, Platform } from 'react-native';

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    const settings = await notifee.requestPermission();

    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      console.log('🔔 Notification permission granted');
      return true;
    }

    console.log('🚫 Notification permission denied');

    Alert.alert(
      'Enable Notifications',
      'Please enable notifications to receive booking and queue updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );

    return false;
  }

  // iOS fallback (optional)
  return true;
}
