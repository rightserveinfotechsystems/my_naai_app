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

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text allowFontScaling={false}style={styles.headerTitle}>About</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text allowFontScaling={false}style={styles.title}>About MyNaai</Text>

          <Text allowFontScaling={false}style={styles.text}>
            MyNaai is a smart salon booking and queue management platform designed to
            connect customers with nearby salons while simplifying day-to-day salon
            operations.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>What We Do</Text>
          <Text allowFontScaling={false}style={styles.text}>
            MyNaai allows customers to discover salons, book services, and join a
            real-time service queue. Salon owners can request account creation through
            the admin, manage their salon profile, add barbers, and efficiently handle
            customer queues.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>Our Mission</Text>
          <Text allowFontScaling={false}style={styles.text}>
            To reduce waiting time, improve transparency, and empower local salons with
            simple and reliable digital tools.
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>Why Choose MyNaai?</Text>
          <Text allowFontScaling={false}style={styles.text}>
            • Live queue-based appointments{'\n'}
            • Easy salon discovery near you{'\n'}
            • Hassle-free booking experience{'\n'}
            • Tools for salon owners to manage customers{'\n'}
            • Admin-verified salon accounts
          </Text>

          <Text allowFontScaling={false}style={styles.subTitle}>Who Can Use MyNaai?</Text>
          <Text allowFontScaling={false}style={styles.text}>
            MyNaai is built for customers looking for convenient grooming services and
            salon owners who want better control over bookings and daily operations.
          </Text>

          {/* <Text allowFontScaling={false}style={styles.subTitle}>Version</Text> */}
          {/* <Text allowFontScaling={false}style={styles.text}>App Version 1.0.0</Text> */}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

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
