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

const FAQScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text allowFontScaling={false}style={styles.headerTitle}>FAQ</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text allowFontScaling={false}style={styles.title}>Frequently Asked Questions</Text>

          {/* CUSTOMER FAQs */}
          <Text allowFontScaling={false}style={styles.q}>How does MYNAAI work for customers?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Customers can browse nearby salons, select services, book appointments,
            and join a live queue to reduce waiting time at the salon.
          </Text>

          <Text allowFontScaling={false}style={styles.q}>Can I book an appointment in advance?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Yes. You can book an appointment or join the live queue based on salon availability.
          </Text>

          <Text allowFontScaling={false}style={styles.q}>How do I know my queue position?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Once booked, the app shows your live queue number and estimated waiting time.
          </Text>

          {/* SALON FAQs */}
          <Text allowFontScaling={false}style={styles.q}>How can a salon join MYNAAI?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Salon owners can request account creation. After admin approval,
            the salon account is activated for login.
          </Text>

          <Text allowFontScaling={false}style={styles.q}>What can salon owners manage?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Salon owners can update salon profile, add barbers and services,
            manage customer queue, and mark barbers as available or on leave.
          </Text>

          <Text allowFontScaling={false}style={styles.q}>Can salons add walk-in customers?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Yes. Salon owners can add walk-in customers directly to the queue
            with service duration.
          </Text>

          {/* PAYMENTS */}
          <Text allowFontScaling={false}style={styles.q}>Is online payment supported?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            Currently, payments are handled directly at the salon.
            Online payment support may be added in future updates.
          </Text>

          {/* SUPPORT */}
          <Text allowFontScaling={false}style={styles.q}>Who do I contact for support?</Text>
          <Text allowFontScaling={false}style={styles.a}>
            You can contact support through the app or reach out to the MYNAAI admin team
            for any account or booking issues.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: DARK,
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

  q: {
    color: GOLD,
    fontWeight: '600',
    marginTop: 14,
  },

  a: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
});
