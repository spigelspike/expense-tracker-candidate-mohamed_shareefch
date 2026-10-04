/* ============================================================
   KOIN — AI Overview Analytics
   Builds a structured financial analysis prompt and provides
   one-click options to send to ChatGPT, Claude, Gemini, or copy.
   Supports selectable time periods.
   ============================================================ */

import { getAllTransactions } from '../modules/transactions.js';
import { getUserProfile } from '../modules/storage.js';
import { getMonthlySummary, getCategoryBreakdown, getMonthlyTrends } from '../modules/analytics.js';
import { formatCurrency, getCurrentMonth } from '../utils.js';
import { showSuccess, showInfo } from './notifications.js';

const OVERLAY_ID = 'ai-overview-overlay';
const MODAL_ID = 'ai-overview-modal';

const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * Period definitions.
 * Each period describes how to derive a date range relative to today.
 */
const PERIODS = [
  { id: 'this_month',   label: 'This Month' },
  { id: 'last_month',   label: 'Last Month' },
  { id: 'last_3',       label: 'Last 3 Months' },
  { id: 'last_6',       label: 'Last 6 Months' },
  { id: 'all_time',     label: 'All Time' },
];

/**
 * Given a period id, return filtered transactions and a human-readable label.
 * @param {string} periodId
 * @param {Array} allTransactions
 * @returns {{ transactions: Array, label: string, year: number|null, month: number|null, multiMonth: boolean }}
 */
function resolvePeriod(periodId, allTransactions) {
  const now = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed

  switch (periodId) {
    case 'this_month': {
      const txns = allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      });
      return { transactions: txns, label: `${MONTH_NAMES_LONG[curMonth]} ${curYear}`, year: curYear, month: curMonth, multiMonth: false };
    }
    case 'last_month': {
      const d = new Date(curYear, curMonth - 1, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const txns = allTransactions.filter(t => {
        const td = new Date(t.date);
        return td.getFullYear() === y && td.getMonth() === m;
      });
      return { transactions: txns, label: `${MONTH_NAMES_LONG[m]} ${y}`, year: y, month: m, multiMonth: false };
    }
    case 'last_3': {
      const cutoff = new Date(curYear, curMonth - 2, 1);
      const txns = allTransactions.filter(t => new Date(t.date) >= cutoff);
      return { transactions: txns, label: 'Last 3 Months', year: null, month: null, multiMonth: true, numMonths: 3 };
    }
    case 'last_6': {
      const cutoff = new Date(curYear, curMonth - 5, 1);
      const txns = allTransactions.filter(t => new Date(t.date) >= cutoff);
      return { transactions: txns, label: 'Last 6 Months', year: null, month: null, multiMonth: true, numMonths: 6 };
    }
    case 'all_time':
    default: {
      return { transactions: allTransactions, label: 'All Time', year: null, month: null, multiMonth: true, numMonths: 12 };
    }
  }
}

/**
 * Build a rich financial summary prompt from current transaction data.
 * @param {string} periodId
 * @returns {string}
 */
