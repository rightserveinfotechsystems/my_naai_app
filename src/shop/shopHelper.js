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
    const outer = parsed?.data || parsed;
    const inner = outer?.user || outer?.salon || outer;
    // Build candidate list for each field from all plausible nests
    const candidates = (keys) => {
      const vals = [];
      for (const k of keys) {
        const v = inner?.[k] ?? outer?.[k] ?? parsed?.[k] ?? parsed?.user?.[k] ?? parsed?.salon?.[k] ?? outer?.salon?.[k] ?? inner?.salon?.[k];
        if (v) vals.push(v);
      }
      return vals.find(v => String(v).trim()) || '';
    };
    const rawPhone = candidates(['phoneNumber','phone','mobile','contact','phoneNo','mobileNumber']);
    const digits = String(rawPhone).replace(/\D/g, '');
    const phone = digits.length === 10 ? digits : digits.length > 10 ? digits.slice(-10) : digits.slice(0,10);
    const session = await getShopSession().catch(()=>null);
    const isSalon = session?.role === 'SALON';
    const user = parsed?.salon ? parsed.salon : parsed;
    const merged = { ...outer, ...inner, ...user, ...(user?.salon || {}) };
    const pt = toPoint(merged) || toPoint(inner) || toPoint(outer?.salon) || toPoint(parsed?.salon) || toPoint(outer);
    const nameRaw = candidates(['ownerName','fullName','name','displayName','userName']);
    const lineRaw = candidates(['addressLine1','address','street','shopAddress']);
    const fallbackLine = isSalon ? `${merged.salonName || 'Salon'}, ` + [merged.addressLine1, merged.city].filter(Boolean).join(', ') : '';
    return {
      name: String(nameRaw || merged.ownerName || merged.fullName || merged.name || '').trim(),
      phone: phone,
      line1: String(lineRaw || lineRaw === '' ? lineRaw : merged.addressLine1 || merged.address || fallbackLine).trim() || String(candidates(['addressLine1','address']) || fallbackLine).trim(),
      city: String(candidates(['city']) || merged.city || '').trim(),
      state: normalizeStateName(candidates(['state']) || merged.state || ''),
      pincode: String(String(candidates(['pincode','pinCode','postalCode']) || merged.pincode || '').replace(/\D/g,'').slice(0,6)).trim(),
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
