/**
 * Presentation helpers used only on the frontend.
 *
 * Conversion rate lives here (not in SQL) because the brief asks the
 * dashboard to compute add-to-carts / views in the browser.
 */

const EVENT_WEIGHTS = [
  { type: 'view', weight: 70 },
  { type: 'click', weight: 20 },
  { type: 'add_to_cart', weight: 10 },
];

/** @param {number} cents */
export function formatCents(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** @param {number} value */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Add-to-carts / views as a percentage. Null when there are no views
 * so the UI can show an em dash instead of 0%.
 * @param {number} addToCart
 * @param {number} views
 * @returns {number | null}
 */
export function conversionRate(addToCart, views) {
  if (!views) {
    return null;
  }

  return (addToCart / views) * 100;
}

/** @param {number | null} rate */
export function formatRate(rate) {
  if (rate === null) {
    return '—';
  }

  return `${rate.toFixed(1)}%`;
}

/** @template T @param {T[]} items */
export function pickRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

/** Weighted funnel: view 70% / click 20% / add_to_cart 10%. */
export function pickRandomEventType() {
  const total = EVENT_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  // Walk the weighted list until the remaining roll is consumed.
  let roll = Math.random() * total;

  for (const item of EVENT_WEIGHTS) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.type;
    }
  }

  return 'view';
}

/** @param {string} eventType */
export function eventLabel(eventType) {
  if (eventType === 'add_to_cart') {
    return 'add to cart';
  }

  return eventType;
}
