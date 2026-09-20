import { getMessaging, requestPermission, getToken } from '@react-native-firebase/messaging';

async function getFCMDeviceToken() {
  try {
    const messaging = getMessaging();
    
    // 1. Request permission first
    const authStatus = await requestPermission(messaging);
    
    // 2. Fetch token if authorized
    if (authStatus) {
      const token = await getToken(messaging);
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('FCM token error', error);
    return null;
  }
}

export default getFCMDeviceToken;