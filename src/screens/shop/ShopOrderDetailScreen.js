import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFileUrl } from '../../services/communication';
import { getOrderStatus, formatEta, STATUS_TIMELINE, canCancelOrder, cancelOrder } from '../../shop/shopOrders';
import { BLINKIT } from '../../shop/shopTheme';
import { getShopOwnerId, formatCurrency } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchServerOrderById, cancelServerOrder } from '../../shop/shopSync';

const ShopOrderDetailScreen = ({ route, navigation }) => {
  const orderId = route.params?.orderId || '';
  const [ownerId, setOwnerId] = useState('guest');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(()=> setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const id = await getShopOwnerId();
    setOwnerId(id);
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(`mynaaiShopOrders:${id}`);
      const local = raw ? JSON.parse(raw) : [];
      const found = (local||[]).find(o=> o.id===orderId) || null;
      setOrder(found);
      const server = await fetchServerOrderById(orderId);
      if (server) {
        // upsert into local
        let orders = (local||[]).slice();
        const idx = orders.findIndex(o=>o.id===server.id);
        if (idx>=0) orders[idx]=server; else orders.unshift(server);
        await AsyncStorage.setItem(`mynaaiShopOrders:${id}`, JSON.stringify(orders));
        setOrder(server);
      }
    } catch {}
    setLoading(false);
  }, [orderId]);

  useEffect(()=>{ load(); }, [load]);

  if (loading) {
    return <SafeAreaView style={styles.loadingWrap}><ActivityIndicator color={BLINKIT.green} /><Text style={styles.loadingText}>Loading order…</Text></SafeAreaView>;
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={20} color="#1a1a1a"/></TouchableOpacity><Text style={styles.headerTitle}>Order details</Text><View style={{width:36}}/></View>
        <View style={styles.center}><Ionicons name="cube-outline" size={40} color="#ccc"/><Text style={styles.emptyTitle}>Order not found</Text><Text style={styles.emptySub}>This order may belong to a different salon account on this device.</Text><TouchableOpacity style={styles.primaryBtn} onPress={()=>navigation.goBack()}><Text style={styles.primaryBtnText}>Back to my orders</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  const status = getOrderStatus(order, now);
  const cancellable = canCancelOrder(order, now);
  const payment = order.payment || {};

  const handleCancel = async () => {
    Alert.alert('Cancel this order?', payment.method==='ONLINE' && payment.status==='PAID' ? 'The amount paid will be refunded to original source in 5–7 days.' : 'No payment will be collected. This cannot be undone once order goes out for delivery.', [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: async () => {
        setCancelling(true);
        try {
          if (order.serverStatus) {
            const accepted = await cancelServerOrder(order.id, 'Cancelled by salon from mobile app');
            if (accepted) {
              const updated = await cancelOrder(ownerId, order.id, { now, reason: 'Cancelled by salon from mobile app' });
              // also mark serverStatus cancelled locally
              if (updated) {
                const patched = { ...updated, serverStatus: 'CANCELLED' };
                // persist patched
                const raw = await AsyncStorage.getItem(`mynaaiShopOrders:${ownerId}`);
                const orders = raw ? JSON.parse(raw) : [];
                const idx = orders.findIndex(o=>o.id===patched.id);
                if (idx>=0) orders[idx]=patched;
                await AsyncStorage.setItem(`mynaaiShopOrders:${ownerId}`, JSON.stringify(orders));
                setOrder(patched);
                Alert.alert('Order cancelled', 'Your order has been cancelled.');
              }
            } else {
              await load();
              Alert.alert('Cannot cancel', 'This order can no longer be cancelled — it has already gone out for delivery. Call support if something is wrong.');
            }
          } else {
            const updated = await cancelOrder(ownerId, order.id, { now, reason: 'Cancelled by salon from mobile app' });
            if (updated?.cancelledAt) {
              setOrder(updated);
              Alert.alert('Order cancelled', 'Your order has been cancelled.');
            } else {
              Alert.alert('Cannot cancel', 'This order has already been dispatched and can no longer be cancelled. Call support if something is wrong.');
            }
          }
        } catch (e) {
          Alert.alert('Error', e?.message || 'Could not cancel this order.');
        } finally { setCancelling(false); }
      }},
    ]);
  };

  const statusColor = status.key==='cancelled' ? '#ef4444' : status.key==='delivered' ? BLINKIT.green : '#f59e0b';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={20} color="#1a1a1a"/></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Order details</Text><Text style={styles.headerSub}>Order {order.id} • {new Date(order.placedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})}</Text></View>
        <View style={{width:36}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Tracker */}
        <View style={[styles.trackerCard, status.key==='delivered' && styles.trackerDelivered, status.key==='cancelled' && styles.trackerCancelled]}>
          <View style={styles.trackerHead}>
            <View>
              <Text style={styles.trackerEyebrow}>ORDER STATUS</Text>
              <Text style={styles.trackerTitle}>{status.key==='cancelled'? 'Order cancelled' : status.label}</Text>
            </View>
            <View style={[styles.statusPill, {backgroundColor: statusColor+'14', borderColor: statusColor}]}><View style={[styles.dot, {backgroundColor: statusColor}]} /><Text style={[styles.pillText, {color: statusColor}]}>{status.label}</Text></View>
          </View>
          {status.key!=='cancelled' && status.key!=='delivered' && <View style={styles.etaBox}><Ionicons name="car-outline" size={14} color={BLINKIT.green}/><Text style={styles.etaText}>Arriving by <Text style={{fontWeight:'800'}}>{formatEta(status.eta)}</Text></Text></View>}
          {status.key==='delivered' && <View style={styles.etaBox}><Ionicons name="checkmark-circle" size={14} color={BLINKIT.green}/><Text style={styles.etaText}>Delivered — enjoy the stock at {order.salonName||'your salon'}</Text></View>}
          {status.key==='cancelled' && <View style={[styles.etaBox, {backgroundColor:'#ffebee'}]}><Text style={[styles.etaText, {color:'#d32f2f'}]}>{payment.method==='ONLINE' ? `Refund of ${formatCurrency(payment.amount)} is on the way (5–7 days).` : 'The order was cancelled before dispatch. No amount was collected.'}</Text></View>}
          {status.key!=='cancelled' && (
            <View style={styles.tracker}>
              {STATUS_TIMELINE.map((step, idx)=> (
                <View key={step.key} style={styles.step}>
                  <View style={[styles.stepDot, idx <= status.stepIndex && styles.stepDotDone, idx===status.stepIndex && styles.stepDotCurrent]} />
                  {idx < STATUS_TIMELINE.length-1 && <View style={[styles.stepLine, idx < status.stepIndex && styles.stepLineDone]} />}
                  <Text style={[styles.stepLabel, idx <= status.stepIndex && styles.stepLabelDone, idx===status.stepIndex && styles.stepLabelCurrent]}>{step.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items • {order.items.reduce((s,i)=>s+i.qty,0)}</Text>
          {order.items.map(item=> (
            <View key={item.productId} style={styles.orderItem}>
              {item.image ? <Image source={{uri: getFileUrl(item.image)}} style={styles.orderImg} /> : <View style={[styles.orderImg, {backgroundColor:'#f5f5f5', justifyContent:'center', alignItems:'center'}]}><Ionicons name="cube-outline" size={16} color="#ccc"/></View>}
              <View style={{flex:1}}>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemQty}>Qty {item.qty}</Text>
              </View>
              <Text style={styles.orderItemTotal}>{formatCurrency(item.price * item.qty)}</Text>
            </View>
          ))}
          <View style={styles.billSep} />
          <View style={styles.billRow}><Text style={styles.billLabel}>Item total</Text><Text style={styles.billValue}>{formatCurrency(order.amounts.itemTotal)}</Text></View>
          {Number(order.amounts.discount)>0 && <View style={styles.billRow}><Text style={[styles.billLabel, styles.saving]}>Order discount</Text><Text style={[styles.billValue, styles.saving]}>- {formatCurrency(order.amounts.discount)}</Text></View>}
          <View style={styles.billRow}><Text style={styles.billLabel}>Delivery fee</Text>{order.amounts.deliveryFee===0 ? <Text style={[styles.billValue, styles.saving]}>FREE</Text> : <Text style={styles.billValue}>{formatCurrency(order.amounts.deliveryFee)}</Text>}</View>
          {Number(order.amounts.codFee)>0 && <View style={styles.billRow}><Text style={styles.billLabel}>COD charges</Text><Text style={styles.billValue}>{formatCurrency(order.amounts.codFee)}</Text></View>}
          {order.amounts.savings>0 && <View style={styles.billRow}><Text style={[styles.billLabel, styles.saving]}>MRP savings</Text><Text style={[styles.billValue, styles.saving]}>- {formatCurrency(order.amounts.savings)}</Text></View>}
          <View style={[styles.billRow, styles.billTotal]}><Text style={styles.billTotalLabel}>To pay</Text><Text style={styles.billTotalValue}>{formatCurrency(order.amounts.total)}</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}><Ionicons name="location-outline" size={16} color={BLINKIT.green}/><Text style={styles.cardTitle}>Delivery to</Text></View>
          <Text style={styles.addrName}>{order.address.name} • {order.address.phone}</Text>
          <Text style={styles.addrLine}>{order.address.line1}{order.address.city ? `, ${order.address.city}`:''}{order.address.state? `, ${order.address.state}`:''} — {order.address.pincode}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>{payment.method==='COD' ? <Ionicons name="cash-outline" size={16} color={BLINKIT.green}/> : <Ionicons name="card-outline" size={16} color={BLINKIT.green}/>} <Text style={styles.cardTitle}>Payment</Text></View>
          {payment.method==='COD' ? (
            <View style={styles.paymentRow}><View style={[styles.statusPill, {borderColor: status.key==='delivered'? BLINKIT.green : '#f59e0b'}]}><Text style={{color: status.key==='delivered'? BLINKIT.green : '#f59e0b', fontSize: 10, fontWeight:'700'}}>{status.key==='delivered'? 'Collected on delivery':'Pay on delivery'}</Text></View><Text style={styles.paymentText}>Pay <Text style={{fontWeight:'800'}}>{formatCurrency(payment.amount)}</Text> in cash when order arrives.</Text></View>
          ) : (
            <View style={styles.paymentRow}><Text style={styles.paymentText}>Paid <Text style={{fontWeight:'800'}}>{formatCurrency(payment.amount)}</Text> online {payment.paymentId ? `• ${payment.paymentId}`:''}</Text><View style={[styles.statusPill, {borderColor: payment.status==='PAID'? BLINKIT.green : '#ef4444'}]}><Text style={{color: payment.status==='PAID'? BLINKIT.green : '#ef4444', fontSize:10, fontWeight:'700'}}>{payment.status==='PAID'? 'Paid' : payment.status==='REFUND_REQUESTED'? 'Refund requested':'Pending'}</Text></View></View>
          )}
        </View>

        {cancellable && <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling}>{cancelling ? <ActivityIndicator color="#fff"/> : <><Ionicons name="close-circle-outline" size={16} color="#fff"/><Text style={styles.cancelText}>Cancel order</Text></>}</TouchableOpacity>}
        {!cancellable && status.key!=='delivered' && status.key!=='cancelled' && <View style={styles.supportNote}><Ionicons name="shield-checkmark-outline" size={14} color={BLINKIT.green}/><Text style={styles.supportText}>This order is already out for delivery. If anything looks wrong, call <Text style={{color: BLINKIT.green, fontWeight:'800'}} onPress={()=>{}}>8380017393</Text>.</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopOrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLINKIT.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
  headerSub: { color: '#888', fontSize: 11, marginTop: 2 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', gap: 8 },
  loadingText: { color: '#888', marginTop: 8, fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8 },
  emptyTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800', marginTop: 8 },
  emptySub: { color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 16 },
  scroll: { padding: 12, paddingBottom: 20 },
  trackerCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#eee', padding: 14, marginBottom: 12 },
  trackerDelivered: { borderColor: '#c8e6c9' },
  trackerCancelled: { borderColor: '#ffcdd2' },
  trackerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trackerEyebrow: { color: '#999', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  trackerTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '800', marginTop: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fff' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 10, fontWeight: '800' },
  etaBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e8f5e9', padding: 8, borderRadius: 10, marginTop: 10 },
  etaText: { color: '#333', fontSize: 11, fontWeight: '500', flex: 1 },
  tracker: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  stepDotDone: { backgroundColor: BLINKIT.green, borderColor: BLINKIT.green },
  stepDotCurrent: { backgroundColor: BLINKIT.green, borderColor: BLINKIT.green, shadowColor: BLINKIT.green, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  stepLine: { position: 'absolute', top: 10, left: -25, right: 25, height: 2, backgroundColor: '#e0e0e0', zIndex: -1 },
  stepLineDone: { backgroundColor: BLINKIT.green },
  stepLabel: { color: '#999', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  stepLabelDone: { color: '#333' },
  stepLabelCurrent: { color: BLINKIT.green },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#eee', padding: 14, marginBottom: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  orderImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#fafafa' },
  orderItemName: { color: '#1a1a1a', fontSize: 12, fontWeight: '700' },
  orderItemQty: { color: '#888', fontSize: 11, marginTop: 2 },
  orderItemTotal: { color: '#1a1a1a', fontSize: 12, fontWeight: '800' },
  billSep: { height: 1, backgroundColor: '#eee', marginVertical: 10, borderStyle: 'dashed' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  billLabel: { color: '#666', fontSize: 12 },
  billValue: { color: '#1a1a1a', fontSize: 12, fontWeight: '700' },
  saving: { color: BLINKIT.green },
  billTotal: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderColor: '#eee', borderStyle: 'dashed' },
  billTotalLabel: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },
  billTotalValue: { color: '#1a1a1a', fontSize: 14, fontWeight: '800' },
  addrName: { color: '#1a1a1a', fontSize: 12, fontWeight: '700' },
  addrLine: { color: '#666', fontSize: 11, marginTop: 4, lineHeight: 16 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  paymentText: { color: '#444', fontSize: 12, flex: 1 },
  cancelBtn: { backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4 },
  cancelText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  supportNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 10, marginTop: 4 },
  supportText: { color: '#666', fontSize: 11, flex: 1, lineHeight: 15 },
  primaryBtn: { backgroundColor: BLINKIT.green, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
