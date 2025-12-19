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

        <Text style={styles.headerTitle}>About</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>About Naai</Text>

          <Text style={styles.text}>
            Naai Salon App helps users discover and book trusted salons nearby
            with ease and confidence.
          </Text>

          <Text style={styles.subTitle}>Our Mission</Text>
          <Text style={styles.text}>
            To simplify salon discovery and booking while empowering local
            salon owners.
          </Text>

          <Text style={styles.subTitle}>Why Choose Naai?</Text>
          <Text style={styles.text}>
            • Trusted salons{'\n'}
            • Easy booking{'\n'}
            • Transparent pricing{'\n'}
            • Quality grooming experience
          </Text>

          <Text style={styles.subTitle}>Version</Text>
          <Text style={styles.text}>App Version 1.0.0</Text>
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
