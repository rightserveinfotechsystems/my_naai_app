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

const FAQScreen = ({ navigation }) => {
  const faqs = [
    {
      q: 'Q1. What is MyNaai?',
      a: 'Ans: MyNaai is a smart salon booking app that allows you to book hair, beauty, and grooming services online so you can skip the waiting line at the salon.',
    },
    {
      q: 'Q2. How do I book an appointment?',
      a: 'Ans: Simply open the app, choose a salon near you, select your desired services, pick a time slot, and confirm your booking. It’s that easy!',
    },
    {
      q: 'Q3. Can I cancel or reschedule my booking?',
      a: 'Ans: Yes, you can cancel your booking directly from the app. However, we request you to cancel well in advance so the salon can offer that time slot to another customer.',
    },
    {
      q: 'Q4. Do I pay on the app or at the salon?',
      a: 'Ans: You can pay directly at the salon after your service is completed.',
    },
    {
      q: 'Q5. What if the salon is running late?',
      a: 'Ans: Our app provides real-time updates. If a salon is running behind schedule, you will be able to track your queue status so you don\'t have to wait unnecessarily.',
    },
    {
      q: 'Q6. How can I contact customer support?',
      a: 'Ans: If you face any issues with your booking, you can reach out to our support team at 8380017393.',
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
          FAQ
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
                  Ans: If you face any issues with your booking, you can reach
                  out to our support team at{' '}
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