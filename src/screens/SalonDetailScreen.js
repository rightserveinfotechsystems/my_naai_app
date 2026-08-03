import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Modal,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getServerUrl } from '../services/communication';
import { wp, hp } from '../utils/AppScreen';

const BG_IMAGE = require('../assets/salon_page_bg.png');
const GOLD = '#E8B97E';
const DARK = '#121212';

/* -------------------- IST TIMEZONE OPEN/CLOSED CALCULATOR -------------------- */
const getSalonStatus = (businessHours = []) => {
  if (!businessHours || !businessHours.length) {
    return { isOpen: false, text: 'CLOSED', color: '#F44336' };
  }

  const schedule = businessHours[0];
  if (!schedule) {
    return { isOpen: false, text: 'CLOSED', color: '#F44336' };
  }

  /* 🎯 Calculate Indian Standard Time (IST = UTC + 5:30) */
  const utcNow = Date.now();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  
  // Create IST Date object independent of device timezone
  const systemOffsetMs = new Date().getTimezoneOffset() * 60000;
  const istDate = new Date(utcNow + systemOffsetMs + istOffsetMs);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[istDate.getDay()];

  // 1. Check Holiday Days
  if (schedule.holidayDays && Array.isArray(schedule.holidayDays) && schedule.holidayDays.includes(currentDay)) {
    return { isOpen: false, text: 'CLOSED (HOLIDAY)', color: '#F44336' };
  }

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
  const openMinutes = parseTimeToMinutes(schedule.openingTime);
  const closeMinutes = parseTimeToMinutes(schedule.closingTime);

  let isOpen = false;

  if (closeMinutes > openMinutes) {
    // Normal operating hours (e.g. 09:00 to 21:00)
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else if (closeMinutes < openMinutes) {
    // Overnight operating hours (e.g. 20:00 to 02:00)
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return {
    isOpen,
    text: isOpen ? 'OPEN NOW' : 'CLOSED',
    color: isOpen ? '#4CAF50' : '#F44336',
  };
};

/* -------------------- TIME FORMATTER -------------------- */
const formatTime12Hour = (time) => {
  if (!time || typeof time !== 'string') return '';
  const [h, m] = time.split(':');
  if (!h || !m) return '';
  
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
};

const SalonDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { salonId } = route.params;

  const [salonDetails, setSalonDetails] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef(null);

  /* -------- FETCH SALON DETAILS -------- */
  const getSalonDetailsById = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await communication.salonByIdInfo({ salonId: id });
      if (response?.status === 'SUCCESS') {
        setSalonDetails(response?.data);
      } else {
        Alert.alert('Error', response?.message || 'Failed to fetch salon details.');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getSalonDetailsById(salonId);
  }, [salonId, getSalonDetailsById]);

  /* -------- IMAGE SLIDER SETUP -------- */
  const images = useMemo(() => {
    if (Array.isArray(salonDetails?.imagesArray) && salonDetails.imagesArray.length > 0) {
      return salonDetails.imagesArray.map((img) => ({
        uri: `${getServerUrl()}/getfiles/${img}`,
      }));
    }
    return [];
  }, [salonDetails?.imagesArray]);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
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

  /* -------- IST SHOP STATUS -------- */
  const salonStatus = useMemo(() => {
    return getSalonStatus(salonDetails?.businessHours);
  }, [salonDetails?.businessHours]);

  const weeklyOff = useMemo(() => {
    return salonDetails?.businessHours?.flatMap((e) => e.holidayDays || []) || [];
  }, [salonDetails?.businessHours]);

  /* -------- HELPERS -------- */
  const openMap = useCallback(() => {
    if (!salonDetails?.latitude || !salonDetails?.longitude) {
      Alert.alert('Location not available');
      return;
    }
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${salonDetails.latitude},${salonDetails.longitude}`
    );
  }, [salonDetails?.latitude, salonDetails?.longitude]);

  const callSalon = useCallback(() => {
    if (salonDetails?.phoneNumber) {
      Linking.openURL(`tel:${salonDetails.phoneNumber}`);
    } else {
      Alert.alert('Phone number unavailable');
    }
  }, [salonDetails?.phoneNumber]);

  const handleContinue = useCallback(() => {
    navigation.navigate('SalonServicesScreen', {
      salon: salonDetails,
    });
  }, [navigation, salonDetails]);

  if (loading || !salonDetails) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  const address = salonDetails?.addressLine1 || '';

  return (
    <View style={styles.container}>
     {/* <ImageBackground source={BG_IMAGE} style={styles.bg}> */}
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            {/* -------------------- HEADER -------------------- */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View>
                <Text allowFontScaling={false} style={styles.headerTitle}>
                  {salonDetails.salonName}
                </Text>
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
              showsVerticalScrollIndicator={false}
            >
              {/* -------------------- SLIDER -------------------- */}
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {images.length > 0 ? (
                  images.map((img, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.9}
                      onPress={() => {
                        setModalImage(img);
                        setModalVisible(true);
                      }}
                    >
                      <ImageBackground source={img} style={styles.sliderImage} />
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

              {/* -------------------- DETAILS CARD -------------------- */}
              <View style={styles.card}>
                {/* SHOP STATUS */}
                <View style={styles.commonRow}>
                  <View style={styles.icon}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={salonStatus.color}
                    />
                  </View>

                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.infoText,
                      { color: salonStatus.color },
                    ]}
                  >
                    {salonStatus.text}
                  </Text>

                  {salonDetails?.businessHours?.length > 0 && (
                    <Text allowFontScaling={false} style={styles.infoSub}>
                      (
                      {`${formatTime12Hour(salonDetails.businessHours[0].openingTime)} - ${formatTime12Hour(salonDetails.businessHours[0].closingTime)}`}
                      )
                    </Text>
                  )}
                </View>

                {/* WEEKLY OFF */}
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

                {/* UPCOMING HOLIDAY */}
                {salonDetails.upcomingHoliday && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color="#FF5252"
                    />
                    <Text
                      allowFontScaling={false}
                      style={[styles.infoText, { color: '#FF5252' }]}
                    >
                      Holiday: {salonDetails.upcomingHoliday}
                    </Text>
                  </View>
                )}

                {/* LOCATION */}
                <TouchableOpacity style={styles.commonRow} onPress={openMap}>
                  <View style={styles.icon}>
                    <Ionicons name="location-outline" size={18} color={GOLD} />
                  </View>

                  <Text allowFontScaling={false} style={styles.linkText}>
                    {address}
                  </Text>
                </TouchableOpacity>

                {/* CALL */}
                <TouchableOpacity style={styles.commonRow} onPress={callSalon}>
                  <View style={styles.icon}>
                    <Ionicons name="call-outline" size={18} color={GOLD} />
                  </View>

                  <Text allowFontScaling={false} style={styles.linkText}>
                    {salonDetails.phoneNumber}
                  </Text>
                </TouchableOpacity>

                {/* STATIC INFO BOX */}
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
        </View>
       {/* </ImageBackground> */}

      {/* BOTTOM CONTINUE BUTTON */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            bottom: 0,
          },
        ]}
      >
        <TouchableOpacity style={styles.bookBtn} onPress={handleContinue}>
          <Text allowFontScaling={false} style={styles.bookText}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* IMAGE FULLSCREEN MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {modalImage && (
            <Image source={modalImage} style={styles.modalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default SalonDetailScreen;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
    padding: 0,
  },
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.99)', },

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
  salonType: { color: GOLD, fontSize: 13, marginLeft: 16 },

  sliderImage: {
    width: wp(100),
    height: hp(35),
  },

  card: { padding: 18 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#1E1E1E',
    elevation: 20,
  },
  bookBtn: {
    backgroundColor: GOLD,
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

  staticInfoBox: {
    marginTop: 18,
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

  commonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  icon: {
    width: 22,
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
    color: GOLD,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});