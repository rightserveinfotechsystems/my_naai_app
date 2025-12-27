import React, { useState, useRef, useEffect } from 'react';
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

/* -------------------- SERVICES -------------------- */
const SERVICES = [
  { id: '1', name: 'Classic Haircut', price: 199, time: 20 },
  { id: '2', name: 'Premium Haircut', price: 299, time: 30 },
  { id: '3', name: 'Hair Spa', price: 599, time: 45 },
  { id: '4', name: 'Beard Trim', price: 149, time: 15 },
  { id: '5', name: 'Beard Styling', price: 249, time: 25 },
  { id: '6', name: 'Basic Facial', price: 399, time: 30 },
  { id: '7', name: 'Gold Facial', price: 699, time: 50 },
];

/* -------------------- BARBERS -------------------- */
const BARBERS = [
  {
    id: '1',
    name: 'Rahul',
    rating: 4.8,
    wait: '10 min',
    status: 'available',
    image: require('../assets/naai/barber1.jpeg'),
  },
  {
    id: '2',
    name: 'Amit',
    rating: 4.5,
    wait: '20 min',
    status: 'busy',
    image: require('../assets/naai/barber2.jpeg'),
  },
  {
    id: '3',
    name: 'Ritik',
    rating: 4.6,
    wait: '--',
    status: 'break',
    image: require('../assets/naai/barber3.jpg'),
  },
];

