import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Dimensions,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');
const { width } = Dimensions.get('window');

const CATEGORIES = ['Hair', 'Beard', 'Facial', 'Grooming'];

const SERVICES = [
  { id: '1', name: 'Classic Haircut', price: 199, category: 'Hair' },
  { id: '2', name: 'Premium Haircut', price: 299, category: 'Hair' },
  { id: '3', name: 'Hair Spa', price: 599, category: 'Hair' },
  { id: '4', name: 'Beard Trim', price: 149, category: 'Beard' },
  { id: '5', name: 'Beard Styling', price: 249, category: 'Beard' },
  { id: '6', name: 'Basic Facial', price: 399, category: 'Facial' },
  { id: '7', name: 'Gold Facial', price: 699, category: 'Facial' },
];

const BARBERS = [
  {
    id: '1',
    name: 'Rahul',
    rating: 4.8,
    wait: '10 min',
    image: require('../assets/naai/barber1.jpeg'),
  },
  {
    id: '2',
    name: 'Amit',
    rating: 4.5,
    wait: '20 min',
    image: require('../assets/naai/barber2.jpeg'),
  },
  {
    id: '3',
    name: 'Rajwal',
    rating: 4.5,
    wait: '20 min',
    image: require('../assets/naai/barber3.jpg'),
  },
  {
    id: '4',
    name: 'Ritik',
    rating: 4.5,
    wait: '20 min',
    image: require('../assets/naai/barber4.jpeg'),
  },
];

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];

