/* ============================================================
   KOIN — Category Definitions
   Central source of truth for all income and expense categories.
   ============================================================ */

/**
 * Each category has:
 *  - name:  display label (unique per type)
 *  - icon:  identifier for the SVG icon helper
 *  - color: CSS custom property for the category colour
 *  - soft:  CSS custom property for the light tint background
 */

export const EXPENSE_CATEGORIES = Object.freeze([
  { name: 'Food',              icon: 'utensils',    color: 'var(--cat-food)',           soft: 'var(--cat-food-soft)' },
  { name: 'Transportation',  icon: 'car',         color: 'var(--cat-transportation)', soft: 'var(--cat-transportation-soft)' },
  { name: 'Shopping',          icon: 'cart',        color: 'var(--cat-shopping)',        soft: 'var(--cat-shopping-soft)' },
  { name: 'Bills',             icon: 'receipt',     color: 'var(--cat-bills)',           soft: 'var(--cat-bills-soft)' },
  { name: 'Entertainment',     icon: 'ticket',      color: 'var(--cat-entertainment)',   soft: 'var(--cat-entertainment-soft)' },
  { name: 'Health',            icon: 'heart',       color: 'var(--cat-health)',          soft: 'var(--cat-health-soft)' },
  { name: 'Education',         icon: 'book',        color: 'var(--cat-education)',       soft: 'var(--cat-education-soft)' },
  { name: 'Travel',            icon: 'plane',       color: 'var(--cat-travel)',          soft: 'var(--cat-travel-soft)' },
  { name: 'Groceries',         icon: 'bag',         color: 'var(--cat-groceries)',       soft: 'var(--cat-groceries-soft)' },
  { name: 'Other',             icon: 'ellipsis',    color: 'var(--cat-other)',           soft: 'var(--cat-other-soft)' },
]);

export const INCOME_CATEGORIES = Object.freeze([
  { name: 'Salary',     icon: 'wallet',      color: 'var(--cat-salary)',     soft: 'var(--cat-salary-soft)' },
  { name: 'Freelance',  icon: 'laptop',       color: 'var(--cat-freelance)',  soft: 'var(--cat-freelance-soft)' },
  { name: 'Business',   icon: 'briefcase',    color: 'var(--cat-business)',   soft: 'var(--cat-business-soft)' },
  { name: 'Investment', icon: 'trending-up',  color: 'var(--cat-investment)', soft: 'var(--cat-investment-soft)' },
  { name: 'Gift',       icon: 'gift',         color: 'var(--cat-gift)',       soft: 'var(--cat-gift-soft)' },
  { name: 'Other',      icon: 'ellipsis',     color: 'var(--cat-other)',      soft: 'var(--cat-other-soft)' },
]);

/* Category aliases for legacy or alternate naming */
const CATEGORY_ALIASES = {
  'Transport': 'Transportation',
  'Bills & Utilities': 'Bills',
  'Rent & Utilities': 'Bills',
  'Rent': 'Bills',
  'Utilities': 'Bills',
};

/* ── Lookup helpers ───────────────────────────────────────── */

/**
 * Return the category array for a given type.
 * @param {'income'|'expense'} type
 * @returns {Array} category objects
 */
export function getCategoriesByType(type) {
  if (type === 'income') return INCOME_CATEGORIES;
  if (type === 'expense') return EXPENSE_CATEGORIES;
  return [];
}

/**
 * Check whether a category name is valid for the given type.
 * @param {'income'|'expense'} type
 * @param {string} category
 * @returns {boolean}
 */
export function isValidCategory(type, category) {
  const normalized = CATEGORY_ALIASES[category] || category;
  const cats = getCategoriesByType(type);
  return cats.some(c => c.name === normalized || c.name === category);
}

/**
 * Retrieve the metadata object for a category name.
 * Searches both income and expense lists; returns a fallback if not found.
 * @param {string} categoryName
 * @returns {{ name: string, icon: string, color: string, soft: string }}
 */
export function getCategoryMeta(categoryName) {
  const normalized = CATEGORY_ALIASES[categoryName] || categoryName;
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const found = all.find(c => c.name === normalized || c.name === categoryName);

  return (
    found || {
      name: categoryName || 'Other',
      icon: 'ellipsis',
      color: 'var(--cat-other)',
      soft: 'var(--cat-other-soft)',
    }
  );
}
