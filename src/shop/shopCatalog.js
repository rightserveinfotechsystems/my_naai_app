// Ported from my-naai-web/src/lib/shopCatalog.js — Blinkit-style catalog rules for mobile
export const SHOP_CATEGORIES = [
  { id: 'hair-care', label: 'Hair care' },
  { id: 'beard-grooming', label: 'Beard & grooming' },
  { id: 'skin-face', label: 'Skin & face' },
  { id: 'fragrance', label: 'Fragrance' },
  { id: 'hair-colour', label: 'Hair colour' },
  { id: 'tools-equipment', label: 'Tools & equipment' },
  { id: 'kits-sets', label: 'Kits & sets' },
];

export const SHOP_GENDERS = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'unisex', label: 'Unisex' },
];

export const PRICE_RANGES = [
  { id: 'all', label: 'Any price' },
  { id: 'under500', label: 'Under ₹500' },
  { id: '500to1000', label: '₹500–₹1,000' },
  { id: 'over1000', label: '₹1,000+' },
];

export const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
];

const CATEGORY_LABELS = Object.fromEntries(SHOP_CATEGORIES.map(c => [c.id, c.label]));
export const GENDER_LABELS = Object.fromEntries(SHOP_GENDERS.map(g => [g.id, g.label]));

const CATEGORY_RULES = [
  ['tools-equipment', ['clipper', 'trimmer', 'straight razor', 'razor', 'shaver', 'comb', 'cape', 'apron', 'towel', 'scissor', 'dryer', 'styler', 'straightener', 'curling iron', 'curler', 'mirror stand']],
  ['kits-sets', ['kit', 'combo', 'bundle', /(^|[^a-z])sets?([^a-z]|$)/i]],
  ['fragrance', ['perfume', 'deodorant', 'deo', 'cologne', 'attar']],
  ['hair-colour', ['colour', 'color', 'henna', 'dye', 'greys']],
  ['beard-grooming', ['beard', 'mustache', 'stubble', 'pomade']],
  ['skin-face', ['face', 'skin', 'sunscreen', 'spf', 'moisturiser', 'moisturizer', 'lotion', 'toner', 'cleanser', 'scrub', 'face mask', 'glow', 'brow', 'lashes', 'lip']],
  ['hair-care', ['shampoo', 'conditioner', 'serum', 'oil', 'spa', 'keratin', 'gel', 'hairspray', 'hair spray', 'hair mask', 'balm', 'butter', 'treatment', 'fall control', 'fall', 'scalp', 'hair']],
];

const GENDER_MEN_RULES = ['beard', 'mustache', 'stubble', 'pomade', "men's", 'for men', 'groom', 'barber'];
const GENDER_WOMEN_RULES = ['women', 'woman', 'ladies', 'bridal', 'lashes', 'lipstick', "women's", 'for women'];

function words(value) {
  return String(value || '').toLowerCase();
}

function keywordMatches(text, keyword) {
  if (keyword instanceof RegExp) return keyword.test(text);
  return text === keyword || text.includes(keyword);
}

function readExplicitCategory(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  const direct = SHOP_CATEGORIES.find(c => c.id === text || c.label.toLowerCase() === text);
  if (direct) return direct.id;
  const rule = CATEGORY_RULES.find(([, keywords]) => keywords.some(k => keywordMatches(text, k)));
  return rule ? rule[0] : '';
}

function readExplicitGender(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  if (['men', 'male', 'm', "men's", 'for men'].includes(text)) return 'men';
  if (['women', 'woman', 'female', 'f', "women's", 'for women', 'ladies'].includes(text)) return 'women';
  if (['unisex', 'all', 'both', 'family'].includes(text)) return 'unisex';
  return '';
}

function sellerGender(product) {
  const type = String(product?.salon?.genderType || product?.salonGenderType || '').trim().toUpperCase();
  if (type === 'MALE') return 'men';
  if (type === 'FEMALE') return 'women';
  return '';
}

export function inferCategory(name) {
  const text = words(name);
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some(k => keywordMatches(text, k))) return category;
  }
  return 'hair-care';
}

