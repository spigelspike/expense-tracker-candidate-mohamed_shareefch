/* ============================================================
   KOIN — Analytics Module
   Aggregates data for charts and financial insights.
   Reuses calculations.js. No DOM or Storage access.
   ============================================================ */

import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateMonthlyBalance,
  calculateSavingsRate,
  calculateTotalIncome,
  calculateTotalExpenses,
} from './calculations.js';
import { getCategoryMeta, EXPENSE_CATEGORIES } from '../data/categories.js';
import { getMonthShortLabel, getMonthLabel, formatCurrency, formatPercentage } from '../utils.js';

/**
 * Normalise monetary value to 2 decimal places.
 * @param {number} val
 * @returns {number}
 */
function roundMoney(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Get monthly summary metrics for a given year and month.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 0-indexed (0-11)
 * @returns {{ income: number, expenses: number, balance: number, savingsRate: number, transactionCount: number }}
 */
export function getMonthlySummary(transactions, year, month) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { income: 0, expenses: 0, balance: 0, savingsRate: 0, transactionCount: 0 };
  }

  const income = calculateMonthlyIncome(transactions, year, month);
  const expenses = calculateMonthlyExpenses(transactions, year, month);
  const balance = calculateMonthlyBalance(transactions, year, month);
  const savingsRate = calculateSavingsRate(income, expenses);

  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const count = transactions.filter(t => t && t.date && t.date.startsWith(prefix)).length;

  return {
    income,
    expenses,
    balance,
    savingsRate,
    transactionCount: count,
  };
}

/**
 * Get trends for the last N months ending at a reference date (or current date).
 * @param {Array} transactions
 * @param {number} numberOfMonths - default 6
 * @param {number} [refYear]
 * @param {number} [refMonth]
 * @returns {Array<{ year: number, month: number, label: string, income: number, expenses: number, balance: number }>}
 */
export function getMonthlyTrends(transactions, numberOfMonths = 6, refYear = null, refMonth = null) {
  const trends = [];
  const now = new Date();
  const endYear = refYear ?? now.getFullYear();
  const endMonth = refMonth ?? now.getMonth();

  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    const income = calculateMonthlyIncome(transactions, y, m);
    const expenses = calculateMonthlyExpenses(transactions, y, m);
    const balance = roundMoney(income - expenses);

    trends.push({
      year: y,
      month: m,
      label: getMonthShortLabel(m),
      fullLabel: getMonthLabel(y, m),
      income,
      expenses,
      balance,
    });
  }

  return trends;
}

/**
 * Get expense breakdown grouped by category for a specific month,
 * or across all transactions if year/month are null.
 * @param {Array} transactions
 * @param {number|null} [year]
 * @param {number|null} [month]
 * @returns {Array<{ category: string, amount: number, percentage: number, color: string, soft: string, icon: string, count: number }>}
 */
export function getCategoryBreakdown(transactions, year = null, month = null) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  let expenseTxns = transactions.filter(t => t && t.type === 'expense' && Number(t.amount) > 0);

  if (year !== null && year !== undefined && month !== null && month !== undefined) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    expenseTxns = expenseTxns.filter(t => t.date && t.date.startsWith(prefix));
  }

  if (expenseTxns.length === 0) return [];

  const totalExpenses = expenseTxns.reduce((sum, t) => sum + Number(t.amount), 0);
  if (totalExpenses <= 0) return [];

  const categoryMap = new Map();
  for (const t of expenseTxns) {
    const cat = t.category || 'Other';
    const current = categoryMap.get(cat) || { amount: 0, count: 0 };
    current.amount += Number(t.amount);
    current.count += 1;
    categoryMap.set(cat, current);
  }

  const breakdown = [];
  categoryMap.forEach((val, cat) => {
    const meta = getCategoryMeta(cat);
    const percentage = roundMoney((val.amount / totalExpenses) * 100);
    breakdown.push({
      category: cat,
      amount: roundMoney(val.amount),
      percentage,
      color: meta.color,
      soft: meta.soft,
      icon: meta.icon,
      count: val.count,
    });
  });

  // Sort descending by amount
  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * Get top N expense categories.
 * @param {Array} transactions
 * @param {number|null} year
 * @param {number|null} month
 * @param {number} [limit=5]
 * @returns {Array}
 */
export function getTopExpenseCategories(transactions, year = null, month = null, limit = 5) {
  const breakdown = getCategoryBreakdown(transactions, year, month);
  return breakdown.slice(0, limit);
}

