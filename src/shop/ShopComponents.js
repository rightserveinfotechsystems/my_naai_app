import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { APP_THEME } from './shopTheme';
import { discountPercent } from './shopCatalog';
import { getFileUrl } from '../services/communication';

export const ProductPlaceholder = require('../assets/my_naai.png');

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
          <Ionicons name="remove" size={large ? 16 : small ? 12 : 13} color={APP_THEME.bg} />
        </TouchableOpacity>
        <Text style={[styles.stepperQty, large && styles.stepperQtyLarge]}>{qty}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={() => onSet(qty + 1)} hitSlop={8}>
          <Ionicons name="add" size={large ? 16 : small ? 12 : 13} color={APP_THEME.bg} />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[styles.addButton, small && styles.addButtonSmall, large && styles.addButtonLarge]} onPress={onAdd} activeOpacity={0.85}>
      <Text style={[styles.addButtonText, large && styles.addButtonTextLarge]}>ADD</Text>
      <Ionicons name="add" size={12} color={APP_THEME.gold} />
    </TouchableOpacity>
  );
}

// Vertical product card — 2 per row, image fits automatically (contain, no crop)
// Attractive e-commerce styling matching dark theme #080A0A / #1C2121 / #E8B97E
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
      <TouchableOpacity style={styles.cardMedia} onPress={() => onOpen?.(product)} activeOpacity={0.92}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="contain" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="image-outline" size={28} color={APP_THEME.muted} />
          </View>
        )}
        {!product.available ? (
          <View style={styles.stockVeil}>
            <Text style={styles.stockVeilText}>Out of stock</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardName}>{product.name}</Text>
        <Text numberOfLines={1} style={styles.cardMeta}>{product.category.replace(/-/g, ' ')}{product.salonName ? ` • ${product.salonName}` : ''}</Text>

        <View style={styles.cardPriceRow}>
          <View style={styles.cardPriceLeft}>
            <Text style={styles.cardPrice}>₹{product.price}</Text>
            {product.mrp > 0 ? <Text style={styles.cardMrp}>₹{product.mrp}</Text> : null}
          </View>
          {product.rating > 0 ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={9} color={APP_THEME.gold} />
              <Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text>
            </View>
          ) : null}
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
    <TouchableOpacity style={[styles.cartBar, offsetBottom !== undefined ? { bottom: offsetBottom } : null]} onPress={onOpen} activeOpacity={0.9}>
      <View style={styles.cartBarLeft}>
        <View style={styles.cartBarIcon}>
          <Ionicons name="bag-handle" size={16} color={APP_THEME.bg} />
        </View>
        <View>
          <Text style={styles.cartBarItems}>{totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'} in cart</Text>
          <Text style={styles.cartBarTotal}>₹{totals.total}</Text>
        </View>
      </View>
      <View style={styles.cartBarCta}>
        <Text style={styles.cartBarCtaText}>View cart</Text>
        <Ionicons name="chevron-forward" size={15} color={APP_THEME.bg} />
      </View>
    </TouchableOpacity>
  );
}

export function ShopBillCard({ lines, totals }) {
  return (
    <View style={styles.billCard}>
      <Text style={styles.billTitle}>Bill details</Text>
      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Item total</Text>
        <Text style={styles.billValue}>₹{totals.itemTotal}</Text>
      </View>
      {totals.discount > 0 ? (
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, styles.billSaving]}>Order discount{totals.discountPercent ? ` (${totals.discountPercent}%)` : ''}</Text>
          <Text style={[styles.billValue, styles.billSaving]}>- ₹{totals.discount}</Text>
        </View>
      ) : null}
      {totals.savings > 0 ? (
        <View style={styles.billRow}>
          <Text style={[styles.billLabel, styles.billSaving]}>MRP savings</Text>
          <Text style={[styles.billValue, styles.billSaving]}>- ₹{totals.savings}</Text>
        </View>
      ) : null}
      <View style={styles.billRow}>
        <Text style={styles.billLabel}>Delivery fee</Text>
        {totals.deliveryFee === 0 && lines.length > 0 ? (
          <Text style={[styles.billValue, styles.billSaving]}>FREE</Text>
        ) : (
          <Text style={styles.billValue}>{totals.deliveryFee === 0 ? '—' : `₹${totals.deliveryFee}`}</Text>
        )}
      </View>
      {totals.codFee > 0 ? (
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>COD charges</Text>
          <Text style={styles.billValue}>₹{totals.codFee}</Text>
        </View>
      ) : null}
      <View style={[styles.billRow, styles.billTotalRow]}>
        <Text style={styles.billTotalLabel}>To pay</Text>
        <Text style={styles.billTotalValue}>₹{totals.total}</Text>
      </View>
      {totals.savings > 0 ? <Text style={styles.billSaved}>You saved ₹{totals.savings} on this order</Text> : null}
    </View>
  );
}

