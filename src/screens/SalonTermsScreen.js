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

const SalonTermsScreen = ({ navigation }) => {
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
            Welcome to MyNaai. By using our partner application, you agree to
            the following terms:
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            1. Account Registration
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            Salon partners must provide accurate and updated information during
            registration. You are responsible for maintaining the confidentiality
            of your login credentials.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            2. Subscription & Payments
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            Access to the MyNaai platform is strictly based on active subscription
            plans. All subscription fees are non-refundable once paid. It is the
            salon owner's responsibility to renew the plan on time to avoid
            service interruption.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            3. Service Delivery & Salon Responsibility
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            MyNaai acts as a digital bridge between the salon and the customer.
            The salon owner is solely responsible for honoring the bookings on time
            and maintaining the quality of the services provided.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            4. Platform Availability
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            We strive to keep the app running 24/7. However, MyNaai is not liable
            for temporary downtimes due to technical maintenance, server upgrades,
            or unforeseen bugs.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            5. Data Privacy
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            We respect your privacy. All salon and customer data processed through
            MyNaai is securely stored and is used exclusively to improve the
            booking experience and app functionality.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            6. Termination of Service
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            MyNaai reserves the right to suspend or terminate any salon account if
            found misusing the platform, providing false information, or violating
            these terms.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SalonTermsScreen;

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