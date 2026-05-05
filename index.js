/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidStyle } from '@notifee/react-native';

// Background & quit state handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification received:', remoteMessage);

  const { notification, data } = remoteMessage;

  // IMPORTANT: Replicate the display logic here for background/quit states
  await notifee.displayNotification({
    title: notification?.title,
    body: notification?.body,
    android: {
      channelId: 'default_channel', // Must match your foreground channel ID
      style: {
        type: AndroidStyle.BIGTEXT,
        text: notification?.body || '', // This forces the expansion
      },
      smallIcon: 'ic_notification',
      pressAction: {
        id: 'default',
      },
      actions: data?.type === "BOOKING_REQUEST" 
        ? [
            {
              title: '✅ Accept',
              pressAction: { id: 'ACCEPT_BOOKING' },
            },
            {
              title: '⏳ Delay',
              pressAction: { id: 'DELAY_BOOKING' },
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