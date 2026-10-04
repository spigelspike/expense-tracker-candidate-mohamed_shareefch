/* ============================================================
   KOIN — Analytics Page UI Module
   In-depth financial analysis: period metrics, savings rate,
   bar/donut charts, and actionable data-supported insights.
   ============================================================ */

import { getAllTransactions } from '../modules/transactions.js';
import {
  getMonthlySummary,
  getMonthlyTrends,
  getCategoryBreakdown,
  getSavingsInsights,
  getHighestSpendingMonth,
  getAverageMonthlyExpenses,
} from '../modules/analytics.js';
import { renderBarChart, renderDonutChart, renderHorizontalBarChart } from './charts.js';
import { formatCurrency, formatPercentage, getMonthLabel, getCurrentMonth, getIcon } from '../utils.js';
import { openAiOverviewModal } from './ai-overview.js';

let selectedYear;
let selectedMonth;

const currentPeriod = getCurrentMonth();
selectedYear = currentPeriod.year;
selectedMonth = currentPeriod.month;

/**
 * Change analytics period by delta months.
 * @param {number} delta
 */
function changePeriod(delta) {
  const d = new Date(selectedYear, selectedMonth + delta, 1);
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();
  renderAnalyticsPage();
}

/**
 * Render the entire Analytics page.
 */
