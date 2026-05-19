/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle, EventType } from '@notifee/react-native';

// 1. Handle background events (This is what catches the button click in "Killed" state)
import { communication } from './src/services/communication';

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
      // Delay opens the app via 'launchActivity: default', 
      // logic is handled in App.js useEffect/Foreground handler
      await notifee.cancelNotification(notification.id);
    }
  }
});

// 2. FCM Background handler (Your existing code)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const { data } = remoteMessage;

  await notifee.displayNotification({
    title: data?.title,
    body: data?.body,
    android: {
      // channelId: 'default_channel',
      channelId: data?.type === "BOOKING_REQUEST" ? 'booking' : 'default_channel',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: data?.body || '',
      },
      smallIcon: 'ic_notification',
      // pressAction: {
      //   id: 'default',
      //   launchActivity: 'default', 
      // },

      // ongoing: true,    // ❌ Prevents the user from swiping it away
      ongoing: data?.type === "BOOKING_REQUEST" ? true : false,
      timeoutAfter: data?.type === "BOOKING_REQUEST" ? 70000 : undefined,

      // autoCancel: false, // ❌ Prevents dismissal when the notification body is tapped
      actions: data?.type === "BOOKING_REQUEST"
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