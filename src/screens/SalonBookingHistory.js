import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../services/communication';
import Skeleton from '../utilities/Skeleton';


const BG_IMAGE = require('../assets/salon_page_bg.jpg');

/* -------------------- CUSTOMER BOOKING DATA -------------------- */

const formatDateReadable = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};



const formatTime = (time) => {
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

/* -------------------- SCREEN -------------------- */
const CustomerBookingHistory = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userList, setUserList] = useState([]);


  const salonQueueHistory = async (pageNo = 1, loadMore = false) => {
    try {
      loadMore ? setLoadingMore(true) : setLoading(true);

      const response = await communication.salonQueueHistory({
        page: pageNo,
      });
      console.log("salonQueueHistory", response?.bookings);

      if (response?.status === 'SUCCESS') {
        const data = response?.bookings || [];

        setUserList(prev =>
          loadMore ? [...prev, ...data] : data
        );

        setHasMore(response.page < response.totalPages);
        setPage(pageNo);
      } else {
        if (!loadMore) setUserList([]);
        setHasMore(false);
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Failed to load booking history'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };


  useEffect(() => {
    salonQueueHistory();
  }, []);


  /* ---------------- LOAD MORE ---------------- */
  const handleLoadMore = () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      userList.length === 0
    ) {
      return;
    }

    salonQueueHistory(page + 1, true);
  };


  /* ---------------- REFRESH ---------------- */
  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    salonQueueHistory();
  };



  const renderItem = ({ item }) => {
    // const statusColor = '#4CAF50'; 

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>

          {/* LEFT INFO */}
          <View style={styles.infoLeft}>
            <Text allowFontScaling={false}style={styles.name}>
              {item.userName || 'Guest'}
            </Text>

            {item?.barberName && (
              <View style={styles.row}>
                <Ionicons name="person-outline" size={14} color="#E8B97E" />
                <Text allowFontScaling={false}style={styles.barber}>
                  Barber: {item?.barberName}
                </Text>
              </View>

            )}

            {/* MOBILE */}
            {item.userPhone !== "0000000000" && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => Linking.openURL(`tel:${item.userPhone}`)}
              >
                <Ionicons name="call-outline" size={14} color="#E8B97E" />
                <Text allowFontScaling={false}style={styles.subText}>
                  {item.userPhone}
                </Text>
              </TouchableOpacity>
            )}

            {/* SERVICES */}
            {item.services ? (
              <View style={styles.row}>
                <Ionicons name="cut-outline" size={14} color="#E8B97E" />
                <Text allowFontScaling={false}style={styles.subText}>{item.services}</Text>
              </View>
            ) : null}

            {/* DATE & TIME */}
            <View style={styles.row}>
              <Ionicons name="calendar-outline" size={14} color="#E8B97E" />
              <Text allowFontScaling={false}style={styles.subText}>
                {formatDateReadable(item.bookingDate)}
                {/* {item.bookingTime ? ` • ${formatTime(item.bookingTime)}` : ''} */}
              </Text>
            </View>
          </View>

          {/* STATUS */}
          {/* <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text allowFontScaling={false}style={styles.statusText}>COMPLETED</Text>
          </View> */}

        </View>
      </View>
    );
  };


  /* ---------------- EMPTY STATE ---------------- */
  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={60} color="#555" />
      <Text allowFontScaling={false}style={styles.emptyText}>No bookings found</Text>
    </View>
  );

  /* ---------------- SKELETON ---------------- */
  // const Skeleton = () => (
  //   <View style={styles.skeletonCard} />
  // );

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <Text allowFontScaling={false}style={styles.title}>
            Customer history
          </Text>

          {/* {WEEKLY_CUSTOMERS.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#777" />
              <Text allowFontScaling={false}style={styles.emptyText}>
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
          )} */}
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
              data={userList}
              // keyExtractor={(item) => item.bookingId}
              keyExtractor={(item, index) =>
                `${item.bookingId}-${index}`
              }

              renderItem={renderItem}
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
              showsVerticalScrollIndicator={false}
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
    textTransform: "capitalize",
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
    // marginBottom: 6,
    fontWeight: '600',
    textTransform: "capitalize",
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#777',
    fontSize: 14,
    marginTop: 10,
  },

  skeletonCard: {
    height: 110,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    marginBottom: 16,
    opacity: 0.6,
  },

});
