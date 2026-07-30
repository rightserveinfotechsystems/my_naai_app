/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee, { 
  AndroidStyle, 
  EventType, 
  AndroidImportance, 
  AndroidCategory 
} from '@notifee/react-native';
import { communication } from './src/services/communication';

// 1. Handle background action button presses (Killed / Background state)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  const bookingRequestId = notification?.data?.bookingRequestId;

  if (type === EventType.ACTION_PRESS) {
    if (pressAction.id === 'ACCEPT_BOOKING') {
      console.log('Background: Accepting', bookingRequestId);
      await communication.bookingRequestOwnerAction(bookingRequestId, { action: "ACCEPT" });
      await notifee.cancelNotification(notification.id);
    }
    else if (pressAction.id === 'REJECT_BOOKING') {
      console.log('Background: Rejecting', bookingRequestId);
      await communication.bookingRequestOwnerAction(bookingRequestId, { action: "REJECT" });
      await notifee.cancelNotification(notification.id);
    }
    else if (pressAction.id === 'DELAY_BOOKING') {
      await notifee.cancelNotification(notification.id);
    }
  }
});

// 2. FCM Background handler
const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async remoteMessage => {
  const { data, notification } = remoteMessage;

  // Guarantee channels exist even in killed state
  await notifee.createChannel({
    id: 'booking',
    name: 'Booking Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'buzzer_old',
    vibration: true,
  });

  await notifee.createChannel({
    id: 'default_channel',
    name: 'Default Notifications',
    importance: AndroidImportance.HIGH,
    sound: 'buzzer',
    vibration: true,
  });

  const isBookingRequest = data?.type === "BOOKING_REQUEST";
  const DURATION_MS = 60000;

  await notifee.displayNotification({
    title: data?.title || notification?.title || 'Notification',
    body: data?.body || notification?.body || '',
    android: {
      channelId: isBookingRequest ? 'booking' : 'default_channel',
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.ALARM, // Fixed syntax typo
      style: {
        type: AndroidStyle.BIGTEXT,
        text: data?.body || notification?.body || '',
      },
      smallIcon: 'ic_notification',
      ongoing: isBookingRequest,
      timeoutAfter: isBookingRequest ? 70000 : undefined,

      ...(isBookingRequest && {
        showChronometer: true,
        chronometerDirection: 'down',
        timestamp: Date.now() + DURATION_MS,
      }),

      actions: isBookingRequest
        ? [
            {
              title: '✅ Accept',
              pressAction: { id: 'ACCEPT_BOOKING' },
            },
            {
              title: '⏳ Delay',
              pressAction: { id: 'DELAY_BOOKING', launchActivity: 'default' },
            },
            {
              title: '❌ Reject',
              pressAction: { id: 'REJECT_BOOKING' },
            },
          ]
        : [],
    },
    data: data,
  });
});

AppRegistry.registerComponent(appName, () => App);