function buildFinancialPrompt(periodId = 'this_month') {
  const profile = getUserProfile();
  const allTransactions = getAllTransactions();
  const { transactions, label, year, month, multiMonth, numMonths } = resolvePeriod(periodId, allTransactions);

  const salary = Number(profile.salary) || 0;
  const goal   = Number(profile.monthlyGoal) || 0;

  let summarySection = '';
  let breakdownSection = '';
  let trendsSection = '';

  if (!multiMonth && year !== null && month !== null) {
    // Single-month view
    const summary   = getMonthlySummary(allTransactions, year, month);
    const breakdown = getCategoryBreakdown(allTransactions, year, month);
    const trends    = getMonthlyTrends(allTransactions, 6);

    const savingsRate = summary.income > 0
      ? Math.round(((summary.income - summary.expenses) / summary.income) * 100) : 0;

    const goalProgress = goal > 0
      ? Math.min(100, Math.round((Math.max(0, summary.balance) / goal) * 100)) : 0;

    summarySection = `## ${label} Summary
- Total Income: ${formatCurrency(summary.income)}
- Total Expenses: ${formatCurrency(summary.expenses)}
- Net Balance: ${formatCurrency(summary.balance)}
- Savings Rate: ${savingsRate}%
- Savings Goal Progress: ${goalProgress}%
- Income Transactions: ${summary.incomeCount || 0}
- Expense Transactions: ${summary.expenseCount || 0}`;

    breakdownSection = `## Expense Breakdown by Category (${label})
${breakdown.length > 0
  ? breakdown.map(c => `  • ${c.category}: ${formatCurrency(c.amount)} (${c.percentage}%)`).join('\n')
  : '  No expense data for this period.'}`;

    trendsSection = `## Monthly Trends (Last 6 Months)
${trends.length > 0
  ? trends.map(t => `  • ${MONTH_NAMES_SHORT[t.month - 1]} ${t.year}: Income ${formatCurrency(t.income)}, Expenses ${formatCurrency(t.expenses)}, Balance ${formatCurrency(t.balance)}`).join('\n')
  : '  Insufficient trend data.'}`;

  } else {
    // Multi-month view: aggregate totals over filtered transactions
    const totalIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netBalance    = totalIncome - totalExpenses;
    const savingsRate   = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    // Category breakdown from filtered transactions
    const catMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const catLines = catEntries.length > 0
      ? catEntries.map(([cat, amt]) => {
          const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
          return `  • ${cat}: ${formatCurrency(amt)} (${pct}%)`;
        }).join('\n')
      : '  No expense data for this period.';

    // Monthly trends over the filtered window
    const trends = getMonthlyTrends(allTransactions, numMonths || 12);
    const trendLines = trends.length > 0
      ? trends.map(t => `  • ${MONTH_NAMES_SHORT[t.month - 1]} ${t.year}: Income ${formatCurrency(t.income)}, Expenses ${formatCurrency(t.expenses)}, Balance ${formatCurrency(t.balance)}`).join('\n')
      : '  Insufficient trend data.';

    summarySection = `## ${label} Summary
- Total Income: ${formatCurrency(totalIncome)}
- Total Expenses: ${formatCurrency(totalExpenses)}
- Net Balance: ${formatCurrency(netBalance)}
- Savings Rate: ${savingsRate}%
- Total Transactions: ${transactions.length}`;

    breakdownSection = `## Expense Breakdown by Category (${label})
${catLines}`;

    trendsSection = `## Monthly Trends (${label})
${trendLines}`;
  }

  return `# Koin Financial Overview — ${label}

## User Profile
- Name: ${profile.name || 'User'}
- Occupation: ${profile.occupation || 'Not specified'}
- Monthly Salary: ${formatCurrency(salary)}
- Monthly Savings Goal: ${formatCurrency(goal)}

${summarySection}

${breakdownSection}

${trendsSection}

## Overall Stats
- All-time transactions: ${allTransactions.length}

---
Please analyze this personal finance data and provide:
1. Key observations about spending patterns
2. Areas where I can reduce expenses
3. Progress toward my savings goal
4. Specific actionable recommendations for next month
5. A simple monthly budget suggestion based on my salary`;
}

/**
 * Copy text to clipboard and show notification.
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Prompt copied to clipboard!');
  } catch {
    showInfo('Copy failed — please manually select and copy the prompt below.');
  }
}

/**
 * Rebuild the prompt preview and return fresh prompt for given period.
 * @param {string} periodId
 * @returns {string}
 */
function refreshPromptPreview(periodId) {
  const prompt = buildFinancialPrompt(periodId);
  const previewEl = document.getElementById('ai-prompt-text');
  if (previewEl) previewEl.textContent = prompt;

  // Update subtitle
  const { transactions, label } = resolvePeriod(periodId, getAllTransactions());
  const subtitleEl = document.getElementById('ai-overview-subtitle');
  if (subtitleEl) subtitleEl.textContent = `${label} · ${transactions.length} transactions`;

  return prompt;
}

/**
 * Open the AI Overview modal.
 */
