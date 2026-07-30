import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
  ActivityIndicator,
  FlatList,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  communication,
  getServerUrl,
} from '../services/communication';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp } from '../utils/AppScreen';
const BookingSchedule = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();

  const { salon, selectedServices } = route.params;

  const bookedSlots = salon?.bookedSlots || [];

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem(
        'mynaaiUser'
      );

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    loadUser();
  }, []);

  const bookingDate = new Date(
    Date.now() + Number(selectedDate) * 86400000
  )
    .toISOString()
    .slice(0, 10);

  const isPastSlot = slotValue => {
    if (selectedDate !== 0) return false;

    const [slotHour, slotMinute] = slotValue
      .split(':')
      .map(Number);

    const slotTotalMinutes =
      slotHour * 60 + slotMinute;

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    return slotTotalMinutes <= currentMinutes;
  };

  const isSlotBooked = slotValue => {
    if (!bookedSlots?.length) return false;

    const toMinutes = time => {
      const clean = time.slice(0, 5);

      const [h, m] = clean
        .split(':')
        .map(Number);

      return h * 60 + m;
    };

    const slotMinutes = toMinutes(slotValue);

    const dayData = bookedSlots.find(
      b => b.date === bookingDate
    );

    if (!dayData || !dayData.slots?.length)
      return false;

    return dayData.slots.some(s => {
      const startMinutes = toMinutes(s.start);

      const endMinutes = toMinutes(s.end);

      return (
        slotMinutes >= startMinutes &&
        slotMinutes < endMinutes
      );
    });
  };

  const generateTimeSlots = () => {
    const schedule = salon?.businessHours?.[0];

    if (!schedule) return [];

    const convertToMinutes = time => {
      const [h, m] = time
        .split(':')
        .map(Number);

      return h * 60 + m;
    };

    const openingMinutes = convertToMinutes(
      schedule.openingTime
    );

    const closingMinutes = convertToMinutes(
      schedule.closingTime
    );

    const slots = [];

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    for (
      let mins = openingMinutes;
      mins < closingMinutes;
      mins += 10
    ) {
      if (
        selectedDate === 0 &&
        mins <= currentMinutes
      )
        continue;

      const hour = Math.floor(mins / 60);

      const minute = mins % 60;

      const displayHour =
        hour > 12
          ? hour - 12
          : hour === 0
            ? 12
            : hour;

      const ampm = hour >= 12 ? 'PM' : 'AM';

      const label = `${displayHour}:${minute
        .toString()
        .padStart(2, '0')} ${ampm}`;

      const value = `${hour
        .toString()
        .padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;

      slots.push({
        label,
        value,
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const selectedDateObj = new Date(
    Date.now() + selectedDate * 86400000
  );

  const selectedDayName =
    selectedDateObj.toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
      }
    );

  const isHoliday =
    salon?.businessHours?.[0]?.holidayDays?.includes(
      selectedDayName
    );

  useEffect(() => {
    if (
      timeSlots.length > 0 &&
      selectedDate === 0
    ) {
      setSelectedTime(timeSlots[0].value);
    }
  }, [selectedDate, salon]);

  const handleConfirm = async () => {
    if (loading) return;

    if (!selectedTime) {
      Alert.alert(
        'Select Time',
        'Please select a time slot.'
      );

      return;
    }

    if (!selectedServices?.length) {
      Alert.alert(
        'Select Service',
        'Please select at least one service.'
      );

      return;
    }

    setLoading(true);

    try {
      const payload = {
        salonId: salon?.salonId,

        barberId:
          selectedBarber?.barberId?.toString() ||
          '',

        bookingDate,

        bookingTime: selectedTime,

        services: selectedServices.map(
          s => s.serviceId
        ),
      };

      const res =
        await communication.createBookingRequest(
          payload
        );

      if (res?.status === 'SUCCESS') {
        Alert.alert(
          'Request Sent',
          'Wait for Salon Response'
        );

        navigation.navigate('Main', {
          screen: 'Booked Salon',
        });
      } else {
        Alert.alert(
          'Error',
          res?.message ||
          'Booking Appointment failed'
        );
      }
    } catch (error) {
      Alert.alert(
        'Warn',
        error?.response?.data?.message || error?.message ||
        'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = isAvailable =>
    isAvailable ? '#4CAF50' : '#F44336';

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >
      {/* ---------------- HEADER ---------------- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <Text
          allowFontScaling={false}
          style={styles.headerTitle}
        >
          Schedule Appointment
        </Text>
      </View>

      <FlatList
        data={salon?.services || []}
        keyExtractor={item =>
          item.serviceId.toString()
        }
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: 'space-between',
        }}
        contentContainerStyle={{
          margin: wp(5),
          paddingBottom: Math.max(
            insets.bottom + 140,
            160
          ),
        }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <>
            {/* ---------------- BARBERS ---------------- */}
            <View style={styles.card}>
              {salon?.barbers?.length > 0 && (
                <Text
                  allowFontScaling={false}
                  style={styles.section}
                >
                  Select Barber (Optional)
                </Text>
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
              >
                {salon?.barbers?.map(b => {
                  const selected =
                    selectedBarber?.barberId ===
                    b.barberId;

                  return (
                    <TouchableOpacity
                      key={b.barberId}
                      style={[
                        styles.barberCard,
                        selected &&
                        styles.barberActive,
                      ]}
                      onPress={() =>
                        setSelectedBarber(
                          selected ? null : b
                        )
                      }
                    >
                      <ImageBackground
                        source={{
                          uri: `${getServerUrl()}/getfiles/${b.profileImageUrl}`,
                        }}
                        style={styles.barberImg}
                        imageStyle={{
                          borderRadius: 12,
                        }}
                      />

                      <Text
                        allowFontScaling={false}
                        style={styles.barberName}
                      >
                        {b.fullName}
                      </Text>

                      <View
                        style={styles.statusRow}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                getStatusColor(
                                  b.isAvailable
                                ),
                            },
                          ]}
                        />

                        <Text
                          allowFontScaling={false}
                          style={styles.statusText}
                        >
                          {b.isAvailable
                            ? 'Available'
                            : 'Not available'}
                        </Text>
                      </View>

                      <Text
                        allowFontScaling={false}
                        style={styles.barberInfo}
                      >
                        ⭐ {b.ratingAverage || 0}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ---------------- DATE ---------------- */}
            <View style={styles.card}>
              <Text
                allowFontScaling={false}
                style={styles.section}
              >
                Select Date
              </Text>

              <View style={styles.dateRow}>
                {[0, 1, 2].map(i => {
                  const date = new Date(
                    Date.now() + i * 86400000
                  );

                  const label =
                    i === 0
                      ? 'Today'
                      : i === 1
                        ? 'Tomorrow'
                        : 'Day After';

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.dateBox,
                        selectedDate === i &&
                        styles.dateActive,
                      ]}
                      onPress={() =>
                        setSelectedDate(i)
                      }
                    >
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.dateDay,
                          selectedDate === i &&
                          styles.activeText,
                        ]}
                      >
                        {label}
                      </Text>

                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.dateNum,
                          selectedDate === i &&
                          styles.activeText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ---------------- TIME ---------------- */}
            {isHoliday ? (
              <View style={styles.card}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.section,
                    { color: 'red' },
                  ]}
                >
                  Salon is closed on{' '}
                  {selectedDayName}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text
                  allowFontScaling={false}
                  style={styles.section}
                >
                  Select Time
                </Text>

                <View style={styles.timeGrid}>
                  {timeSlots.map(slot => {
                    const booked =
                      isSlotBooked(slot.value);

                    const past =
                      isPastSlot(slot.value);

                    const disabled =
                      booked || past;

                    return (
                      <TouchableOpacity
                        key={slot.value}
                        disabled={disabled}
                        style={[
                          styles.timeSlot,
                          selectedTime ===
                          slot.value &&
                          styles.timeSlotActive,
                          booked &&
                          styles.timeSlotBooked,
                          past &&
                          styles.pastSlot,
                        ]}
                        onPress={() =>
                          setSelectedTime(
                            slot.value
                          )
                        }
                      >
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.timeSlotText,
                            selectedTime ===
                            slot.value &&
                            styles.activeText,
                            booked &&
                            styles.timeSlotBookedText,
                            past &&
                            styles.disabledText,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        }
      />

      {/* ---------------- CONFIRM BUTTON ---------------- */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(
              insets.bottom,
              12
            ),
            // bottom: Math.max(insets.bottom, 8),
            bottom: 0,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text
              allowFontScaling={false}
              style={styles.confirmText}
            >
              Confirm Booking
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingSchedule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(4),
  },

  headerTitle: {
    color: '#fff',
    fontSize: wp(4.8),
    fontWeight: '700',
    marginLeft: wp(4),
  },

  card: {
    marginVertical: hp(2),
    borderRadius: wp(4),
  },

  section: {
    color: '#fff',
    fontSize: wp(4.2),
    fontWeight: '700',
    marginBottom: hp(1.5),
  },

  barberCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: wp(4),
    padding: wp(2.5),
    marginRight: wp(3),
    width: wp(30),
  },

  barberActive: {
    borderWidth: 1,
    borderColor: '#E1B378',
  },

  barberImg: {
    height: hp(10),
  },

  barberName: {
    color: '#fff',
    fontWeight: '600',
    marginTop: hp(0.8),
    fontSize: wp(3.5),
  },

  barberInfo: {
    color: '#AAA',
    fontSize: wp(3),
  },


  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    color: '#AAA',
    fontSize: wp(3),
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dateBox: {
    width: wp(26),
    height: hp(9),
    borderRadius: wp(4),
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateActive: {
    backgroundColor: '#E1B378',
  },

  dateDay: {
    color: '#AAA',
    fontSize: wp(3),
  },

  dateNum: {
    color: '#fff',
    fontSize: wp(5),
    fontWeight: '700',
  },

  activeText: {
    color: '#000',
  },

  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  timeSlot: {
    width: wp(29),
    backgroundColor: '#2A2A2A',
    paddingVertical: hp(1.2),
    borderRadius: wp(3),
    marginBottom: hp(1.2),
    alignItems: 'center',
  },

  timeSlotActive: {
    backgroundColor: '#E1B378',
  },

  timeSlotText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp(3.2),
  },

  timeSlotBooked: {
    backgroundColor: '#2e1b1b',
  },

  timeSlotBookedText: {
    color: '#4e3331',
  },

  pastSlot: {
    backgroundColor: '#2A2A2A',
  },

  disabledText: {
    color: '#888',
  },

  bottomBar: {
    position: 'absolute',
    // bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    backgroundColor: '#121212',
    // borderTopWidth: 1,
    // borderTopColor: '#2A2A2A',
    elevation: 20,
    zIndex: 100,
  },
  confirmBtn: {
    backgroundColor: '#E1B378',
    paddingVertical: hp(1.8),
    borderRadius: wp(8),
    alignItems: 'center',
    marginBottom: 10,
  },

  confirmText: {
    color: '#000',
    fontWeight: '700',
    fontSize: wp(4),
  },
});