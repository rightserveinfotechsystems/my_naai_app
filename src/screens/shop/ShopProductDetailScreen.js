import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getFileUrl } from '../../services/communication';
import { normalizeShopProduct, discountPercent, categoryLabel, SHOP_GENDERS } from '../../shop/shopCatalog';
import { cartTotals } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopQuantityControl, ShopProductCard, ShopCartBar } from '../../shop/ShopComponents';
import { APP_THEME } from '../../shop/shopTheme';
import { getShopOwnerId } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const ShopProductDetailScreen = ({ route, navigation }) => {
  const productId = String(route.params?.productId || '');
  const [ownerId, setOwnerId] = useState('guest');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => { const id = await getShopOwnerId(); setOwnerId(id); })();
    fetchShopSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    function extractProducts(res) {
      if (!res) return { rows: [], totalPages: 1 };
      const body = res?.data?.products ? res.data : res?.products ? res : res?.data?.data?.products ? res.data.data : res;
      const rows = Array.isArray(body?.products) ? body.products : Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      const pages = body?.pagination?.totalPages || body?.data?.pagination?.totalPages || res?.pagination?.totalPages || res?.data?.pagination?.totalPages || 1;
      return { rows, totalPages: pages };
    }
    function rowsFromRes(r) {
      return extractProducts(r).rows;
    }
    (async () => {
      setLoading(true);
      try {
        const first = await communication.shopProductList({ page: 1, searchString: '' });
        const { rows, totalPages } = extractProducts(first);
        const pages = Math.min(Number(totalPages) || 1, 10);
        let restRows = [];
        if (pages > 1) {
          const rest = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              communication.shopProductList({ page: i + 2, searchString: '' })
                .then(r => rowsFromRes(r))
                .catch(() => [])
            )
          );
          restRows = rest.flat();
        }
        const list = [...rows, ...restRows].map((item, idx) => normalizeShopProduct(item, idx));
        if (!cancelled) setProducts(list);
      } catch { if (!cancelled) setProducts([]); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshCart = async (oid) => {
    try { const raw = await AsyncStorage.getItem(`mynaaiShopCart:${oid}`); const lines = raw ? JSON.parse(raw) : []; setCart(Array.isArray(lines) ? lines : []); } catch { setCart([]); }
  };
  useEffect(() => { if (ownerId) refreshCart(ownerId); }, [ownerId]);
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SHOP_CART_UPDATED', () => { if (ownerId) refreshCart(ownerId); });
    const focus = navigation.addListener ? navigation.addListener('focus', () => { if (ownerId) refreshCart(ownerId); }) : () => {};
    return () => { sub.remove(); if (focus && focus.remove) focus.remove(); };
  }, [ownerId, navigation]);

  const persist = async (lines) => { try { await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify(lines)); } catch {} setCart(lines); DeviceEventEmitter.emit('SHOP_CART_UPDATED'); };

  const add = async (product, qty = 1) => {
    const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
    const lines = raw ? JSON.parse(raw) : [];
    const pid = String(product?.id || product?.productId || '');
    const idx = lines.findIndex(l => l.productId === pid);
    if (idx >= 0) lines[idx].qty = Math.min(99, lines[idx].qty + Math.max(1, Math.round(Number(qty) || 1)));
    else lines.push({ productId: pid, name: product.name, price: Number(product.price) || 0, mrp: Number(product.mrp) || 0, image: product.image || '', category: product.category || '', gender: product.gender || '', salonName: product.salonName || '', qty: Math.max(1, Math.round(Number(qty) || 1)) });
    await persist(lines);
    try { await communication.shopCartAdd({ productId: pid, qty }); } catch {}
  };
  const setQty = async (pid, next) => {
    const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
    let lines = raw ? JSON.parse(raw) : [];
    const n = Math.round(Number(next) || 0);
    if (n <= 0) lines = lines.filter(l => l.productId !== String(pid));
    else { const idx = lines.findIndex(l => l.productId === String(pid)); if (idx >= 0) lines[idx].qty = Math.min(99, n); }
    await persist(lines);
    try { if (n <= 0) await communication.shopCartRemove({ productId: String(pid) }); else await communication.shopCartSetQty({ productId: String(pid), qty: n }); } catch {}
  };

  useEffect(() => { setActiveImage(0); }, [productId]);

  const product = useMemo(() => products.find(p => String(p.id) === productId) || null, [products, productId]);
  const images = useMemo(() => (product?.images?.length ? product.images : product?.image ? [product.image] : []), [product]);
  const similar = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.available && p.category === product.category && String(p.id) !== String(product.id)).sort((a,b)=>b.rating-a.rating||a.name.localeCompare(b.name)).slice(0,6);
  }, [products, product]);
  const totals = useMemo(() => cartTotals(cart, settings), [cart, settings]);
  const qtyFor = id => cart.find(l => l.productId === String(id))?.qty || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={['top']}>
        <ActivityIndicator size="large" color={APP_THEME.gold} />
        <Text style={styles.loadingText}>Loading product…</Text>
      </SafeAreaView>
    );
  }
  if (!product) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={['top']}>
        <Ionicons name="cube-outline" size={48} color={APP_THEME.muted} />
        <Text style={styles.emptyTitle}>Product not available</Text>
        <Text style={styles.emptySub}>It may have been removed from the catalog.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to shop</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const off = discountPercent(product);
  const genderLabel = SHOP_GENDERS.find(g => g.id === product.gender)?.label || 'Unisex';
  const cartBarOffset = 12 + Math.max(insets.bottom, 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={20} color={APP_THEME.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ShopCart')} style={styles.headerBtn}>
          <Ionicons name="bag-handle-outline" size={20} color={APP_THEME.white} />
          {totals.itemCount > 0 && <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{totals.itemCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 90 + Math.max(insets.bottom, 6) }]}>
        <View style={styles.hero}>
          {images.length ? (
            <Image source={{ uri: getFileUrl(images[Math.min(activeImage, images.length-1)] || '') }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}><Ionicons name="image-outline" size={48} color={APP_THEME.muted} /></View>
          )}
          {!product.available && <View style={styles.veil}><Text style={styles.veilText}>Out of stock</Text></View>}
          {off > 0 && <View style={styles.heroOff}><Text style={styles.heroOffText}>{off}% off</Text></View>}
        </View>
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {images.map((img, idx) => (
              <TouchableOpacity key={img} style={[styles.thumb, idx === activeImage && styles.thumbActive]} onPress={() => setActiveImage(idx)}>
                <Image source={{ uri: getFileUrl(img) }} style={styles.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.tags}>
          <View style={styles.tag}><Text style={styles.tagText}>{categoryLabel(product.category)}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{genderLabel}</Text></View>
          <View style={[styles.tag, product.available ? styles.tagGold : styles.tagRed]}>
            <Text style={[styles.tagText, product.available ? styles.tagTextGold : styles.tagTextRed]}>{product.available ? 'In stock' : 'Out of stock'}</Text>
          </View>
        </View>

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.seller}>{product.salonName ? `Sold by ${product.salonName}` : 'Supplied by My Naai'}</Text>

        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.mrp > 0 && <Text style={styles.mrp}>₹{product.mrp}</Text>}
            {off > 0 && <View style={styles.offInline}><Text style={styles.offInlineText}>{off}% off</Text></View>}
          </View>
          {product.rating > 0 && (
            <View style={styles.rating}><Ionicons name="star" size={10} color={APP_THEME.gold} /><Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text></View>
          )}
        </View>

        <View style={styles.actionRow}>
          <ShopQuantityControl qty={qtyFor(product.id)} onAdd={() => add(product,1)} onSet={next => setQty(product.id, next)} disabled={!product.available} large />
          <Text style={styles.actionHint}>{qtyFor(product.id) ? `${qtyFor(product.id)} in cart` : 'Add to cart for salon supply'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About this product</Text>
          <Text style={styles.cardText}>{product.description || `${categoryLabel(product.category)} pick${product.salonName ? ` from ${product.salonName}` : ' from the Naai Shop catalog'} — delivered to your salon in 1–2 days.`}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}><Ionicons name="car-outline" size={16} color={APP_THEME.gold} /><Text style={styles.cardTitle}>Delivery</Text></View>
          <View style={styles.deliveryLine}><Ionicons name="flash" size={13} color={APP_THEME.gold} /><Text style={styles.deliveryText}>Next-day delivery to your salon · {settings && product.price >= settings.freeDeliveryAbove ? 'FREE on this item' : `free above ₹${settings?.freeDeliveryAbove || 499}`}</Text></View>
          <View style={styles.deliveryLine}><Ionicons name="cash-outline" size={13} color={APP_THEME.gold} /><Text style={styles.deliveryText}>{settings?.codThreshold > 0 && product.price > settings.codThreshold ? 'Online payment via UPI, cards & netbanking' : 'Cash on delivery available • online via UPI, cards & netbanking'}</Text></View>
          <View style={styles.deliveryLine}><Ionicons name="shield-checkmark-outline" size={13} color={APP_THEME.gold} /><Text style={styles.deliveryText}>Free cancellation until order goes out for delivery</Text></View>
        </View>

        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>You may also like</Text>
            <View style={styles.similarGrid}>
              {similar.map(p => (
                <ShopProductCard key={p.id} product={p} qty={qtyFor(p.id)} onAdd={add} onSetQty={(prod, next)=>setQty(prod.id, next)} onOpen={(prod)=> navigation.replace('ShopProductDetail', { productId: prod.id })} style={styles.similarCard} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <ShopCartBar totals={totals} onOpen={() => navigation.navigate('ShopCart')} offsetBottom={cartBarOffset} />
    </SafeAreaView>
  );
};

export default ShopProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: APP_THEME.line, backgroundColor: APP_THEME.bg },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800' },
  headerBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: APP_THEME.gold, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  headerBadgeText: { color: APP_THEME.bg, fontSize: 10, fontWeight: '800' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_THEME.bg, gap: 8 },
  loadingText: { color: APP_THEME.muted, marginTop: 8 },
  emptyTitle: { color: APP_THEME.white, fontSize: 15, fontWeight: '800', marginTop: 12 },
  emptySub: { color: APP_THEME.muted, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  backBtn: { marginTop: 14, backgroundColor: APP_THEME.gold, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: APP_THEME.bg, fontWeight: '800' },
  scroll: { paddingBottom: 90 },
  hero: { aspectRatio: 4/3, backgroundColor: '#101414', overflow: 'hidden', borderWidth: 1, borderColor: APP_THEME.line, borderRadius: 18, marginHorizontal: 12, marginTop: 8 },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#101414' },
  veil: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  veilText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  heroOff: { position: 'absolute', top: 12, left: 12, backgroundColor: APP_THEME.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  heroOffText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 11 },
  thumbs: { padding: 12, gap: 8 },
  thumb: { width: 52, height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: APP_THEME.line, overflow: 'hidden', backgroundColor: APP_THEME.card },
  thumbActive: { borderColor: APP_THEME.gold, backgroundColor: APP_THEME.card },
  thumbImg: { width: '100%', height: '100%' },
  tags: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line },
  tagText: { color: APP_THEME.mutedLight, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  tagGold: { backgroundColor: APP_THEME.goldWash, borderColor: 'rgba(232,185,126,0.22)' },
  tagRed: { backgroundColor: 'rgba(242,123,116,0.12)', borderColor: 'rgba(242,123,116,0.22)' },
  tagTextGold: { color: APP_THEME.gold },
  tagTextRed: { color: APP_THEME.red },
  name: { color: APP_THEME.white, fontSize: 16, fontWeight: '800', paddingHorizontal: 14, marginTop: 12, lineHeight: 21 },
  seller: { color: APP_THEME.muted, fontSize: 11, paddingHorizontal: 14, marginTop: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginTop: 10 },
  priceLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { color: APP_THEME.white, fontSize: 17, fontWeight: '800' },
  mrp: { color: APP_THEME.muted, fontSize: 12, textDecorationLine: 'line-through' },
  offInline: { backgroundColor: APP_THEME.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  offInlineText: { color: APP_THEME.bg, fontSize: 10, fontWeight: '800' },
  rating: { flexDirection: 'row', alignItems: 'center', backgroundColor: APP_THEME.goldWash, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: 'rgba(232,185,126,0.18)' },
  ratingText: { color: APP_THEME.gold, fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, marginTop: 14 },
  actionHint: { color: APP_THEME.muted, fontSize: 11, fontWeight: '600' },
  card: { margin: 12, padding: 12, backgroundColor: APP_THEME.card, borderRadius: 12, borderWidth: 1, borderColor: APP_THEME.line },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { color: APP_THEME.white, fontSize: 12, fontWeight: '800' },
  cardText: { color: APP_THEME.mutedLight, fontSize: 11.5, lineHeight: 17 },
  deliveryLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  deliveryText: { color: APP_THEME.mutedLight, fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 14 },
  similarSection: { padding: 12 },
  similarTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800', marginBottom: 10 },
  similarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  similarCard: { width: '48.5%', marginBottom: 8 },
});