const SalonDetailScreen = ({ route, navigation }) => {
  const { salon } = route.params;

  const [favorite, setFavorite] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Hair');
  const [activeIndex, setActiveIndex] = useState(0);

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const scrollRef = useRef(null);

  const filteredServices = useMemo(
    () => SERVICES.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  /* -------------------- AUTO SLIDER -------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = (activeIndex + 1) % salon.images.length;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, salon.images.length]);

  /* -------------------- HELPERS -------------------- */
  const openMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`;
    Linking.openURL(url);
  };

  const callSalon = () => {
    Linking.openURL(`tel:${salon.phone}`);
  };

  const handleBooking = () => {
    if (!selectedService) {
      Alert.alert('Missing Service', 'Please select a service');
      return;
    }

    if (!selectedBarber) {
      Alert.alert('Missing Barber', 'Please select a barber');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Missing Time Slot', 'Please select a time slot');
      return;
    }

    Alert.alert(
      'Booking Confirmed 🎉',
      `Service: ${selectedService.name}\nBarber: ${selectedBarber.name}\nSlot: ${selectedSlot}`,
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Main', {
              screen: 'Booked Salon', // or "My Bookings" screen name
            });
          },
        },
      ]
    );
  };


  const openModal = img => {
    setModalImage(img);
    setModalVisible(true);
  };

  /* -------------------- UI -------------------- */
  return (
    <View style={styles.container}>
      <ImageBackground source={BG_IMAGE} style={styles.bg}>
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text
                  style={styles.headerTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {salon.name}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
              {/* IMAGE SLIDER */}
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e =>
                  setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))
                }
              >
                {salon.images.map((img, i) => (
                  <TouchableOpacity key={i} onPress={() => openModal(img)}>
                    <ImageBackground source={img} style={styles.sliderImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* DOTS */}
              <View style={styles.dotsRow}>
                {salon.images.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, activeIndex === i && styles.activeDot]}
                  />
                ))}
              </View>

              {/* DETAILS CARD */}
              <View style={styles.card}>
                <View style={styles.row}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>
                    {salon.rating} ({salon.reviews} reviews)
                  </Text>
                </View>

                <TouchableOpacity style={styles.row} onPress={openMap}>
                  <Ionicons name="location-outline" size={18} color="#E1B378" />
                  <Text style={styles.linkText}>{salon.address}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row} onPress={callSalon}>
                  <Ionicons name="call-outline" size={18} color="#E1B378" />
                  <Text style={styles.linkText}>{salon.phone}</Text>
                </TouchableOpacity>

                {/* -------------------- CATEGORY FILTER -------------------- */}
                <Text style={styles.section}>Services</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryBtn,
                        activeCategory === cat && styles.categoryActive,
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          activeCategory === cat && styles.categoryTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* -------------------- SERVICES LIST -------------------- */}
                <View style={{ marginTop: 12 }}>
                  {filteredServices.map(service => {
                    const isActive = selectedService?.id === service.id;

                    return (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceRow,
                          isActive && styles.serviceActive,
                        ]}
                        onPress={() => setSelectedService(service)}
                      >
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.servicePrice}>₹{service.price}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>


                {/* -------------------- BARBERS -------------------- */}
                <Text style={styles.section}>Select Barber</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {BARBERS.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.barberCard,
                        selectedBarber?.id === b.id && styles.barberActive,
                      ]}
                      onPress={() => setSelectedBarber(b)}
                    >
                      <ImageBackground source={b.image} style={styles.barberImg} />
                      <Text style={styles.barberName}>{b.name}</Text>
                      <Text style={styles.barberInfo}>
                        ⭐ {b.rating} • ⏱ {b.wait}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* -------------------- DATE -------------------- */}
                <Text style={styles.section}>Select Date</Text>
                <View style={styles.dateRow}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setSelectedDate(i)}
                      style={[styles.dateBox, selectedDate === i && styles.dateActive]}
                    >
                      <Text style={styles.dateText}>
                        {new Date(Date.now() + i * 86400000).toDateString().slice(0, 10)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* -------------------- TIME SLOT -------------------- */}
                <Text style={styles.section}>Select Time Slot</Text>
                <View style={styles.slotWrap}>
                  {TIME_SLOTS.map(slot => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[styles.slot, selectedSlot === slot && styles.slotActive]}
                    >
                      <Text style={styles.slotText}>{slot}</Text>
                    </TouchableOpacity>
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

      {/* FULL SCREEN IMAGE MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image source={modalImage} style={styles.modalImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

export default SalonDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)' },

  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 10,
    maxWidth: width - 80,
  },

  sliderImage: { width, height: 260 },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#555', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#E1B378' },

  card: { margin: 16, padding: 18, borderRadius: 24, backgroundColor: '#1E1E1E' },

  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  rating: { color: '#FFD700', marginLeft: 6 },
  linkText: { color: '#E1B378', marginLeft: 8 },

  section: { marginTop: 16, marginBottom: 6, color: '#fff', fontWeight: '700', fontSize: 16 },

  categoryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    marginRight: 12,
  },
  categoryActive: { backgroundColor: '#E1B378' },
  categoryText: { color: '#fff', fontWeight: '600' },
  categoryTextActive: { color: '#000' },

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  serviceName: { color: '#fff', fontWeight: '600' },
  servicePrice: { color: '#E1B378', fontWeight: '700' },

  barberCard: { backgroundColor: '#2A2A2A', borderRadius: 14, padding: 10, marginRight: 12, width: 120 },
  barberActive: { borderWidth: 1, borderColor: '#E1B378' },
  barberImg: { height: 80, borderRadius: 12, overflow: 'hidden' },
  barberName: { color: '#fff', marginTop: 6, fontWeight: '600' },
  barberInfo: { color: '#AAA', fontSize: 12 },

  dateRow: { flexDirection: 'row', flexWrap: 'wrap' },
  dateBox: { padding: 8, backgroundColor: '#2A2A2A', borderRadius: 10, margin: 4 },
  dateActive: { backgroundColor: '#E1B378' },
  dateText: { color: '#fff', fontSize: 12 },

  slotWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: { backgroundColor: '#2A2A2A', padding: 10, borderRadius: 10, margin: 6 },
  slotActive: { backgroundColor: '#E1B378' },
  slotText: { color: '#fff' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E1E1E', padding: 16 },
  bookBtn: { backgroundColor: '#E1B378', paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
  bookText: { color: '#000', fontWeight: '700', fontSize: 16 },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '100%', height: '80%' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  serviceActive: {
    borderWidth: 1,
    borderColor: '#E1B378',
    backgroundColor: '#333',
  },

});
