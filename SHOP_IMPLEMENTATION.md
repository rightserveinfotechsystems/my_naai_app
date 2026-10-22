# Naai Shop — Blinkit-style E-commerce for Salon Mobile App

This document explains the new **Shop** tab added for salon partners to purchase salon-related stock from the same panel — matching the web implementation at `my-naai-web` and using the **same REST API contract**.

## 1. What was added

* A new bottom-tab **Shop** for the `SALON` role — the tab order now mirrors the website:

  ```
  Queue | History | Shop (Blinkit) | Products | Account
  ```
  Customer tab (`Salon Naai`, `Booked Salon`, `Products`, `Account`) is untouched.

* A full Blinkit/Zepto-inspired commerce flow inside the same navigation stack:

  ```
  Shop (catalog) → Product detail → Cart → Checkout → Orders → Order detail
  ```

  Every screen reuses the **same backend** the website already uses (`https://backend.mynaai.in`):

  * `POST /api/shop-products/list`
  * `POST /api/shop-cart/{get,add,set-qty,remove,clear}`
  * `POST /api/shop-orders/{create,list,get-by-id,cancel}`
  * `POST /api/shop-settings/get`

  The mobile `src/services/communication.js` was extended with those calls — identical payloads and auth headers as `my-naai-web/src/lib/api.js`.

## 2. Design — Blinkit

Visual language follows Blinkit, not the existing dark salon theme:

* **Header** — Blinkit green (`#0C831F`) with the yellow 24-hour delivery pill, salon city/location line, and a white search bar with rounded corners and soft shadow — same as the Blinkit home header.
* **Category filters** — horizontal scroll chips (Hair care, Beard & grooming, Skin & face…) above a second row of gender + price chips. Selecting a chip re-filters in-memory (no extra round-trip) using `applyShopFilters` from the web catalog rules.
* **Product cards** — white, 14 px radius, 1 px `#e8e8e8` border. Square image, `% off` green badge, 2-line name, price + struck-through MRP, green rating chip, and the signature Blinkit **ADD** button (green outline, white fill) that flips to a green **stepper** (`−  qty  +`) once quantity > 0. Out-of-stock shows a dimmed veil.
* **Grid** — 2-column masonry, `gap: 8`, exactly like Zepto/Blinkit on a 5–6" phone.
* **Floating cart bar** — green capsule at the bottom with bag icon, item count, total and “View cart →”. On the Shop tab it sits **above** the dark bottom tab bar (`bottom: 70`).
* **Product detail** — large hero image with thumbnail strip, tags (category, gender, in-stock), price row with MRP/off, large ADD/stepper, “About this product”, and a **Delivery** card (free-above threshold, COD threshold + charges, cancellation note) driven by `shop_settings`. “You may also like” reuses the same card.
* **Cart** — Blinkit yellow/green delivery banner with free-delivery progress, item list (72 px thumb + price/mrp + stepper + remove), bill card and sticky green **Proceed to checkout** footer.
* **Checkout** — address form (prefilled from the salon profile), bill card, COD vs **Pay online** options (Razorpay, `rzp_live_ST8yVm3RaFMiHW`), and a success view with order id, ETA and action to **Track order**.
* **Orders** — pill tabs (Active / All / Delivered / Cancelled), order cards with icon/tone, ETA and tracker.
* **Order detail** — timeline tracker (`placed → packed → shipped → delivered` → `cancelled` branch), items, address, payment, cancel button and support note.

Color palette:

```
Blinkit green: #0C831F    Delivery banner yellow: #FFC141
Green wash:    rgba(12,131,31,0.08)
Light bg:      #f7f7f7 / #ffffff
Text dark:     #1a1a1a, muted #888
```

## 3. File map

```
src/services/communication.js   — added shop API methods + getFileUrl helper
src/shop/shopCatalog.js         — port of my-naai-web/src/lib/shopCatalog.js
src/shop/shopOrders.js          — port of shopOrders.js adapted to AsyncStorage
src/shop/shopSettings.js        — admin shop settings cache
src/shop/shopSync.js            — server cart/order sync (mapServer* + push helpers)
src/shop/shopHelper.js          — salonId/name helpers, formatCurrency
src/shop/shopTheme.js           — BLINKIT palette
src/shop/ShopComponents.js      — ShopQuantityControl, ShopProductCard, ShopCartBar, ShopBillCard, EmptyState, Skeleton
src/screens/shop/ShopScreen.js              — main catalog (search, chips, grid, cart bar)
src/screens/shop/ShopProductDetailScreen.js — gallery, price, delivery, similar, add-to-cart
src/screens/shop/ShopCartScreen.js          — delivery note + item list + bill + clear
src/screens/shop/ShopCheckoutScreen.js      — address + payment (Razorpay / COD) + success
src/screens/shop/ShopOrdersScreen.js        — order list with filter tabs
src/screens/shop/ShopOrderDetailScreen.js   — tracker, cancel, payment & address
App.jsx                         — SalonTabs now has Shop tab + Stack routes for Shop*
```

## 4. API reuse

All shop requests go through `communication.*` with `Authorization: Bearer <token>` exactly as the web `api.shop*` helpers. No new backend work is required — the same `shop_products`, `shop_carts`, `shop_orders`, `shop_settings` tables power both clients, so a salon sees the same cart and order history on web and mobile.

Image URLs use `getFileUrl(path)` (normalises `public/uploads/...`, `/getFiles/...`, absolute backend URLs) — the same logic that fixed ad images in the past.

## 5. State & offline

* Local cart/orders are stored in `AsyncStorage` under `mynaaiShopCart:<salonId>` and `mynaaiShopOrders:<salonId>` — same key scheme as the web localStorage.
* On mount, a signed-in salon pulls the server cart/orders (`shopCartGet`, `shopOrderList`) and the server copy **wins** (account-level truth). Every mutation (`add`, `setQty`, `remove`, `clear`, `create`, `cancel`) updates local state first (instant UI) and fires a fire-and-forget push to the server, so the shop works offline and the cart follows the account across devices.
* `shopSettings` are fetched once per session and cached (`fetchShopSettings`) — defaults (`freeDeliveryAbove: 499`, `deliveryFee: 49`) ensure the bill never flashes a wrong number before the fetch resolves.

## 6. Payment

Online payment uses `react-native-razorpay` with the live key `rzp_live_ST8yVm3RaFMiHW` (same as `paymentForMembership.js`). Amount is `Math.round(total * 100)` paise, prefill name/contact from the delivery form, theme `BLINKIT.green`. On success the order is recorded locally (`placeOrder`) and registered server-side (`shopOrderCreate`). COD is offered only when `itemTotal <= codThreshold`; `codCharges` are added to the bill exactly as the backend computes them.

## 7. Testing

* Open the app as a **salon** account and tap the new **Shop** tab (bag icon, position 3).
* Search “shampoo”, switch category to “Tools & equipment”, change gender/price — grid re-filters instantly.
* Tap a card → detail page (image gallery, price, delivery facts, similar).
* Add → stepper appears. Tap “View cart” (green bar) → cart with progress to free delivery.
* Proceed to checkout → edit address, pick COD or Pay online, place order → success view → Track order / My orders → cancel flow (server-gated).
* Verify the same orders appear after switching to the web portal with the same salon account (server is truth).

## 8. Future

* Push the category inference to the backend (persist `category`/`gender` on `shop_products`) — the mobile already honours explicit fields and falls back to keyword inference.
* Replace the second filter row with a bottom-sheet for large catalogs.
* Wire the `shop_settings` admin screen to the mobile (already surfaced in the web).
