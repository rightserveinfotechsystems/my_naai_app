import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeStateName } from './stateOptions';
import { toPoint } from './geo';
import { getShopOwnerIdForCurrentUser, getShopSession, buyerName } from './shopBuyer';

export async function getShopOwnerId() {
  try {
    return await getShopOwnerIdForCurrentUser();
  } catch { return 'guest'; }
}

export async function getShopSalonName() {
  try {
    const session = await getShopSession();
    const name = buyerName(session);
    if (name) return name;
    const raw = await AsyncStorage.getItem('mynaaiUser');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.salon?.salonName || parsed?.salonName || parsed?.fullName || parsed?.user?.salon?.salonName || '';
  } catch { return ''; }
}

export async function getShopSessionForCopy() {
  try { return await getShopSession(); } catch { return { userId: null, role: null, user: {} }; }
}

export async function getShopAddressDefaults() {
  try {
    const raw = await AsyncStorage.getItem('mynaaiUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = await getShopSession().catch(()=>null);
    const isSalon = session?.role === 'SALON';
    const user = parsed?.salon ? parsed.salon : parsed;
    const merged = { ...parsed, ...user, ...(user?.salon || {}) };
    const pt = toPoint(merged) || toPoint(merged?.salon) || toPoint(parsed?.salon);
    const fallbackLine = isSalon ? `${merged.salonName || 'Salon'}, ` + [merged.addressLine1, merged.city].filter(Boolean).join(', ') : '';
    return {
      name: merged.ownerName || merged.fullName || merged.name || '',
      phone: merged.phoneNumber || merged.phone || '',
      line1: merged.addressLine1 || merged.address || fallbackLine,
      city: merged.city || '',
      state: normalizeStateName(merged.state || ''),
      pincode: merged.pincode || '',
      ...(pt ? { latitude: pt.latitude, longitude: pt.longitude } : { latitude: null, longitude: null }),
    };
  } catch {
    return null;
  }
}

export function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return `₹ ${value || 0}`;
  return `₹ ${n.toLocaleString('en-IN')}`;
}

export function getSalonCityFallback() {
  return '';
}
