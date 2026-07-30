import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  // Dimensions,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getServerUrl } from '../services/communication';
import { wp, hp } from '../utils/AppScreen';

const BG_IMAGE = require('../assets/salon_page_bg.png');
// const { width } = Dimensions.get('window');

const GOLD = '#E8B97E';
const DARK = '#121212';
// const CARD = '#1E1E1E';


const SalonDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
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
          x: next * wp(100),
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


  const getStatusColor = isAvailable => {
    if (isAvailable === true) return '#4CAF50';
    return '#F44336';
  };

  const isShopOpen = () => {
    const hour = new Date().getHours();
    return hour >= 9 && hour < 22;
  };

  const handleContinue = () => {
    navigation.navigate('SalonServicesScreen', {
      salon: salonDetails,
    });
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


  const isSlotBooked = (slotValue) => {
    if (!bookedSlots.length) return false;

    return bookedSlots.some(booked => {
      const bookedStart = booked.start.slice(0, 5);
      return bookedStart === slotValue;
    });
  };

  // const address = `${salonDetails?.addressLine1}, ${salonDetails?.addressLine2}, ${salonDetails?.city}`;
  const address = `${salonDetails?.addressLine1}`;

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
  const weeklyOff =
    salonDetails?.businessHours?.flatMap(e => e.holidayDays || []) || [];

  const isSalonOpenNow = (businessHours) => {
    if (!businessHours || businessHours.length === 0) return false;

    const schedule = businessHours[0];
    const now = new Date();

    const convertToSeconds = (time) => {
      const [h, m, s] = time.split(':').map(Number);
      return h * 3600 + m * 60 + s;
    };

    const currentSeconds =
      now.getHours() * 3600 +
      now.getMinutes() * 60 +
      now.getSeconds();

    const opening = convertToSeconds(schedule.openingTime);
    const closing = convertToSeconds(schedule.closingTime);

    // Get today's name (e.g., "Friday")
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });

    // ❌ Holiday check
    if (schedule.holidayDays?.includes(today)) {
      return false;
    }

    // ❌ Outside working hours
    if (currentSeconds < opening || currentSeconds > closing) {
      return false;
    }

    return true;
  };
  const isOpenNow = isSalonOpenNow(salonDetails.businessHours);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const isHolidayToday =
    salonDetails?.businessHours?.[0]?.holidayDays?.includes(today);


  return (
    <View style={styles.container}>
      <ImageBackground source={BG_IMAGE} style={styles.bg}>
        <View style={styles.overlay}>
          {loading ? (
            <ActivityIndicator size="small" color="#a71818ff" />
          ) : (
            <>
              <SafeAreaView
                style={{ flex: 1 }}
                edges={['top', 'left', 'right']}
              >

                {/* -------------------- HEADER -------------------- */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  <View>
                    <Text allowFontScaling={false} style={styles.headerTitle}>{salonDetails.salonName}</Text>
                    <Text allowFontScaling={false} style={styles.salonType}>
                      {salonDetails.genderType || ''} SALON
                    </Text>
                  </View>
                </View>

                <ScrollView
                  contentContainerStyle={{
                    paddingBottom: 180 + Math.max(insets.bottom, 20),
                    marginTop: 80,
                  }}
                >
                  {/* -------------------- SLIDER -------------------- */}
                  <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                  >
                    {images?.length > 0 ? (
                      images.map((img, i) => (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.9}
                          onPress={() => {
                            setModalImage(img);
                            setModalVisible(true);
                          }}
                        >
                          <ImageBackground
                            source={img}
                            style={styles.sliderImage}
                          // imageStyle={{ borderRadius: 16 }}
                          />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          setModalImage(require('../assets/myNaai.jpeg'));
                          setModalVisible(true);
                        }}
                      >
                        <ImageBackground
                          source={require('../assets/myNaai.jpeg')}
                          style={styles.sliderImage}
                          imageStyle={{ borderRadius: 12 }}
                        />
                      </TouchableOpacity>
                    )}
                  </ScrollView>




                  {/* -------------------- DETAILS -------------------- */}
                  <View style={styles.card}>
                    {/* <View style={styles.ratingRow}>

                      <View style={{ flexDirection: 'row' }}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text allowFontScaling={false}style={styles.rating}>
                          {salonDetails.ratingAverage} ({salonDetails.totalReviews} reviews)
                        </Text>
                      </View>


                    </View> */}
                    {/* {salonDetails?.isOpen && (
                      <>
                        <View style={styles.waitRow}>
                          <Ionicons name="people-outline" size={14} color="#E1B378" />
                          <Text allowFontScaling={false}style={styles.waitText}>
                            Queue: {salonDetails?.queueLength} People
                          </Text>
                        </View>

                        <View style={styles.waitRow}>
                          <Ionicons name="time-outline" size={14} color="#E1B378" />
                          <Text allowFontScaling={false}style={styles.waitText}>
                            Avg Waiting Time: {salonDetails?.totalWaitTime?.display}
                          </Text>
                        </View>
                      </>
                    )} */}


                    {/* SHOP STATUS */}
                    <View style={styles.commonRow}>
                      <View style={styles.icon}>
                        <Ionicons
                          name="time-outline"
                          size={18}
                          color={
                            isHolidayToday
                              ? '#FF5252'
                              : isOpenNow
                                ? '#4CAF50'
                                : '#F44336'
                          }
                        />
                      </View>

                      <Text allowFontScaling={false}
                        style={[
                          styles.infoText,
                          { color: isOpenNow ? '#4CAF50' : '#F44336' },
                        ]}
                      >
                        {isHolidayToday ? 'HOLIDAY' : isOpenNow ? 'OPEN NOW' : 'CLOSED'}
                      </Text>

                      <Text allowFontScaling={false} style={styles.infoSub}>
                        ({salonDetails?.businessHours?.length > 0
                          ? `${formatTime12Hour(
                            salonDetails.businessHours[0].openingTime
                          )} - ${formatTime12Hour(
                            salonDetails.businessHours[0].closingTime
                          )}`
                          : ''})
                      </Text>
                    </View>

                    {/* {salonDetails.businessHours &&
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#E1B378" />
                        <Text allowFontScaling={false}style={styles.infoText}>
                          Weekly Off:{' '}
                          {salonDetails.businessHours?.length
                            ? salonDetails.businessHours
                              .flatMap(e => e.holidayDays || [])
                              .join(', ')
                            : 'N/A'}
                        </Text>

                      </View>
                      } */}

                    {weeklyOff.length > 0 && (
                      <View style={styles.commonRow}>
                        <View style={styles.icon}>
                          <Ionicons name="calendar-outline" size={15} color="#fff" />
                        </View>

                        <Text allowFontScaling={false} style={styles.infoText}>
                          Weekly Off: {weeklyOff.join(', ')}
                        </Text>
                      </View>
                    )}

                    {salonDetails.upcomingHoliday && (
                      <View style={styles.infoRow}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={16}
                          color="#FF5252"
                        />
                        <Text allowFontScaling={false} style={[styles.infoText, { color: '#FF5252' }]}>
                          Holiday: {salonDetails.upcomingHoliday}
                        </Text>
                      </View>
                    )}
                    {/* </View> */}

                    {/* LOCATION */}
                    <TouchableOpacity style={styles.commonRow} onPress={openMap}>
                      <View style={styles.icon}>
                        <Ionicons name="location-outline" size={18} color="#E1B378" />
                      </View>

                      <Text allowFontScaling={false} style={styles.linkText}>
                        {address}
                      </Text>
                    </TouchableOpacity>

                    {/* CALL */}
                    <TouchableOpacity style={styles.commonRow} onPress={callSalon}>
                      <View style={styles.icon}>
                        <Ionicons name="call-outline" size={18} color="#E1B378" />
                      </View>

                      <Text allowFontScaling={false} style={styles.linkText}>
                        {salonDetails.phoneNumber}
                      </Text>
                    </TouchableOpacity>

                    {/* SERVICES */}
                    {/* <Text allowFontScaling={false}style={styles.section}>Services</Text>
                    {services.map(service => {

                      return (
                        <TouchableOpacity
                          key={service.serviceId}
                          style={styles.serviceRow}
                        >
                          <View>
                            <Text allowFontScaling={false}style={styles.serviceName}>{service.serviceName}</Text>
                            <Text allowFontScaling={false}style={styles.serviceTime}>
                              ⏱ {service.durationMinutes} min
                            </Text>
                          </View>
                          <Text allowFontScaling={false}style={styles.servicePrice}>₹{service.price}</Text>
                        </TouchableOpacity>
                      );
                    })} */}

                    {/* BARBERS */}
                    {/* <Text allowFontScaling={false}style={styles.section}>Barbers</Text>
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
                          <Text allowFontScaling={false}style={styles.barberName}>{b.fullName}</Text>

                          <View style={styles.statusRow}>
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(b.isAvailable) },
                              ]}
                            />
                            <Text allowFontScaling={false}style={styles.statusText}>
                              {b.isAvailable ? 'Available' : 'Not available'}
                            </Text>

                          </View>

                          <Text allowFontScaling={false}style={styles.barberInfo}>
                            ⭐ {b.ratingAverage} • ⏱ {b.durationTime}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView> */}
                    <View style={styles.staticInfoBox}>
                      <Text allowFontScaling={false} style={styles.staticText}>
                        • Please arrive at least 10 minutes before your scheduled time.
                      </Text>
                      <Text allowFontScaling={false} style={styles.staticText}>
                        • Service duration may vary based on requirements.
                      </Text>
                      <Text allowFontScaling={false} style={styles.staticText}>
                        • Walk-ins are subject to availability and waiting time.
                      </Text>
                    </View>

                  </View>
                </ScrollView>
              </SafeAreaView>
            </>
          )}
        </View>
      </ImageBackground>

      {/* BOTTOM */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            // bottom: Math.max(insets.bottom, 8),
            bottom: 0,
          },
        ]}
      >
        <TouchableOpacity style={styles.bookBtn} onPress={handleContinue}>
          <Text allowFontScaling={false} style={styles.bookText}>Continue</Text>
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
    padding: 0,
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

  sliderImage: {
    width: wp(100),
    height: hp(35),
  },

  card: { padding: 18 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 10,
    marginTop: 8,
  },

  rating: { color: '#FFD700', marginLeft: 6 },
  wait: { color: '#fff', marginLeft: 6, fontSize: 13 },


  infoBox: {
    // backgroundColor: '#2A2A2A',
    // borderRadius: 14,
    // padding: 14,
    marginTop: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },


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

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#1E1E1E',
    elevation: 20
    // borderTopWidth: 1,
    // borderTopColor: '#2A2A2A',
  },
  bookBtn: {
    backgroundColor: '#E1B378',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
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
    marginTop: 6,
  },
  waitText: {
    marginLeft: 6,
    color: '#E1B378',
    fontSize: 13,
    fontWeight: '600',
  },
  staticInfoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },

  staticText: {
    color: '#AAA',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  // commonRow: {
  //   flexDirection: 'row',
  //   alignItems: 'flex-start',
  //   marginTop: 10,
  // }

  commonRow: {
    flexDirection: 'row',
    alignItems: 'center',   // 👈 SAME LINE alignment
    marginTop: 15,
  },

  icon: {
    width: 22,              // 👈 FIXED width for perfect alignment
    alignItems: 'center',
  },

  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },

  infoSub: {
    fontSize: 12,
    color: '#AAA',
    marginLeft: 6,
  },

  linkText: {
    fontSize: 16,
    color: '#E1B378',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },


});
