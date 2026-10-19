import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { cartTotals, cartCount, placeOrder } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopBillCard } from '../../shop/ShopComponents';
import { BLINKIT } from '../../shop/shopTheme';
import { getShopOwnerId, getShopSalonName, getShopAddressDefaults, formatCurrency } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { communication, rzp_key } from '../../services/communication';
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
  const [payState, setPayState] = useState('idle'); // idle | opening | confirming
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
      const name = await getShopSalonName();
      setSalonName(name);
      const defaults = await getShopAddressDefaults();
      if (defaults) setAddress(defaults);
      try {
        const raw = await AsyncStorage.getItem(`mynaaiShopCart:${id}`);
        const parsed = raw ? JSON.parse(raw) : [];
        setLines(Array.isArray(parsed) ? parsed : []);
      } catch {}
      fetchShopSettings().then(setSettings).catch(()=>{});
    })();
  }, []);

  const totals = useMemo(() => cartTotals(lines, settings, { method: payment === 'cod' ? 'COD' : 'ONLINE' }), [lines, settings, payment]);
  const codLocked = settings?.codThreshold > 0 && totals.itemTotal > settings.codThreshold;

  useEffect(() => { if (payment === 'cod' && codLocked) setPayment('online'); }, [payment, codLocked]);

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
    // clear cart locally
    try { await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify([])); } catch {}
    setLines([]);
    setPlaced(order);
    setPayState('idle');
    Alert.alert('Order placed', `Order ${order.id} placed successfully.`);
    // register server
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
      theme: { color: BLINKIT.green },
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

  const placeCod = async () => {
    await finalizeOrder({ method: 'COD', status: 'PENDING', paymentId: '', amount: totals.total });
  };

  const submit = async () => {
    if (busy) return;
    const problem = validate();
    if (problem) return Alert.alert('Check address', problem);
    if (lines.length === 0) return Alert.alert('Empty cart', 'Your cart is empty.');
    if (payment === 'cod' && codLocked) return Alert.alert('COD not available', `Cash on delivery is only available for orders up to ${formatCurrency(settings.codThreshold)} — please pay online.`);
    setBusy(true);
    try {
      if (payment === 'online') await payOnline();
      else await placeCod();
    } finally { setBusy(false); }
  };

  if (placed) {
    // Success view
    const etaText = 'the next working day';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.successWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={56} color={BLINKIT.green} /></View>
          <Text style={styles.successTitle}>Order placed</Text>
          <Text style={styles.successId}>Order {placed.id}</Text>
          <View style={styles.successEta}><Ionicons name="car-outline" size={16} color={BLINKIT.green} /><Text style={styles.successEtaText}>Arriving by <Text style={{fontWeight:'800'}}>{etaText}</Text> at {placed.address.line1}, {placed.address.city}</Text></View>
          <View style={styles.successBill}><ShopBillCard lines={placed.items} totals={placed.amounts} /></View>
          <Text style={styles.successPayment}>{placed.payment.method === 'ONLINE' ? `Paid ${formatCurrency(placed.payment.amount)} online${placed.payment.paymentId ? ` • ${placed.payment.paymentId}` : ''}` : `Pay ${formatCurrency(placed.payment.amount)} in cash on delivery`}</Text>
          <View style={styles.successActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.replace('ShopOrderDetail', { orderId: placed.id })}><Text style={styles.primaryBtnText}>Track order</Text><Ionicons name="chevron-forward" size={14} color="#fff"/></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Shop')}><Text style={styles.secondaryBtnText}>Continue shopping</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={20} color="#1a1a1a"/></TouchableOpacity><Text style={styles.headerTitle}>Checkout</Text><View style={{width:36}}/></View>
        <View style={styles.empty}><Ionicons name="bag-outline" size={40} color="#ccc"/><Text style={styles.emptyTitle}>Nothing to check out</Text><Text style={styles.emptySub}>Your cart is empty.</Text><TouchableOpacity style={styles.primaryBtn} onPress={()=>navigation.navigate('Shop')}><Text style={styles.primaryBtnText}>Browse the shop</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  const payLabel = payState === 'opening' ? 'Contacting payment gateway…'
    : payState === 'confirming' ? 'Confirming your payment…'
    : payment === 'online' ? `Pay ${formatCurrency(totals.total)} online` : `Place order • pay ${formatCurrency(totals.total)} on delivery`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={20} color="#1a1a1a"/></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Checkout</Text><Text style={styles.headerSub}>Delivery to your salon</Text></View>
        <View style={{width:36}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.cardHead}><Ionicons name="location-outline" size={16} color={BLINKIT.green} /><Text style={styles.cardHeadTitle}>Delivery address</Text></View>

          <Text style={styles.label}>Recipient name *</Text>
          <TextInput style={styles.input} value={address.name} onChangeText={v=>setField('name', v)} placeholder="e.g. Ramesh Kumar" placeholderTextColor="#aaa" />

          <Text style={styles.label}>Contact number *</Text>
          <TextInput style={styles.input} value={address.phone} onChangeText={v=>setField('phone', v.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile" placeholderTextColor="#aaa" keyboardType="number-pad" maxLength={10} />

          <Text style={styles.label}>Address *</Text>
          <TextInput style={styles.input} value={address.line1} onChangeText={v=>setField('line1', v)} placeholder="Shop / salon address" placeholderTextColor="#aaa" />

          <View style={styles.row}>
            <View style={{flex:1}}>
              <Text style={styles.label}>City *</Text>
              <TextInput style={styles.input} value={address.city} onChangeText={v=>setField('city', v)} placeholder="City" placeholderTextColor="#aaa" />
            </View>
            <View style={{flex:1}}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={address.state} onChangeText={v=>setField('state', v)} placeholder="State" placeholderTextColor="#aaa" />
            </View>
          </View>
          <Text style={styles.label}>Pincode *</Text>
          <TextInput style={styles.input} value={address.pincode} onChangeText={v=>setField('pincode', v.replace(/\D/g,'').slice(0,6))} placeholder="6-digit pincode" placeholderTextColor="#aaa" keyboardType="number-pad" maxLength={6} />

          <View style={{marginTop:14}}>
            <ShopBillCard lines={lines} totals={totals} />
          </View>

          <Text style={styles.payTitle}>Payment method</Text>

          <TouchableOpacity style={[styles.payOption, payment==='online' && styles.payOptionActive]} onPress={()=>setPayment('online')} activeOpacity={0.8}>
            <Ionicons name="card-outline" size={18} color={payment==='online'? BLINKIT.green : '#888'} />
            <View style={{flex:1}}>
              <Text style={[styles.payLabel, payment==='online' && styles.payLabelActive]}>Pay online</Text>
              <Text style={styles.payHint}>UPI, cards, netbanking via Razorpay</Text>
            </View>
            <View style={[styles.radio, payment==='online' && styles.radioActive]}>{payment==='online' && <View style={styles.radioDot}/>}</View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.payOption, payment==='cod' && styles.payOptionActive, codLocked && styles.payOptionDisabled]} onPress={()=> !codLocked && setPayment('cod')} activeOpacity={0.8} disabled={codLocked}>
            <Ionicons name="cash-outline" size={18} color={payment==='cod'? BLINKIT.green : '#888'} />
            <View style={{flex:1}}>
              <Text style={[styles.payLabel, payment==='cod' && styles.payLabelActive, codLocked && {color:'#aaa'}]}>Cash on delivery</Text>
              <Text style={styles.payHint}>{codLocked ? `Only for orders up to ${formatCurrency(settings?.codThreshold)} — this one is ${formatCurrency(totals.itemTotal)}, so please pay online` : settings?.codCharges>0 ? `Pay in cash when order arrives • ₹${settings.codCharges} COD charges` : 'Pay in cash when order arrives'}</Text>
            </View>
            <View style={[styles.radio, payment==='cod' && styles.radioActive, codLocked && styles.radioDisabled]}>{payment==='cod' && !codLocked && <View style={styles.radioDot}/>}</View>
          </TouchableOpacity>

          {payState !== 'idle' && (
            <View style={styles.payStatus}><ActivityIndicator size="small" color={BLINKIT.green} /><Text style={styles.payStatusText}>{payLabel}</Text></View>
          )}

          <TouchableOpacity style={[styles.proceedBtn, busy && {opacity:0.6}]} onPress={submit} disabled={busy} activeOpacity={0.9}>
            {busy || payState!=='idle' ? <ActivityIndicator color="#fff" /> : <><Text style={styles.proceedText}>{payLabel}</Text><Ionicons name={payment==='online'?'card':'cash'} size={16} color="#fff"/></>}
          </TouchableOpacity>

          <View style={styles.terms}><Ionicons name="shield-checkmark-outline" size={13} color={BLINKIT.green} /><Text style={styles.termsText}>Orders can be cancelled free until they go out for delivery. Online refunds return to source in 5-7 days.</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShopCheckoutScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLINKIT.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 2 },
  scroll: { padding: 12, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#eee', padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeadTitle: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },
  label: { color: '#444', fontSize: 11, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#1a1a1a', fontSize: 13, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row', gap: 10 },
  payTitle: { color: '#1a1a1a', fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, marginBottom: 8, backgroundColor: '#fff' },
  payOptionActive: { borderColor: BLINKIT.green, backgroundColor: '#f0faf2' },
  payOptionDisabled: { opacity: 0.5 },
  payLabel: { color: '#1a1a1a', fontSize: 13, fontWeight: '700' },
  payLabelActive: { color: BLINKIT.green },
  payHint: { color: '#888', fontSize: 10, marginTop: 2, lineHeight: 13 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: BLINKIT.green },
  radioDisabled: { borderColor: '#ddd' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLINKIT.green },
  payStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', padding: 10, borderRadius: 10, marginTop: 10 },
  payStatusText: { color: '#333', fontSize: 11, fontWeight: '600' },
  proceedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BLINKIT.green, paddingVertical: 14, borderRadius: 12, marginTop: 14 },
  proceedText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  terms: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  termsText: { color: '#999', fontSize: 10, flex: 1, lineHeight: 14 },
  // success
  successWrap: { padding: 20, alignItems: 'center', backgroundColor: '#fff', flexGrow: 1, paddingTop: 40 },
  successIcon: { marginBottom: 12 },
  successTitle: { color: '#1a1a1a', fontSize: 22, fontWeight: '800' },
  successId: { color: BLINKIT.green, fontSize: 12, fontWeight: '800', marginTop: 4, letterSpacing: 0.5 },
  successEta: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', padding: 10, borderRadius: 10, marginTop: 12, width: '100%' },
  successEtaText: { color: '#333', fontSize: 11, flex: 1, lineHeight: 15 },
  successBill: { width: '100%', marginTop: 14 },
  successPayment: { color: '#666', fontSize: 11, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, textAlign: 'center' },
  successActions: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%', justifyContent: 'center' },
  primaryBtn: { backgroundColor: BLINKIT.green, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  secondaryBtn: { borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, backgroundColor: '#fff' },
  secondaryBtnText: { color: '#333', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', padding: 40, gap: 10, flex: 1, justifyContent: 'center' },
  emptyTitle: { color: '#1a1a1a', fontSize: 14, fontWeight: '800' },
  emptySub: { color: '#888', fontSize: 12, textAlign: 'center' },
});
