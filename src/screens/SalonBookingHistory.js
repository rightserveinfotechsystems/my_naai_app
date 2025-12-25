import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

/* -------------------- CUSTOMER BOOKING DATA -------------------- */
/* Use YYYY-MM-DD format for date filtering */

const CUSTOMER_BOOKINGS = [
  {
    id: '1',
    customerName: 'Brett Gomez',
    barberName: 'Rahul',
    mobile: '9876543210',
    services: 'Haircut, Beard',
    date: '2025-12-20',
    time: '11:30 AM',
    status: 'Completed',
  },
  {
    id: '2',
    customerName: 'Salman Khan',
    barberName: 'Ritik',
    mobile: '9123456789',
    services: 'Hair Spa',
    date: '2025-12-19',
    time: '4:00 PM',
    status: 'Completed',
  },
  {
    id: '3',
    customerName: 'Shahrukh Khan',
    barberName: 'Rajwal',
    mobile: '9988776655',
    services: 'Haircut',
    date: '2025-12-10',
    time: '1:00 PM',
    status: 'Completed',
  },
];

/* -------------------- LAST 7 DAYS FILTER -------------------- */

const isWithinLast7Days = (dateStr) => {
  const bookingDate = new Date(dateStr);
  const today = new Date();
  const diffTime = today - bookingDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
};

const WEEKLY_CUSTOMERS = CUSTOMER_BOOKINGS.filter(item =>
  isWithinLast7Days(item.date),
);

/* -------------------- SCREEN -------------------- */

const CustomerBookingHistory = () => {
  const renderItem = ({ item }) => {
    const statusColor =
      item.status === 'Completed'
        ? '#4CAF50'
        : item.status === 'Cancelled'
          ? '#E53935'
          : '#E8B97E';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>

          {/* LEFT INFO */}
          <View style={styles.infoLeft}>
            <Text style={styles.name}>{item.customerName}</Text>
            <Text style={styles.barber}>✂️ Barber: {item.barberName}</Text>

            {/* MOBILE NUMBER (CLICKABLE) */}
            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(`tel:${item.mobile}`)}
            >
              <Ionicons name="call-outline" size={14} color="#E8B97E" />
              <Text
                style={[
                  styles.subText,
                  { textDecorationLine: 'underline' },
                ]}
              >
                {item.mobile}
              </Text>
            </TouchableOpacity>

            {/* SERVICES */}
            <View style={styles.row}>
              <Ionicons name="cut-outline" size={14} color="#E8B97E" />
              <Text style={styles.subText}>{item.services}</Text>
            </View>

            {/* DATE & TIME */}
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={14} color="#E8B97E" />
              <Text style={styles.subText}>
                {item.date} • {item.time}
              </Text>
            </View>
          </View>

          {/* RIGHT STATUS */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>

        </View>
      </View>
    );
  };



  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>
            Customer History (Last 7 Days)
          </Text>

          {WEEKLY_CUSTOMERS.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#777" />
              <Text style={styles.emptyText}>
                No customers in the last 7 days
              </Text>
            </View>
          ) : (
            <FlatList
              data={WEEKLY_CUSTOMERS}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            />
          )}
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default CustomerBookingHistory;

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },

  container: {
    flex: 1,
    paddingHorizontal: 14,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 10,
  },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 14,
  },

  info: {
    padding: 14,
  },

  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  subText: {
    color: '#AAA',
    fontSize: 13,
    marginLeft: 8,
  },

  statusBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },

  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },

  emptyText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },

  infoLeft: {
    flex: 1,
    paddingRight: 10,
  },

  barber: {
    color: '#E8B97E',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },

});