export function openAiOverviewModal() {
  const overlay = document.getElementById(OVERLAY_ID);
  const modal   = document.getElementById(MODAL_ID);
  if (!overlay || !modal) return;

  // Default period
  let activePeriod = 'this_month';
  let currentPrompt = buildFinancialPrompt(activePeriod);

  const { year, month } = getCurrentMonth();
  const allTxns = getAllTransactions();
  const { transactions: initTxns, label: initLabel } = resolvePeriod(activePeriod, allTxns);

  // Period selector pills HTML
  const periodPillsHtml = PERIODS.map(p => `
    <button type="button" class="ai-period-pill${p.id === activePeriod ? ' active' : ''}" data-period="${p.id}">
      ${p.label}
    </button>`).join('');

  modal.innerHTML = `
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#8B5CF6,#3978F6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="color:#ffffff;">
            <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z"/>
            <path d="M19 2c0 2.2-1.8 4-4 4 2.2 0 4 1.8 4 4 0-2.2 1.8-4 4-4-2.2 0-4-1.8-4-4z"/>
          </svg>
        </span>
        <div>
          <h2 class="modal-title" id="ai-overview-title" style="font-size:16px;margin:0;">AI Financial Overview</h2>
          <p id="ai-overview-subtitle" style="margin:0;font-size:12px;color:var(--text-muted);">${initLabel} · ${initTxns.length} transactions</p>
        </div>
      </div>
      <button type="button" class="btn-icon modal-close" id="btn-close-ai-modal" aria-label="Close AI overview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="modal-body" style="padding:var(--space-5) var(--space-6);">
      <p style="font-size:13px;color:var(--text-secondary);margin:0 0 var(--space-4);">
        Send your financial data to your favorite AI assistant for personalized insights and recommendations.
      </p>

      <!-- Period Selector -->
      <div class="ai-period-selector" role="group" aria-label="Select time period">
        <span class="ai-period-label">Period:</span>
        <div class="ai-period-pills" id="ai-period-pills">
          ${periodPillsHtml}
        </div>
      </div>

      <!-- LLM Action Buttons -->
      <div class="ai-llm-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-5);">
        <!-- ChatGPT (OpenAI Official Logo) -->
        <button type="button" class="ai-llm-btn ai-llm-btn--chatgpt" id="btn-ai-chatgpt">
          <span class="ai-llm-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9899 5.9899 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.0781a4.4709 4.4709 0 0 1-2.8764-1.0404l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.66-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1401-2.1764zM2.3402 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.4992 4.4992 0 0 1 2.3402 7.8956zm16.0993 3.8558L12.5967 8.3829l2.02-1.1635a.0804.0804 0 0 1 .0757 0l4.8304 2.7915a4.4945 4.4945 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6866zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8304-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3074 12.829l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0261a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.7048 5.411a.7948.7948 0 0 0-.3927.6813v6.7369h-.0047zm-1.0076-1.4058l2.6025-1.4965 2.5977 1.4965v2.9977l-2.5977 1.4965-2.6025-1.4965z"/>
            </svg>
          </span>
          <span class="ai-llm-name">ChatGPT</span>
        </button>

        <!-- Claude (Anthropic Official Starburst/Asterisk) -->
        <button type="button" class="ai-llm-btn ai-llm-btn--claude" id="btn-ai-claude">
          <span class="ai-llm-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/>
            </svg>
          </span>
          <span class="ai-llm-name">Claude</span>
        </button>

        <!-- Gemini (Google Gemini Official 4-Point Sparkle Star) -->
        <button type="button" class="ai-llm-btn ai-llm-btn--gemini" id="btn-ai-gemini">
          <span class="ai-llm-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"/>
            </svg>
          </span>
          <span class="ai-llm-name">Gemini</span>
        </button>

        <button type="button" class="ai-llm-btn ai-llm-btn--copy" id="btn-ai-copy">
          <span class="ai-llm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </span>
          <span class="ai-llm-name">Copy Prompt</span>
        </button>
      </div>

      <!-- Prompt Preview -->
      <div class="ai-prompt-preview">
        <div class="ai-prompt-preview-header">
          <span style="font-size:12px;font-weight:600;color:var(--text-secondary);">Generated Prompt Preview</span>
        </div>
        <pre class="ai-prompt-text" id="ai-prompt-text">${escapeForHTML(currentPrompt)}</pre>
      </div>
    </div>
  `;

  // --- Wire period pills ---
  document.getElementById('ai-period-pills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-period]');
    if (!pill) return;
    activePeriod = pill.dataset.period;

    // Update active class
    document.querySelectorAll('#ai-period-pills .ai-period-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.period === activePeriod);
    });

    // Refresh prompt and preview
    currentPrompt = refreshPromptPreview(activePeriod);
  });

  // Close
  document.getElementById('btn-close-ai-modal')?.addEventListener('click', closeAiOverviewModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAiOverviewModal(); });

  // ChatGPT
  document.getElementById('btn-ai-chatgpt')?.addEventListener('click', () => {
    const url = `https://chatgpt.com/?q=${encodeURIComponent(currentPrompt)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  // Claude — copy then open
  document.getElementById('btn-ai-claude')?.addEventListener('click', async () => {
    await copyToClipboard(currentPrompt);
    setTimeout(() => window.open('https://claude.ai/new', '_blank', 'noopener,noreferrer'), 600);
  });

  // Gemini — copy then open
  document.getElementById('btn-ai-gemini')?.addEventListener('click', async () => {
    await copyToClipboard(currentPrompt);
    setTimeout(() => window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer'), 600);
  });

  // Copy prompt
  document.getElementById('btn-ai-copy')?.addEventListener('click', () => {
    copyToClipboard(currentPrompt);
  });

  // Show overlay
  overlay.removeAttribute('aria-hidden');
  overlay.classList.add('active');
  document.getElementById('btn-close-ai-modal')?.focus();
}

/**
 * Close the AI Overview modal.
 */
export function closeAiOverviewModal() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

/**
 * Escape text for safe display inside HTML pre element.
 * @param {string} text
 * @returns {string}
 */
function escapeForHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Initialize AI Overview sidebar button and mobile analytics card.
 * Call once on app init.
 */
export function initAiOverview() {
  // Desktop sidebar navigation button
  document.getElementById('btn-nav-ai-overview')?.addEventListener('click', () => {
    openAiOverviewModal();
  });
  document.getElementById('btn-sidebar-ai-overview')?.addEventListener('click', () => {
    openAiOverviewModal();
  });

  // Keyboard support for modal close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById(OVERLAY_ID);
      if (overlay?.classList.contains('active')) closeAiOverviewModal();
    }
  });
}
