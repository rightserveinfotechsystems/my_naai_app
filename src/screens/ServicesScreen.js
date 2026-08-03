import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client'; // 👈 Import Socket.io Client
import { communication, getServerUrl } from '../services/communication'; // 👈 Import getServerUrl

const ServicesScreen = () => {
  const [salonList, setSalonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  /* ---------------- USER INFO ---------------- */
  const getUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      const parsed = JSON.parse(userData);
      const id = parsed?.userId;

      if (id) setUserId(id);
    } catch {
      Alert.alert('Error', 'Unable to load user');
    }
  };


/* ---------------- 🎯 DIRECT USER SOCKET CONNECTION ---------------- */
  useEffect(() => {
    if (!userId) return;

    let socket = null;

    try {
      socket = io(getServerUrl(), {
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('🟢 Socket connected in ServicesScreen:', socket.id);
        
        // 🎯 EMIT join_user so server puts this client into `user_${userId}` room
        socket.emit('join_user', String(userId));
      });

      // Targeted callback to handle booking updates
      const handleUserBookingUpdate = (data) => {
        console.log('⚡ Received personal booking update on socket:', data);
        fetchBookings(userId, 1);
      };

      // Listen for updates targeted at this user
      socket.on('booking_status_updated', handleUserBookingUpdate);
      

    } catch (err) {
      console.log('Socket connection error in ServicesScreen:', err);
    }

    return () => {
      if (socket) {
        console.log('🔴 Disconnecting socket from ServicesScreen');
        socket.disconnect();
      }
    };
  }, [userId]);

  /* ---------------- API CALL ---------------- */
  const fetchBookings = async (id, pageNo = 1, loadMore = false) => {
    try {
      loadMore ? setLoadingMore(true) : setLoading(true);

      const response = await communication.bookedSalonList({
        userId: id,
        page: pageNo,
        searchString: '',
      });

      if (response?.status === 'SUCCESS') {
        const data = response.data || [];

        setSalonList(prev => (loadMore ? [...prev, ...data] : data));
        setHasMore(data.length >= 10);
        setPage(pageNo);
      } else {
        if (!loadMore) setSalonList([]);
        setHasMore(false);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleCancelBooking = (bookingRequestId) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setCancellingId(bookingRequestId);

              // Optimistic remove
              setSalonList(prev =>
                prev.filter(item => item.bookingId !== bookingRequestId)
              );

              const response = await communication.bookingRequestCancel(bookingRequestId);

              if (response?.status !== "SUCCESS") {
                fetchBookings(userId, 1);
              }
            } catch (e) {
              Alert.alert("Error", e.message);
              fetchBookings(userId, 1);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchBookings(userId, 1);
    }
  }, [userId]);

  /* ---------------- LOAD MORE & REFRESH ---------------- */
  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore || !userId || salonList.length === 0) return;
    fetchBookings(userId, page + 1, true);
  };

  const onRefresh = () => {
    if (!userId) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    setPage(1);
    fetchBookings(userId, 1);
  };

  const STATUS_COLORS = {
    pending: '#E1B378',
    confirmed: '#4CAF50',
    completed: '#E8B97E',
    cancelled: '#E53935',
  };

  const STATUS_LABELS = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }) => {
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

    const isBookingPassed = () => {
      if (!item.bookingDate) return false;

      try {
        const rawDateStr = typeof item.bookingDate === 'string'
          ? item.bookingDate.split('T')[0]
          : new Date(item.bookingDate).toISOString().split('T')[0];

        const [year, month, day] = rawDateStr.split('-').map(Number);
        
        let hours = 0;
        let minutes = 0;

        if (item.bookingTime) {
          const timeParts = item.bookingTime.trim().split(':');
          hours = parseInt(timeParts[0], 10) || 0;
          minutes = parseInt(timeParts[1], 10) || 0;
        }

        const bookingDateTime = new Date(year, month - 1, day, hours, minutes, 0);
        return Date.now() >= bookingDateTime.getTime();
      } catch (e) {
        return false;
      }
    };

    const isExpired = isBookingPassed();
    const statusKey = isExpired ? 'completed' : item.status?.toLowerCase();
    
    const btnColor = STATUS_COLORS[statusKey] || (isExpired ? '#4CAF50' : '#9E9E9E');
    const displayStatusLabel = STATUS_LABELS[statusKey] || (isExpired ? 'Completed' : 'Unknown');

    return (
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <View style={styles.info}>
            <Text allowFontScaling={false} style={styles.name}>{item.salonName}</Text>
            <Text allowFontScaling={false} style={styles.address}>{item.salonCity}</Text>

            <View style={styles.barberRow}>
              <Ionicons name="person-outline" size={14} color="#aaa" />
              <Text allowFontScaling={false} style={styles.barberText}>
                Barber: {item.barberName || 'N/A'}
              </Text>
            </View>
            <View style={styles.barberRow}>
              <Ionicons name="cut-outline" size={14} color="#aaa" />
              <Text allowFontScaling={false} style={styles.barberText}>
                Service: {item.serviceName || 'N/A'}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#E1B378" />
              <Text allowFontScaling={false} style={styles.dateText}>
                {formatDateReadable(item.bookingDate)} - {formatTime(item.bookingTime)}
              </Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.statusBadge, { backgroundColor: btnColor }]}>
              <Text allowFontScaling={false} style={styles.statusBadgeText}>
                {displayStatusLabel}
              </Text>
            </View>

            {!isExpired && ["pending", "confirmed"].includes(item.status?.toLowerCase()) && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancelBooking(item.bookingId)}
                disabled={cancellingId === item.bookingId}
              >
                {cancellingId === item.bookingId ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={14} color="#fff" />
                    <Text allowFontScaling={false} style={[styles.cancelBtnText, { marginLeft: 4 }]}>
                      Cancel
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={60} color="#555" />
      <Text allowFontScaling={false} style={styles.emptyText}>No bookings found</Text>
    </View>
  );

  const Skeleton = () => <View style={styles.skeletonCard} />;

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.container}>
        <Text allowFontScaling={false} style={styles.title}>My Bookings</Text>

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
            data={salonList}
            keyExtractor={(item, index) => `${item.bookingId || item.id}-${index}`}
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
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.99)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: "capitalize",
  },
  address: {
    color: '#AAA',
    fontSize: 12,
    marginVertical: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    color: '#E1B378',
    fontSize: 12,
    marginLeft: 4,
  },
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  barberText: {
    color: '#bbb',
    fontSize: 12,
    marginLeft: 6,
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
  rightSection: {
    width: 110,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statusBadge: {
    width: 90,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#E53935',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});