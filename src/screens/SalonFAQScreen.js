import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GOLD = '#E8B97E';
const DARK = '#121212';
const CARD = '#1E1E1E';

const SalonFAQScreen = ({ navigation }) => {
  const faqs = [
    {
      q: 'Q1. What is the MyNaai Partner App?',
      a: 'Ans: MyNaai Partner is a dedicated app for salon owners to receive, manage, and track customer bookings in real-time, helping you avoid overcrowding in your salon.',
    },
    {
      q: 'Q2. How does the subscription plan work?',
      a: 'Ans: We offer affordable, flat-rate subscription plans. Once subscribed, you get full access to unlimited bookings and our complete suite of management tools for the duration of your active plan.',
    },
    {
      q: 'Q3. Do I need to refresh the app to see new bookings?',
      a: 'Ans: No! MyNaai features an auto-reload system. The moment a customer books an appointment, it will instantly reflect in your "My Bookings" dashboard.',
    },
    {
      q: 'Q4. What if a customer does not show up?',
      a: "Ans: You can easily manage the status of every booking from your dashboard and mark them as 'Completed' or 'No-Show' to keep your queue updated for other waiting customers.",
    },
    {
      q: 'Q5. How can I contact support if I face an issue?',
      a: 'Ans: We are always here to help. You can reach out to our dedicated support team directly by calling our helpline: 8380017393.',
      isSupport: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.headerTitle}>
          Partner FAQ
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
            Frequently Asked Questions
          </Text>

          {faqs.map((item, index) => (
            <View key={index} style={styles.faqBlock}>
              <Text allowFontScaling={false} style={styles.q}>
                {item.q}
              </Text>

              {item.isSupport ? (
                <Text allowFontScaling={false} style={styles.a}>
                  Ans: We are always here to help. You can reach out to our
                  dedicated support team directly by calling our helpline:{' '}
                  <Text
                    style={styles.linkText}
                    onPress={() => Linking.openURL('tel:8380017393')}
                  >
                    8380017393
                  </Text>
                  .
                </Text>
              ) : (
                <Text allowFontScaling={false} style={styles.a}>
                  {item.a}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SalonFAQScreen;

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

  faqBlock: {
    marginTop: 14,
  },

  q: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
  },

  a: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },

  linkText: {
    color: GOLD,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});