/**
 * Find the month with highest total expenses across all data.
 * @param {Array} transactions
 * @returns {{ year: number, month: number, label: string, amount: number }|null}
 */
export function getHighestSpendingMonth(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return null;

  const monthlyTotals = new Map();

  for (const t of transactions) {
    if (t && t.type === 'expense' && t.date && Number(t.amount) > 0) {
      const ym = t.date.substring(0, 7); // "YYYY-MM"
      monthlyTotals.set(ym, (monthlyTotals.get(ym) || 0) + Number(t.amount));
    }
  }

  if (monthlyTotals.size === 0) return null;

  let highestYm = null;
  let highestAmount = -1;

  monthlyTotals.forEach((amt, ym) => {
    if (amt > highestAmount) {
      highestAmount = amt;
      highestYm = ym;
    }
  });

  if (!highestYm || highestAmount <= 0) return null;

  const [yStr, mStr] = highestYm.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;

  return {
    year: y,
    month: m,
    label: getMonthLabel(y, m),
    amount: roundMoney(highestAmount),
  };
}

/**
 * Get average monthly expenses over the last N months.
 * @param {Array} transactions
 * @param {number} [numberOfMonths=6]
 * @returns {number}
 */
export function getAverageMonthlyExpenses(transactions, numberOfMonths = 6) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;
  const trends = getMonthlyTrends(transactions, numberOfMonths);
  const nonZeroMonths = trends.filter(t => t.expenses > 0);
  if (nonZeroMonths.length === 0) return 0;

  const sum = nonZeroMonths.reduce((acc, t) => acc + t.expenses, 0);
  return roundMoney(sum / nonZeroMonths.length);
}

/**
 * Generate actionable, data-driven savings insights for a given month.
 * Returns only claims backed by actual transactions.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {Array<{ type: 'positive'|'warning'|'neutral', title: string, description: string, icon: string }>}
 */
export function getSavingsInsights(transactions, year, month) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const insights = [];
  const currentSummary = getMonthlySummary(transactions, year, month);
  const breakdown = getCategoryBreakdown(transactions, year, month);

  // 1. Top expense category insight
  if (breakdown.length > 0 && breakdown[0].amount > 0) {
    const top = breakdown[0];
    insights.push({
      type: 'neutral',
      title: `Top Spending Category: ${top.category}`,
      description: `${top.category} accounts for ${formatPercentage(top.percentage)} of your expenses this month (${formatCurrency(top.amount)}).`,
      icon: top.icon,
    });
  }

  // 2. Savings rate insight
  if (currentSummary.income > 0) {
    if (currentSummary.savingsRate >= 20) {
      insights.push({
        type: 'positive',
        title: 'Healthy Savings Rate',
        description: `You saved ${formatPercentage(currentSummary.savingsRate)} of your income this month! Financial experts recommend at least 20%.`,
        icon: 'trending-up',
      });
    } else if (currentSummary.savingsRate > 0) {
      insights.push({
        type: 'neutral',
        title: 'Moderate Savings',
        description: `You saved ${formatPercentage(currentSummary.savingsRate)} of your income this month (${formatCurrency(currentSummary.balance)}).`,
        icon: 'wallet',
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Expenses Exceeded Income',
        description: `Expenses exceeded income by ${formatCurrency(Math.abs(currentSummary.balance))} this month. Consider reviewing non-essential spending.`,
        icon: 'alert-circle',
      });
    }
  }

  // 3. Month-over-month comparison
  const prevDate = new Date(year, month - 1, 1);
  const prevSummary = getMonthlySummary(transactions, prevDate.getFullYear(), prevDate.getMonth());

  if (prevSummary.expenses > 0 && currentSummary.expenses > 0) {
    const diff = currentSummary.expenses - prevSummary.expenses;
    const pctChange = roundMoney(Math.abs(diff / prevSummary.expenses) * 100);

    if (diff < 0) {
      insights.push({
        type: 'positive',
        title: 'Spending Decreased',
        description: `Your spending is down ${formatPercentage(pctChange)} compared to last month (${getMonthLabel(prevDate.getFullYear(), prevDate.getMonth())}).`,
        icon: 'trending-down',
      });
    } else if (diff > 0) {
      insights.push({
        type: 'warning',
        title: 'Spending Increased',
        description: `Your spending is up ${formatPercentage(pctChange)} compared to last month (${getMonthLabel(prevDate.getFullYear(), prevDate.getMonth())}).`,
        icon: 'trending-up',
      });
    }
  }

  return insights;
}

