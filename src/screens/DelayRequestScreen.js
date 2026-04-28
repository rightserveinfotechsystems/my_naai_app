import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { communication } from "../services/communication";

export default function DelayRequestScreen({ route, navigation }) {
  console.log("Full Route 👉", route);
  const { bookingRequestId, delayMinutes, proposedTime } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleCustomerAction = async (action) => {
    if (loading) return;
    try {
      setSelectedAction(action);
      setLoading(true);

      await communication.customerDelayResponse(
        bookingRequestId,
        { action }
      );

      Alert.alert(
        "Success",
        action === "ACCEPT"
          ? "You have accepted the delay request."
          : "You have rejected the delay request."
      );

      navigation.goBack();

    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text allowFontScaling={false}style={styles.title}>Delay Request</Text>

      <View style={styles.card}>
        <Text allowFontScaling={false}style={styles.message}>
          The salon has requested to delay your booking by{" "}
          <Text allowFontScaling={false}style={styles.highlight}>
            {delayMinutes} minutes
          </Text>.
        </Text>
        <Text allowFontScaling={false}style={styles.message}>
          Your new booking time will be{" "}
          <Text allowFontScaling={false}style={styles.highlight}>
            {proposedTime}
          </Text>
        </Text>

        <Text allowFontScaling={false}style={styles.subMessage}>
          Do you want to accept this change?
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.acceptBtn,
            loading && { opacity: 0.6 }
          ]}
          disabled={loading}
          onPress={() => handleCustomerAction("ACCEPT")}
        >
          {loading && selectedAction === "ACCEPT" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text allowFontScaling={false}style={styles.btnText}>Accept</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.rejectBtn,
            loading && { opacity: 0.6 }
          ]}
          disabled={loading}
          onPress={() => handleCustomerAction("REJECT")}
        >
          {loading && selectedAction === "REJECT" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text allowFontScaling={false}style={styles.btnText}>Reject</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E1B378',
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#1C1C1C',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1B378',
  },
  message: {
    fontSize: 17,
    color: '#fff',
    lineHeight: 24,
  },
  highlight: {
    color: '#E1B378',
    fontWeight: 'bold',
  },
  subMessage: {
    marginTop: 15,
    color: '#aaa',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  acceptBtn: {
    backgroundColor: '#1DB954',
    flex: 0.48,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#E53935',
    flex: 0.48,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
