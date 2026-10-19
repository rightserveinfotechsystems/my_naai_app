import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getOrderStatus, readOrders, formatEta } from '../../shop/shopOrders';
import { fetchAllServerOrders } from '../../shop/shopSync';
import { EmptyState } from '../../shop/ShopComponents';
import { BLINKIT } from '../../shop/shopTheme';
import { getShopOwnerId, formatCurrency } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

function mergeOrders(local, server) {
  const byId = new Map();
  (local||[]).forEach(o=>{ if (o?.id) byId.set(o.id, o); });
  (server||[]).forEach(o=>{ if (o?.id) byId.set(o.id, o); });
  return [...byId.values()].sort((a,b)=> String(b.placedAt).localeCompare(String(a.placedAt)));
}

const ShopOrdersScreen = ({ navigation }) => {
  const [ownerId, setOwnerId] = useState('guest');
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    const id = ownerId || await getShopOwnerId();
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    try {
      const raw = await AsyncStorage.getItem(`mynaaiShopOrders:${id}`);
      const local = raw ? JSON.parse(raw) : [];
      const localOrders = Array.isArray(local) ? local.filter(o=>o?.id && o?.items?.length).sort((a,b)=>String(b.placedAt).localeCompare(String(a.placedAt))) : [];
      setOrders(localOrders);
      const server = await fetchAllServerOrders();
      if (server) {
        const merged = mergeOrders(localOrders, server);
        await AsyncStorage.setItem(`mynaaiShopOrders:${id}`, JSON.stringify(merged));
        setOrders(merged);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [ownerId]);

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
    })();
  }, []);

  useEffect(() => { if (ownerId) load(); }, [ownerId, load]);

  const buckets = useMemo(() => ({
    all: orders,
    active: orders.filter(o=> ['placed','packed','shipped'].includes(getOrderStatus(o).key)),
    delivered: orders.filter(o=> getOrderStatus(o).key==='delivered'),
    cancelled: orders.filter(o=> getOrderStatus(o).key==='cancelled'),
  }), [orders]);
  const visible = buckets[filter] || buckets.all;

  const renderItem = ({ item }) => {
    const status = getOrderStatus(item);
    const iconMap = { placed: 'cube-outline', packed: 'cube', shipped: 'car-outline', delivered: 'checkmark-circle', cancelled: 'close-circle' };
    const tone = status.key==='cancelled' ? '#ef4444' : status.key==='delivered' ? BLINKIT.green : '#f59e0b';
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ShopOrderDetail', { orderId: item.id })} activeOpacity={0.8}>
        <View style={[styles.icon, {backgroundColor: status.key==='cancelled'? '#ffebee' : status.key==='delivered'? '#e8f5e9' : '#fff8d6'}]}>
          <Ionicons name={iconMap[status.key]||'cube-outline'} size={20} color={tone} />
        </View>
        <View style={{flex:1}}>
          <View style={styles.topRow}>
            <Text style={styles.orderId}>{item.id}</Text>
            <View style={[styles.pill, {backgroundColor: tone+ '1A', borderColor: tone}]}><Text style={[styles.pillText, {color: tone}]}>{status.label}</Text></View>
          </View>
          <Text style={styles.meta}>{new Date(item.placedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})} • {item.items.reduce((s,i)=>s+i.qty,0)} {item.items.reduce((s,i)=>s+i.qty,0)===1?'item':'items'} • {formatCurrency(item.amounts.total)}</Text>
          {status.key!=='cancelled' && <View style={styles.etaRow}><Ionicons name="time-outline" size={12} color={BLINKIT.green} /><Text style={styles.etaText}>{status.key==='delivered'? 'Delivered' : `Arriving by ${formatEta(status.eta)}`}</Text></View>}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#bbb" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={20} color="#1a1a1a"/></TouchableOpacity>
        <View><Text style={styles.headerTitle}>My orders</Text><Text style={styles.headerSub}>Track and manage every Naai Shop order.</Text></View>
        <TouchableOpacity onPress={()=>load(true)} style={styles.headerBtn}><Ionicons name="refresh" size={18} color="#1a1a1a"/></TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[
          { id:'active', label:'Active', count: buckets.active.length },
          { id:'all', label:'All', count: buckets.all.length },
          { id:'delivered', label:'Delivered' },
          { id:'cancelled', label:'Cancelled' },
        ].map(t=> (
          <TouchableOpacity key={t.id} style={[styles.tab, filter===t.id && styles.tabActive]} onPress={()=>setFilter(t.id)}>
            <Text style={[styles.tabText, filter===t.id && styles.tabTextActive]}>{t.label} {t.count!==undefined ? `(${t.count})`: ''}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={BLINKIT.green} /><Text style={styles.loadingText}>Loading orders…</Text></View>
      ) : visible.length ? (
        <FlatList
          data={visible}
          renderItem={renderItem}
          keyExtractor={item=>item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={BLINKIT.green} />}
        />
      ) : (
        <EmptyState icon="cube-outline" title={filter==='active'? 'No active orders' : 'No orders here yet'} message={filter==='active'? 'Order stock for your salon and it will appear here with live status.' : 'Order stock for your salon and it will appear here.'} actionLabel="Browse the shop" onAction={()=>navigation.navigate('Shop')} />
      )}
    </SafeAreaView>
  );
};

export default ShopOrdersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLINKIT.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
  headerSub: { color: '#888', fontSize: 11, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  tabActive: { backgroundColor: BLINKIT.green, borderColor: BLINKIT.green },
  tabText: { color: '#666', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingTop: 40 },
  loadingText: { color: '#888', fontSize: 12 },
  list: { padding: 12, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#eee', padding: 12, marginBottom: 10 },
  icon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  orderId: { color: '#1a1a1a', fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  pillText: { fontSize: 10, fontWeight: '800' },
  meta: { color: '#888', fontSize: 11, marginTop: 3 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  etaText: { color: BLINKIT.green, fontSize: 10, fontWeight: '700' },
});