/**
 * Get detailed month-over-month comparison for income, expenses, and net balance.
 * Returns null or comparison object backed by actual data.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month
 * @returns {object}
 */
export function getMonthComparison(transactions, year, month) {
  const currentSummary = getMonthlySummary(transactions, year, month);
  const prevDate = new Date(year, month - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();
  const prevSummary = getMonthlySummary(transactions, prevYear, prevMonth);

  const hasPrevData = prevSummary.transactionCount > 0;
  const hasCurrentData = currentSummary.transactionCount > 0;

  // Expenses comparison
  const expenseDiff = roundMoney(currentSummary.expenses - prevSummary.expenses);
  const expensePct = prevSummary.expenses > 0
    ? roundMoney((Math.abs(expenseDiff) / prevSummary.expenses) * 100)
    : 0;

  // Income comparison
  const incomeDiff = roundMoney(currentSummary.income - prevSummary.income);
  const incomePct = prevSummary.income > 0
    ? roundMoney((Math.abs(incomeDiff) / prevSummary.income) * 100)
    : 0;

  // Balance comparison
  const balanceDiff = roundMoney(currentSummary.balance - prevSummary.balance);
  const balancePct = prevSummary.balance !== 0
    ? roundMoney((Math.abs(balanceDiff) / Math.abs(prevSummary.balance)) * 100)
    : 0;

  return {
    hasPrevData,
    hasCurrentData,
    prevMonthLabel: getMonthLabel(prevYear, prevMonth),
    currentSummary,
    prevSummary,
    expenses: {
      diff: expenseDiff,
      pct: expensePct,
      trend: expenseDiff > 0 ? 'up' : expenseDiff < 0 ? 'down' : 'neutral',
      isPositive: expenseDiff < 0, // Lower expenses is positive for personal finance
    },
    income: {
      diff: incomeDiff,
      pct: incomePct,
      trend: incomeDiff > 0 ? 'up' : incomeDiff < 0 ? 'down' : 'neutral',
      isPositive: incomeDiff >= 0, // Higher income is positive
    },
    balance: {
      diff: balanceDiff,
      pct: balancePct,
      trend: balanceDiff > 0 ? 'up' : balanceDiff < 0 ? 'down' : 'neutral',
      isPositive: balanceDiff >= 0,
    },
  };
}

/**
 * Calculate average daily spending for a given month.
 * Accounts for elapsed days if current month or total days in past month.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export function getAverageDailySpending(transactions, year, month) {
  if (!Array.isArray(transactions) || transactions.length === 0) return 0;

  const currentSummary = getMonthlySummary(transactions, year, month);
  if (currentSummary.expenses <= 0) return 0;

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  // If viewing current month, divide by days elapsed so far (min 1 day)
  // If viewing past month, divide by total days in that month
  const daysInPeriod = isCurrentMonth
    ? Math.max(1, now.getDate())
    : new Date(year, month + 1, 0).getDate();

  return roundMoney(currentSummary.expenses / daysInPeriod);
}

/**
 * Retrieve comprehensive data for category cards.
 * Returns structured metrics for all standard expense categories.
 * @param {Array} transactions
 * @param {number} year
 * @param {number} month
 * @returns {Array<{ category: string, amount: number, percentage: number, count: number, icon: string, color: string, soft: string, hasSpending: boolean }>}
 */
export function getAllCategoryCardsData(transactions, year, month) {
  const breakdown = getCategoryBreakdown(transactions, year, month);
  const currentSummary = getMonthlySummary(transactions, year, month);
  const totalExpenses = currentSummary.expenses;

  // Map of category -> breakdown item
  const breakdownMap = new Map();
  breakdown.forEach(item => {
    breakdownMap.set(item.category, item);
  });

  // Base list of categories to always display in the spending overview
  const baseCategories = EXPENSE_CATEGORIES.map(c => c.name);

  // Include any other categories with spending
  breakdown.forEach(item => {
    if (!baseCategories.includes(item.category)) {
      baseCategories.push(item.category);
    }
  });

  return baseCategories.map(catName => {
    const meta = getCategoryMeta(catName);
    const existing = breakdownMap.get(catName);
    const amount = existing ? existing.amount : 0;
    const count = existing ? existing.count : 0;
    const percentage = totalExpenses > 0 ? roundMoney((amount / totalExpenses) * 100) : 0;

    return {
      category: catName,
      amount,
      percentage,
      count,
      icon: meta.icon,
      color: meta.color,
      soft: meta.soft,
      hasSpending: amount > 0,
    };
  });
}
