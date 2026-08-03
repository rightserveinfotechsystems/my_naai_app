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

        <Text allowFontScaling={false} style={styles.headerTitle}>
          Terms & Conditions
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text allowFontScaling={false} style={styles.title}>
            Terms & Conditions
          </Text>

          <Text allowFontScaling={false} style={styles.introText}>
            Welcome to MyNaai! By using our customer application, you agree to
            the following terms:
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            1. Account Registration
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            Users must provide accurate details (name and phone number) to
            ensure smooth booking and communication. Your data is kept secure
            and confidential.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            2. Booking and Cancellations
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            When you book an appointment, the salon reserves a specific time
            slot for you. If you are unable to visit, please cancel your booking
            through the app as early as possible. Frequent "No-Shows" without
            cancellation may result in temporary suspension of booking
            privileges.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            3. Service Quality & Liability
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            MyNaai is a digital booking platform that connects you with
            independent salons. While we strive to partner with the best, the
            respective salon is solely responsible for the quality, safety, and
            pricing of the actual services provided.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            4. Pricing and Payments
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            Service prices listed on the app are provided by the salon partners
            and may be subject to change. Final billing and payments are
            settled directly between the customer and the salon.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            5. Privacy Policy
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            We value your privacy. Your personal information is used exclusively
            to facilitate your bookings, improve app performance, and communicate
            important updates. We do not sell your data to third parties.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            6. App Usage
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            MyNaai reserves the right to modify or terminate user access if the
            platform is used for fraudulent bookings, spam, or any activity that
            disrupts the service for salons and other users.
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
    marginBottom: 8,
  },

  introText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },

  subTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
  },

  text: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});