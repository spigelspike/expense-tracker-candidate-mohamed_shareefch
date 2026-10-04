/* ============================================================
   KOIN — Calculations Module
   Pure financial totals and balance calculations.
   Never mutates inputs. No DOM or Storage access.
   ============================================================ */

/**
 * Normalise a monetary amount to avoid floating-point inaccuracies.
 * Rounds to 2 decimal places.
 * @param {number} val
 * @returns {number}
 */
function roundMoney(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Safely extract a valid positive numeric amount from a transaction.
 * @param {object} t
 * @returns {number}
 */
function getValidAmount(t) {
  if (!t || typeof t !== 'object') return 0;
  const num = Number(t.amount);
  return isFinite(num) && num > 0 ? num : 0;
}

/**
 * Check if a transaction belongs to a given year and month.
 * Month is 0-indexed (0 = January, 11 = December).
 * @param {object} t
 * @param {number} year
 * @param {number} month - 0-indexed (0-11)
 * @returns {boolean}
 */
function isTransactionInMonth(t, year, month) {
  if (!t || !t.date || typeof t.date !== 'string') return false;
  const parts = t.date.split('-');
  if (parts.length !== 3) return false;
  const tYear = parseInt(parts[0], 10);
  const tMonth = parseInt(parts[1], 10) - 1; // Convert 1-indexed to 0-indexed
  return tYear === year && tMonth === month;
}

/**
 * Calculate total income across all transactions.
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateTotalIncome(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;
  const total = transactions.reduce((sum, t) => {
    return t && t.type === 'income' ? sum + getValidAmount(t) : sum;
  }, 0);
  return roundMoney(total);
}

/**
 * Calculate total expenses across all transactions.
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateTotalExpenses(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;
  const total = transactions.reduce((sum, t) => {
    return t && t.type === 'expense' ? sum + getValidAmount(t) : sum;
  }, 0);
  return roundMoney(total);
}

/**
 * Calculate net balance across all transactions (income - expenses).
 * @param {Array} transactions
 * @returns {number}
 */
export function calculateBalance(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  return roundMoney(income - expenses);
}

/**
 * Calculate total income for a specific month and year.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 0-indexed (0-11)
 * @returns {number}
 */
export function calculateMonthlyIncome(transactions, year, month) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;
  const filtered = transactions.filter(t => isTransactionInMonth(t, year, month) && t.type === 'income');
  return calculateTotalIncome(filtered);
}

/**
 * Calculate total expenses for a specific month and year.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 0-indexed (0-11)
 * @returns {number}
 */
export function calculateMonthlyExpenses(transactions, year, month) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;
  const filtered = transactions.filter(t => isTransactionInMonth(t, year, month) && t.type === 'expense');
  return calculateTotalExpenses(filtered);
}

/**
 * Calculate net balance for a specific month and year.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 0-indexed (0-11)
 * @returns {number}
 */
export function calculateMonthlyBalance(transactions, year, month) {
  const income = calculateMonthlyIncome(transactions, year, month);
  const expenses = calculateMonthlyExpenses(transactions, year, month);
  return roundMoney(income - expenses);
}

/**
 * Calculate savings rate as a percentage: (income - expenses) / income * 100.
 * If income is <= 0, returns 0. Clamped between 0 and 100 when net is positive,
 * or 0 if spending exceeds income.
 * @param {number} income
 * @param {number} expenses
 * @returns {number} e.g. 25.5 (for 25.5%)
 */
export function calculateSavingsRate(income, expenses) {
  const inc = Number(income);
  const exp = Number(expenses);
  if (!isFinite(inc) || !isFinite(exp) || inc <= 0) return 0;
  const savings = inc - exp;
  if (savings <= 0) return 0;
  const rate = (savings / inc) * 100;
  return roundMoney(Math.min(100, Math.max(0, rate)));
}

/**
 * Calculate a full summary for a set of transactions.
 * @param {Array} transactions
 * @returns {{ totalIncome: number, totalExpenses: number, balance: number, count: number }}
 */
export function calculateTransactionSummary(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      count: 0,
    };
  }

  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  const balance = roundMoney(income - expenses);

  return {
    totalIncome: income,
    totalExpenses: expenses,
    balance,
    count: transactions.length,
  };
}
