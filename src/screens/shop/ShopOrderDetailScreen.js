import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFileUrl } from '../../services/communication';
import { getOrderStatus, formatEta, STATUS_TIMELINE, canCancelOrder, cancelOrder } from '../../shop/shopOrders';
import { APP_THEME } from '../../shop/shopTheme';
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

  useEffect(() => { const t = setInterval(()=> setNow(Date.now()), 30000); return () => clearInterval(t); }, []);

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
    return <SafeAreaView style={styles.loadingWrap} edges={['top']}><ActivityIndicator color={APP_THEME.gold} /><Text style={styles.loadingText}>Loading order…</Text></SafeAreaView>;
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={18} color={APP_THEME.white}/></TouchableOpacity><Text style={styles.headerTitle}>Order details</Text><View style={{width:34}}/></View>
        <View style={styles.center}><Ionicons name="cube-outline" size={36} color={APP_THEME.muted}/><Text style={styles.emptyTitle}>Order not found</Text><Text style={styles.emptySub}>This order may belong to a different salon account on this device.</Text><TouchableOpacity style={styles.primaryBtn} onPress={()=>navigation.goBack()}><Text style={styles.primaryBtnText}>Back to my orders</Text></TouchableOpacity></View>
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
              if (updated) {
                const patched = { ...updated, serverStatus: 'CANCELLED' };
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
            if (updated?.cancelledAt) { setOrder(updated); Alert.alert('Order cancelled', 'Your order has been cancelled.'); }
            else Alert.alert('Cannot cancel', 'This order has already been dispatched and can no longer be cancelled. Call support if something is wrong.');
          }
        } catch (e) { Alert.alert('Error', e?.message || 'Could not cancel this order.'); } finally { setCancelling(false); }
      }},
    ]);
  };

  const statusColor = status.key==='cancelled' ? APP_THEME.red : status.key==='delivered' ? APP_THEME.gold : '#D4A45A';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={18} color={APP_THEME.white}/></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Order details</Text><Text style={styles.headerSub}>Order {order.id} • {new Date(order.placedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'})}</Text></View>
        <View style={{width:34}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 20 + Math.max(insets.bottom, 8) }]}>
        <View style={[styles.trackerCard, status.key==='delivered' && styles.trackerDelivered, status.key==='cancelled' && styles.trackerCancelled]}>
          <View style={styles.trackerHead}>
            <View>
              <Text style={styles.trackerEyebrow}>ORDER STATUS</Text>
              <Text style={styles.trackerTitle}>{status.key==='cancelled'? 'Order cancelled' : status.label}</Text>
            </View>
            <View style={[styles.statusPill, {backgroundColor: statusColor+'14', borderColor: statusColor}]}><View style={[styles.dot, {backgroundColor: statusColor}]} /><Text style={[styles.pillText, {color: statusColor}]}>{status.label}</Text></View>
          </View>
          {status.key==='delivered' ? (
            <View style={styles.etaBox}><Ionicons name="checkmark-circle" size={13} color={APP_THEME.gold}/><Text style={styles.etaText}>Delivered — enjoy the stock at {order.salonName || 'your salon'}</Text></View>
          ) : status.key==='cancelled' ? (
            <View style={[styles.etaBox, {backgroundColor:'rgba(242,123,116,0.12)', borderColor:'rgba(242,123,116,0.18)', borderWidth:1}]}><Text style={[styles.etaText, {color: APP_THEME.red}]}>{payment.method==='ONLINE' ? `Refund of ${formatCurrency(payment.amount)} is on the way (5–7 days).` : 'The order was cancelled before dispatch. No amount was collected.'}</Text></View>
          ) : null}
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
              {item.image ? <Image source={{uri: getFileUrl(item.image)}} style={styles.orderImg} /> : <View style={[styles.orderImg, {backgroundColor: APP_THEME.bg, justifyContent:'center', alignItems:'center'}]}><Ionicons name="cube-outline" size={15} color={APP_THEME.muted}/></View>}
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
          <View style={styles.cardHead}><Ionicons name="location-outline" size={15} color={APP_THEME.gold}/><Text style={styles.cardTitle}>Delivery to</Text></View>
          <Text style={styles.addrName}>{order.address.name} • {order.address.phone}</Text>
          <Text style={styles.addrLine}>{order.address.line1}{order.address.city ? `, ${order.address.city}`:''}{order.address.state? `, ${order.address.state}`:''} — {order.address.pincode}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>{payment.method==='COD' ? <Ionicons name="cash-outline" size={15} color={APP_THEME.gold}/> : <Ionicons name="card-outline" size={15} color={APP_THEME.gold}/>}<Text style={styles.cardTitle}>Payment</Text></View>
          {payment.method==='COD' ? (
            <View style={styles.paymentRow}><View style={[styles.statusPill, {borderColor: status.key==='delivered'? APP_THEME.gold : '#D4A45A'}]}><Text style={{color: status.key==='delivered'? APP_THEME.gold : '#D4A45A', fontSize: 10, fontWeight:'700'}}>{status.key==='delivered'? 'Collected on delivery':'Pay on delivery'}</Text></View><Text style={styles.paymentText}>Pay <Text style={{fontWeight:'800'}}>{formatCurrency(payment.amount)}</Text> in cash when order arrives.</Text></View>
          ) : (
            <View style={styles.paymentRow}><Text style={styles.paymentText}>Paid <Text style={{fontWeight:'800'}}>{formatCurrency(payment.amount)}</Text> online {payment.paymentId ? `• ${payment.paymentId}`:''}</Text><View style={[styles.statusPill, {borderColor: payment.status==='PAID'? APP_THEME.gold : APP_THEME.red}]}><Text style={{color: payment.status==='PAID'? APP_THEME.gold : APP_THEME.red, fontSize:10, fontWeight:'700'}}>{payment.status==='PAID'? 'Paid' : payment.status==='REFUND_REQUESTED'? 'Refund requested':'Pending'}</Text></View></View>
          )}
        </View>

        {cancellable && <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling}>{cancelling ? <ActivityIndicator color="#fff"/> : <><Ionicons name="close-circle-outline" size={15} color="#fff"/><Text style={styles.cancelText}>Cancel order</Text></>}</TouchableOpacity>}
        {!cancellable && status.key!=='delivered' && status.key!=='cancelled' && <View style={styles.supportNote}><Ionicons name="shield-checkmark-outline" size={13} color={APP_THEME.gold}/><Text style={styles.supportText}>This order is already out for delivery. If anything looks wrong, call <Text style={{color: APP_THEME.gold, fontWeight:'800'}} onPress={()=>{}}>8380017393</Text>.</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopOrderDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: APP_THEME.bg, borderBottomWidth: 1, borderColor: APP_THEME.line },
  headerBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800' },
  headerSub: { color: APP_THEME.muted, fontSize: 11, marginTop: 2 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_THEME.bg, gap: 8 },
  loadingText: { color: APP_THEME.muted, marginTop: 8, fontSize: 11 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8, backgroundColor: APP_THEME.bg },
  emptyTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800', marginTop: 8 },
  emptySub: { color: APP_THEME.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  scroll: { padding: 12, paddingBottom: 20 },
  trackerCard: { backgroundColor: APP_THEME.card, borderRadius: 14, borderWidth: 1, borderColor: APP_THEME.line, padding: 12, marginBottom: 10 },
  trackerDelivered: { borderColor: 'rgba(232,185,126,0.18)' },
  trackerCancelled: { borderColor: 'rgba(242,123,116,0.22)' },
  trackerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  trackerEyebrow: { color: APP_THEME.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  trackerTitle: { color: APP_THEME.white, fontSize: 15, fontWeight: '800', marginTop: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: APP_THEME.bg },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 9, fontWeight: '800' },
  etaBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: APP_THEME.goldWash, padding: 8, borderRadius: 9, marginTop: 10, borderWidth: 1, borderColor: 'rgba(232,185,126,0.12)' },
  etaText: { color: APP_THEME.mutedLight, fontSize: 11, fontWeight: '500', flex: 1 },
  tracker: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: APP_THEME.line, backgroundColor: APP_THEME.card },
  stepDotDone: { backgroundColor: APP_THEME.gold, borderColor: APP_THEME.gold },
  stepDotCurrent: { backgroundColor: APP_THEME.gold, borderColor: APP_THEME.gold, shadowColor: APP_THEME.gold, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  stepLine: { position: 'absolute', top: 9, left: -25, right: 25, height: 2, backgroundColor: APP_THEME.line, zIndex: -1 },
  stepLineDone: { backgroundColor: APP_THEME.gold },
  stepLabel: { color: APP_THEME.muted, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  stepLabelDone: { color: APP_THEME.mutedLight },
  stepLabelCurrent: { color: APP_THEME.gold },
  card: { backgroundColor: APP_THEME.card, borderRadius: 12, borderWidth: 1, borderColor: APP_THEME.line, padding: 12, marginBottom: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { color: APP_THEME.white, fontSize: 12, fontWeight: '800' },
  orderItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  orderImg: { width: 44, height: 44, borderRadius: 9, backgroundColor: APP_THEME.bg },
  orderItemName: { color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  orderItemQty: { color: APP_THEME.muted, fontSize: 10, marginTop: 2 },
  orderItemTotal: { color: APP_THEME.white, fontSize: 11, fontWeight: '800' },
  billSep: { height: 1, backgroundColor: APP_THEME.line, marginVertical: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  billLabel: { color: APP_THEME.mutedLight, fontSize: 11 },
  billValue: { color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  saving: { color: APP_THEME.green },
  billTotal: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderColor: APP_THEME.line },
  billTotalLabel: { color: APP_THEME.white, fontSize: 12, fontWeight: '800' },
  billTotalValue: { color: APP_THEME.white, fontSize: 13, fontWeight: '800' },
  addrName: { color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  addrLine: { color: APP_THEME.mutedLight, fontSize: 11, marginTop: 4, lineHeight: 15 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  paymentText: { color: APP_THEME.mutedLight, fontSize: 11, flex: 1 },
  cancelBtn: { backgroundColor: '#C0392B', paddingVertical: 13, borderRadius: 11, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4 },
  cancelText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  supportNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, borderRadius: 10, padding: 10, marginTop: 4 },
  supportText: { color: APP_THEME.mutedLight, fontSize: 11, flex: 1, lineHeight: 14 },
  primaryBtn: { backgroundColor: APP_THEME.gold, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9 },
  primaryBtnText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },
});
