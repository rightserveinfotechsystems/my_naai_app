import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BLINKIT, SHOP_STYLES } from './shopTheme';
import { discountPercent } from './shopCatalog';
import { getFileUrl } from '../services/communication';

export const ProductPlaceholder = require('../assets/my_naai.png');

// Blinkit ADD button vs stepper
export function ShopQuantityControl({ qty, onAdd, onSet, disabled = false, small = false, large = false }) {
  if (disabled) {
    return (
      <View style={[styles.stockChip, small && styles.stockChipSmall]}>
        <Text style={styles.stockChipText}>Out of stock</Text>
      </View>
    );
  }
  if (qty > 0) {
    return (
      <View style={[styles.stepper, small && styles.stepperSmall, large && styles.stepperLarge]}>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onSet(qty - 1)} hitSlop={8}>
          <Ionicons name="remove" size={large ? 18 : small ? 12 : 14} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.stepperQty, large && styles.stepperQtyLarge]}>{qty}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onSet(qty + 1)} hitSlop={8}>
          <Ionicons name="add" size={large ? 18 : small ? 12 : 14} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[styles.addButton, small && styles.addButtonSmall, large && styles.addButtonLarge]} onPress={onAdd} activeOpacity={0.8}>
      <Text style={[styles.addButtonText, large && styles.addButtonTextLarge]}>ADD</Text>
    </TouchableOpacity>
  );
}

export function ShopProductCard({ product, qty, onAdd, onSetQty, onOpen, style }) {
  const off = discountPercent(product);
  const imageUri = product.image ? getFileUrl(product.image) : null;
  return (
    <View style={[styles.card, !product.available && styles.cardOutOfStock, style]}>
      {off > 0 && (
        <View style={styles.offBadge}>
          <Text style={styles.offBadgeText}>{off}% OFF</Text>
        </View>
      )}
      <TouchableOpacity style={styles.cardMedia} onPress={() => onOpen?.(product)} activeOpacity={0.9}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="image-outline" size={28} color={BLINKIT.muted} />
          </View>
        )}
        {!product.available && (
          <View style={styles.stockVeil}>
            <Text style={styles.stockVeilText}>Out of stock</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardName}>{product.name}</Text>
        <Text numberOfLines={1} style={styles.cardMeta}>{product.category.replace(/-/g, ' ')} {product.salonName ? `• ${product.salonName}` : ''}</Text>
        <View style={styles.cardPriceRow}>
          <View style={styles.cardPriceLeft}>
            <Text style={styles.cardPrice}>₹{product.price}</Text>
            {product.mrp > 0 && <Text style={styles.cardMrp}>₹{product.mrp}</Text>}
          </View>
          {product.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardAction}>
          <ShopQuantityControl qty={qty} onAdd={() => onAdd(product)} onSet={next => onSetQty(product, next)} disabled={!product.available} />
        </View>
      </View>
    </View>
  );
}

export function ShopCartBar({ totals, onOpen, offsetBottom }) {
  if (!totals.itemCount) return null;
  return (
    <TouchableOpacity style={[styles.cartBar, offsetBottom !== undefined && { bottom: offsetBottom }]} onPress={onOpen} activeOpacity={0.9}>
      <View style={styles.cartBarLeft}>
        <View style={styles.cartBarIcon}>
          <Ionicons name="bag-handle" size={18} color="#fff" />
        </View>
        <View>
          <Text style={styles.cartBarItems}>{totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}</Text>
          <Text style={styles.cartBarTotal}>₹{totals.total}</Text>
        </View>
      </View>
      <View style={styles.cartBarCta}>
        <Text style={styles.cartBarCtaText}>View Cart</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export function ShopBillCard({ lines, totals }) {
  // totals is already computed
  return (
    <View style={styles.billCard}>
      <Text style={styles.billTitle}>Bill details</Text>
      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Item total</Text>
        <Text style={styles.billValue}>₹{totals.itemTotal}</Text>
      </View>
      {totals.discount > 0 && (
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, styles.billSaving]}>Order discount{totals.discountPercent ? ` (${totals.discountPercent}%)` : ''}</Text>
          <Text style={[styles.billValue, styles.billSaving]}>- ₹{totals.discount}</Text>
        </View>
      )}
      {totals.savings > 0 && (
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, styles.billSaving]}>MRP savings</Text>
          <Text style={[styles.billValue, styles.billSaving]}>- ₹{totals.savings}</Text>
        </View>
      )}
      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Delivery fee</Text>
        {totals.deliveryFee === 0 && lines.length > 0 ? (
          <Text style={[styles.billValue, styles.billSaving]}>FREE</Text>
        ) : (
          <Text style={styles.billValue}>{totals.deliveryFee === 0 ? '—' : `₹${totals.deliveryFee}`}</Text>
        )}
      </View>
      {totals.codFee > 0 && (
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>COD charges</Text>
          <Text style={styles.billValue}>₹{totals.codFee}</Text>
        </View>
      )}
      <View style={[styles.billRow, styles.billTotalRow]}>
        <Text style={styles.billTotalLabel}>To pay</Text>
        <Text style={styles.billTotalValue}>₹{totals.total}</Text>
      </View>
      {totals.savings > 0 && <Text style={styles.billSaved}>You saved ₹{totals.savings} on this order</Text>}
    </View>
  );
}

