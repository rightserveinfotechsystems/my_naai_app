import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../services/communication';
import Skeleton from '../utilities/Skeleton';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SalonDashboard = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [tomorrowBookings, setTomorrowBookings] = useState([]);
  const [dayAfterBookings, setDayAfterBookings] = useState([]);
  const [salonId, setSalonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  /* ---------------- USER INFO ---------------- */
  const userByIdInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      const parsedUser = JSON.parse(userData);
      setSalonId(parsedUser?.salon?.salonId);
    } catch {
      Alert.alert('Error', 'Failed to fetch user info');
    }
  };

  /* ---------------- NOTIFICATION COUNT ---------------- */
  const fetchNotificationCount = useCallback(async () => {
    if (!salonId) return;
    try {
      const response = await communication.userNotificationCount({ salonId });
      if (response?.status === 'SUCCESS') {
        setNotificationCount(response?.notification || 0);
      }
    } catch (error) {
      console.log('Notification count error', error);
    }
  }, [salonId]);

  /* ---------------- CATEGORIZE BOOKINGS ---------------- */
  const categorizeBookings = (bookings = []) => {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const dayAfter = moment().add(2, 'day').startOf('day');

    const todayBookings = [];
    const tomorrowBookings = [];
    const dayAfterBookings = [];

    bookings.forEach(booking => {
      const bookingDate = moment(booking.bookingDate, 'YYYY-MM-DD').startOf('day');
      if (bookingDate.isSame(today, 'day')) todayBookings.push(booking);
      else if (bookingDate.isSame(tomorrow, 'day')) tomorrowBookings.push(booking);
      else if (bookingDate.isSame(dayAfter, 'day')) dayAfterBookings.push(booking);
    });

    return { todayBookings, tomorrowBookings, dayAfterBookings };
  };

  /* ---------------- CUSTOMER LIST ---------------- */
  const getCustomerList = async (pageNo = 1, loadMore = false) => {
    if (loadingMore || (loadMore && !hasMore)) return;
    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const response = await communication.customerList({ salonId, page: pageNo });
      if (response?.status === 'SUCCESS') {
        const newData = response?.data || [];
        const mergedData = loadMore ? [...customers, ...newData] : newData;

        setCustomers(mergedData);

        const { todayBookings, tomorrowBookings, dayAfterBookings } = categorizeBookings(mergedData);
        setTodayBookings(todayBookings);
        setTomorrowBookings(tomorrowBookings);
        setDayAfterBookings(dayAfterBookings);

        const pagination = response?.pagination || {};
        setPage(pagination.page);
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        setCustomers([]);
        setTodayBookings([]);
        setTomorrowBookings([]);
        setDayAfterBookings([]);
        setHasMore(false);
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  /* ---------------- SERVICE DONE ---------------- */
  const handleBookingDone = bookingId => {
    Alert.alert(
      'Confirm Service',
      'Are you sure you want to mark this service as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Done',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await communication.bookingDone({ salonId, bookingId });
              if (response?.status === 'SUCCESS') {
                console.log('Success', 'Service completed successfully');
                getCustomerList(1, false);
                fetchNotificationCount();
              } else {
                console.log('Error', 'Unable to complete service');
              }
            } catch (error) {
              console.log('Error', error?.response?.data?.message || 'Something went wrong');
            }
          },
        },
      ]
    );
  };

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    userByIdInfo();
  }, []);

  useEffect(() => {
    if (!salonId) return;
    getCustomerList();
    fetchNotificationCount();
  }, [salonId, fetchNotificationCount]);

  useFocusEffect(useCallback(() => {
    if (salonId) fetchNotificationCount();
  }, [salonId, fetchNotificationCount]));

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    getCustomerList(1, false);
    fetchNotificationCount();
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) getCustomerList(page + 1, true);
  };

  const formatDateReadable = dateStr => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ---------------- RENDER SINGLE BOOKING ---------------- */
  const renderSalon = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

            <Text style={styles.name}>
              {item?.userName || 'Guest'}
            </Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => handleBookingDone(item.bookingId)}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>

          </View>


          {item?.barberName && (
            <View style={styles.row}>
              <Ionicons name="person-outline" size={14} color="#E8B97E" />
              <Text style={styles.barber}>Barber: {item?.barberName}</Text>
            </View>
          )}

          {item.userPhone !== "0000000000" && (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={14} color="#E8B97E" />
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.userPhone}`)}>
                <Text style={styles.subText}>{item.userPhone}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.row}>
            <Ionicons name="cut-outline" size={14} color="#E8B97E" />
            <Text style={styles.subText}>{item?.serviceNames}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={14} color="#E8B97E" />
            <Text style={styles.subText}>
              {formatDateReadable(item?.bookingDate)}, token: {item?.queueNumber}
            </Text>
          </View>
        </View>

        {/* <TouchableOpacity style={styles.doneBtn} onPress={() => handleBookingDone(item.bookingId)}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="people-outline" size={60} color="#666" />
      <Text style={styles.emptyText}>No customers in queue</Text>
    </View>
  );

  /* ---------------- RENDER ---------------- */
  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <Text style={styles.title}>Customer Queue</Text>
            <View style={styles.actions}>
              {/* <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AddOfflineCustomer', { salonId })}>
                <Ionicons name="add" size={22} color="#000" />
              </TouchableOpacity> */}

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  navigation.navigate('SalonNotifications', { salonId, onReadComplete: fetchNotificationCount })
                }
              >
                <Ionicons name="notifications-outline" size={20} color="#000" />
                {/* {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )} */}
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <>
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </>
          ) : (
            <FlatList
              data={[]}
              keyExtractor={(_, index) => index.toString()}
              renderItem={null}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E1B378" />}
              ListHeaderComponent={
                <>
                  {todayBookings.length > 0 && (
                    <>
                      <Text style={styles.sectionHeader}>Today</Text>
                      {todayBookings.map(item => (
                        <React.Fragment key={item.bookingId}>{renderSalon({ item })}</React.Fragment>
                      ))}
                    </>
                  )}
                  {tomorrowBookings.length > 0 && (
                    <>
                      <Text style={styles.sectionHeader}>Tomorrow</Text>
                      {tomorrowBookings.map(item => (
                        <React.Fragment key={item.bookingId}>{renderSalon({ item })}</React.Fragment>
                      ))}
                    </>
                  )}
                  {dayAfterBookings.length > 0 && (
                    <>
                      <Text style={styles.sectionHeader}>Day After Tomorrow</Text>
                      {dayAfterBookings.map(item => (
                        <React.Fragment key={item.bookingId}>{renderSalon({ item })}</React.Fragment>
                      ))}
                    </>
                  )}
                  {todayBookings.length === 0 && tomorrowBookings.length === 0 && dayAfterBookings.length === 0 && <EmptyState />}
                </>
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore && <ActivityIndicator size="small" color="#E1B378" style={{ marginVertical: 20 }} />
              }
            />
          )}
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default SalonDashboard;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  container: { flex: 1, paddingHorizontal: 14 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },

  actions: { flexDirection: 'row' },
  iconBtn: { backgroundColor: '#E1B378', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },

  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: 'red', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  card: { backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 14 },
  infoRow: { flexDirection: 'row', padding: 12 },
  infoLeft: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subText: { color: '#AAA', fontSize: 13, marginLeft: 8 },

  doneBtn: { backgroundColor: '#E1B378', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, alignSelf: 'center' },
  doneText: { color: '#000', fontSize: 12, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#777', marginTop: 10 },

  row: { flexDirection: 'row', alignItems: 'center' },
  barber: { color: '#E8B97E', fontSize: 13, fontWeight: '600', textTransform: 'capitalize', marginLeft: 8 },

  sectionHeader: { color: '#E1B378', fontSize: 18, fontWeight: '700', marginVertical: 8 },
});
