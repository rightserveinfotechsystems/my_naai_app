import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../services/communication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const ServicesScreen = () => {
  const [salonList, setSalonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const isFocused = useIsFocused();

  /* ---------------- USER INFO ---------------- */
  const getUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      console.log("userData", userData);

      const parsed = JSON.parse(userData);
      const id = parsed?.userId;

      if (!id) return;

      setUserId(id);

    } catch {
      Alert.alert('Error', 'Unable to load user');
    }
  };

  /* ---------------- API CALL ---------------- */
  const fetchBookings = async (id, pageNo = 1, loadMore = false) => {
    try {
      loadMore ? setLoadingMore(true) : setLoading(true);

      const response = await communication.bookedSalonList({
        userId: id,
        page: pageNo,
        searchString: '',
      });

      console.log("response bookedSalonList ", response);

      if (response?.status === 'SUCCESS') {
        const data = response.data || [];

        console.log("booked response", data);



        setSalonList(prev =>
          loadMore ? [...prev, ...data] : data
        );

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

              // ✅ Optimistic remove
              setSalonList(prev =>
                prev.filter(item => item.bookingRequestId !== bookingRequestId)
              );

              const response = await communication.bookingRequestCancel(bookingRequestId);

              if (response?.status === "SUCCESS") {
                console.log("Success", "Booking cancelled");

              } else {
                console.log("Error", "Unable to cancel booking");

                fetchBookings(userId, 1);
              }

            } catch (e) {
              Alert.alert("Error", e.message);

              // ❗ rollback on error
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


  /* ---------------- LOAD MORE ---------------- */
  const handleLoadMore = () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      !userId ||
      salonList.length === 0
    ) {
      return;
    }

    fetchBookings(userId, page + 1, true);
  };


  /* ---------------- REFRESH ---------------- */
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
    completed: '#f2ff00',
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
    console.log("gghitem", item);

    // const btnColor =
    //   item.status === 'pending'
    //     ? '#E1B378'
    //     : item.status === 'completed'
    //       ? '#4CAF50'
    //       : '#E53935';
    const btnColor = STATUS_COLORS[item.status?.toLowerCase()] || '#9E9E9E';

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



    return (
      <View style={styles.card}>
        {/* <Image
          source={
            item.imageUrl
              ? { uri: item.imageUrl }
              : require('../assets/naai/naai1.jpg')
          }
          style={styles.image}
        /> */}

        <View style={styles.infoContainer}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.salonName}</Text>
            <Text style={styles.address}>{item.salonCity}</Text>

            <View style={styles.barberRow}>
              <Ionicons name="person-outline" size={14} color="#aaa" />
              <Text style={styles.barberText}>
                Barber: {item.barberName || 'N/A'}
              </Text>
            </View>
            <View style={styles.barberRow}>
              <Ionicons name="cut-outline" size={14} color="#aaa" />
              <Text style={styles.barberText}>
                Service: {item.serviceName || 'N/A'}
              </Text>
            </View>

            {/* <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#E1B378" />
              <Text style={styles.dateText}>
                {item.bookingDate} • {item.bookingTime}
              </Text>
            </View> */}

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#E1B378" />
              <Text style={styles.dateText}>
                {formatDateReadable(item.bookingDate)}
                {/* • {formatTime(item.bookingTime)} */}
              </Text>
              {/* {item.queueNumber && (
                <View style={[styles.dateRow, { marginLeft: 4 }]}>
                  <Ionicons name="time-outline" size={14} color="#E1B378" />
                  <Text style={styles.dateText}>
                    Queue:{item.queueNumber} People
                  </Text>
                </View>
              )} */}
              {/* <View style={styles.dateRow}> */}
              {/* <Text style={styles.dateText}>
                ,Token Number: {item.queueNumber}
              </Text> */}
              {/* </View> */}


            </View>
            {/* {item.status === "pending" &&
              <View style={styles.dateRow}>
                <Ionicons name="time-outline" size={14} color="#E1B378" />
                <Text style={styles.dateText}>
                  Waiting Time: {item?.waitingTimeDisplay}
                </Text>
              </View>} */}


          </View>


          <View style={styles.rightSection}>
            {/* STATUS BADGE */}
            <View style={[styles.statusBadge, { backgroundColor: btnColor }]}>
              <Text style={styles.statusBadgeText}>
                {STATUS_LABELS[item.status?.toLowerCase()] || "Unknown"}
              </Text>
            </View>

            {/* CANCEL BUTTON */}
            {["pending", "confirmed"].includes(
              item.status?.toLowerCase()
            ) && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelBooking(item.bookingRequestId)}
                  disabled={cancellingId === item.bookingRequestId}
                >
                  {cancellingId === item.bookingRequestId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="close-circle-outline" size={14} color="#fff" />
                      <Text style={[styles.cancelBtnText, { marginLeft: 4 }]}>
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

  /* ---------------- EMPTY STATE ---------------- */
  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={60} color="#555" />
      <Text style={styles.emptyText}>No bookings found</Text>
    </View>
  );

  /* ---------------- SKELETON ---------------- */
  const Skeleton = () => (
    <View style={styles.skeletonCard} />
  );

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>My Bookings</Text>

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
              keyExtractor={(item, index) =>
                `${item.bookingId || item.id}-${index}`
              }

              // keyExtractor={(item, index) =>
              //   item.bookingId?.toString() || index.toString()
              // }
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

export default ServicesScreen;



const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
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
  image: {
    width: 100,
    height: '100%',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
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
  statusBtn: {
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },

  statusBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#E53935',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    minWidth: 80,
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },


});