export function EmptyState({ icon = 'bag-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={42} color={BLINKIT.green} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={[styles.card, styles.skeleton]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ADD button - Blinkit style: green outline
  addButton: {
    borderWidth: 1,
    borderColor: BLINKIT.green,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addButtonSmall: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    minWidth: 64,
    borderRadius: 6,
  },
  addButtonLarge: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    minWidth: 110,
    borderRadius: 10,
    borderWidth: 1.2,
  },
  addButtonText: { color: BLINKIT.green, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  addButtonTextLarge: { fontSize: 14 },
  stockChip: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  stockChipSmall: { paddingHorizontal: 8, paddingVertical: 4 },
  stockChipText: { color: '#999', fontSize: 11, fontWeight: '700' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLINKIT.green,
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
    minWidth: 76,
    justifyContent: 'space-between',
    shadowColor: BLINKIT.green,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  stepperSmall: { minWidth: 64, borderRadius: 6, paddingVertical: 1 },
  stepperLarge: { minWidth: 110, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 4 },
  stepperBtn: { padding: 6, borderRadius: 6 },
  stepperQty: { color: '#fff', fontWeight: '800', fontSize: 13, minWidth: 20, textAlign: 'center' },
  stepperQtyLarge: { fontSize: 15 },
  // Product card Blinkit
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden',
    flex: 1,
  },
  cardOutOfStock: { opacity: 0.6 },
  offBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: BLINKIT.green,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  offBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  cardMedia: { aspectRatio: 1, backgroundColor: '#fafafa', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  stockVeil: { position: 'absolute', bottom: 8, left: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 4, borderRadius: 8, alignItems: 'center' },
  stockVeilText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 10, gap: 4 },
  cardName: { color: '#1a1a1a', fontSize: 12.5, fontWeight: '700', lineHeight: 16, minHeight: 32 },
  cardMeta: { color: '#999', fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  cardPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardPriceLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardPrice: { color: '#1a1a1a', fontWeight: '800', fontSize: 13 },
  cardMrp: { color: '#999', fontSize: 11, textDecorationLine: 'line-through', marginLeft: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLINKIT.green, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 3 },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardAction: { marginTop: 8, alignItems: 'center' },
  // Cart bar Blinkit green
  cartBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: BLINKIT.green,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: BLINKIT.green,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBarIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  cartBarItems: { color: '#fff', fontSize: 12, fontWeight: '700', opacity: 0.9 },
  cartBarTotal: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cartBarCta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cartBarCtaText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  // Bill card
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 14,
  },
  billTitle: { color: '#888', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  billLabel: { color: '#666', fontSize: 12, fontWeight: '500' },
  billValue: { color: '#1a1a1a', fontSize: 12, fontWeight: '700' },
  billSaving: { color: BLINKIT.green },
  billTotalRow: { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e8e8e8', borderStyle: 'dashed' },
  billTotalLabel: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },
  billTotalValue: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
  billSaved: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e8e8e8', borderStyle: 'dashed', color: BLINKIT.green, fontSize: 11, fontWeight: '700' },
  // Empty
  empty: { alignItems: 'center', padding: 32, marginTop: 20 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { color: '#1a1a1a', fontSize: 17, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyMessage: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  emptyAction: { backgroundColor: BLINKIT.green, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyActionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  // Skeleton
  skeleton: { borderColor: '#f0f0f0' },
  skeletonImage: { aspectRatio: 1, backgroundColor: '#f2f2f2' },
  skeletonLines: { padding: 10, gap: 8 },
  skeletonLine: { height: 10, backgroundColor: '#f2f2f2', borderRadius: 6 },
});
