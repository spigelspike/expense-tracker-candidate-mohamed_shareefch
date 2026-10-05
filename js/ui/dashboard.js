/* ============================================================
   KOIN — Dashboard UI Module
   Primary financial overview:
   - Grand Sky Hero Balance Card (INR ₹, Eye toggle, MoM comparison)
   - 3 Prominent Quick Action Pills (+ Add Income, − Add Expense, All Records)
   - Income & Expense Inflow/Outflow Summary Cards
   - Dedicated "Spending by Category" Cards Grid (Groceries, Health, Transport, etc.)
   - Desktop 2-Column Grid (Bar Chart, Donut Chart, Summary Widget, Recent Transactions)
   - Mobile Segregated Analytics Section (Segmented Cashflow / Spend Share charts)
   ============================================================ */

import { getAllTransactions, removeTransaction } from '../modules/transactions.js';
import {
  getMonthlySummary,
  getMonthlyTrends,
  getCategoryBreakdown,
  getMonthComparison,
  getAverageDailySpending,
  getAllCategoryCardsData,
  getSavingsInsights,
} from '../modules/analytics.js';
import { filterByMonth, sortTransactions } from '../modules/filters.js';
import { renderBarChart, renderDonutChart } from './charts.js';
import { openAddForm, openEditForm } from './transaction-form.js';
import { navigateTo } from './navigation.js';
import { filterByCategory, openDeleteConfirmation } from './transaction-list.js';
import { showSuccess, showError } from './notifications.js';
import { formatCurrency, formatDateShort, getMonthLabel, getCurrentMonth, getIcon, escapeHTML } from '../utils.js';
import { getCategoryMeta } from '../data/categories.js';

let isBalanceHidden = false;
let selectedYear;
let selectedMonth;
let showAllCategories = false;
let mobileActiveChart = 'cashflow'; // 'cashflow' | 'breakdown'

// Initialise period with current year and month
const currentPeriod = getCurrentMonth();
selectedYear = currentPeriod.year;
selectedMonth = currentPeriod.month;

let mobileListenersAttached = false;

/**
 * Switch period by delta months (-1 or +1).
 * @param {number} delta
 */
export function changePeriod(delta) {
  const d = new Date(selectedYear, selectedMonth + delta, 1);
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();
  renderDashboard();
}

/**
 * Toggle balance visibility between actual amount and asterisks.
 */
function toggleBalanceVisibility() {
  isBalanceHidden = !isBalanceHidden;
  const balanceText = document.getElementById('dashboard-balance-amount');
  const toggleBtn = document.getElementById('btn-toggle-balance');
  if (!balanceText || !toggleBtn) return;

  const allTxns = getAllTransactions();
  const summary = getMonthlySummary(allTxns, selectedYear, selectedMonth);

  if (isBalanceHidden) {
    balanceText.textContent = '••••••••';
    balanceText.classList.add('hidden-amount');
    toggleBtn.innerHTML = getIcon('eye-off');
    toggleBtn.setAttribute('aria-label', 'Show balance');
  } else {
    balanceText.textContent = formatCurrency(summary.balance);
    balanceText.classList.remove('hidden-amount');
    toggleBtn.innerHTML = getIcon('eye');
    toggleBtn.setAttribute('aria-label', 'Hide balance');
  }
}

/**
 * Render the entire dashboard view.
 */
