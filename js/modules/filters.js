/* ============================================================
   KOIN — Filters Module
   Pure search, filter, and sorting functions.
   Never mutates inputs. Returns fresh arrays.
   ============================================================ */

/**
 * Filter transactions by type ('income', 'expense', or 'all'/falsy).
 * @param {Array} transactions
 * @param {string} type - 'income' | 'expense' | 'all'
 * @returns {Array}
 */
export function filterByType(transactions, type) {
  if (!Array.isArray(transactions)) return [];
  if (!type || type === 'all') return transactions.slice();
  const normalized = type.toLowerCase().trim();
  return transactions.filter(t => t && t.type === normalized);
}

/**
 * Filter transactions by category.
 * @param {Array} transactions
 * @param {string} category - Category name or 'all'/falsy
 * @returns {Array}
 */
export function filterByCategory(transactions, category) {
  if (!Array.isArray(transactions)) return [];
  if (!category || category === 'all') return transactions.slice();
  const normalized = category.toLowerCase().trim();
  return transactions.filter(t => t && t.category && t.category.toLowerCase().trim() === normalized);
}

/**
 * Filter transactions by inclusive date range.
 * Dates are expected in 'YYYY-MM-DD' format.
 * @param {Array} transactions
 * @param {string|null} startDate - 'YYYY-MM-DD' or falsy
 * @param {string|null} endDate - 'YYYY-MM-DD' or falsy
 * @returns {Array}
 */
export function filterByDateRange(transactions, startDate, endDate) {
  if (!Array.isArray(transactions)) return [];
  if (!startDate && !endDate) return transactions.slice();

  return transactions.filter(t => {
    if (!t || !t.date) return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });
}

/**
 * Filter transactions by year and month.
 * Month is 0-indexed (0 = Jan, 11 = Dec).
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 0-indexed (0-11)
 * @returns {Array}
 */
export function filterByMonth(transactions, year, month) {
  if (!Array.isArray(transactions)) return [];
  if (year === undefined || year === null || month === undefined || month === null) {
    return transactions.slice();
  }

  const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return transactions.filter(t => t && t.date && t.date.startsWith(targetPrefix));
}

/**
 * Search transactions case-insensitively in description and category.
 * @param {Array} transactions
 * @param {string} query
 * @returns {Array}
 */
export function searchTransactions(transactions, query) {
  if (!Array.isArray(transactions)) return [];
  if (!query || typeof query !== 'string') return transactions.slice();
  const clean = query.trim().toLowerCase();
  if (!clean) return transactions.slice();

  return transactions.filter(t => {
    if (!t) return false;
    const desc = (t.description || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    return desc.includes(clean) || cat.includes(clean);
  });
}

/**
 * Default empty filter state.
 */
export function clearFilters() {
  return {
    query: '',
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
    year: null,
    month: null,
  };
}

/**
 * Apply combined filters to transactions using AND logic.
 * @param {Array} transactions
 * @param {object} filters - { query, type, category, startDate, endDate, year, month }
 * @returns {Array}
 */
export function filterTransactions(transactions, filters) {
  if (!Array.isArray(transactions)) return [];
  if (!filters || typeof filters !== 'object') return transactions.slice();

  let result = transactions;

  // 1. Search Query
  if (filters.query && filters.query.trim()) {
    result = searchTransactions(result, filters.query);
  }

  // 2. Type
  if (filters.type && filters.type !== 'all') {
    result = filterByType(result, filters.type);
  }

  // 3. Category
  if (filters.category && filters.category !== 'all') {
    result = filterByCategory(result, filters.category);
  }

  // 4. Date Range
  if (filters.startDate || filters.endDate) {
    result = filterByDateRange(result, filters.startDate, filters.endDate);
  }

  // 5. Specific Month/Year (if provided and date range not explicitly active)
  if (filters.year !== null && filters.year !== undefined && filters.month !== null && filters.month !== undefined) {
    result = filterByMonth(result, filters.year, filters.month);
  }

  return result.slice();
}

/**
 * Sort transactions newest first by date (descending),
 * with createdAt descending as the stable secondary sort key.
 * @param {Array} transactions
 * @returns {Array} fresh sorted copy
 */
export function sortTransactions(transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.slice().sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    // Primary: date descending (e.g. "2026-10-04" > "2026-10-03")
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    // Secondary: createdAt descending
    const createdA = a.createdAt || '';
    const createdB = b.createdAt || '';
    return createdB.localeCompare(createdA);
  });
}
