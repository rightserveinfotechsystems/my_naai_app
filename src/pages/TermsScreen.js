import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GOLD = '#E8B97E';
const DARK = '#121212';
const CARD = '#1E1E1E';

const TermsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Terms & Conditions</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Terms & Conditions</Text>

          <Text style={styles.text}>
            By using the Naai Salon App, you agree to comply with and be bound by
            the following terms and conditions.
          </Text>

          <Text style={styles.subTitle}>1. Booking Policy</Text>
          <Text style={styles.text}>
            Bookings are subject to salon availability. Appointment confirmation
            does not guarantee immediate service.
          </Text>

          <Text style={styles.subTitle}>2. Cancellation</Text>
          <Text style={styles.text}>
            Users may cancel appointments before the scheduled time. Late
            cancellations may not be accepted.
          </Text>

          <Text style={styles.subTitle}>3. Payments</Text>
          <Text style={styles.text}>
            Payments are currently made directly at the salon unless stated
            otherwise.
          </Text>

          <Text style={styles.subTitle}>4. User Responsibility</Text>
          <Text style={styles.text}>
            Users are responsible for providing accurate information during
            booking.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 10,
  },

  title: {
    color: GOLD,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  subTitle: {
    color: GOLD,
    fontWeight: '600',
    marginTop: 14,
  },

  text: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});
