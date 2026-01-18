import messaging from '@react-native-firebase/messaging';
import { Alert, Linking } from 'react-native';

export async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('🔔 Notification permission granted');
  } else {
    console.log('🚫 Notification permission denied');

    // Optional UX fallback
    Alert.alert(
      'Enable Notifications',
      'Please enable notifications to receive booking and queue updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }

  return enabled;
}
