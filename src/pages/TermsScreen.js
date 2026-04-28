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

        <Text allowFontScaling={false}style={styles.headerTitle}>Terms & Conditions</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text allowFontScaling={false}style={styles.title}>Terms & Conditions</Text>

          <Text allowFontScaling={false}style={styles.text}>
            By accessing or using the MyNaai Salon Booking Application, you agree to
            comply with and be bound by the following Terms & Conditions. If you do not
            agree, please do not use the app.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>1. About the Naai App</Text>
          <Text allowFontScaling={false}style={styles.text}>
            MyNaai is a salon booking platform that allows customers to discover salons,
            book services, and join a live service queue. Salon owners can request
            account creation through the admin, manage salon profiles, add barbers,
            and handle customer queues.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>2. Appointment & Queue System</Text>
          <Text allowFontScaling={false}style={styles.text}>
            Appointments are managed through a queue-based system. Booking confirmation
            indicates your position in the queue and does not guarantee immediate
            service. Actual service time may vary based on workload and availability.
          </Text>

          {/* <Text allowFontScaling={false}style={styles.subTitle}>3. Cancellation Policy</Text>
  <Text allowFontScaling={false}style={styles.text}>
    Customers may cancel appointments before their service time. Failure to
    arrive on time may result in removal from the queue at the salon’s
    discretion.
  </Text> */}

          <Text allowFontScaling={false}style={styles.subTitle}>4. Payments</Text>
          <Text allowFontScaling={false}style={styles.text}>
            All payments are currently handled directly at the salon. MyNaai does not
            process or store payment information unless explicitly stated in future
            updates.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>5. Salon Owner Responsibilities</Text>
          <Text allowFontScaling={false}style={styles.text}>
            Salon owners are responsible for maintaining accurate salon details,
            barber availability, service pricing, and queue updates. Any misuse may
            result in account suspension.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>6. User Responsibilities</Text>
          <Text allowFontScaling={false}style={styles.text}>
            Users must provide accurate information during registration and booking.
            Misuse of the platform, false bookings, or abuse may lead to account
            termination.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>7. Admin Rights</Text>
          <Text allowFontScaling={false}style={styles.text}>
            The admin reserves the right to approve or reject salon account requests,
            monitor activity, and suspend accounts that violate platform policies.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>8. Changes to Terms</Text>
          <Text allowFontScaling={false}style={styles.text}>
            MyNaai reserves the right to update these Terms & Conditions at any time.
            Continued use of the app implies acceptance of the revised terms.
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
