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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { communication, getServerUrl } from '../services/communication';

const ServicesScreen = () => {
  const [salonList, setSalonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [filter, setFilter] = useState('all');

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

  useEffect(() => {
    if (!userId) return;
    let socket = null;
    try {
      socket = io(getServerUrl(), { transports: ['websocket'] });
      socket.on('connect', () => {
        console.log('Socket connected in ServicesScreen:', socket.id);
        socket.emit('join_user', String(userId));
      });
      const handleUserBookingUpdate = (data) => {
        console.log('Received personal booking update:', data);
        fetchBookings(userId, 1);
      };
      socket.on('booking_status_updated', handleUserBookingUpdate);
    } catch (err) {
      console.log('Socket connection error:', err);
    }
    return () => { if (socket) socket.disconnect(); };
  }, [userId]);

  const fetchBookings = async (id, pageNo = 1, loadMore = false) => {
    try {
      loadMore ? setLoadingMore(true) : setLoading(true);
      const response = await communication.bookedSalonList({ userId: id, page: pageNo, searchString: '' });
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
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive',
        onPress: async () => {
          try {
            setCancellingId(bookingRequestId);
            setSalonList(prev => prev.filter(item => item.bookingId !== bookingRequestId));
            const response = await communication.bookingRequestCancel(bookingRequestId);
            if (response?.status !== 'SUCCESS') fetchBookings(userId, 1);
          } catch (e) {
            Alert.alert('Error', e.message);
            fetchBookings(userId, 1);
          } finally { setCancellingId(null); }
        },
      },
    ]);
  };

  useEffect(() => { getUserInfo(); }, []);
  useEffect(() => { if (userId) fetchBookings(userId, 1); }, [userId]);

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore || !userId || salonList.length === 0) return;
    fetchBookings(userId, page + 1, true);
  };
  const onRefresh = () => {
    if (!userId) { setRefreshing(false); return; }
    setRefreshing(true); setPage(1); fetchBookings(userId, 1);
  };

  // ── Web parity: getBookingStatus + colors/labels ──
  const getBookingStatus = (item) => {
    const passed = (() => {
      if (!item?.bookingDate) return false;
      try {
        const raw = typeof item.bookingDate === 'string' ? item.bookingDate.split('T')[0] : new Date(item.bookingDate).toISOString().split('T')[0];
        const [y,m,d] = raw.split('-').map(Number);
        let h=0, mm=0;
        if (item.bookingTime) { const p=item.bookingTime.trim().split(':'); h=parseInt(p[0],10)||0; mm=parseInt(p[1],10)||0; }
        return Date.now() >= new Date(y,m-1,d,h,mm,0).getTime();
      } catch { return false; }
    })();
    const key = passed ? 'completed' : String(item?.status || 'pending').toLowerCase();
    const label = key === 'confirmed' ? 'Confirmed' : key === 'completed' ? 'Completed' : key === 'cancelled' ? 'Cancelled' : 'Waiting for salon';
    return { key, label };
  };

  const STATUS_PILL = {
    pending: { bg: 'rgba(232,185,126,.11)', color: '#E8B97E' },
    confirmed: { bg: 'rgba(110,209,158,.11)', color: '#6ED19E' },
    completed: { bg: 'rgba(232,185,126,.09)', color: '#D5B485' },
    cancelled: { bg: 'rgba(242,123,116,.10)', color: '#F27B74' },
  };

  const allCount = salonList.length;
  const waitingCount = salonList.filter(i => getBookingStatus(i).key === 'pending').length;
  const filtered = salonList.filter(item => filter === 'all' || getBookingStatus(item).key === filter);

  const renderItem = ({ item }) => {
    const formatMonth = (d) => !d ? '' : new Date(d).toLocaleDateString('en-IN', { month: 'short' });
    const formatDay = (d) => !d ? '' : String(new Date(d).getDate());
    const formatWeekday = (d) => !d ? '' : new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });
    const formatTime = (t) => {
      if (!t) return '';
      const [h,m] = t.split(':'); const dt=new Date(); dt.setHours(Number(h),Number(m));
      return dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
    };

    const status = getBookingStatus(item);
    const pill = STATUS_PILL[status.key] || STATUS_PILL.pending;

    const salonDisplayName = item.salonName || item.salon?.salonName || item.salon?.name || item.salonDetails?.salonName || item.salonDetails?.name || item.salonData?.salonName || item.salonInfo?.salonName || item.shopName || '';
    const salonDisplayCity = item.salonCity || item.salon?.city || item.salon?.salonCity || item.salonDetails?.city || item.city || '';

    const isPending = status.key === 'pending';
    const canCancel = !['completed','cancelled'].includes(status.key);

    // Calendar rail: month uppercase, day number, weekday
    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingCalendar}>
          <Text allowFontScaling={false} style={styles.calMonth}>{formatMonth(item.bookingDate).toUpperCase()}</Text>
          <Text allowFontScaling={false} style={styles.calDay}>{formatDay(item.bookingDate)}</Text>
          <Text allowFontScaling={false} style={styles.calWeek}>{formatWeekday(item.bookingDate)}</Text>
        </View>
        <View style={styles.bookingMain}>
          <View style={styles.titleRow}>
            <View style={{ flex:1, minWidth:0 }}>
              <Text allowFontScaling={false} style={styles.bookingLabel}>APPOINTMENT</Text>
              <Text allowFontScaling={false} style={styles.salonName} numberOfLines={1}>{salonDisplayName || 'My Naai salon'}</Text>
              <Text allowFontScaling={false} style={styles.salonCity} numberOfLines={1}>{salonDisplayCity || 'Nearby'}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: pill.color }]} />
              <Text allowFontScaling={false} style={[styles.statusText, { color: pill.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={14} color="#E8B97E" />
              <Text allowFontScaling={false} style={styles.detailText} numberOfLines={1}>{item.barberName || 'Any specialist'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="cut-outline" size={14} color="#E8B97E" />
              <Text allowFontScaling={false} style={styles.detailText} numberOfLines={1}>{item.serviceName || item.services || 'Salon service'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#E8B97E" />
              <Text allowFontScaling={false} style={styles.detailText} numberOfLines={1}>{formatTime(item.bookingTime)}</Text>
            </View>
          </View>

          {isPending && (
            <View style={styles.waitingNote}>
              <Ionicons name="time-outline" size={13} color="#E8B97E" />
              <Text allowFontScaling={false} style={styles.waitingNoteText}>Sent to the salon — waiting for their action. We will alert you when they respond.</Text>
            </View>
          )}

          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelBooking(item.bookingId)} disabled={cancellingId === item.bookingId} hitSlop={{ top:12,bottom:12,left:10,right:10 }}>
              {cancellingId === item.bookingId ? <ActivityIndicator size="small" color="#F27B74" /> : (
                <>
                  <Ionicons name="close" size={14} color="#F27B74" />
                  <Text allowFontScaling={false} style={styles.cancelText}>Cancel booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={60} color="#E8B97E" />
      <Text allowFontScaling={false} style={styles.emptyTitle}>No bookings yet</Text>
      <Text allowFontScaling={false} style={styles.emptyText}>Your next good hair day is only a few taps away.</Text>
    </View>
  );
  const Skeleton = () => <View style={styles.skeletonCard} />;

  const tabs = [
    { id:'all', label:'All', count: allCount },
    { id:'confirmed', label:'Confirmed' },
    { id:'pending', label:'Pending' },
    { id:'completed', label:'Completed' },
  ];

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text allowFontScaling={false} style={styles.title}>My bookings</Text>
          <Text allowFontScaling={false} style={styles.subtitle}>Keep every appointment in view.</Text>
        </View>

        {/* Tabs — web .booking-tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsWrap}>
          {tabs.map(t => (
            <TouchableOpacity key={t.id} style={[styles.tab, filter===t.id && styles.tabActive]} onPress={()=>setFilter(t.id)}>
              <Text allowFontScaling={false} style={[styles.tabText, filter===t.id && styles.tabTextActive]}>{t.label}{t.id==='all' ? `  ${t.count}` : ''}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!loading && waitingCount > 0 && (
          <View style={styles.waitingBanner}>
            <Ionicons name="time-outline" size={16} color="#E8B97E" style={{ marginTop:1 }} />
            <View style={{ flex:1 }}>
              <Text allowFontScaling={false} style={styles.waitingBannerTitle}>Waiting for the salon to accept.</Text>
              <Text allowFontScaling={false} style={styles.waitingBannerText}>{waitingCount===1 ? 'Your booking request has been sent' : `${waitingCount} booking requests have been sent`} — the salon will accept it or suggest another time, and you will get an alert either way.</Text>
            </View>
          </View>
        )}

        {loading ? (
          <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item,index)=> `${item.bookingId || item.id}-${index}`}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8B97E" />}
            ListEmptyComponent={<EmptyState />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#E8B97E" style={{ marginVertical:20 }} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'#080A0A' },
  container: { flex:1, paddingHorizontal:14, paddingTop:10 },
  header: { marginBottom: 2 },
  title: { color:'#fff', fontSize:22, fontWeight:'700', letterSpacing:-0.3 },
  subtitle: { color:'#899191', fontSize:11.5, marginTop:2 },
  tabsWrap: { flexGrow:0, flexShrink:0, marginTop:14, marginBottom:12 },
  tabs: { gap:6, paddingBottom:4 },
  tab: { minHeight:32, paddingHorizontal:11, borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:20, backgroundColor:'#171B1B', justifyContent:'center', alignItems:'center' },
  tabActive: { backgroundColor:'#E8B97E', borderColor:'#E8B97E' },
  tabText: { color:'#B7BEBE', fontSize:10, fontWeight:'700' },
  tabTextActive: { color:'#111' },

  waitingBanner: { flexDirection:'row', alignItems:'flex-start', gap:10, marginBottom:14, padding:12, borderWidth:1, borderColor:'rgba(232,185,126,.34)', borderRadius:14, backgroundColor:'rgba(232,185,126,.08)' },
  waitingBannerTitle: { color:'#fff', fontSize:12.5, fontWeight:'700' },
  waitingBannerText: { color:'#D8DFDE', fontSize:11.5, lineHeight:17, marginTop:2 },

  // Card — web .booking-card 143px min, radius 18, line border, bg card
  bookingCard: { flexDirection:'row', minHeight:143, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:18, backgroundColor:'#171B1B', marginBottom:12 },
  bookingCalendar: { width:61, flexShrink:0, flexDirection:'column', alignItems:'center', justifyContent:'center', borderRightWidth:1, borderColor:'rgba(255,255,255,0.08)', backgroundColor:'rgba(232,185,126,0.045)', paddingVertical:10 },
  calMonth: { color:'#E8B97E', fontSize:10, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.3 },
  calDay: { color:'#fff', fontSize:26, fontWeight:'700', lineHeight:28, marginTop:4, marginBottom:2 },
  calWeek: { color:'#899191', fontSize:10, fontWeight:'500' },
  bookingMain: { flex:1, minWidth:0, padding:14 },
  titleRow: { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', gap:8 },
  bookingLabel: { color:'#E8B97E', fontSize:8, fontWeight:'700', letterSpacing:1.1 },
  salonName: { color:'#fff', fontSize:15, fontWeight:'700', marginTop:5, marginBottom:2 },
  salonCity: { color:'#899191', fontSize:11 },
  statusPill: { flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:9, paddingVertical:6, borderRadius:20 },
  statusDot: { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:10, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.5 },
  detailsGrid: { gap:5, marginTop:12 },
  detailRow: { flexDirection:'row', alignItems:'center', gap:6, minWidth:0 },
  detailText: { flex:1, color:'#B7BEBE', fontSize:11, fontWeight:'500' },
  waitingNote: { flexDirection:'row', alignItems:'center', gap:6, marginTop:9 },
  waitingNoteText: { flex:1, color:'#E8B97E', fontSize:10.5, lineHeight:15 },
  cancelBtn: { flexDirection:'row', alignItems:'center', gap:5, marginTop:12, alignSelf:'flex-start' },
  cancelText: { color:'#F27B74', fontSize:10, fontWeight:'700' },

  empty: { alignItems:'center', justifyContent:'center', marginTop:60, paddingHorizontal:20 },
  emptyTitle: { color:'#fff', fontSize:16, fontWeight:'700', marginTop:12 },
  emptyText: { color:'#899191', fontSize:12, marginTop:7, textAlign:'center', lineHeight:16 },
  skeletonCard: { height:135, backgroundColor:'#1C2121', borderRadius:18, marginBottom:12, opacity:0.6 },
});
