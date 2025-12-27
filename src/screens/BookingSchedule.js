import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BookingSchedule = ({ route, navigation }) => {
  const { salon, services = [], barber } = route.params;

  const [selectedDate, setSelectedDate] = useState(0);

  /* -------------------- QUEUE LOGIC -------------------- */
  const queuePosition = useMemo(() => {
    const baseQueue = barber ? 3 : 6;
    return baseQueue + selectedDate;
  }, [barber, selectedDate]);

  /* -------------------- TOTAL -------------------- */
  const totalAmount = services.reduce((sum, s) => sum + s.price, 0);

  /* -------------------- CONFIRM -------------------- */
  const handleConfirm = () => {
    if (services.length === 0) {
      Alert.alert(
        'Select Service',
        'Please select at least one service to continue.',
      );
      return;
    }

    Alert.alert(
      'Booking Confirmed 🎉',
      `Salon: ${salon.name}
Services: ${services.map(s => s.name).join(', ')}
Barber: ${barber ? barber.name : 'Auto Assigned'}
Date: ${new Date(
        Date.now() + selectedDate * 86400000,
      ).toDateString()}
People ahead in queue: ${queuePosition}`,
      [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('Main', { screen: 'Booked Salon' }),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* -------------------- HEADER -------------------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Appointment</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {/* -------------------- SUMMARY -------------------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Summary</Text>

          <Text style={styles.summaryText}>
            Salon: <Text style={styles.bold}>{salon.name}</Text>
          </Text>

          <Text style={styles.summaryText}>
            Services:{' '}
            <Text style={styles.bold}>
              {services.map(s => s.name).join(', ')}
            </Text>
          </Text>

          <Text style={styles.summaryText}>
            Barber:{' '}
            <Text style={styles.bold}>
              {barber ? barber.name : 'Auto Assign'}
            </Text>
          </Text>

          <Text style={styles.totalText}>Total: ₹{totalAmount}</Text>
        </View>

        {/* -------------------- DATE PICKER -------------------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Select Date</Text>

          <View style={styles.dateRow}>
            {[0, 1, 2].map(i => {
              const date = new Date(Date.now() + i * 86400000);
              const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day After';

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dateBox,
                    selectedDate === i && styles.dateActive,
                  ]}
                  onPress={() => setSelectedDate(i)}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      selectedDate === i && styles.activeText,
                    ]}
                  >
                    {label}
                  </Text>

                  <Text
                    style={[
                      styles.dateNum,
                      selectedDate === i && styles.activeText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* -------------------- QUEUE INFO -------------------- */}
        <View style={styles.queueBox}>
          <Ionicons name="people-outline" size={20} color="#E1B378" />
          <Text style={styles.queueText}>
            Estimated people ahead in queue:{' '}
            <Text style={styles.bold}>{queuePosition}</Text>
          </Text>
        </View>
      </ScrollView>

      {/* -------------------- CONFIRM BUTTON -------------------- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingSchedule;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  card: {
    backgroundColor: '#1E1E1E',
    margin: 16,
    padding: 16,
    borderRadius: 18,
  },

  section: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  summaryText: {
    color: '#AAA',
    marginBottom: 6,
  },

  bold: {
    color: '#fff',
    fontWeight: '600',
  },

  totalText: {
    color: '#E1B378',
    fontWeight: '700',
    marginTop: 8,
    fontSize: 16,
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBox: {
    width: 90,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateActive: {
    backgroundColor: '#E1B378',
  },
  dateDay: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 4,
  },
  dateNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  activeText: {
    color: '#000',
  },

  queueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
  },
  queueText: {
    color: '#AAA',
    marginLeft: 10,
    fontSize: 13,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#121212',
  },
  confirmBtn: {
    backgroundColor: '#E1B378',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