const SalonDetailScreen = ({ route, navigation }) => {
  const { salon } = route.params;
  console.log("salon", salon.open);


  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);

  const scrollRef = useRef(null);

  /* -------------------- AUTO SLIDER -------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      let next = (activeIndex + 1) % salon.images.length;
      setActiveIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  /* -------------------- HELPERS -------------------- */
  const openMap = () => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`
    );
  };

  const callSalon = () => {
    Linking.openURL(`tel:${salon.phone}`);
  };

  const toggleService = service => {
    setSelectedServices(prev =>
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const getStatusColor = status => {
    if (status === 'available') return '#4CAF50';
    if (status === 'busy') return '#FF9800';
    return '#F44336';
  };

  const isShopOpen = () => {
    const hour = new Date().getHours();
    return hour >= 9 && hour < 22;
  };

  const handleContinue = () => {
    if (selectedServices.length === 0) {
      Alert.alert(
        'Service Required',
        'Please select at least one service to continue booking.',
        [{ text: 'OK' }],
      );
      return;
    }

    navigation.navigate('BookingSchedule', {
      salon,
      services: selectedServices,
      barber: selectedBarber,
    });
  };

  const totalAmount = selectedServices.reduce((s, i) => s + i.price, 0);
  const totalTime = selectedServices.reduce((s, i) => s + i.time, 0);

  return (
    <View style={styles.container}>
      <ImageBackground source={BG_IMAGE} style={styles.bg}>
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* -------------------- HEADER -------------------- */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View>
                <Text style={styles.headerTitle}>{salon.name}</Text>
                <Text style={styles.salonType}>
                  {salon.type || 'Unisex Salon'}
                </Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
              {/* -------------------- SLIDER -------------------- */}
              <View style={{ marginTop: 60 }}>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                >
                  {salon.images.map((img, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setModalImage(img);
                        setModalVisible(true);
                      }}
                    >
                      <ImageBackground source={img} style={styles.sliderImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* -------------------- DETAILS -------------------- */}
              <View style={styles.card}>
                <View style={styles.ratingRow}>

                  <View style={{ flexDirection: 'row' }}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>
                      {salon.rating} ({salon.reviews} reviews)
                    </Text>
                  </View>
                  {salon.open &&
                    <Text style={styles.wait}>
                      • Queue: {salon.waitNumber} People
                    </Text>
                  }

                </View>

                {/* SHOP STATUS */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={salon.open ? '#4CAF50' : '#F44336'}
                    />

                    <Text
                      style={[
                        styles.infoText,
                        { color: salon.open ? '#4CAF50' : '#F44336' },
                      ]}
                    >
                      {salon.open ? 'OPEN NOW' : 'CLOSED'}
                    </Text>

                    <Text style={styles.infoSub}>
                      ({salon.openTime ?? '9 AM'} - {salon.closeTime ?? '10 PM'})
                    </Text>
                  </View>


                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#E1B378" />
                    <Text style={styles.infoText}>
                      Weekly Off: {salon.weeklyOff || 'Monday'}
                    </Text>
                  </View>

                  {salon.upcomingHoliday && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color="#FF5252"
                      />
                      <Text style={[styles.infoText, { color: '#FF5252' }]}>
                        Holiday: {salon.upcomingHoliday}
                      </Text>
                    </View>
                  )}
                </View>

                {/* LOCATION */}
                <TouchableOpacity style={styles.row} onPress={openMap}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#E1B378"
                  />
                  <Text style={styles.linkText}>{salon.address}</Text>
                  <Ionicons name="open-outline" size={14} color="#AAA" />
                </TouchableOpacity>

                {/* CALL */}
                <TouchableOpacity style={styles.row} onPress={callSalon}>
                  <Ionicons name="call-outline" size={18} color="#E1B378" />
                  <Text style={styles.linkText}>{salon.phone}</Text>
                </TouchableOpacity>

                {/* SERVICES */}
                <Text style={styles.section}>Select Services</Text>
                {SERVICES.map(service => {
                  const active = selectedServices.some(
                    s => s.id === service.id
                  );
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceRow,
                        active && styles.serviceActive,
                      ]}
                      onPress={() => toggleService(service)}
                    >
                      <View>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceTime}>
                          ⏱ {service.time} min
                        </Text>
                      </View>
                      <Text style={styles.servicePrice}>₹{service.price}</Text>
                    </TouchableOpacity>
                  );
                })}

                {selectedServices.length > 0 && (
                  <Text style={styles.totalText}>
                    Total: ₹{totalAmount} • ⏱ {totalTime} min
                  </Text>
                )}

                {/* BARBERS */}
                <Text style={styles.section}>Select Barber (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {BARBERS.map(b => (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.barberCard,
                        selectedBarber?.id === b.id && styles.barberActive,
                      ]}
                      onPress={() =>
                        setSelectedBarber(
                          selectedBarber?.id === b.id ? null : b
                        )
                      }
                    >
                      <ImageBackground source={b.image} style={styles.barberImg} />
                      <Text style={styles.barberName}>{b.name}</Text>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(b.status) },
                          ]}
                        />
                        <Text style={styles.statusText}>{b.status}</Text>
                      </View>

                      <Text style={styles.barberInfo}>
                        ⭐ {b.rating} • ⏱ {b.wait}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* BOTTOM */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleContinue}>
          <Text style={styles.bookText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* IMAGE MODAL */}
      <Modal visible={modalVisible} transparent>
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

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: '#1E1E1E' },

  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginLeft: 16 },
  salonType: { color: '#E1B378', fontSize: 13, marginLeft: 16 },

  sliderImage: { width, height: 260 },

  card: { padding: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  rating: { color: '#FFD700', marginLeft: 6 },
  wait: { color: '#fff', marginLeft: 6, fontSize: 13 },
  linkText: { color: '#E1B378', marginLeft: 8 },

  // infoBox: { backgroundColor: '#2A2A2A', borderRadius: 14, padding: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  infoSub: { color: '#AAA', marginLeft: 6, fontSize: 12 },

  section: { color: '#fff', fontWeight: '700', fontSize: 16, marginTop: 16, marginBottom: 5 },

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  serviceActive: { borderWidth: 1, borderColor: '#E1B378' },
  serviceName: { color: '#fff', fontWeight: '600' },
  serviceTime: { color: '#AAA', fontSize: 12 },
  servicePrice: { color: '#E1B378', fontWeight: '700' },

  totalText: { color: '#E1B378', fontWeight: '700', textAlign: 'right' },

  barberCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 10,
    marginRight: 12,
    width: 120,
  },
  barberActive: { borderWidth: 1, borderColor: '#E1B378' },
  barberImg: { height: 80, borderRadius: 12 },
  barberName: { color: '#fff', fontWeight: '600', marginTop: 6 },
  barberInfo: { color: '#AAA', fontSize: 12 },

  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#AAA', fontSize: 12 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  bookBtn: {
    backgroundColor: '#E1B378',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  bookText: { color: '#000', fontWeight: '700', fontSize: 16 },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: { width: '100%', height: '80%' },
  modalClose: { position: 'absolute', top: 50, right: 20 },
});
