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

const SalonAboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.headerTitle}>
          About Partner App
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
            About MyNaai
          </Text>

          <Text allowFontScaling={false} style={styles.text}>
            Welcome to MyNaai, the ultimate salon booking and queue management
            platform designed specifically for modern salons.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            Our Mission
          </Text>
          <Text allowFontScaling={false} style={styles.text}>
            Our goal is simple: "Skip the Wait." We empower salon owners to manage
            their weekend rush and daily appointments effortlessly, ensuring that
            no customer has to waste time waiting in long queues.
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            Why Choose Us?
          </Text>
          <Text allowFontScaling={false} style={styles.bulletItem}>
            • <Text style={styles.boldText}>Smart Queue Management:</Text> Keep
            track of every booking in real-time.
          </Text>
          <Text allowFontScaling={false} style={styles.bulletItem}>
            • <Text style={styles.boldText}>Premium Experience:</Text> Offer
            your customers a VIP booking experience before they even step into
            your salon.
          </Text>
          <Text allowFontScaling={false} style={styles.bulletItem}>
            • <Text style={styles.boldText}>Business Growth:</Text> Focus on
            your craft while we handle your digital presence and appointment
            scheduling.
          </Text>

          <Text allowFontScaling={false} style={styles.tagline}>
            Join the digital revolution with MyNaai and take your salon business to
            the next level!
          </Text>

          <Text allowFontScaling={false} style={styles.subTitle}>
            Need Support?
          </Text>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('tel:8380017393')}
          >
            <Ionicons name="call-outline" size={18} color={GOLD} />
            <Text allowFontScaling={false} style={styles.contactText}>
              Call Support: 8380017393
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SalonAboutScreen;

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