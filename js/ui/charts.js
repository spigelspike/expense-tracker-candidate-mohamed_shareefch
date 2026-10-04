/* ============================================================
   KOIN — Charts UI Module
   Pure SVG and CSS chart rendering.
   No calculations, persistence, or data manipulation inside.
   Accessible, data-driven, and responsive.
   ============================================================ */

import { formatCurrency, formatCurrencyCompact, formatPercentage, getIcon } from '../utils.js';

/**
 * Render a dual-bar comparison chart (e.g. Income vs Expenses across months).
 * @param {HTMLElement} container - DOM element to render into
 * @param {Array<{ label: string, income: number, expenses: number }>} data
 * @param {object} [options]
 */
export function renderBarChart(container, data, options = {}) {
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
        <p class="empty-state-text">No transaction data available for this period.</p>
      </div>
    `;
    return;
  }

  // Find max value for scaling the Y-axis
  let maxVal = 0;
  data.forEach(item => {
    if (item.income > maxVal) maxVal = item.income;
    if (item.expenses > maxVal) maxVal = item.expenses;
  });

  // Provide a minimal scale threshold if all are 0
  const chartMax = maxVal > 0 ? maxVal * 1.2 : 1000;

  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'chart-container';
  chartWrapper.setAttribute('role', 'img');
  chartWrapper.setAttribute(
    'aria-label',
    options.ariaLabel || 'Monthly income versus expense comparison chart'
  );

  // Background grid lines (3 lines)
  const grid = document.createElement('div');
  grid.className = 'chart-grid';
  grid.setAttribute('aria-hidden', 'true');
  grid.innerHTML = `
    <div class="chart-grid-line"></div>
    <div class="chart-grid-line"></div>
    <div class="chart-grid-line"></div>
  `;
  chartWrapper.appendChild(grid);

  // Bar chart container
  const barChart = document.createElement('div');
  barChart.className = 'bar-chart';

  data.forEach(item => {
    const group = document.createElement('div');
    group.className = 'bar-chart-group';

    const bars = document.createElement('div');
    bars.className = 'bar-chart-bars';

    // Income Bar
    const isIncomeZero = item.income === 0;
    const incomeHeightPct = maxVal > 0 && !isIncomeZero
      ? Math.max(4, (item.income / chartMax) * 100)
      : 4;
    const incomeBar = document.createElement('div');
    incomeBar.className = 'bar-chart-bar bar-chart-bar--income';
    if (isIncomeZero) incomeBar.classList.add('bar-chart-bar--zero');
    incomeBar.style.height = `${incomeHeightPct}%`;
    incomeBar.setAttribute('tabindex', '0');
    incomeBar.setAttribute(
      'aria-label',
      `${item.label} Income: ${formatCurrency(item.income)}`
    );

    const incomeTooltip = document.createElement('div');
    incomeTooltip.className = 'chart-tooltip';
    incomeTooltip.textContent = `+${formatCurrency(item.income)}`;
    incomeBar.appendChild(incomeTooltip);

    // Expense Bar
    const isExpenseZero = item.expenses === 0;
    const expenseHeightPct = maxVal > 0 && !isExpenseZero
      ? Math.max(4, (item.expenses / chartMax) * 100)
      : 4;
    const expenseBar = document.createElement('div');
    expenseBar.className = 'bar-chart-bar bar-chart-bar--expense';
    if (isExpenseZero) expenseBar.classList.add('bar-chart-bar--zero');
    expenseBar.style.height = `${expenseHeightPct}%`;
    expenseBar.setAttribute('tabindex', '0');
    expenseBar.setAttribute(
      'aria-label',
      `${item.label} Expense: ${formatCurrency(item.expenses)}`
    );

    const expenseTooltip = document.createElement('div');
    expenseTooltip.className = 'chart-tooltip';
    expenseTooltip.textContent = `-${formatCurrency(item.expenses)}`;
    expenseBar.appendChild(expenseTooltip);

    bars.appendChild(incomeBar);
    bars.appendChild(expenseBar);

    // Label
    const label = document.createElement('div');
    label.className = 'bar-chart-label';
    label.textContent = item.label;

    group.appendChild(bars);
    group.appendChild(label);
    barChart.appendChild(group);
  });

  chartWrapper.appendChild(barChart);

  // Chart Legend
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  legend.setAttribute('aria-hidden', 'true');
  legend.innerHTML = `
    <div class="chart-legend-item">
      <span class="chart-legend-dot" style="background: linear-gradient(135deg, #2B59FF, #60A5FA);"></span>
      <span>Income</span>
    </div>
    <div class="chart-legend-item">
      <span class="chart-legend-dot" style="background: linear-gradient(135deg, #F43F5E, #FDA4AF);"></span>
      <span>Expenses</span>
    </div>
  `;
  chartWrapper.appendChild(legend);

  container.appendChild(chartWrapper);
}

/**
 * Render a SVG Donut Chart with center value and legend.
 * @param {HTMLElement} container
 * @param {Array<{ category: string, amount: number, percentage: number, color: string }>} data
 * @param {object} [options]
 */
export function renderDonutChart(container, data, options = {}) {
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
        <p class="empty-state-text">No expense categories to display.</p>
      </div>
    `;
    return;
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const wrapper = document.createElement('div');
  wrapper.className = 'donut-chart-wrapper';
  wrapper.setAttribute('role', 'img');
  wrapper.setAttribute('aria-label', options.ariaLabel || 'Category expense breakdown donut chart');

  // SVG parameters
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const circles = data.map(item => {
    const strokeDash = (item.percentage / 100) * circumference;
    const offset = currentOffset;
    currentOffset -= strokeDash;

    return `
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="transparent"
        stroke="${item.color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${strokeDash} ${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
        style="transition: stroke-dasharray 0.5s ease;"
      />
    `;
  }).join('');

  const donutDiv = document.createElement('div');
  donutDiv.className = 'donut-chart';
  donutDiv.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="transparent"
        stroke="var(--bg-main)"
        stroke-width="${strokeWidth}"
      />
      ${circles}
    </svg>
    <div class="donut-chart-center" aria-hidden="true">
      <span class="donut-chart-center-label">${options.centerLabel || 'Total'}</span>
      <span class="donut-chart-center-value">${formatCurrencyCompact(total)}</span>
    </div>
  `;

  // Legend
  const legendDiv = document.createElement('div');
  legendDiv.className = 'donut-legend';

  data.slice(0, 5).forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'donut-legend-item';
    legendItem.innerHTML = `
      <span class="donut-legend-color" style="background-color: ${item.color};"></span>
      <span class="donut-legend-label">${item.category}</span>
      <span class="donut-legend-value">${formatCurrency(item.amount)}</span>
      <span class="donut-legend-pct">${formatPercentage(item.percentage)}</span>
    `;
    legendDiv.appendChild(legendItem);
  });

  wrapper.appendChild(donutDiv);
  wrapper.appendChild(legendDiv);
  container.appendChild(wrapper);
}

/**
 * Render a horizontal bar chart for category breakdown list.
 * @param {HTMLElement} container
 * @param {Array<{ category: string, amount: number, percentage: number, color: string, icon: string }>} data
 */
export function renderHorizontalBarChart(container, data) {
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: var(--space-6) var(--space-4);">
        <p class="empty-state-text">No category data available.</p>
      </div>
    `;
    return;
  }

  const chart = document.createElement('div');
  chart.className = 'h-bar-chart';

  data.forEach(item => {
    const row = document.createElement('div');
    row.className = 'h-bar-item';

    const header = document.createElement('div');
    header.className = 'h-bar-header';

    const label = document.createElement('div');
    label.className = 'h-bar-label';
    label.innerHTML = `
      <span class="category-icon category-icon--sm" style="background-color: ${item.soft || 'var(--bg-main)'}; color: ${item.color};">
        ${getIcon(item.icon)}
      </span>
      <span>${item.category}</span>
    `;

    const val = document.createElement('div');
    val.className = 'h-bar-value';
    val.innerHTML = `${formatCurrency(item.amount)} <span class="text-muted" style="font-size: var(--font-size-xs); font-weight: normal; margin-left: 4px;">(${formatPercentage(item.percentage)})</span>`;

    header.appendChild(label);
    header.appendChild(val);

    const track = document.createElement('div');
    track.className = 'h-bar-track';

    const fill = document.createElement('div');
    fill.className = 'h-bar-fill';
    fill.style.width = `${Math.max(2, item.percentage)}%`;
    fill.style.backgroundColor = item.color;

    track.appendChild(fill);
    row.appendChild(header);
    row.appendChild(track);
    chart.appendChild(row);
  });

  container.appendChild(chart);
}