export function EmptyState({ icon = 'bag-outline', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={APP_THEME.gold} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel ? (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.9}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={15} color={APP_THEME.bg} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={[styles.card, styles.skeleton]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonLines}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '62%' }]} />
        <View style={[styles.skeletonLine, { width: '42%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: APP_THEME.gold,
    backgroundColor: 'rgba(232,185,126,0.12)',
    paddingVertical: 4.5,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 60,
    justifyContent: 'center',
  },
  addButtonSmall: { paddingVertical: 3, paddingHorizontal: 9, minWidth: 54, borderRadius: 6 },
  addButtonLarge: { paddingVertical: 7, paddingHorizontal: 16, minWidth: 84, borderRadius: 8, borderWidth: 1.2 },
  addButtonText: { color: APP_THEME.gold, fontWeight: '800', fontSize: 9.5, letterSpacing: 0.5 },
  addButtonTextLarge: { fontSize: 13 },
  stockChip: {
    backgroundColor: APP_THEME.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_THEME.line,
  },
  stockChipSmall: { paddingHorizontal: 8, paddingVertical: 4 },
  stockChipText: { color: APP_THEME.muted, fontSize: 10, fontWeight: '700' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.gold,
    borderRadius: 6,
    paddingHorizontal: 1.5,
    paddingVertical: 1.5,
    minWidth: 62,
    justifyContent: 'space-between',
  },
  stepperSmall: { minWidth: 54, borderRadius: 6, paddingVertical: 1 },
  stepperLarge: { minWidth: 84, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 2 },
  stepperBtn: { padding: 4, borderRadius: 5 },
  stepperQty: { color: APP_THEME.bg, fontWeight: '800', fontSize: 11, minWidth: 16, textAlign: 'center' },
  stepperQtyLarge: { fontSize: 12 },

  // ---- Vertical card, 2 per row — compact minimized ----
  card: {
    backgroundColor: APP_THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_THEME.line,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardOutOfStock: { opacity: 0.65 },
  offBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
    backgroundColor: APP_THEME.gold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  offBadgeText: { color: APP_THEME.bg, fontSize: 7.5, fontWeight: '800', letterSpacing: 0.2 },
  // Image area — fits automatically, no crop — minimized
  cardMedia: {
    height: 96,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  stockVeil: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(8,10,10,0.84)',
    paddingVertical: 4,
    borderRadius: 7,
    alignItems: 'center',
  },
  stockVeilText: { color: APP_THEME.white, fontSize: 9, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: APP_THEME.line, opacity: 0.9 },
  cardBody: { padding: 7, gap: 2, backgroundColor: APP_THEME.card },
  cardName: { color: APP_THEME.white, fontSize: 10.5, fontWeight: '700', lineHeight: 13, minHeight: 26 },
  cardMeta: { color: APP_THEME.muted, fontSize: 8, fontWeight: '600', textTransform: 'capitalize' },
  cardPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  cardPriceLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  cardPrice: { color: APP_THEME.white, fontWeight: '800', fontSize: 11 },
  cardMrp: { color: APP_THEME.muted, fontSize: 9, textDecorationLine: 'line-through', marginLeft: 3 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.goldWash,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 5,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(232,185,126,0.22)',
  },
  ratingText: { color: APP_THEME.gold, fontSize: 8, fontWeight: '800' },
  cardAction: { marginTop: 5, alignItems: 'center' },

  cartBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: APP_THEME.gold,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 20,
    zIndex: 30,
  },
  cartBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBarIcon: { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(8,10,10,0.12)', justifyContent: 'center', alignItems: 'center' },
  cartBarItems: { color: APP_THEME.bg, fontSize: 11, fontWeight: '700' },
  cartBarTotal: { color: APP_THEME.bg, fontSize: 14, fontWeight: '800' },
  cartBarCta: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: APP_THEME.bg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  cartBarCtaText: { color: APP_THEME.white, fontWeight: '800', fontSize: 12 },

  billCard: {
    backgroundColor: APP_THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_THEME.line,
    padding: 12,
  },
  billTitle: { color: APP_THEME.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  billLabel: { color: APP_THEME.mutedLight, fontSize: 11, fontWeight: '500' },
  billValue: { color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  billSaving: { color: APP_THEME.green },
  billTotalRow: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: APP_THEME.line },
  billTotalLabel: { color: APP_THEME.white, fontSize: 12, fontWeight: '800' },
  billTotalValue: { color: APP_THEME.white, fontSize: 14, fontWeight: '800' },
  billSaved: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: APP_THEME.line, color: APP_THEME.green, fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', padding: 28, marginTop: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { color: APP_THEME.white, fontSize: 15, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  emptyMessage: { color: APP_THEME.muted, fontSize: 12, textAlign: 'center', lineHeight: 16, marginBottom: 14, paddingHorizontal: 18 },
  emptyAction: { backgroundColor: APP_THEME.gold, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyActionText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },

  skeleton: { borderColor: APP_THEME.line, backgroundColor: APP_THEME.card },
  skeletonImage: { height: 96, backgroundColor: '#202525' },
  skeletonLines: { padding: 7, gap: 6 },
  skeletonLine: { height: 8, backgroundColor: APP_THEME.line, borderRadius: 5 },
});