export function renderDashboard() {
  const pageContainer = document.getElementById('page-dashboard');
  if (!pageContainer) return;

  const allTxns = getAllTransactions();
  const monthTxns = filterByMonth(allTxns, selectedYear, selectedMonth);
  const sortedMonthTxns = sortTransactions(monthTxns);
  const recentTxns = sortedMonthTxns.slice(0, 5);

  const summary = getMonthlySummary(allTxns, selectedYear, selectedMonth);
  const trends = getMonthlyTrends(allTxns, 6, selectedYear, selectedMonth);
  const categoryBreakdown = getCategoryBreakdown(allTxns, selectedYear, selectedMonth);
  const allCategoryCards = getAllCategoryCardsData(allTxns, selectedYear, selectedMonth);
  const comparison = getMonthComparison(allTxns, selectedYear, selectedMonth);
  const dailyAverage = getAverageDailySpending(allTxns, selectedYear, selectedMonth);
  const insights = getSavingsInsights(allTxns, selectedYear, selectedMonth);

  const periodLabelText = getMonthLabel(selectedYear, selectedMonth);

  // Determine categories to display (Show active with spend by default, or all if none have spend or toggle is active)
  const activeSpendCategories = allCategoryCards.filter(c => c.hasSpending);
  const displayCategories = (showAllCategories || activeSpendCategories.length === 0)
    ? allCategoryCards
    : activeSpendCategories;

  // Month-over-month balance context
  let momBalanceHtml = '';
  if (comparison.hasPrevData) {
    const isPos = comparison.balance.isPositive;
    momBalanceHtml = `
      <span class="hero-metric-badge ${isPos ? 'hero-metric--positive' : 'hero-metric--negative'}">
        ${isPos ? getIcon('trending-up') : getIcon('trending-down')}
        <span>${isPos ? '+' : ''}${formatCurrency(comparison.balance.diff)} (${comparison.balance.pct.toFixed(1)}%) vs last month</span>
      </span>
    `;
  } else {
    momBalanceHtml = `
      <span class="hero-metric-badge ${summary.balance >= 0 ? 'hero-metric--positive' : 'hero-metric--negative'}">
        ${summary.balance >= 0 ? getIcon('trending-up') : getIcon('trending-down')}
        <span>${summary.savingsRate > 0 ? `${summary.savingsRate.toFixed(1)}% saved` : `${summary.transactionCount} records`}</span>
      </span>
    `;
  }

  // Month-over-month income & expense badges
  let momIncomeBadge = '';
  let momExpenseBadge = '';
  if (comparison.hasPrevData) {
    const incTrend = comparison.income.trend;
    momIncomeBadge = `
      <span class="badge ${incTrend === 'up' ? 'badge--income' : 'badge--neutral'}" style="font-size: 11px;">
        ${incTrend === 'up' ? '▲ +' : incTrend === 'down' ? '▼ -' : ''}${comparison.income.pct.toFixed(1)}% vs prev mo
      </span>
    `;

    const expTrend = comparison.expenses.trend;
    momExpenseBadge = `
      <span class="badge ${expTrend === 'down' ? 'badge--income' : 'badge--expense'}" style="font-size: 11px;">
        ${expTrend === 'up' ? '▲ +' : expTrend === 'down' ? '▼ -' : ''}${comparison.expenses.pct.toFixed(1)}% vs prev mo
      </span>
    `;
  }

  pageContainer.innerHTML = `
    <!-- Top Bar (Clean period selector, Dashboard heading removed as requested) -->
    <div class="dash-top-bar">
      <h1 class="sr-only">Dashboard</h1>

      <div class="dash-period-badge" role="group" aria-label="Month selector">
        <button type="button" class="btn-period-arrow" id="btn-prev-month" aria-label="Previous month" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); padding: 2px;">
          ${getIcon('chevron-left')}
        </button>
        <span class="period-dot"></span>
        <span id="dashboard-period-label" style="font-weight: 700; color: var(--text-primary); font-size: 13px;">${periodLabelText}</span>
        <button type="button" class="btn-period-arrow" id="btn-next-month" aria-label="Next month" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); padding: 2px;">
          ${getIcon('chevron-right')}
        </button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════
         MAIN MONEY SHOWING CARD (With Integrated Income & Expense)
         ════════════════════════════════════════════════════════ -->
    <section class="card balance-card hero-balance-banner" aria-label="Net Balance">
      <div class="hero-sky-overlay" aria-hidden="true"></div>

      <div class="hero-balance-content">
        <div class="hero-flex-layout">
          <!-- Left Balance Info -->
          <div class="hero-balance-left">
            <div class="hero-top-row">
              <div class="hero-label-group">
                <span class="hero-portfolio-tag">NET BALANCE</span>
                <div class="balance-label">
                  <span class="card-title">Total Balance</span>
                  <button type="button" class="balance-toggle" id="btn-toggle-balance" aria-label="${isBalanceHidden ? 'Show balance' : 'Hide balance'}">
                    ${isBalanceHidden ? getIcon('eye-off') : getIcon('eye')}
                  </button>
                </div>
              </div>
            </div>

            <div class="hero-balance-main">
              <div class="balance-amount ${isBalanceHidden ? 'hidden-amount' : ''}" id="dashboard-balance-amount">
                ${isBalanceHidden ? '••••••••' : formatCurrency(summary.balance)}
              </div>

              <div class="hero-balance-metrics">
                ${momBalanceHtml}
                <span class="hero-context-text">${summary.transactionCount} transactions recorded</span>
              </div>
            </div>

            <!-- Action Pills -->
            <div class="hero-actions-row">
              <button type="button" class="btn hero-btn hero-btn--income" id="btn-hero-add-income">
                <span class="hero-btn-icon">${getIcon('plus')}</span>
                <span>Add Income</span>
              </button>

              <button type="button" class="btn hero-btn hero-btn--expense" id="btn-hero-add-expense">
                <span class="hero-btn-icon">${getIcon('arrow-up')}</span>
                <span>Add Expense</span>
              </button>

              <button type="button" class="btn hero-btn hero-btn--records" id="btn-hero-view-records">
                <span class="hero-btn-icon">${getIcon('transactions')}</span>
                <span>All Records</span>
              </button>
            </div>
          </div>

          <!-- Right: Total Income & Total Expense Integrated into Main Money Card (Piggy bank removed) -->
          <div class="hero-balance-right hero-cashflow-panel">
            <div class="hero-cashflow-card hero-cashflow-card--income">
              <div class="hero-cashflow-head">
                <div class="hero-cashflow-icon hero-cashflow-icon--income">
                  ${getIcon('arrow-down')}
                </div>
                <span class="hero-cashflow-tag">Inflow</span>
              </div>
              <div class="hero-cashflow-label">Total Income</div>
              <div class="hero-cashflow-amount hero-cashflow-amount--income">
                +${formatCurrency(summary.income)}
              </div>
              ${momIncomeBadge}
            </div>

            <div class="hero-cashflow-card hero-cashflow-card--expense">
              <div class="hero-cashflow-head">
                <div class="hero-cashflow-icon hero-cashflow-icon--expense">
                  ${getIcon('arrow-up')}
                </div>
                <span class="hero-cashflow-tag">Outflow</span>
              </div>
              <div class="hero-cashflow-label">Total Expenses</div>
              <div class="hero-cashflow-amount hero-cashflow-amount--expense">
                -${formatCurrency(summary.expenses)}
              </div>
              ${momExpenseBadge}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════
         DESKTOP TWO-COLUMN DASHBOARD GRID
         ════════════════════════════════════════════════════════ -->
    <div class="dashboard-grid">

      <!-- Left / Primary Column -->
      <div class="dashboard-primary">

        <!-- ════════════════════════════════════════════════════════
             SPENDING BY CATEGORY (Clean, Responsive, Well-Aligned)
             ════════════════════════════════════════════════════════ -->
        <section class="card spending-section" aria-label="Category Spending">
          <div class="card-header" style="margin-bottom: var(--space-4);">
            <div>
              <h2 class="card-title">Spending by Category</h2>
              <p class="card-subtitle">${periodLabelText} expense distribution</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-toggle-all-categories">
              ${showAllCategories ? 'Show Top 4' : 'View All'}
            </button>
          </div>

          <div class="spending-categories-grid">
            ${displayCategories.slice(0, showAllCategories ? undefined : 4).map(cat => `
              <div
                class="spending-category-card"
                data-category="${cat.category}"
                role="button"
                tabindex="0"
                aria-label="${cat.category}: ${formatCurrency(cat.amount)}"
                style="--card-accent: ${cat.color};"
              >
                <div class="spending-card-top">
                  <div class="spending-card-icon-wrapper" style="background-color: ${cat.soft}; color: ${cat.color};">
                    ${getIcon(cat.icon)}
                  </div>
                  <span class="spending-pct-pill">${cat.percentage}%</span>
                </div>
                <div class="spending-card-body">
                  <span class="spending-card-name">${cat.category}</span>
                  <span class="spending-card-amount">${formatCurrency(cat.amount)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════
             LATEST TRANSACTION HISTORY
             ════════════════════════════════════════════════════════ -->
        <section class="latest-transactions-section" aria-label="Latest transaction history">
          <div class="latest-section-header">
            <h2 class="latest-section-title">Latest transaction</h2>
            <a href="#transactions" class="latest-see-all" id="link-view-all-transactions">See all</a>
          </div>

          <div class="latest-transactions-card" id="dashboard-recent-transactions"></div>
        </section>

      </div>

      <!-- Right / Secondary Column (Charts & Real Insights) -->
      <div class="dashboard-secondary">

        <!-- Income vs Expense 6-Month Chart -->
        <section class="card dashboard-charts-desktop mb-6" aria-label="Income vs Expense Chart">
          <div class="card-header">
            <div>
              <h2 class="card-title">Income vs Expenses</h2>
              <p class="card-subtitle">Monthly cashflow trend over the last 6 months</p>
            </div>
            <span class="badge" style="background: var(--bg-main); color: var(--color-primary); font-weight: 700;">6 Months</span>
          </div>
          <div id="dashboard-bar-chart-container"></div>
        </section>

        <!-- Spend Breakdown Donut Chart -->
        <section class="card dashboard-charts-desktop mb-6" aria-label="Expense Breakdown by Category">
          <div class="card-header">
            <div>
              <h2 class="card-title">Spend Breakdown</h2>
              <p class="card-subtitle">${periodLabelText} Category Share</p>
            </div>
            <span class="badge" style="background: var(--bg-main); color: var(--text-secondary);">${categoryBreakdown.length} Categories</span>
          </div>
          <div id="dashboard-donut-chart-container"></div>
        </section>

        <!-- Real Financial Insights (Replaces fake bank card) -->
        <section class="card financial-insights-card" aria-label="Financial Insights">
          <div class="card-header">
            <div>
              <h2 class="card-title">Financial Insights</h2>
              <p class="card-subtitle">${periodLabelText} health indicators</p>
            </div>
            <span class="badge ${summary.savingsRate >= 20 ? 'badge--income' : 'badge--neutral'}" style="font-size: 11px;">
              ${summary.savingsRate > 0 ? `${summary.savingsRate.toFixed(1)}% Saved` : 'Overview'}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-3);">
            ${insights.length > 0 ? insights.slice(0, 2).map(ins => `
              <div class="insight-card" style="padding: var(--space-3); gap: var(--space-3);">
                <div class="insight-icon" style="width: 32px; height: 32px;" aria-hidden="true">
                  ${getIcon(ins.icon || 'lightbulb')}
                </div>
                <div class="insight-text" style="font-size: var(--font-size-xs);">
                  <strong>${escapeHTML(ins.title)}:</strong> ${escapeHTML(ins.description)}
                </div>
              </div>
            `).join('') : `
              <div class="insight-card" style="padding: var(--space-3);">
                <div class="insight-icon" aria-hidden="true">${getIcon('lightbulb')}</div>
                <div class="insight-text" style="font-size: var(--font-size-xs);">
                  <strong>Keep Tracking:</strong> Log daily transactions to reveal actionable spending insights and trends.
                </div>
              </div>
            `}
          </div>
        </section>

      </div>

    </div>

    <!-- ════════════════════════════════════════════════════════
         MOBILE SEGREGATED ANALYTICS SECTION
         ════════════════════════════════════════════════════════ -->
    <section class="mobile-analytics-section card" id="mobile-analytics-section" aria-label="Monthly Financial Charts">
      <div class="card-header">
        <div>
          <h2 class="card-title">Financial Charts & Trends</h2>
          <p class="card-subtitle">${periodLabelText} Insights & Cashflow</p>
        </div>
      </div>

      <!-- Segmented pill controls for mobile charts -->
      <div class="chart-tabs-segmented" role="tablist">
        <button
          type="button"
          class="chart-tab-btn ${mobileActiveChart === 'cashflow' ? 'active' : ''}"
          id="tab-mobile-cashflow"
          role="tab"
          aria-selected="${mobileActiveChart === 'cashflow'}"
        >
          Cashflow Trend
        </button>
        <button
          type="button"
          class="chart-tab-btn ${mobileActiveChart === 'breakdown' ? 'active' : ''}"
          id="tab-mobile-breakdown"
          role="tab"
          aria-selected="${mobileActiveChart === 'breakdown'}"
        >
          Spending Share
        </button>
      </div>

      <div id="mobile-chart-viewport" style="min-height: 200px;"></div>

      <button type="button" class="btn btn-secondary btn-sm" id="btn-mobile-full-analytics" style="width: 100%; margin-top: var(--space-4);">
        <span>Open Complete Analytics & Reports →</span>
      </button>
    </section>
  `;

  // Render Desktop Charts
  const barChartContainer = document.getElementById('dashboard-bar-chart-container');
  if (barChartContainer) {
    renderBarChart(barChartContainer, trends, {
      ariaLabel: `Monthly income versus expense chart leading up to ${periodLabelText}`,
    });
  }

  const donutChartContainer = document.getElementById('dashboard-donut-chart-container');
  if (donutChartContainer) {
    renderDonutChart(donutChartContainer, categoryBreakdown, {
      centerLabel: 'Expenses',
      ariaLabel: `Expense category breakdown for ${periodLabelText}`,
    });
  }

  // Render Mobile Segregated Chart Viewport
  renderMobileChartView(trends, categoryBreakdown, periodLabelText);

  // Render Recent Transactions (Table on desktop, Cards on mobile)
  renderRecentTransactionsList(recentTxns);

  // Update mobile header period label if present
  const mobilePeriodLabel = document.getElementById('mobile-period-label');
  if (mobilePeriodLabel) {
    mobilePeriodLabel.textContent = periodLabelText;
  }

  // Attach Event Handlers
  document.getElementById('btn-prev-month')?.addEventListener('click', () => changePeriod(-1));
  document.getElementById('btn-next-month')?.addEventListener('click', () => changePeriod(1));

  if (!mobileListenersAttached) {
    document.getElementById('btn-mobile-prev-month')?.addEventListener('click', () => changePeriod(-1));
    document.getElementById('btn-mobile-next-month')?.addEventListener('click', () => changePeriod(1));
    mobileListenersAttached = true;
  }

  document.getElementById('btn-toggle-balance')?.addEventListener('click', toggleBalanceVisibility);

  // 3 Hero Buttons Handlers
  document.getElementById('btn-hero-add-income')?.addEventListener('click', () => openAddForm('income'));
  document.getElementById('btn-hero-add-expense')?.addEventListener('click', () => openAddForm('expense'));
  document.getElementById('btn-hero-view-records')?.addEventListener('click', () => navigateTo('transactions'));

  // Category Toggle (Show All vs Active)
  document.getElementById('btn-toggle-all-categories')?.addEventListener('click', () => {
    showAllCategories = !showAllCategories;
    renderDashboard();
  });

  // Category Cards Click Handlers (Filter transactions by category)
  const categoryCards = document.querySelectorAll('.spending-category-card');
  categoryCards.forEach(card => {
    const catName = card.getAttribute('data-category');
    if (!catName) return;

    card.addEventListener('click', () => {
      filterByCategory(catName);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        filterByCategory(catName);
      }
    });
  });

  // Mobile Segmented Chart Switchers
  document.getElementById('tab-mobile-cashflow')?.addEventListener('click', () => {
    mobileActiveChart = 'cashflow';
    document.getElementById('tab-mobile-cashflow')?.classList.add('active');
    document.getElementById('tab-mobile-breakdown')?.classList.remove('active');
    renderMobileChartView(trends, categoryBreakdown, periodLabelText);
  });

  document.getElementById('tab-mobile-breakdown')?.addEventListener('click', () => {
    mobileActiveChart = 'breakdown';
    document.getElementById('tab-mobile-breakdown')?.classList.add('active');
    document.getElementById('tab-mobile-cashflow')?.classList.remove('active');
    renderMobileChartView(trends, categoryBreakdown, periodLabelText);
  });

  document.getElementById('btn-mobile-full-analytics')?.addEventListener('click', () => {
    navigateTo('analytics');
  });

  document.getElementById('link-view-all-transactions')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('transactions');
  });
}

/**
 * Render the active chart in the mobile segregated section.
 * @param {Array} trends
 * @param {Array} categoryBreakdown
 * @param {string} periodLabelText
 */
function renderMobileChartView(trends, categoryBreakdown, periodLabelText) {
  const container = document.getElementById('mobile-chart-viewport');
  if (!container) return;

  container.innerHTML = '';
  if (mobileActiveChart === 'cashflow') {
    renderBarChart(container, trends, {
      ariaLabel: `Mobile monthly income versus expense trend`,
    });
  } else {
    renderDonutChart(container, categoryBreakdown, {
      centerLabel: 'Spend',
      ariaLabel: `Mobile category expense breakdown for ${periodLabelText}`,
    });
  }
}

/**
 * Render the 5 recent transactions as a desktop table and mobile list cards.
 * @param {Array} transactions
 */
function renderRecentTransactionsList(transactions) {
  const container = document.getElementById('dashboard-recent-transactions');
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-8) var(--space-4);">
        <div class="empty-state-icon">
          ${getIcon('receipt')}
        </div>
        <h3 class="empty-state-title">No transactions yet</h3>
        <p class="empty-state-text">Start tracking your money by recording your first transaction for this month.</p>
        <button type="button" class="btn btn-primary btn-sm" id="btn-empty-add-dash">
          ${getIcon('plus')}
          <span>Add Transaction</span>
        </button>
      </div>
    `;
    document.getElementById('btn-empty-add-dash')?.addEventListener('click', () => openAddForm('expense'));
    return;
  }

  // Unified clean latest transactions list (Image 3 & Reference 1)
  const listWrapper = document.createElement('div');
  listWrapper.className = 'latest-tx-list';

  transactions.forEach(t => {
    const meta = getCategoryMeta(t.category);
    const isIncome = t.type === 'income';

    const item = document.createElement('div');
    item.className = 'latest-tx-item';
    item.innerHTML = `
      <div class="latest-tx-left">
        <div class="latest-tx-icon" style="background-color: ${meta.soft}; color: ${meta.color};" aria-hidden="true">
          ${getIcon(meta.icon)}
        </div>
        <div class="latest-tx-details">
          <span class="latest-tx-title" title="${escapeHTML(t.description)}">${escapeHTML(t.description)}</span>
          <div class="latest-tx-meta">
            <span class="badge" style="background: ${meta.soft}; color: ${meta.color}; font-size: 11px; padding: 1px 7px;">
              ${t.category}
            </span>
            <span>•</span>
            <span>${formatDateShort(t.date)}</span>
          </div>
        </div>
      </div>

      <div class="latest-tx-right">
        <span class="latest-tx-amount ${isIncome ? 'latest-tx-amount--income' : 'latest-tx-amount--expense'}">
          ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
        </span>
        <div class="latest-tx-actions">
          <button type="button" class="latest-action-btn btn-edit-dash" data-id="${t.id}" aria-label="Edit ${escapeHTML(t.description)}">
            ${getIcon('edit')}
          </button>
          <button type="button" class="latest-action-btn latest-action-btn--delete btn-delete-dash" data-id="${t.id}" data-desc="${escapeHTML(t.description)}" aria-label="Delete ${escapeHTML(t.description)}">
            ${getIcon('trash')}
          </button>
        </div>
      </div>
    `;

    listWrapper.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(listWrapper);

  // Attach Edit and Delete listeners
  container.querySelectorAll('.btn-edit-dash').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const all = getAllTransactions();
      const target = all.find(item => item.id === id);
      if (target) openEditForm(target);
    });
  });

  container.querySelectorAll('.btn-delete-dash').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const desc = btn.getAttribute('data-desc');
      openDeleteConfirmation(id, desc, () => {
        renderDashboard();
      });
    });
  });
}
