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

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.headerTitle}>
          About Us
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
            Welcome to MyNaai
          </Text>

          <Text allowFontScaling={false} style={styles.text}>
            Tired of waiting in long queues at the salon? MyNaai is here to
            change the way you book your salon appointments.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            Our Mission: "Skip the Wait"
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            We believe your time is valuable. MyNaai is a premium salon booking
            platform that lets you find the best salons near you, check their
            real-time availability, and book your spot from the comfort of your
            home.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            Why Choose MyNaai?
          </Text>
          <Text allowFontScaling={false} style={styles.bulletItem}>
            • <Text style={styles.boldText}>Zero Waiting Time:</Text> Walk into
            the salon only when it’s your turn.
          </Text>
          <Text allowFontScaling={false} style={styles.bulletItem}>
            • <Text style={styles.boldText}>Discover Top Salons:</Text> Explore
            highly-rated salons and stylists in your city.
          </Text>
          <Text allowFontScaling={false} style={styles.bulletItem}>
            • <Text style={styles.boldText}>Seamless Booking:</Text> A simple,
            fast, and premium booking experience at your fingertips.
          </Text>

          <Text allowFontScaling={false} style={styles.tagline}>
            Your time, your style. Book with MyNaai today!
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            Need Help?
          </Text>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('tel:8380017393')}
          >
            <Ionicons name="call-outline" size={18} color={GOLD} />
            <Text allowFontScaling={false} style={styles.contactText}>
              Call Us: 8380017393
            </Text>
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },

  subTitle: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 4,
  },

  text: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },

  bulletItem: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
  },

  boldText: {
    color: '#fff',
    fontWeight: '600',
  },

  tagline: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 18,
    textAlign: 'center',
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },

  contactText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});