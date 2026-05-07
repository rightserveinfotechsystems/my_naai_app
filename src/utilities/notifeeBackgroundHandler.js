import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { communication } from '../services/communication';

notifee.onBackgroundEvent(async ({ type, detail }) => {

  const { pressAction, notification } = detail;
  const data = notification?.data;

  console.log('🔥 Background Action Clicked:', pressAction?.id);

  if (type === EventType.ACTION_PRESS) {

    const bookingRequestId = data?.bookingRequestId;

    // ✅ ACCEPT
    if (pressAction?.id === 'ACCEPT_BOOKING') {

      await communication.bookingRequestOwnerAction(
        bookingRequestId,
        { action: 'ACCEPT' }
      );

      await notifee.cancelNotification(notification.id);
    }

    // ❌ REJECT
    if (pressAction?.id === 'REJECT_BOOKING') {

      await communication.bookingRequestOwnerAction(
        bookingRequestId,
        { action: 'REJECT' }
      );

      await notifee.cancelNotification(notification.id);
    }

    // ⏳ DELAY
    if (pressAction?.id === 'DELAY_BOOKING') {

      // SAVE NAVIGATION
      await AsyncStorage.setItem(
        'PENDING_NAVIGATION',
        JSON.stringify({
          screen: 'BookingRequestScreen',
          params: {
            bookingRequestId,
            openDelayModal: true,
          },
        }),
      );
    }
  }

  // 👇 NORMAL NOTIFICATION BODY CLICK
  if (type === EventType.PRESS) {

    if (data?.type === 'BOOKING_REQUEST') {

      await AsyncStorage.setItem(
        'PENDING_NAVIGATION',
        JSON.stringify({
          screen: 'BookingRequestScreen',
          params: {
            bookingRequestId: data?.bookingRequestId,
          },
        }),
      );
    }
  }
});