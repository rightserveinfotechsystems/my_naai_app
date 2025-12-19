import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

/* -------------------- DATA -------------------- */

const CATEGORIES = ['Hair', 'Beard', 'Facial', 'Grooming'];

const SERVICES = [
  { id: '1', name: 'Classic Haircut', price: 199, category: 'Hair' },
  { id: '2', name: 'Premium Haircut', price: 299, category: 'Hair' },
  { id: '3', name: 'Hair Spa', price: 599, category: 'Hair' },

  { id: '4', name: 'Beard Trim', price: 149, category: 'Beard' },
  { id: '5', name: 'Beard Styling', price: 249, category: 'Beard' },

  { id: '6', name: 'Basic Facial', price: 399, category: 'Facial' },
  { id: '7', name: 'Gold Facial', price: 699, category: 'Facial' },

  { id: '8', name: 'Head Massage', price: 199, category: 'Grooming' },
  { id: '9', name: 'Manicure', price: 349, category: 'Grooming' },
];

/* -------------------- SCREEN -------------------- */

const SalonDetailScreen = ({ route, navigation }) => {
  const { salon } = route.params;

  const [favorite, setFavorite] = useState(false);
  const [gender, setGender] = useState('Male');
  const [activeCategory, setActiveCategory] = useState('Hair');

  /* -------------------- IMAGE SAFE HANDLING -------------------- */

  const bgSource =
    typeof salon?.image === 'string'
      ? { uri: salon.image }
      : salon?.image;

  /* -------------------- FILTER SERVICES -------------------- */

  const filteredServices = useMemo(() => {
    return SERVICES.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  /* -------------------- BOOKING HANDLER -------------------- */

  const handleBooking = () => {
  Alert.alert(
    'Booking Confirmed 🎉',
    'You have booked the salon successfully.',
    [
      {
        text: 'Cancel',
        style: 'cancel', // Makes it visually a cancel button
      },
      {
        text: 'OK',
        onPress: () =>
          navigation.navigate('Main', { screen: 'Booked Salon' }),
      },
    ],
    { cancelable: false } // Prevents tapping outside to dismiss
  );
};



  /* -------------------- UI -------------------- */

  return (
    <View style={styles.container}>
      <ImageBackground source={bgSource} style={styles.bg}>
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>

            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setFavorite(!favorite)}>
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={favorite ? '#D4AF37' : '#fff'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 160 }}
            >
              {/* Spacer for image */}
              <View style={{ height: 220 }} />

              {/* MAIN CARD */}
              <View style={styles.card}>
                <Text style={styles.name}>{salon.name}</Text>
                <Text style={styles.address}>{salon.address}</Text>

                {/* GENDER TOGGLE */}
                <View style={styles.genderRow}>
                  {['Male', 'Female'].map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        gender === g && styles.genderActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={styles.genderText}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* CATEGORY TABS */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryTab,
                        activeCategory === cat && styles.categoryActive,
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text style={styles.categoryText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* SERVICES (READ-ONLY LIST) */}
                <View style={styles.rowWrap}>
                  {filteredServices.map(service => (
                    <View key={service.id} style={styles.serviceChip}>
                      <Text style={styles.chipText}>{service.name}</Text>
                      <Text style={styles.price}>₹{service.price}</Text>
                    </View>
                  ))}
                </View>

              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBooking}>
          <Text style={styles.bookText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SalonDetailScreen;

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  card: {
    margin: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#1E1E1E',
    elevation: 8,
  },

  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  address: {
    color: '#AAA',
    marginBottom: 12,
  },

  genderRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },

  genderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 10,
  },

  genderActive: {
    backgroundColor: '#D4AF37',
  },

  genderText: {
    color: '#fff',
    fontWeight: '600',
  },

  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 10,
    marginVertical: 12,
  },

  categoryActive: {
    backgroundColor: '#D4AF37',
  },

  categoryText: {
    color: '#fff',
    fontWeight: '600',
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  serviceChip: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 14,
    minWidth: '45%',
  },

  chipText: {
    color: '#fff',
    fontWeight: '600',
  },

  price: {
    color: '#D4AF37',
    fontSize: 12,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    padding: 16,
    alignItems: 'center',
  },

  bookBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },

  bookText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
