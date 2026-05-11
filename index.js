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
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  // Check if the user pressed the 'Delay' button
  if (type === EventType.ACTION_PRESS && pressAction.id === 'DELAY_BOOKING') {
    console.log('User pressed Delay in background/killed state');
    
    // You can perform background logic here (like calling an API)
    // The 'launchActivity: default' in your displayNotification will handle opening the app.
    
    // Clean up the notification
    await notifee.cancelNotification(notification.id);
  }
});

// 2. FCM Background handler (Your existing code)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const { data } = remoteMessage;

  await notifee.displayNotification({
    title: data?.title,
    body: data?.body,
    android: {
      channelId: 'default_channel',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: data?.body || '',
      },
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
        launchActivity: 'default', // Ensures clicking the notification body opens the app
      },
      actions: data?.type === "BOOKING_REQUEST"
        ? [
          {
            title: '✅ Accept',
            pressAction: { id: 'ACCEPT_BOOKING', launchActivity: 'default' },
          },
          {
            title: '⏳ Delay',
            pressAction: { id: 'DELAY_BOOKING', launchActivity: 'default' },
          },
          {
            title: '❌ Reject',
            pressAction: { id: 'REJECT_BOOKING', launchActivity: 'default' },
          },
        ]
        : [],
    },
    data: data,
  });
});

AppRegistry.registerComponent(appName, () => App);