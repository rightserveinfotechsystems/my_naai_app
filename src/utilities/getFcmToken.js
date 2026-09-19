import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';

const FCM_TOKEN_KEY = 'FCM_TOKEN';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

let tokenRefreshSub = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Keep the cached token fresh whenever Firebase rotates it. */
function subscribeToTokenRefresh() {
  if (tokenRefreshSub) return tokenRefreshSub;
  try {
    tokenRefreshSub = onTokenRefresh(getMessaging(), async (token) => {
      if (token) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      }
    });
  } catch (err) {
    console.log('FCM onTokenRefresh error:', err?.message || err);
    tokenRefreshSub = null;
  }
  return tokenRefreshSub;
}

/**
 * Reliable FCM device token fetch (non-blocking, never throws):
 *  1. Returns the cached token when available — no native call.
 *  2. Otherwise asks Firebase, retrying: `SERVICE_NOT_AVAILABLE` is
 *     transient right after launch while Google Play Services is still
 *     binding, so a couple of spaced retries recover it.
 *  3. Subscribes to token refresh so the cache stays current.
 * Returns '' when FCM is unavailable so login/onboarding flows keep working.
 */
export async function getFcmDeviceToken() {
  try {
    const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (cached) {
      subscribeToTokenRefresh();
      return cached;
    }

    const messaging = getMessaging();
    if (!(await messaging.isSupported())) {
      console.log('FCM is not supported on this device');
      return '';
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const token = await getToken(messaging);
        if (token) {
          await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
          subscribeToTokenRefresh();
          return token;
        }
      } catch (err) {
        console.log(
          `FCM getToken attempt ${attempt}/${MAX_ATTEMPTS} failed:`,
          err?.message || err?.code || err
        );
        if (attempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS);
        }
      }
    }
    return '';
  } catch (err) {
    console.log('FCM token fetch error:', err?.message || err);
    return '';
  }
}

export default getFcmDeviceToken;
