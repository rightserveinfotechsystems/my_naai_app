import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { cartTotals, cartCount, placeOrder } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopBillCard } from '../../shop/ShopComponents';
import { APP_THEME } from '../../shop/shopTheme';
import { getShopOwnerId, getShopSalonName, getShopAddressDefaults, formatCurrency } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rzp_key } from '../../services/communication';
import RazorpayCheckout from 'react-native-razorpay';
import { registerServerOrder, clearServerCart } from '../../shop/shopSync';

const ShopCheckoutScreen = ({ navigation }) => {
  const [ownerId, setOwnerId] = useState('guest');
  const [salonName, setSalonName] = useState('');
  const [lines, setLines] = useState([]);
  const [settings, setSettings] = useState(null);
  const [address, setAddress] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
  const [payment, setPayment] = useState('online');
  const [busy, setBusy] = useState(false);
  const [payState, setPayState] = useState('idle');
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
      const name = await getShopSalonName();
      setSalonName(name);
      const defaults = await getShopAddressDefaults();
      if (defaults) setAddress(defaults);
      try { const raw = await AsyncStorage.getItem(`mynaaiShopCart:${id}`); const parsed = raw ? JSON.parse(raw) : []; setLines(Array.isArray(parsed) ? parsed : []); } catch {}
      fetchShopSettings().then(setSettings).catch(()=>{});
    })();
  }, []);

  const insets = useSafeAreaInsets();
  const totals = useMemo(() => cartTotals(lines, settings, { method: payment === 'cod' ? 'COD' : 'ONLINE' }), [lines, settings, payment]);
  const codLocked = settings?.codThreshold > 0 && totals.itemTotal > settings.codThreshold;
  useEffect(() => { if (payment === 'cod' && codLocked) setPayment('online'); }, [payment, codLocked]);
  const goToShop = () => {
    // Valid nested route: Stack 'Salon' -> Tab 'Shop' (not 'Shop' directly)
    try { navigation.navigate('Salon', { screen: 'Shop' }); return; } catch {}
    if (navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
  };
  const goToShopFromEmpty = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    try { navigation.navigate('Salon', { screen: 'Shop' }); } catch {}
  };

  const setField = (k, v) => setAddress(prev => ({ ...prev, [k]: v }));
  const validate = () => {
    if (!address.name.trim()) return 'Add the recipient’s name.';
    if (!/^\d{10}$/.test(address.phone.trim())) return 'Add a 10-digit contact number.';
    if (!address.line1.trim()) return 'Add the delivery address.';
    if (!address.city.trim()) return 'Add the city.';
    if (!/^\d{6}$/.test(address.pincode.trim())) return 'Add a 6-digit pincode.';
    return '';
  };

  const finalizeOrder = async (paymentInfo) => {
    const order = await placeOrder(ownerId, { items: lines, address, payment: paymentInfo, amounts: totals, salonName });
    try { await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify([])); } catch {}
    setLines([]);
    setPlaced(order);
    setPayState('idle');
    Alert.alert('Order placed', `Order ${order.id} placed successfully.`);
    registerServerOrder(order).then(registered => { if (registered) clearServerCart(); });
    return order;
  };

  const payOnline = async () => {
    setPayState('opening');
    const amountPaise = Math.round(totals.total * 100);
    const options = {
      description: `Naai Shop order • ${cartCount(lines)} ${cartCount(lines)===1?'item':'items'}`,
      image: 'https://res.cloudinary.com/dfdkzozqi/image/upload/v1773818628/my_naai_pay_gateway_ucntco.png',
      currency: 'INR',
      key: rzp_key,
      amount: amountPaise,
      name: 'My Naai',
      prefill: { email: '', contact: address.phone, name: address.name },
      theme: { color: '#E8B97E' },
      notes: { flow: 'shop-order', salonId: ownerId, items: String(cartCount(lines)) },
    };
    try {
      setPayState('confirming');
      const data = await RazorpayCheckout.open(options);
      await finalizeOrder({ method: 'ONLINE', status: 'PAID', paymentId: data.razorpay_payment_id || '', amount: totals.total });
    } catch (error) {
      setPayState('idle');
      const msg = error?.description || error?.message || '';
      if (String(msg).toLowerCase().includes('cancel') || error?.code === 0) {
        Alert.alert('Payment cancelled', 'No amount was charged — your cart is still waiting.');
      } else {
        Alert.alert('Payment failed', msg || 'Payment could not be completed. Try again or choose Cash on Delivery.');
      }
    }
  };
  const placeCod = async () => { await finalizeOrder({ method: 'COD', status: 'PENDING', paymentId: '', amount: totals.total }); };
  const submit = async () => {
    if (busy) return;
    const problem = validate();
    if (problem) return Alert.alert('Check address', problem);
    if (lines.length === 0) return Alert.alert('Empty cart', 'Your cart is empty.');
    if (payment === 'cod' && codLocked) return Alert.alert('COD not available', `Cash on delivery is only available for orders up to ${formatCurrency(settings.codThreshold)} — please pay online.`);
    setBusy(true);
    try { if (payment === 'online') await payOnline(); else await placeCod(); } finally { setBusy(false); }
  };

  if (placed) {
    const etaText = 'the next working day';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={[styles.successWrap, { paddingBottom: Math.max(insets.bottom, 8) + 16 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={52} color={APP_THEME.gold} /></View>
          <Text style={styles.successTitle}>Order placed</Text>
          <Text style={styles.successId}>Order {placed.id}</Text>
          <View style={styles.successEta}><Ionicons name="car-outline" size={14} color={APP_THEME.gold} /><Text style={styles.successEtaText}>Arriving by <Text style={{fontWeight:'800'}}>{etaText}</Text> at {placed.address.line1}, {placed.address.city}</Text></View>
          <View style={styles.successBill}><ShopBillCard lines={placed.items} totals={placed.amounts} /></View>
          <Text style={styles.successPayment}>{placed.payment.method === 'ONLINE' ? `Paid ${formatCurrency(placed.payment.amount)} online${placed.payment.paymentId ? ` • ${placed.payment.paymentId}` : ''}` : `Pay ${formatCurrency(placed.payment.amount)} in cash on delivery`}</Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.replace('ShopOrderDetail', { orderId: placed.id })}><Text style={styles.primaryBtnText}>Track order</Text><Ionicons name="chevron-forward" size={14} color={APP_THEME.bg}/></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={goToShop}><Text style={styles.secondaryBtnText}>Continue shopping</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={18} color={APP_THEME.white}/></TouchableOpacity><Text style={styles.headerTitle}>Checkout</Text><View style={{width:34}}/></View>
        <View style={styles.empty}><Ionicons name="bag-outline" size={36} color={APP_THEME.muted}/><Text style={styles.emptyTitle}>Nothing to check out</Text><Text style={styles.emptySub}>Your cart is empty.</Text><TouchableOpacity style={styles.primaryBtn} onPress={goToShopFromEmpty}><Text style={styles.primaryBtnText}>Browse the shop</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  const payLabel = payState === 'opening' ? 'Contacting payment gateway…'
    : payState === 'confirming' ? 'Confirming your payment…'
    : payment === 'online' ? `Pay ${formatCurrency(totals.total)} online` : `Place order • pay ${formatCurrency(totals.total)} on delivery`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={18} color={APP_THEME.white}/></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Checkout</Text><Text style={styles.headerSub}>Delivery to your salon</Text></View>
        <View style={{width:34}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 20 + Math.max(insets.bottom, 8) }]}>
        <View style={styles.card}>
          <View style={styles.cardHead}><Ionicons name="location-outline" size={15} color={APP_THEME.gold} /><Text style={styles.cardHeadTitle}>Delivery address</Text></View>

          <Text style={styles.label}>Recipient name *</Text>
          <TextInput style={styles.input} value={address.name} onChangeText={v=>setField('name', v)} placeholder="e.g. Ramesh Kumar" placeholderTextColor={APP_THEME.muted} />

          <Text style={styles.label}>Contact number *</Text>
          <TextInput style={styles.input} value={address.phone} onChangeText={v=>setField('phone', v.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" placeholderTextColor={APP_THEME.muted} keyboardType="number-pad" maxLength={10} />

          <Text style={styles.label}>Address *</Text>
          <TextInput style={styles.input} value={address.line1} onChangeText={v=>setField('line1', v)} placeholder="Shop / salon address" placeholderTextColor={APP_THEME.muted} />

          <View style={styles.row}>
            <View style={{flex:1}}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={address.city} onChangeText={v=>setField('city', v)} placeholder="City" placeholderTextColor={APP_THEME.muted} />
            </View>
            <View style={{flex:1}}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={address.state} onChangeText={v=>setField('state', v)} placeholder="State" placeholderTextColor={APP_THEME.muted} />
            </View>
          </View>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput style={styles.input} value={address.pincode} onChangeText={v=>setField('pincode', v.replace(/\D/g,'').slice(0,6))} placeholder="6-digit pincode" placeholderTextColor={APP_THEME.muted} keyboardType="number-pad" maxLength={6} />

          <View style={{marginTop:12}}>
            <ShopBillCard lines={lines} totals={totals} />
          </View>

          <Text style={styles.payTitle}>Payment method</Text>

          <TouchableOpacity style={[styles.payOption, payment==='online' && styles.payOptionActive]} onPress={()=>setPayment('online')} activeOpacity={0.85}>
            <Ionicons name="card-outline" size={17} color={payment==='online'? APP_THEME.gold : APP_THEME.muted} />
            <View style={{flex:1}}>
              <Text style={[styles.payLabel, payment==='online' && styles.payLabelActive]}>Pay online</Text>
              <Text style={styles.payHint}>UPI, cards, netbanking via Razorpay</Text>
            </View>
            <View style={[styles.radio, payment==='online' && styles.radioActive]}>{payment==='online' && <View style={styles.radioDot}/>}</View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.payOption, payment==='cod' && styles.payOptionActive, codLocked && styles.payOptionDisabled]} onPress={()=> !codLocked && setPayment('cod')} activeOpacity={0.85} disabled={codLocked}>
            <Ionicons name="cash-outline" size={17} color={payment==='cod'? APP_THEME.gold : APP_THEME.muted} />
            <View style={{flex:1}}>
              <Text style={[styles.payLabel, payment==='cod' && styles.payLabelActive, codLocked && {color: APP_THEME.muted}]}>Cash on delivery</Text>
              <Text style={styles.payHint}>{codLocked ? `Only for orders up to ${formatCurrency(settings?.codThreshold)} — this one is ${formatCurrency(totals.itemTotal)}, so please pay online` : settings?.codCharges>0 ? `Pay in cash when order arrives • ₹${settings.codCharges} COD charges` : 'Pay in cash when order arrives'}</Text>
            </View>
            <View style={[styles.radio, payment==='cod' && styles.radioActive, codLocked && styles.radioDisabled]}>{payment==='cod' && !codLocked && <View style={styles.radioDot}/>}</View>
          </TouchableOpacity>

          {payState !== 'idle' && (
            <View style={styles.payStatus}><ActivityIndicator size="small" color={APP_THEME.gold} /><Text style={styles.payStatusText}>{payLabel}</Text></View>
          )}

          <TouchableOpacity style={[styles.proceedBtn, busy && {opacity:0.6}]} onPress={submit} disabled={busy} activeOpacity={0.9}>
            {busy || payState!=='idle' ? <ActivityIndicator color={APP_THEME.bg} /> : <><Text style={styles.proceedText}>{payLabel}</Text><Ionicons name={payment==='online'?'card':'cash'} size={15} color={APP_THEME.bg}/></>}
          </TouchableOpacity>

          <View style={styles.terms}><Ionicons name="shield-checkmark-outline" size={12} color={APP_THEME.gold} /><Text style={styles.termsText}>Orders can be cancelled free until they go out for delivery. Online refunds return to source in 5-7 days.</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopCheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: APP_THEME.bg, borderBottomWidth: 1, borderColor: APP_THEME.line },
  headerBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: APP_THEME.muted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  scroll: { padding: 12, paddingBottom: 20 },
  card: { backgroundColor: APP_THEME.card, borderRadius: 12, borderWidth: 1, borderColor: APP_THEME.line, padding: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeadTitle: { color: APP_THEME.white, fontSize: 12, fontWeight: '800' },
  label: { color: APP_THEME.mutedLight, fontSize: 10, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: APP_THEME.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: APP_THEME.white, fontSize: 12, backgroundColor: APP_THEME.bg },
  row: { flexDirection: 'row', gap: 10 },
  payTitle: { color: APP_THEME.white, fontSize: 12, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: APP_THEME.line, borderRadius: 12, padding: 11, marginBottom: 8, backgroundColor: APP_THEME.bg },
  payOptionActive: { borderColor: APP_THEME.gold, backgroundColor: APP_THEME.goldWash },
  payOptionDisabled: { opacity: 0.45 },
  payLabel: { color: APP_THEME.white, fontSize: 12, fontWeight: '700' },
  payLabelActive: { color: APP_THEME.gold },
  payHint: { color: APP_THEME.muted, fontSize: 10, marginTop: 2, lineHeight: 13 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: APP_THEME.gold },
  radioDisabled: { borderColor: APP_THEME.line },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: APP_THEME.gold },
  payStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: APP_THEME.goldWash, padding: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: 'rgba(232,185,126,0.16)' },
  payStatusText: { color: APP_THEME.white, fontSize: 11, fontWeight: '600' },
  proceedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: APP_THEME.gold, paddingVertical: 13, borderRadius: 11, marginTop: 14 },
  proceedText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  termsText: { color: APP_THEME.muted, fontSize: 10, flex: 1, lineHeight: 13 },
  successWrap: { padding: 20, alignItems: 'center', backgroundColor: APP_THEME.bg, flexGrow: 1, paddingTop: 40 },
  successIcon: { marginBottom: 10 },
  successTitle: { color: APP_THEME.white, fontSize: 20, fontWeight: '800' },
  successId: { color: APP_THEME.gold, fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  successEta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, padding: 10, borderRadius: 10, marginTop: 12, width: '100%' },
  successEtaText: { color: APP_THEME.mutedLight, fontSize: 11, flex: 1, lineHeight: 15 },
  successBill: { width: '100%', marginTop: 14 },
  successPayment: { color: APP_THEME.muted, fontSize: 11, marginTop: 10, textAlign: 'center' },
  successActions: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%', justifyContent: 'center' },
  primaryBtn: { backgroundColor: APP_THEME.gold, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryBtnText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },
  secondaryBtn: { borderWidth: 1, borderColor: APP_THEME.line, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: APP_THEME.card },
  secondaryBtnText: { color: APP_THEME.white, fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', padding: 40, gap: 10, flex: 1, justifyContent: 'center', backgroundColor: APP_THEME.bg },
  emptyTitle: { color: APP_THEME.white, fontSize: 13, fontWeight: '800' },
  emptySub: { color: APP_THEME.muted, fontSize: 11, textAlign: 'center' },
});
