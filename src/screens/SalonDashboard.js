import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
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


const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SalonDashboard = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [salonId, setSalonId] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ---------------- GET USER INFO ---------------- */
  const userByIdInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      const parsedUser = JSON.parse(userData);
      setSalonId(parsedUser?.salon?.salonId);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch user info');
    }
  };

  /* ---------------- GET CUSTOMER LIST ---------------- */
  const getCustomerList = async (pageNo = 1, loadMore = false) => {
    if (loadingMore || (loadMore && !hasMore)) return;

    loadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const response = await communication.customerList({
        salonId,
        page: pageNo,
      });

      if (response?.status === 'SUCCESS') {
        const newData = response?.data || [];
        const pagination = response?.pagination || {};

        setCustomers(prev => {
          const merged = loadMore ? [...prev, ...newData] : newData;

          const uniqueMap = new Map();
          merged.forEach(item => {
            uniqueMap.set(item.bookingId, item);
          });

          return Array.from(uniqueMap.values());
        });


        setPage(pagination.page);
        setHasMore(pagination.page < pagination.totalPages);
      } else {
        if (!loadMore) setCustomers([]);
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


  /* ---------------- Service done api  ---------------- */


  const handleBookingDone = (bookingId) => {
    Alert.alert(
      'Confirm Service',
      'Are you sure you want to mark this service as completed?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Done',
          style: 'destructive',
          onPress: async () => {
            try {
              const payload = {
                salonId,
                bookingId,
              };

              const response = await communication.bookingDone(payload);

              if (response?.status === 'SUCCESS') {
                Alert.alert('Success', 'Service completed successfully');

                // 🔔 Auto refresh queue after done
                // getCustomerList(1);
                getCustomerList(1, false);

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
      ],
      { cancelable: true }
    );
  };

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    userByIdInfo();
  }, []);

  useEffect(() => {
    if (salonId) {
      getCustomerList();
    }
  }, [salonId]);

  /* ---------------- REFRESH ---------------- */
  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    getCustomerList(1, false); // page 1, replace data
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

          {item?.userPhone && (
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

  /* ---------------- EMPTY STATE ---------------- */
  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="people-outline" size={60} color="#666" />
      <Text style={styles.emptyText}>No customers in queue</Text>
    </View>
  );

  /* ---------------- SKELETON ---------------- */
  // const Skeleton = () => <View style={styles.skeletonCard} />;

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Black Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* 🔝 Top Right Actions */}
          <View style={styles.topBar}>
            <Text style={styles.title}>Customer Queue</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('AddOfflineCustomer', { salonId })}
              >
                <Ionicons name="add" size={22} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTENT */}
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
              data={customers}
              keyExtractor={(item, index) => `${item.bookingId || index}`}
              renderItem={renderSalon}
              showsVerticalScrollIndicator={false}
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
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
  },
  iconBtn: {
    backgroundColor: '#E1B378',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

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

  skeletonCard: {
    height: 90,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    marginBottom: 16,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 2,
  },
});
