import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_THEME } from '../shop/shopTheme';

export function BookingConfirmModal({
  visible,
  onClose,
  onConfirm,
  salon,
  services = [],
  barber = null,
  bookingDate, // ISO yyyy-mm-dd
  dateLabel, // Today / Tomorrow / Day After
  dateFull, // Monday, 14 Oct 2024
  timeLabel, // 10:30 AM
  timeValue, // 10:30
  loading = false,
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const total = services.reduce((s, svc) => s + (Number(svc.price) || 0), 0);
  const totalDuration = services.reduce((s, svc) => s + (Number(svc.durationMinutes) || 0), 0);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { paddingBottom: Math.max(14, insets.bottom + 10) }]} onPress={() => {}}>
          <View style={[styles.accent, { backgroundColor: APP_THEME.gold }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="calendar-outline" size={22} color={APP_THEME.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Confirm your booking</Text>
              <Text style={styles.subtitle}>Review details before we send the request</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={APP_THEME.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Salon */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Ionicons name="storefront-outline" size={13} color={APP_THEME.gold} />
                <Text style={styles.sectionTitle}>Salon</Text>
              </View>
              <View style={styles.salonCard}>
                <Text style={styles.salonName} numberOfLines={1}>{salon?.salonName || 'Salon'}</Text>
                {salon?.addressLine1 ? (
                  <View style={styles.rowGap}>
                    <Ionicons name="location-outline" size={12} color={APP_THEME.muted} />
                    <Text style={styles.salonMeta} numberOfLines={2}>{salon.addressLine1}{salon?.city ? `, ${salon.city}` : ''}</Text>
                  </View>
                ) : null}
                {salon?.genderType ? (
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{String(salon.genderType).toUpperCase()} SALON</Text></View>
                    {salon?.businessHours?.[0] ? <Text style={styles.metaSmall}>{salon.businessHours[0].openingTime}–{salon.businessHours[0].closingTime}</Text> : null}
                  </View>
                ) : null}
              </View>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Ionicons name="cut-outline" size={13} color={APP_THEME.gold} />
                <Text style={styles.sectionTitle}>Services · {services.length}</Text>
                <Text style={styles.sectionAction}>₹{total}</Text>
              </View>
              <View style={styles.listCard}>
                {services.map((s, idx) => (
                  <View key={String(s.serviceId || s.id || idx)} style={[styles.serviceRow, idx !== services.length - 1 && styles.serviceRowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName} numberOfLines={1}>{s.serviceName || s.name || 'Service'}</Text>
                      {s.durationMinutes ? <Text style={styles.serviceSub}>{s.durationMinutes} min</Text> : null}
                    </View>
                    <Text style={styles.servicePrice}>₹{s.price}</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{total}</Text>
                </View>
                {totalDuration > 0 ? <Text style={styles.totalHint}>~ {totalDuration} min estimated</Text> : null}
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Ionicons name="time-outline" size={13} color={APP_THEME.gold} />
                <Text style={styles.sectionTitle}>Date & time</Text>
              </View>
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleIcon}><Ionicons name="calendar-outline" size={14} color={APP_THEME.gold} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleLabel}>Date</Text>
                    <Text style={styles.scheduleValue}>{dateLabel || bookingDate} · {dateFull || bookingDate}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleIcon}><Ionicons name="alarm-outline" size={14} color={APP_THEME.gold} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleLabel}>Time slot</Text>
                    <Text style={styles.scheduleValue}>{timeLabel || timeValue || '--'}</Text>
                  </View>
                </View>
                {barber ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.scheduleRow}>
                      <View style={styles.scheduleIcon}><Ionicons name="person-outline" size={14} color={APP_THEME.gold} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scheduleLabel}>Barber</Text>
                        <Text style={styles.scheduleValue}>{barber.fullName || barber.name || 'Selected'}</Text>
                      </View>
                      {barber.isAvailable !== undefined ? (
                        <View style={[styles.availDot, { backgroundColor: barber.isAvailable ? '#6ED19E' : '#F27B74' }]} />
                      ) : null}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.scheduleRow}>
                      <View style={styles.scheduleIcon}><Ionicons name="people-outline" size={14} color={APP_THEME.muted} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scheduleLabel}>Barber</Text>
                        <Text style={styles.scheduleValueMuted}>Any available barber</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
              <Text style={styles.note}>You can change date, time or barber — close this to edit.</Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} activeOpacity={0.9} disabled={loading}>
              <Ionicons name="pencil-outline" size={14} color={APP_THEME.white} style={{ marginRight: 6 }} />
              <Text style={styles.btnSecondaryText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.7 }]} onPress={onConfirm} activeOpacity={0.9} disabled={loading}>
              {loading ? <ActivityIndicator color={APP_THEME.bg} style={{ marginRight: 8 }} /> : <Ionicons name="checkmark-circle" size={16} color={APP_THEME.bg} style={{ marginRight: 6 }} />}
              <Text style={styles.btnPrimaryText}>{loading ? 'Booking…' : 'Confirm & book'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerHint}>By confirming, salon will be notified instantly.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#1C2121',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#252B2B',
    paddingHorizontal: 14,
    paddingTop: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 28,
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.95 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingTop: 4 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(232,185,126,0.14)', borderWidth: 1, borderColor: 'rgba(232,185,126,0.22)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#080A0A', borderWidth: 1, borderColor: '#252B2B', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', lineHeight: 18, letterSpacing: 0.2 },
  subtitle: { color: '#899191', fontSize: 11, fontWeight: '500', marginTop: 2 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 6, gap: 10 },
  section: { gap: 6 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: '#B7BEBE', fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 },
  sectionAction: { color: APP_THEME.gold, fontSize: 11, fontWeight: '800' },
  salonCard: { backgroundColor: '#080A0A', borderWidth: 1, borderColor: '#252B2B', borderRadius: 12, padding: 10, gap: 6 },
  salonName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  salonMeta: { color: '#B7BEBE', fontSize: 11, flex: 1, lineHeight: 14 },
  rowGap: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  badge: { backgroundColor: 'rgba(232,185,126,0.14)', borderWidth: 1, borderColor: 'rgba(232,185,126,0.22)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  badgeText: { color: APP_THEME.gold, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  metaSmall: { color: APP_THEME.muted, fontSize: 10, fontWeight: '600' },
  listCard: { backgroundColor: '#080A0A', borderWidth: 1, borderColor: '#252B2B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  serviceRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  serviceName: { color: '#fff', fontSize: 12, fontWeight: '700' },
  serviceSub: { color: APP_THEME.muted, fontSize: 10, marginTop: 2 },
  servicePrice: { color: APP_THEME.gold, fontSize: 12, fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#252B2B' },
  totalLabel: { color: '#fff', fontSize: 12, fontWeight: '800' },
  totalValue: { color: '#fff', fontSize: 13, fontWeight: '800' },
  totalHint: { color: APP_THEME.muted, fontSize: 10, marginTop: 4, textAlign: 'right' },
  scheduleCard: { backgroundColor: '#080A0A', borderWidth: 1, borderColor: '#252B2B', borderRadius: 12, padding: 10 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  scheduleIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(232,185,126,0.12)', borderWidth: 1, borderColor: 'rgba(232,185,126,0.18)', justifyContent: 'center', alignItems: 'center' },
  scheduleLabel: { color: APP_THEME.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  scheduleValue: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 1 },
  scheduleValueMuted: { color: '#B7BEBE', fontSize: 12, fontWeight: '600', marginTop: 1 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 6 },
  note: { color: APP_THEME.muted, fontSize: 10, lineHeight: 13, textAlign: 'center', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, backgroundColor: '#080A0A', borderWidth: 1, borderColor: '#252B2B', minHeight: 44,
  },
  btnSecondaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  btnPrimary: {
    flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, backgroundColor: APP_THEME.gold, borderWidth: 1, borderColor: APP_THEME.gold, minHeight: 44,
  },
  btnPrimaryText: { color: '#080A0A', fontSize: 13, fontWeight: '800' },
  footerHint: { color: '#6a7373', fontSize: 10, textAlign: 'center', marginTop: 8 },
});
