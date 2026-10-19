import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getFileUrl, communication } from '../../services/communication';
import { cartTotals, freeDeliveryGap, cartCount } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopQuantityControl, ShopBillCard, EmptyState } from '../../shop/ShopComponents';
import { APP_THEME } from '../../shop/shopTheme';
import { getShopOwnerId } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ShopCartScreen = ({ navigation }) => {
  const [ownerId, setOwnerId] = useState('guest');
  const [lines, setLines] = useState([]);
  const [settings, setSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (oid) => {
    try { const raw = await AsyncStorage.getItem(`mynaaiShopCart:${oid}`); const parsed = raw ? JSON.parse(raw) : []; setLines(Array.isArray(parsed) ? parsed : []); } catch { setLines([]); }
  };

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
      await load(id);
      fetchShopSettings().then(setSettings).catch(()=>{});
      try {
        const res = await communication.shopCartGet();
        const serverLines = res?.data?.lines || [];
        if (Array.isArray(serverLines)) {
          const normalized = serverLines.map(l => ({ productId: String(l.productId), name: l.name, price: Number(l.price)||0, mrp: Number(l.mrp)||0, image: l.image||'', category: l.category||'', gender: l.gender||'', salonName: l.salonName||'', qty: Number(l.qty)||1 }));
          await AsyncStorage.setItem(`mynaaiShopCart:${id}`, JSON.stringify(normalized));
          setLines(normalized);
        }
      } catch {}
    })();
  }, []);

  const persist = async (next) => { try { await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify(next)); } catch {} setLines(next); };
  const setQty = async (pid, next) => {
    let nextLines = [...lines];
    const n = Math.round(Number(next)||0);
    if (n <= 0) nextLines = nextLines.filter(l => l.productId !== String(pid));
    else { const idx = nextLines.findIndex(l => l.productId === String(pid)); if (idx >=0) nextLines[idx] = { ...nextLines[idx], qty: Math.min(99,n) }; }
    await persist(nextLines);
    try { if (n <= 0) await communication.shopCartRemove({ productId: String(pid) }); else await communication.shopCartSetQty({ productId: String(pid), qty: n }); } catch {}
  };
  const removeLine = async (line) => {
    const pid = String(line.productId || line);
    const next = lines.filter(l => l.productId !== pid);
    await persist(next);
    try { await communication.shopCartRemove({ productId: pid }); } catch {}
  };
  const clearAll = () => {
    Alert.alert('Clear your cart?', 'Every item will be removed from this cart.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear cart', style: 'destructive', onPress: async () => { await persist([]); try { await communication.shopCartClear(); } catch {} }},
    ]);
  };

  const totals = cartTotals(lines, settings);
  const gap = freeDeliveryGap(lines, settings);
  const progress = settings?.freeDeliveryAbove ? Math.min(100, Math.round((totals.subtotal / settings.freeDeliveryAbove)*100)) : 100;
  const onRefresh = async () => { setRefreshing(true); await load(ownerId); setRefreshing(false); };

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={18} color={APP_THEME.white}/></TouchableOpacity>
          <Text style={styles.headerTitle}>Your cart</Text>
          <View style={{width:36}} />
        </View>
        <EmptyState icon="bag-handle-outline" title="Your cart is empty" message="Fill it with shampoo, clippers and beard oil — delivered to your salon." actionLabel="Browse the shop" onAction={() => navigation.navigate('Shop')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}><Ionicons name="arrow-back" size={18} color={APP_THEME.white}/></TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Your cart</Text>
          <Text style={styles.headerSub}>{cartCount(lines)} {cartCount(lines)===1?'item':'items'} from the Naai Shop</Text>
        </View>
        <View style={{width:36}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={APP_THEME.gold} />}>
        <View style={[styles.deliveryNote, gap===0 && styles.deliveryNoteUnlocked]}>
          <Ionicons name="car-outline" size={16} color={gap===0 ? APP_THEME.bg : APP_THEME.gold} />
          <View style={{flex:1}}>
            {gap>0 ? (
              <>
                <Text style={styles.deliveryNoteText}>Add items worth <Text style={styles.deliveryNoteBold}>₹{gap}</Text> more to unlock <Text style={styles.deliveryNoteBold}>FREE delivery</Text></Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
              </>
            ) : (
              <Text style={[styles.deliveryNoteText, {color: APP_THEME.bg, fontWeight:'800'}]}>You have unlocked FREE delivery 🎉</Text>
            )}
          </View>
        </View>

        <View style={styles.listHead}>
          <Text style={styles.listHeadText}>Items in cart • <Text style={{fontWeight:'800', color: APP_THEME.white}}>{cartCount(lines)}</Text></Text>
          <TouchableOpacity onPress={clearAll}><Text style={styles.clearText}>Clear cart</Text></TouchableOpacity>
        </View>

        {lines.map(line => (
          <View key={line.productId} style={styles.item}>
            {line.image ? <Image source={{ uri: getFileUrl(line.image) }} style={styles.itemImage} resizeMode="cover" /> : <View style={[styles.itemImage, styles.itemImagePlaceholder]}><Ionicons name="cube-outline" size={18} color={APP_THEME.muted}/></View>}
            <View style={styles.itemCopy}>
              <Text numberOfLines={2} style={styles.itemName}>{line.name}</Text>
              <Text style={styles.itemPriceLine}><Text style={styles.itemPrice}>₹{line.price}</Text><Text style={styles.itemEach}> each</Text>{line.mrp>0 && <Text style={styles.itemMrp}> MRP ₹{line.mrp}</Text>}</Text>
              <View style={styles.itemRow}>
                <ShopQuantityControl qty={line.qty} onAdd={()=>setQty(line.productId, line.qty+1)} onSet={next=>setQty(line.productId,next)} small />
                <TouchableOpacity onPress={()=>removeLine(line)} style={styles.removeBtn}><Ionicons name="trash-outline" size={12} color={APP_THEME.muted} /><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
                <Text style={styles.lineTotal}>₹{line.price * line.qty}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{marginTop:12}}>
          <ShopBillCard lines={lines} totals={totals} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerAmount}>
          <Text style={styles.footerLabel}>To pay</Text>
          <Text style={styles.footerTotal}>₹{totals.total}</Text>
          <Text style={styles.footerItems}>{cartCount(lines)} {cartCount(lines)===1?'item':'items'}</Text>
        </View>
        <TouchableOpacity style={styles.proceedBtn} onPress={() => navigation.navigate('ShopCheckout')}>
          <Text style={styles.proceedText}>Proceed to checkout</Text>
          <Ionicons name="chevron-forward" size={14} color={APP_THEME.bg} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ShopCartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: APP_THEME.bg, borderBottomWidth: 1, borderColor: APP_THEME.line },
  headerBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: APP_THEME.muted, fontSize: 11, textAlign: 'center', marginTop: 2 },
  scroll: { padding: 12, paddingBottom: 20 },
  deliveryNote: { flexDirection: 'row', gap: 10, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, borderRadius: 12, padding: 12, alignItems: 'center' },
  deliveryNoteUnlocked: { backgroundColor: APP_THEME.gold, borderColor: APP_THEME.gold },
  deliveryNoteText: { color: APP_THEME.mutedLight, fontSize: 11.5, lineHeight: 15 },
  deliveryNoteBold: { fontWeight: '800', color: APP_THEME.white },
  progressTrack: { height: 4, backgroundColor: APP_THEME.line, borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: APP_THEME.gold, borderRadius: 4 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  listHeadText: { color: APP_THEME.muted, fontSize: 11, fontWeight: '600' },
  clearText: { color: APP_THEME.gold, fontSize: 11, fontWeight: '700' },
  item: { flexDirection: 'row', gap: 10, backgroundColor: APP_THEME.card, borderRadius: 12, borderWidth: 1, borderColor: APP_THEME.line, padding: 10, marginBottom: 8 },
  itemImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: APP_THEME.bg },
  itemImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  itemCopy: { flex: 1, gap: 3 },
  itemName: { color: APP_THEME.white, fontSize: 12, fontWeight: '700', lineHeight: 15 },
  itemPriceLine: { color: APP_THEME.muted, fontSize: 11 },
  itemPrice: { color: APP_THEME.white, fontWeight: '800', fontSize: 11 },
  itemEach: { color: APP_THEME.muted, fontSize: 10 },
  itemMrp: { color: APP_THEME.muted, fontSize: 10, textDecorationLine: 'line-through' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4 },
  removeText: { color: APP_THEME.muted, fontSize: 10, fontWeight: '600' },
  lineTotal: { marginLeft: 'auto', color: APP_THEME.white, fontWeight: '800', fontSize: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: APP_THEME.card, padding: 12, borderTopWidth: 1, borderColor: APP_THEME.line, gap: 12 },
  footerAmount: { gap: 1 },
  footerLabel: { color: APP_THEME.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  footerTotal: { color: APP_THEME.white, fontSize: 15, fontWeight: '800' },
  footerItems: { color: APP_THEME.muted, fontSize: 11 },
  proceedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: APP_THEME.gold, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10 },
  proceedText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },
});