export function renderAnalyticsPage() {
  const container = document.getElementById('page-analytics');
  if (!container) return;

  const allTxns = getAllTransactions();
  const summary = getMonthlySummary(allTxns, selectedYear, selectedMonth);
  const trends = getMonthlyTrends(allTxns, 6, selectedYear, selectedMonth);
  const categoryBreakdown = getCategoryBreakdown(allTxns, selectedYear, selectedMonth);
  const insights = getSavingsInsights(allTxns, selectedYear, selectedMonth);
  const highestMonth = getHighestSpendingMonth(allTxns);
  const avgExpenses = getAverageMonthlyExpenses(allTxns, 6);

  const periodLabel = getMonthLabel(selectedYear, selectedMonth);

  container.innerHTML = `
    <!-- Header -->
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Analytics</h1>
        <p class="page-subtitle">Understand your spending patterns and savings performance</p>
      </div>

      <div class="page-header-actions">
        <!-- Period Selector -->
        <div class="period-selector" role="group" aria-label="Analytics month selector">
          <button type="button" class="btn btn-secondary btn-icon" id="btn-analytics-prev" aria-label="Previous month">
            ${getIcon('chevron-left')}
          </button>
          <span class="period-label" id="analytics-period-label">${periodLabel}</span>
          <button type="button" class="btn btn-secondary btn-icon" id="btn-analytics-next" aria-label="Next month">
            ${getIcon('chevron-right')}
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile-only AI Overview Card -->
    <button type="button" class="ai-overview-analytics-card mobile-only" id="btn-analytics-ai-overview" aria-label="Open AI Overview Analytics">
      <span class="ai-card-icon-wrap" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z"/>
          <path d="M19 2c0 2.2-1.8 4-4 4 2.2 0 4 1.8 4 4 0-2.2 1.8-4 4-4-2.2 0-4-1.8-4-4z"/>
        </svg>
      </span>
      <span class="ai-card-text">
        <span class="ai-card-title">AI Overview Analytics</span>
        <p class="ai-card-sub">Send your financial data to ChatGPT, Claude, or Gemini</p>
      </span>
      <span class="ai-card-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </button>

    <!-- Key Metrics Grid -->
    <div class="stats-grid mb-6">
      <div class="card stat-card">
        <div class="stat-value text-income">+${formatCurrency(summary.income)}</div>
        <div class="stat-label">Total Income</div>
      </div>

      <div class="card stat-card">
        <div class="stat-value text-expense">-${formatCurrency(summary.expenses)}</div>
        <div class="stat-label">Total Expenses</div>
      </div>

      <div class="card stat-card">
        <div class="stat-value" style="color: ${summary.balance >= 0 ? 'var(--color-income)' : 'var(--color-expense)'};">
          ${formatCurrency(summary.balance)}
        </div>
        <div class="stat-label">Net Savings</div>
      </div>

      <div class="card stat-card">
        <div class="stat-value" style="color: var(--color-primary);">
          ${formatPercentage(summary.savingsRate)}
        </div>
        <div class="stat-label">Savings Rate</div>
      </div>
    </div>

    <!-- Charts Layout (2 columns on large screens) -->
    <div class="dashboard-grid mb-6">

      <!-- Income vs Expense Bar Chart -->
      <section class="card" aria-label="Income and Expense Trends">
        <div class="card-header">
          <h2 class="card-title">Income vs Expenses (6-Month Trend)</h2>
          <span class="text-muted" style="font-size: var(--font-size-xs);">Comparison</span>
        </div>
        <div id="analytics-bar-chart-container"></div>
      </section>

      <!-- Category Donut Chart -->
      <section class="card" aria-label="Expense Distribution">
        <div class="card-header">
          <h2 class="card-title">Expense Breakdown</h2>
          <span class="text-muted" style="font-size: var(--font-size-xs);">${periodLabel}</span>
        </div>
        <div id="analytics-donut-chart-container"></div>
      </section>

    </div>

    <!-- Category Spending List & Insights -->
    <div class="dashboard-grid">

      <!-- Horizontal Category Bars -->
      <section class="card" aria-label="Category Spending Breakdown">
        <div class="card-header">
          <h2 class="card-title">Top Spending by Category</h2>
          <span class="text-muted" style="font-size: var(--font-size-xs);">${categoryBreakdown.length} Categories</span>
        </div>
        <div id="analytics-hbar-chart-container"></div>
      </section>

      <!-- Financial Insights & Historical Stats -->
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">

        <!-- Actionable Insights Card -->
        <section class="card" aria-label="Monthly Insights">
          <div class="card-header">
            <h2 class="card-title">Financial Insights</h2>
            <span class="text-muted" style="font-size: var(--font-size-xs);">${periodLabel}</span>
          </div>

          <div id="analytics-insights-container" style="display: flex; flex-direction: column; gap: var(--space-3);">
            ${renderInsightsHTML(insights)}
          </div>
        </section>

        <!-- Benchmark Statistics -->
        <section class="card" aria-label="Historical Benchmarks">
          <div class="card-header">
            <h2 class="card-title">Historical Benchmarks</h2>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-3);">
            <div class="flex-between" style="padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border);">
              <span class="text-secondary" style="font-size: var(--font-size-sm);">Average Monthly Expenses</span>
              <span class="font-tabular" style="font-weight: var(--font-weight-semibold);">${formatCurrency(avgExpenses)}</span>
            </div>
            <div class="flex-between" style="padding: var(--space-2) 0;">
              <span class="text-secondary" style="font-size: var(--font-size-sm);">Highest Spending Month</span>
              <span class="font-tabular" style="font-weight: var(--font-weight-semibold);">
                ${highestMonth ? `${highestMonth.label} (${formatCurrency(highestMonth.amount)})` : 'None recorded'}
              </span>
            </div>
          </div>
        </section>

      </div>

    </div>
  `;

  // Render Charts
  const barContainer = document.getElementById('analytics-bar-chart-container');
  renderBarChart(barContainer, trends, {
    ariaLabel: `Income and expense comparison over the 6 months leading up to ${periodLabel}`,
  });

  const donutContainer = document.getElementById('analytics-donut-chart-container');
  renderDonutChart(donutContainer, categoryBreakdown, {
    centerLabel: 'Expenses',
    ariaLabel: `Category spending breakdown for ${periodLabel}`,
  });

  const hBarContainer = document.getElementById('analytics-hbar-chart-container');
  renderHorizontalBarChart(hBarContainer, categoryBreakdown);

  // Period switch listeners
  document.getElementById('btn-analytics-prev')?.addEventListener('click', () => changePeriod(-1));
  document.getElementById('btn-analytics-next')?.addEventListener('click', () => changePeriod(1));

  // Mobile AI Overview card
  document.getElementById('btn-analytics-ai-overview')?.addEventListener('click', () => {
    openAiOverviewModal();
  });
}

/**
 * Generate HTML string for insights list.
 * @param {Array} insights
 * @returns {string}
 */
function renderInsightsHTML(insights) {
  if (!insights || insights.length === 0) {
    return `
      <div style="padding: var(--space-4); text-align: center; color: var(--text-muted); font-size: var(--font-size-sm);">
        Log more transactions this month to unlock personalized spending insights.
      </div>
    `;
  }

  return insights.map(item => `
    <div class="insight-card">
      <div class="insight-icon" aria-hidden="true">
        ${getIcon(item.icon || 'lightbulb')}
      </div>
      <div class="insight-text">
        <strong>${item.title}:</strong> ${item.description}
      </div>
    </div>
  `).join('');
}
