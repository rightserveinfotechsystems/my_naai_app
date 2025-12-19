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

        <Text style={styles.headerTitle}>FAQ</Text>

        {/* spacer to center title */}
        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Frequently Asked Questions</Text>

          <Text style={styles.q}>How do I book a salon?</Text>
          <Text style={styles.a}>
            Choose a salon, select services and confirm your booking.
          </Text>

          <Text style={styles.q}>Can I cancel my booking?</Text>
          <Text style={styles.a}>
            Yes, cancellation is allowed before appointment time.
          </Text>

          <Text style={styles.q}>Is online payment required?</Text>
          <Text style={styles.a}>
            Currently, payment is done directly at the salon.
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
