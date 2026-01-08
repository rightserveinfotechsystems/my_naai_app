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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getServerUrl } from '../services/communication';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');
const { width } = Dimensions.get('window');

const GOLD = '#E8B97E';
const DARK = '#121212';
// const CARD = '#1E1E1E';


const SalonDetailScreen = ({ route, navigation }) => {
  const { salonId } = route.params;

  const [salonDetails, setSalonDetails] = useState(null);

  const [activeIndex, setActiveIndex] = useState(0);
  // const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);

  // salonByIdInfo
  const getSalonDetailsById = async (salonId) => {
    setLoading(true);
    try {
      const response = await communication.salonByIdInfo({ salonId });
      console.log("getSalonDetailsById", response);


      if (response?.status === "SUCCESS") {
        setSalonDetails(response?.data);
      } else {
        Alert.alert('Error', response?.message);
      }
    } catch (error) {
      Alert.alert('Error', error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // const loadUserDetails = async () => {
    //   const user = await AsyncStorage.getItem('mnymktUser');
    //   if (user) {
    //     const userData = JSON.parse(user);
    //     getSalonDetailsById(userData.userId);
    //   }
    // };
    // getSalonDetailsById();
    getSalonDetailsById(salonId);

  }, []);

  /* -------------------- AUTO SLIDER -------------------- */

  const images = Array.isArray(salonDetails?.imagesArray)
    ? salonDetails.imagesArray.map(img => ({
      uri: `${getServerUrl()}/getfiles/${img}`,
    }))
    : [];

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % images.length;

        scrollRef.current?.scrollTo({
          x: next * width,
          animated: true,
        });

        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [images]);


  /* -------------------- HELPERS -------------------- */
  const openMap = () => {
    if (!salonDetails.latitude || !salonDetails.longitude) {
      Alert.alert('Location not available');
      return;
    }

    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${salonDetails.latitude},${salonDetails.longitude}`
    );
  };


  const callSalon = () => {
    Linking.openURL(`tel:${salonDetails.phone}`);
  };

  // const toggleService = service => {
  //   setSelectedServices(prev =>
  //     prev.some(s => s.id === service.id)
  //       ? prev.filter(s => s.id !== service.id)
  //       : [...prev, service]
  //   );
  // };

  const getStatusColor = isAvailable => {
    if (isAvailable === true) return '#4CAF50';
    return '#F44336';
  };

  const isShopOpen = () => {
    const hour = new Date().getHours();
    return hour >= 9 && hour < 22;
  };

  const handleContinue = () => {
    // if (selectedServices.length === 0) {
    //   Alert.alert(
    //     'Service Required',
    //     'Please select at least one service to continue booking.',
    //     [{ text: 'OK' }],
    //   );
    //   return;
    // }

    navigation.navigate('BookingSchedule', { salon: salonDetails });
  };


  if (!salonDetails) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  const services = salonDetails?.services || [];
  const barbers = salonDetails?.barbers || [];

  const address = `${salonDetails?.addressLine1}, ${salonDetails?.addressLine2}, ${salonDetails?.city}`;

  const formatTime12Hour = (time) => {
    if (!time) return '';

    const [h, m] = time.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m));

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };


  return (
    <View style={styles.container}>
      <ImageBackground source={BG_IMAGE} style={styles.bg}>
        <View style={styles.overlay}>
          {loading ? (
            <ActivityIndicator size="small" color="#a71818ff" />
          ) : (
            <>
              <SafeAreaView style={{ flex: 1 }}>

                {/* -------------------- HEADER -------------------- */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <View>
                    <Text style={styles.headerTitle}>{salonDetails.salonName}</Text>
                    <Text style={styles.salonType}>
                      {salonDetails.genderType || ''} SALON
                    </Text>
                  </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 180, marginTop: 50 }}>
                  {/* -------------------- SLIDER -------------------- */}
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                  >
                    {images.map((img, i) => (
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


                  {/* -------------------- DETAILS -------------------- */}
                  <View style={styles.card}>
                    <View style={styles.ratingRow}>

                      <View style={{ flexDirection: 'row' }}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>
                          {salonDetails.ratingAverage} ({salonDetails.totalReviews} reviews)
                        </Text>
                      </View>


                    </View>
                    {salonDetails?.isOpen && (
                      <>
                        <View style={styles.waitRow}>
                          <Ionicons name="people-outline" size={14} color="#E1B378" />
                          <Text style={styles.waitText}>
                            Queue: {salonDetails?.queueLength} People
                          </Text>
                        </View>

                        <View style={styles.waitRow}>
                          <Ionicons name="time-outline" size={14} color="#E1B378" />
                          <Text style={styles.waitText}>
                            Avg Waiting Time: {salonDetails?.totalWaitTime?.display}
                          </Text>
                        </View>
                      </>
                    )}


                    {/* SHOP STATUS */}
                    <View style={styles.infoBox}>
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={salonDetails.isOpen ? '#4CAF50' : '#F44336'}
                        />

                        <Text
                          style={[
                            styles.infoText,
                            { color: salonDetails.isOpen ? '#4CAF50' : '#F44336' },
                          ]}
                        >
                          {salonDetails.isOpen ? 'OPEN NOW' : 'CLOSED'}
                        </Text>
                        <Text style={styles.infoSub}>
                          (
                          {salonDetails?.businessHours?.length > 0
                            ? `${formatTime12Hour(
                              salonDetails.businessHours[0].openingTime
                            )} - ${formatTime12Hour(
                              salonDetails.businessHours[0].closingTime
                            )}`
                            : ''}
                          )
                        </Text>

                      </View>


                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#E1B378" />
                        <Text style={styles.infoText}>
                          Weekly Off:{' '}
                          {salonDetails.businessHours?.length
                            ? salonDetails.businessHours
                              .flatMap(e => e.holidayDays || [])
                              .join(', ')
                            : 'N/A'}
                        </Text>

                      </View>

                      {salonDetails.upcomingHoliday && (
                        <View style={styles.infoRow}>
                          <Ionicons
                            name="alert-circle-outline"
                            size={16}
                            color="#FF5252"
                          />
                          <Text style={[styles.infoText, { color: '#FF5252' }]}>
                            Holiday: {salonDetails.upcomingHoliday}
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
                      <Text style={styles.linkText}>{address}</Text>
                      <Ionicons name="open-outline" size={14} color="#AAA" />
                    </TouchableOpacity>

                    {/* CALL */}
                    <TouchableOpacity style={styles.row} onPress={callSalon}>
                      <Ionicons name="call-outline" size={18} color="#E1B378" />
                      <Text style={styles.linkText}>{salonDetails.phoneNumber}</Text>
                    </TouchableOpacity>

                    {/* SERVICES */}
                    <Text style={styles.section}>Services</Text>
                    {services.map(service => {

                      return (
                        <TouchableOpacity
                          key={service.serviceId}
                          style={styles.serviceRow}
                        >
                          <View>
                            <Text style={styles.serviceName}>{service.serviceName}</Text>
                            <Text style={styles.serviceTime}>
                              ⏱ {service.durationMinutes} min
                            </Text>
                          </View>
                          <Text style={styles.servicePrice}>₹{service.price}</Text>
                        </TouchableOpacity>
                      );
                    })}


                    {/* {selectedServices.length > 0 && (
                      <Text style={styles.totalText}>
                        Total: ₹{totalAmount} • ⏱ {totalTime} min
                      </Text>
                    )} */}

                    {/* BARBERS */}
                    <Text style={styles.section}>Barbers</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {barbers.map(b => (
                        <TouchableOpacity
                          key={b.id || b.barberId}
                          style={
                            styles.barberCard
                          }
                          onPress={() =>
                            setSelectedBarber(
                              selectedBarber?.id === b.id ? null : b
                            )
                          }
                        >
                          <ImageBackground source={{ uri: `${getServerUrl()}/getfiles/${b.profileImageUrl}` }
                          } style={styles.barberImg} />
                          <Text style={styles.barberName}>{b.fullName}</Text>

                          <View style={styles.statusRow}>
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(b.isAvailable) },
                              ]}
                            />
                            <Text style={styles.statusText}>
                              {b.isAvailable ? 'Available' : 'Not available'}
                            </Text>

                          </View>

                          <Text style={styles.barberInfo}>
                            ⭐ {b.ratingAverage} • ⏱ {b.durationTime}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </ScrollView>
              </SafeAreaView>
            </>
          )}
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
  // container: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: DARK,
    padding: 14,
  },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: '#1E1E1E' },

  header: {
    position: 'absolute',
    top: 30,
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
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  waitText: {
    marginLeft: 6,
    color: '#E1B378',
    fontSize: 13,
    fontWeight: '600',
  },

});
