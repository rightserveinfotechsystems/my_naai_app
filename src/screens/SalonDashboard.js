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

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SalonDashboard = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
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

  /* ---------------- CUSTOMER LIST ---------------- */
  const getCustomerList = async (pageNo = 1, loadMore = false) => {
    if (loadingMore || (loadMore && !hasMore)) return;

    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const response = await communication.customerList({
        salonId,
        page: pageNo,
      });
      console.log("customerList", response?.data);


      if (response?.status === 'SUCCESS') {
        const newData = response?.data || [];
        const pagination = response?.pagination || {};

        setCustomers(prev => {
          const merged = loadMore ? [...prev, ...newData] : newData;
          const uniqueMap = new Map();
          merged.forEach(item => uniqueMap.set(item.bookingId, item));
          return Array.from(uniqueMap.values());
        });

        setPage(pagination.page);
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        setCustomers([]);
        setHasMore(false);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to fetch customers'
      );
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
              const response = await communication.bookingDone({
                salonId,
                bookingId,
              });

              if (response?.status === 'SUCCESS') {
                Alert.alert('Success', 'Service completed successfully');
                getCustomerList(1, false);
                fetchNotificationCount();
              } else {
                Alert.alert('Error', 'Unable to complete service');
              }
            } catch (error) {
              Alert.alert(
                'Error',
                error?.response?.data?.message || 'Something went wrong'
              );
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

  /* 🔥 REFRESH COUNT WHEN SCREEN FOCUSED */
  useFocusEffect(
    useCallback(() => {
      if (salonId) {
        fetchNotificationCount();
      }
    }, [salonId, fetchNotificationCount])
  );

  /* ---------------- REFRESH ---------------- */
  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    getCustomerList(1, false);
    fetchNotificationCount();
  };

  /* ---------------- LOAD MORE ---------------- */
  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      getCustomerList(page + 1, true);
    }
  };

  /* ---------------- RENDER ITEM ---------------- */
  const renderSalon = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.infoRow}>
        <View style={styles.infoLeft}>
          <Text style={styles.name}>{item?.userName || 'Guest'}</Text>
          {item?.barberName && (
            <View style={styles.row}>
              <Ionicons name="person-outline" size={14} color="#E8B97E" />
              <Text style={styles.barber}>
                Barber: {item?.barberName}
              </Text>
            </View>

          )}
          {item?.userPhone && (
            <View style={styles.row}>
              <Ionicons name="call-outline" size={14} color="#E8B97E" />
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${item.userPhone}`)}
              >
                <Text style={styles.subText}>{item.userPhone}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.row}>
            <Ionicons name="cut-outline" size={14} color="#E8B97E" />
            <Text style={styles.subText}>{item?.serviceNames}</Text>
          </View>

          {item?.barber && (
            <Text style={styles.subText}>👤 {item.barber.fullName}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => handleBookingDone(item.bookingId)}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="people-outline" size={60} color="#666" />
      <Text style={styles.emptyText}>No customers in queue</Text>
    </View>
  );

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <Text style={styles.title}>Customer Queue</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  navigation.navigate('AddOfflineCustomer', { salonId })
                }
              >
                <Ionicons name="add" size={22} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  navigation.navigate('SalonNotifications', {
                    salonId,
                    onReadComplete: fetchNotificationCount, // ✅ FIX
                  })
                }
              >
                <Ionicons name="notifications-outline" size={20} color="#000" />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <>
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </>
          ) : (
            <FlatList
              data={customers}
              keyExtractor={item => item.bookingId.toString()}
              renderItem={renderSalon}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#E1B378"
                />
              }
              ListEmptyComponent={<EmptyState />}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore && (
                  <ActivityIndicator
                    size="small"
                    color="#E1B378"
                    style={{ marginVertical: 20 }}
                  />
                )
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

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },

  actions: { flexDirection: 'row' },
  iconBtn: {
    backgroundColor: '#E1B378',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', padding: 12 },
  infoLeft: { flex: 1 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subText: { color: '#AAA', fontSize: 13, marginLeft: 8 },

  doneBtn: {
    backgroundColor: '#E1B378',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  doneText: { color: '#000', fontSize: 12, fontWeight: '600' },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#777', marginTop: 10 },

  row: { flexDirection: 'row', alignItems: 'center' },
  barber: {
    color: '#E8B97E',
    fontSize: 13,
    // marginBottom: 6,
    fontWeight: '600',
    textTransform: "capitalize",
    marginLeft: 8,
  },
});
