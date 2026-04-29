import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { communication } from '../services/communication';

export default function BookingRequestScreen({ route, navigation }) {
 const { bookingRequestId, openDelayModal } = route.params || {};

  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDelayOptions, setShowDelayOptions] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  console.log("bookingRequestId 👉", bookingRequestId);

  useEffect(() => {
    if (bookingRequestId) {
      fetchBookingDetails();
    }
  }, [bookingRequestId]);

  useEffect(() => {
  if (openDelayModal) {
    setShowDelayOptions(true);
  }
}, [openDelayModal]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      const res = await communication.getBookingRequestById(
        bookingRequestId
      );

      console.log("Booking details 👉", res);

      setBookingDetails(res?.data);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerAction = async (action, delayMinutes = null) => {
    if (actionLoading) return;
    try {
      setSelectedAction(action);
      setActionLoading(true);

      const payload =
        action === "DELAY"
          ? { action, delayMinutes: String(delayMinutes) }
          : { action };

      console.log("bookingRequestId", bookingRequestId);
      console.log("payload", payload);

      const res = await communication.bookingRequestOwnerAction(
        bookingRequestId,
        payload
      );

      console.log("res", res);

      // Alert.alert("Success", `Booking ${action.toLowerCase()}ed successfully`);

      // navigation.goBack();
      navigation.replace("Salon");

    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setActionLoading(false);
      setShowDelayOptions(false);
      setSelectedAction(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#0F0F0F" barStyle="light-content" />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E1B378" />
          {/* <Text allowFontScaling={false}style={{ color: '#fff', marginTop: 15 }}>
            Loading booking details...
          </Text> */}
        </View>
      </SafeAreaView>
    );
  }

  if (!bookingDetails) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#0F0F0F" barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text allowFontScaling={false}style={styles.title}>New Booking Request</Text>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text allowFontScaling={false}style={styles.label}>Customer Name</Text>
          <Text allowFontScaling={false}style={styles.value}>
            {bookingDetails?.customerName}
          </Text>

          <Text allowFontScaling={false}style={styles.label}>Selected Date</Text>
          <Text allowFontScaling={false}style={styles.value}>
            {bookingDetails?.bookingDate}
          </Text>

          <Text allowFontScaling={false}style={styles.label}>Time Slot</Text>
          <Text allowFontScaling={false}style={styles.value}>
            {bookingDetails?.startTime} - {bookingDetails?.endTime}
          </Text>

          <Text allowFontScaling={false}style={styles.label}>Services</Text>
          {bookingDetails?.services
            ?.split(',')
            ?.map((service, index) => (
              <Text allowFontScaling={false}key={index} style={styles.serviceItem}>
                • {service.trim()}
              </Text>
            ))}

        </View>

        {/* Action Buttons */}
        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[
              styles.acceptBtn,
              actionLoading && { opacity: 0.6 }
            ]}
            disabled={actionLoading}
            onPress={() => handleOwnerAction("ACCEPT")}
          >
            {actionLoading && selectedAction === "ACCEPT" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text allowFontScaling={false}style={styles.btnWhiteText}>Accept</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rejectBtn,
              actionLoading && { opacity: 0.6 }
            ]}
            disabled={actionLoading}
            onPress={() => handleOwnerAction("REJECT")}
          >
            {actionLoading && selectedAction === "REJECT" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text allowFontScaling={false}style={styles.btnWhiteText}>Reject</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.delayBtn,
            actionLoading && { opacity: 0.6 }
          ]}
          disabled={actionLoading}
          onPress={() => setShowDelayOptions(true)}
        >
          <Text allowFontScaling={false}style={styles.delayText}>Delay</Text>
        </TouchableOpacity>

        {/* Delay Modal */}
        <Modal visible={showDelayOptions} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text allowFontScaling={false}style={styles.modalTitle}>Select Delay Time</Text>

              {[20, 40, 60].map(min => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.timeBtn,
                    actionLoading && { opacity: 0.5 }
                  ]}
                  disabled={actionLoading}
                  onPress={() => handleOwnerAction("DELAY", min)}
                >
                  {/* {actionLoading && selectedAction === "DELAY" ? (
                    <ActivityIndicator color="#E1B378" />
                  ) : (
                    <Text allowFontScaling={false}style={styles.timeText}>+{min} Minutes</Text>
                  )} */}
                  <Text allowFontScaling={false}style={styles.timeText}>+{min} Minutes</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                disabled={actionLoading}
                onPress={() => {
                  if (!actionLoading) setShowDelayOptions(false);
                }}
              >
                <Text allowFontScaling={false}
                  style={[
                    styles.cancelText,
                    actionLoading && { opacity: 0.5 }
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
      {actionLoading && (
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color="#E1B378" />
          <Text allowFontScaling={false}style={{ color: '#fff', marginTop: 10 }}>
            Processing...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const GOLD = '#E1B378';
const GREEN = '#1DB954';
const RED = '#E53935';
const BLACK = '#0F0F0F';
const DARK_CARD = '#1C1C1C';
const YELLOW = '#FFC107';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BLACK },

  container: { paddingHorizontal: 18, paddingBottom: 30 },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GOLD,
    marginTop: 10,
    marginBottom: 25,
    letterSpacing: 1,
  },

  card: {
    backgroundColor: DARK_CARD,
    padding: 20,
    borderRadius: 14,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: GOLD,
  },

  label: {
    fontSize: 13,
    color: '#888',
    marginTop: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  value: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginTop: 5,
  },

  serviceItem: {
    fontSize: 15,
    marginTop: 6,
    color: GOLD,
  },

  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  acceptBtn: {
    backgroundColor: GREEN,
    flex: 0.48,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  rejectBtn: {
    backgroundColor: RED,
    flex: 0.48,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },

  delayBtn: {
    backgroundColor: YELLOW,
    padding: 16,
    marginTop: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  btnWhiteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },

  delayText: {
    color: BLACK,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },

  modalBox: {
    backgroundColor: DARK_CARD,
    margin: 25,
    padding: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: GOLD,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GOLD,
    marginBottom: 15,
    textAlign: 'center',
  },

  timeBtn: {
    padding: 14,
    backgroundColor: BLACK,
    marginTop: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },

  timeText: {
    fontSize: 16,
    color: GOLD,
    fontWeight: '600',
  },

  cancelText: {
    marginTop: 20,
    color: '#999',
    textAlign: 'center',
  },
  fullScreenLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