export function inferGender(name) {
  const text = words(name);
  if (text.includes('unisex') || text.includes('family')) return 'unisex';
  const men = GENDER_MEN_RULES.some(w => text.includes(w));
  const women = GENDER_WOMEN_RULES.some(w => text.includes(w));
  if (men && !women) return 'men';
  if (women && !men) return 'women';
  if (men && women) return 'unisex';
  return '';
}

export function parseProductImages(item = {}) {
  let raw = item.productImages ?? item.images ?? item.productImage ?? item.image ?? '';
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try { raw = JSON.parse(trimmed); } catch { raw = trimmed; }
    }
    if (typeof raw === 'string') raw = raw.split(/[,|]+/);
  }
  if (!Array.isArray(raw)) raw = raw ? [raw] : [];
  const seen = new Set();
  const images = [];
  raw.forEach(value => {
    const text = String(value || '').trim();
    if (text && !seen.has(text)) { seen.add(text); images.push(text); }
  });
  return images;
}

export function normalizeShopProduct(item = {}, index = 0) {
  const id = item.productId || item.id || `shop-product-${index}`;
  const name = item.productName || item.name || 'Untitled product';
  const price = Math.max(0, Number(item.price) || 0);
  const rawMrp = Number(item.mrp ?? item.marketPrice ?? item.mrpPrice ?? 0);
  const mrp = rawMrp > price ? rawMrp : 0;
  const salon = item.salon || {};
  const images = parseProductImages(item);
  return {
    id,
    name,
    price,
    mrp,
    rating: Number(item.rating || 0),
    reviews: item.reviews ?? item.reviewCount ?? '',
    available: item.isAvailable ?? item.available ?? true,
    image: images[0] || '',
    images,
    description: item.description || item.productDescription || '',
    salonName: salon.salonName || item.salonName || '',
    salonGenderType: String(salon.genderType || item.salonGenderType || '').toUpperCase(),
    category: readExplicitCategory(item.category || item.categoryName) || inferCategory(name),
    gender: readExplicitGender(item.gender || item.genderType) || inferGender(name) || sellerGender(item) || 'unisex',
  };
}

export function categoryLabel(id) {
  return CATEGORY_LABELS[id] || id;
}

export function categoryChipsFor(products) {
  const seen = new Set(SHOP_CATEGORIES.map(c => c.id));
  const extra = [];
  for (const p of products || []) {
    if (p?.category && !seen.has(p.category)) {
      seen.add(p.category);
      extra.push({ id: p.category, label: p.category.charAt(0).toUpperCase() + p.category.slice(1).replace(/[-_]/g, ' ') });
    }
  }
  return [...SHOP_CATEGORIES, ...extra];
}

export function matchesPriceRange(price, rangeId) {
  switch (rangeId) {
    case 'under500': return price < 500;
    case '500to1000': return price >= 500 && price <= 1000;
    case 'over1000': return price > 1000;
    default: return true;
  }
}

export const DEFAULT_SHOP_FILTERS = Object.freeze({
  search: '',
  category: 'all',
  gender: 'all',
  priceRange: 'all',
  sort: 'popular',
});

export function applyShopFilters(products, filters = DEFAULT_SHOP_FILTERS) {
  const list = Array.isArray(products) ? products : [];
  const search = String(filters.search || '').trim().toLowerCase();
  const filtered = list.filter(p => {
    if (!p?.available) return false;
    if (search && !`${p.name} ${p.salonName} ${p.description}`.toLowerCase().includes(search)) return false;
    if (filters.category && filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.gender && filters.gender !== 'all' && p.gender !== filters.gender) return false;
    if (!matchesPriceRange(p.price, filters.priceRange)) return false;
    return true;
  });
  const sort = filters.sort || 'popular';
  filtered.sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price || a.name.localeCompare(b.name);
    if (sort === 'price-desc') return b.price - a.price || a.name.localeCompare(b.name);
    return b.rating - a.rating || a.name.localeCompare(b.name);
  });
  return filtered;
}

export function discountPercent(product) {
  if (!product?.mrp || product.mrp <= product.price) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}
