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

/* ---------------- 1. BACKGROUND / KILLED ACTION & TAP HANDLER ---------------- */
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  const bookingRequestId = notification?.data?.bookingRequestId;

  // Banner body click in background / killed state -> OS launches main activity
  if (type === EventType.PRESS || pressAction?.id === 'default') {
    return;
  }

  // Action button clicks in background / killed state
  if (type === EventType.ACTION_PRESS) {
    if (pressAction?.id === 'ACCEPT_BOOKING') {
      console.log('Background: Accepting booking', bookingRequestId);
      await communication.bookingRequestOwnerAction(bookingRequestId, { action: "ACCEPT" });
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
      }
    }
    else if (pressAction?.id === 'REJECT_BOOKING') {
      console.log('Background: Rejecting booking', bookingRequestId);
      await communication.bookingRequestOwnerAction(bookingRequestId, { action: "REJECT" });
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
      }
    }
    else if (pressAction?.id === 'DELAY_BOOKING') {
      // Do NOT cancel here. Let app open BookingRequestScreen with delay modal.
    }
  }
});

/* ---------------- 2. MODULAR FCM BACKGROUND HANDLER ---------------- */
const messagingInstance = getMessaging();

setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
  const { data, notification } = remoteMessage;

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
  const notificationId = data?.bookingRequestId || notification?.id || `booking_${Date.now()}`;

  await notifee.displayNotification({
    id: notificationId,
    title: data?.title || notification?.title || 'Notification',
    body: data?.body || notification?.body || '',
    android: {
      channelId: isBookingRequest ? 'booking' : 'default_channel',
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.ALARM,
      
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },

      style: {
        type: AndroidStyle.BIGTEXT,
        text: data?.body || notification?.body || '',
      },
      smallIcon: 'ic_notification',
      ongoing: isBookingRequest,
      autoCancel: false,

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

  if (isBookingRequest) {
    setTimeout(async () => {
      try {
        await notifee.cancelNotification(notificationId);
      } catch (err) {
        console.log('Timed out notification cleanup error:', err);
      }
    }, 70000);
  }
});

AppRegistry.registerComponent(appName, () => App);