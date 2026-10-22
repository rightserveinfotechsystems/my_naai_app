import { communication } from '../services/communication';
import { DEFAULT_SHOP_SETTINGS } from './shopOrders';

let cached = null;
let inFlight = null;

const asNonNegative = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function normalizeShopSettings(data) {
  return {
    freeDeliveryAbove: asNonNegative(data?.freeDeliveryAbove, DEFAULT_SHOP_SETTINGS.freeDeliveryAbove),
    deliveryFee: asNonNegative(data?.deliveryFee, DEFAULT_SHOP_SETTINGS.deliveryFee),
    discountPercent: Math.min(100, asNonNegative(data?.discountPercent, DEFAULT_SHOP_SETTINGS.discountPercent)),
    codThreshold: asNonNegative(data?.codThreshold, DEFAULT_SHOP_SETTINGS.codThreshold),
    codCharges: asNonNegative(data?.codCharges, DEFAULT_SHOP_SETTINGS.codCharges),
  };
}

export function fetchShopSettings({ force = false } = {}) {
  if (cached && !force) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = communication.shopSettingsGet()
    .then(res => {
      cached = normalizeShopSettings(res?.data);
      return cached;
    })
    .catch(() => communication.shopSettingsGetPublic()
      .then(res => {
        cached = normalizeShopSettings(res?.data);
        return cached;
      })
      .catch(() => {
        cached = { ...DEFAULT_SHOP_SETTINGS };
        return cached;
      }))
    .finally(() => { inFlight = null; });
  return inFlight;
}

export function resetShopSettingsCache() {
  cached = null;
  inFlight = null;
}

export function getCachedShopSettings() {
  return cached || { ...DEFAULT_SHOP_SETTINGS };
}
