/* ============================================================
   KOIN — Transaction List UI Module
   Search, filters, sort, desktop table, mobile cards,
   edit triggering, and accessible delete confirmation.
   ============================================================ */

import { getAllTransactions, removeTransaction } from '../modules/transactions.js';
import { filterTransactions, sortTransactions, clearFilters } from '../modules/filters.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryMeta } from '../data/categories.js';
import { openAddForm, openEditForm } from './transaction-form.js';
import { showSuccess, showError } from './notifications.js';
import { navigateTo } from './navigation.js';
import { formatCurrency, formatDate, formatDateShort, debounce, getIcon } from '../utils.js';

let activeFilters = clearFilters();
let pendingDeleteId = null;
let mutationCallbacks = [];

/**
 * Filter the transaction list by a specific category and navigate to transactions view.
 * @param {string} categoryName
 */
export function filterByCategory(categoryName) {
  activeFilters = {
    ...clearFilters(),
    category: categoryName,
    type: 'all',
  };
  navigateTo('transactions');
}

/**
 * Register a callback when a transaction is deleted.
 * @param {Function} cb
 */
export function onTransactionMutated(cb) {
  if (typeof cb === 'function') {
    mutationCallbacks.push(cb);
  }
}

function notifyMutation() {
  mutationCallbacks.forEach(cb => {
    try {
      cb();
    } catch (err) {
      console.error('Error in onTransactionMutated:', err);
    }
  });
}

/**
 * Open confirmation modal dialog before deleting.
 * @param {string} id
 * @param {string} desc
 */
export function openDeleteConfirmation(id, desc, onDeleted) {
  pendingDeleteId = id;
  const overlay = document.getElementById('confirm-overlay');
  const modal = document.getElementById('confirm-modal');
  if (!overlay || !modal) return;

  modal.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-dialog-icon" aria-hidden="true">
        ${getIcon('trash')}
      </div>
      <h3 class="confirm-dialog-title" id="confirm-title">Delete Transaction?</h3>
      <p class="confirm-dialog-text">
        Are you sure you want to delete "<strong>${desc}</strong>"? This action cannot be undone.
      </p>
      <div class="confirm-dialog-actions">
        <button type="button" class="btn btn-secondary" id="btn-cancel-delete">Cancel</button>
        <button type="button" class="btn btn-danger" id="btn-confirm-delete">Delete</button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const cancelBtn = document.getElementById('btn-cancel-delete');
  const confirmBtn = document.getElementById('btn-confirm-delete');

  const closeDialog = () => {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    pendingDeleteId = null;
  };

  cancelBtn?.addEventListener('click', closeDialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  }, { once: true });

  confirmBtn?.addEventListener('click', () => {
    if (!pendingDeleteId) return;
    try {
      removeTransaction(pendingDeleteId);
      closeDialog();
      showSuccess('Transaction deleted successfully.');
      notifyMutation();
      renderTransactionList();
      if (typeof onDeleted === 'function') {
        onDeleted();
      }
    } catch (err) {
      showError(err.message || 'Failed to delete transaction.');
    }
  });

  confirmBtn?.focus();
}

/**
 * Render the transaction list page.
 */
export function renderTransactionList() {
  const container = document.getElementById('page-transactions');
  if (!container) return;

  const allTxns = getAllTransactions();
  const filtered = filterTransactions(allTxns, activeFilters);
  const sorted = sortTransactions(filtered);

  // Build category options based on currently selected type filter
  let categoryOptions = [];
  if (activeFilters.type === 'expense') {
    categoryOptions = EXPENSE_CATEGORIES.map(c => c.name);
  } else if (activeFilters.type === 'income') {
    categoryOptions = INCOME_CATEGORIES.map(c => c.name);
  } else {
    // Unique list of all category names
    const allNames = new Set([
      ...EXPENSE_CATEGORIES.map(c => c.name),
      ...INCOME_CATEGORIES.map(c => c.name),
    ]);
    categoryOptions = Array.from(allNames);
  }

  container.innerHTML = `
    <!-- Header -->
    <header class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Transactions</h1>
        <p class="page-subtitle">View, search, and manage all your income and expenses</p>
      </div>
      <div class="page-header-actions">
        <button type="button" class="btn btn-primary" id="btn-add-transaction-list">
          ${getIcon('plus')}
          <span>Add Transaction</span>
        </button>
      </div>
    </header>

    <!-- Filter Bar -->
    <div class="card mb-5" style="padding: var(--space-4) var(--space-5);">
      <div class="filter-bar">
        <!-- Search Input -->
        <div class="search-input-wrapper">
          <span class="search-icon" aria-hidden="true">${getIcon('search')}</span>
          <input
            type="search"
            class="form-input"
            id="filter-search"
            placeholder="Search by description or category..."
            value="${activeFilters.query || ''}"
            aria-label="Search transactions"
          >
        </div>

        <div class="filter-bar-row">
          <!-- Type Filter -->
          <select class="form-select filter-select" id="filter-type" aria-label="Filter by type">
            <option value="all" ${activeFilters.type === 'all' ? 'selected' : ''}>All Types</option>
            <option value="expense" ${activeFilters.type === 'expense' ? 'selected' : ''}>Expenses</option>
            <option value="income" ${activeFilters.type === 'income' ? 'selected' : ''}>Income</option>
          </select>

          <!-- Category Filter -->
          <select class="form-select filter-select" id="filter-category" aria-label="Filter by category">
            <option value="all" ${activeFilters.category === 'all' ? 'selected' : ''}>All Categories</option>
            ${categoryOptions.map(cat => `
              <option value="${cat}" ${activeFilters.category === cat ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>
        </div>

        <div class="filter-bar-row">
          <!-- Start Date -->
          <input
            type="date"
            class="form-input filter-select"
            id="filter-start-date"
            value="${activeFilters.startDate || ''}"
            aria-label="Start date"
            title="Start date"
          >

          <!-- End Date -->
          <input
            type="date"
            class="form-input filter-select"
            id="filter-end-date"
            value="${activeFilters.endDate || ''}"
            aria-label="End date"
            title="End date"
          >
        </div>

        <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-filters" title="Reset all filters">
          Reset Filters
        </button>
      </div>

      <!-- Active result count -->
      <div style="font-size: var(--font-size-xs); color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
        <span>Showing <strong>${sorted.length}</strong> of ${allTxns.length} transactions</span>
      </div>
    </div>

    <!-- Main List Container -->
    <div class="card" id="transactions-content-card">
      <div id="transactions-empty-wrapper" class="transaction-empty-wrapper"></div>
      <div id="transactions-table-wrapper" class="transaction-table-wrapper"></div>
      <div id="transactions-cards-wrapper" class="transaction-cards"></div>
    </div>
  `;

  // Render Table & Cards or Empty States
  renderTransactionRecords(sorted, allTxns.length);

  // Attach Filter Listeners
  attachFilterListeners();
}

/**
 * Render the table (desktop) and cards (mobile) or appropriate empty state.
 * @param {Array} transactions
 * @param {number} totalCount
 */
function renderTransactionRecords(transactions, totalCount) {
  const emptyWrapper = document.getElementById('transactions-empty-wrapper');
  const tableWrapper = document.getElementById('transactions-table-wrapper');
  const cardsWrapper = document.getElementById('transactions-cards-wrapper');
  if (!tableWrapper || !cardsWrapper) return;

  // Case 1: Total records is 0
  if (totalCount === 0) {
    const emptyHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">${getIcon('receipt')}</div>
        <h3 class="empty-state-title">No transactions recorded yet</h3>
        <p class="empty-state-text">Your financial records will appear here once you log your first income or expense.</p>
        <button type="button" class="btn btn-primary" id="btn-empty-add-trans">
          ${getIcon('plus')}
          <span>Add Transaction</span>
        </button>
      </div>
    `;
    if (emptyWrapper) {
      emptyWrapper.innerHTML = emptyHtml;
      emptyWrapper.style.display = 'block';
    }
    tableWrapper.innerHTML = '';
    tableWrapper.style.display = 'none';
    cardsWrapper.innerHTML = '';
    cardsWrapper.style.display = 'none';
    document.getElementById('btn-empty-add-trans')?.addEventListener('click', () => openAddForm());
    return;
  }

  // Case 2: Filters match 0 records
  if (transactions.length === 0) {
    const noResultsHtml = `
      <div class="empty-state">
        <div class="empty-state-icon" style="background-color: var(--color-purple-soft); color: var(--color-purple);">
          ${getIcon('search')}
        </div>
        <h3 class="empty-state-title">No matching transactions</h3>
        <p class="empty-state-text">Try adjusting your search terms, date range, or category filter to find what you are looking for.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-empty-reset-trans">
          Reset Filters
        </button>
      </div>
    `;
    if (emptyWrapper) {
      emptyWrapper.innerHTML = noResultsHtml;
      emptyWrapper.style.display = 'block';
    }
    tableWrapper.innerHTML = '';
    tableWrapper.style.display = 'none';
    cardsWrapper.innerHTML = '';
    cardsWrapper.style.display = 'none';
    document.getElementById('btn-empty-reset-trans')?.addEventListener('click', () => {
      activeFilters = clearFilters();
      renderTransactionList();
    });
    return;
  }

  if (emptyWrapper) {
    emptyWrapper.innerHTML = '';
    emptyWrapper.style.display = 'none';
  }
  tableWrapper.style.display = '';
  cardsWrapper.style.display = '';

  // ── Desktop Table ──────────────────────────────────────────
  const table = document.createElement('table');
  table.className = 'transaction-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col" style="width: 140px;">Date</th>
        <th scope="col">Description</th>
        <th scope="col" style="width: 160px;">Category</th>
        <th scope="col" style="width: 120px;">Type</th>
        <th scope="col" style="width: 160px; text-align: right;">Amount</th>
        <th scope="col" style="width: 100px; text-align: right;">Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  transactions.forEach(t => {
    const meta = getCategoryMeta(t.category);
    const isIncome = t.type === 'income';

    const tr = document.createElement('tr');

    // Date
    const tdDate = document.createElement('td');
    tdDate.className = 'transaction-date';
    tdDate.textContent = formatDate(t.date);

    // Description
    const tdDesc = document.createElement('td');
    const descSpan = document.createElement('div');
    descSpan.className = 'transaction-description';
    descSpan.textContent = t.description;
    tdDesc.appendChild(descSpan);

    // Category
    const tdCat = document.createElement('td');
    tdCat.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-2);">
        <span class="category-icon category-icon--sm" style="background-color: ${meta.soft}; color: ${meta.color};">
          ${getIcon(meta.icon)}
        </span>
        <span style="font-size: var(--font-size-sm);">${t.category}</span>
      </div>
    `;

    // Type Badge
    const tdType = document.createElement('td');
    tdType.innerHTML = `
      <span class="badge ${isIncome ? 'badge--income' : 'badge--expense'}">
        ${isIncome ? 'Income' : 'Expense'}
      </span>
    `;

    // Amount
    const tdAmount = document.createElement('td');
    tdAmount.style.textAlign = 'right';
    const amountSpan = document.createElement('span');
    amountSpan.className = `transaction-amount ${isIncome ? 'transaction-amount--income' : 'transaction-amount--expense'}`;
    amountSpan.textContent = `${isIncome ? '+' : '-'}${formatCurrency(t.amount)}`;
    tdAmount.appendChild(amountSpan);

    // Actions
    const tdActions = document.createElement('td');
    tdActions.style.textAlign = 'right';
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'transaction-actions';
    actionsDiv.style.justifyContent = 'flex-end';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon';
    editBtn.title = 'Edit transaction';
    editBtn.setAttribute('aria-label', `Edit ${t.description}`);
    editBtn.innerHTML = getIcon('edit');
    editBtn.addEventListener('click', () => openEditForm(t));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon';
    deleteBtn.style.color = 'var(--color-expense)';
    deleteBtn.title = 'Delete transaction';
    deleteBtn.setAttribute('aria-label', `Delete ${t.description}`);
    deleteBtn.innerHTML = getIcon('trash');
    deleteBtn.addEventListener('click', () => openDeleteConfirmation(t.id, t.description));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    tdActions.appendChild(actionsDiv);

    tr.appendChild(tdDate);
    tr.appendChild(tdDesc);
    tr.appendChild(tdCat);
    tr.appendChild(tdType);
    tr.appendChild(tdAmount);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  tableWrapper.innerHTML = '';
  tableWrapper.appendChild(table);

  // ── Mobile Cards ───────────────────────────────────────────
  cardsWrapper.innerHTML = '';
  transactions.forEach(t => {
    const meta = getCategoryMeta(t.category);
    const isIncome = t.type === 'income';

    const card = document.createElement('div');
    card.className = 'transaction-card';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'category-icon';
    iconDiv.style.backgroundColor = meta.soft;
    iconDiv.style.color = meta.color;
    iconDiv.setAttribute('aria-hidden', 'true');
    iconDiv.innerHTML = getIcon(meta.icon);

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'transaction-card-body';

    const descSpan = document.createElement('div');
    descSpan.className = 'transaction-description';
    descSpan.textContent = t.description;

    const metaSpan = document.createElement('div');
    metaSpan.className = 'transaction-category';
    metaSpan.textContent = `${t.category} • ${formatDateShort(t.date)}`;

    bodyDiv.appendChild(descSpan);
    bodyDiv.appendChild(metaSpan);

    const rightDiv = document.createElement('div');
    rightDiv.className = 'transaction-card-right';

    const amountSpan = document.createElement('div');
    amountSpan.className = `transaction-amount ${isIncome ? 'transaction-amount--income' : 'transaction-amount--expense'}`;
    amountSpan.textContent = `${isIncome ? '+' : '-'}${formatCurrency(t.amount)}`;

    const actionBtns = document.createElement('div');
    actionBtns.style.display = 'flex';
    actionBtns.style.gap = 'var(--space-1)';
    actionBtns.style.marginTop = '4px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-icon';
    editBtn.style.width = '28px';
    editBtn.style.height = '28px';
    editBtn.setAttribute('aria-label', `Edit ${t.description}`);
    editBtn.innerHTML = getIcon('edit');
    editBtn.addEventListener('click', () => openEditForm(t));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-icon';
    deleteBtn.style.width = '28px';
    deleteBtn.style.height = '28px';
    deleteBtn.style.color = 'var(--color-expense)';
    deleteBtn.setAttribute('aria-label', `Delete ${t.description}`);
    deleteBtn.innerHTML = getIcon('trash');
    deleteBtn.addEventListener('click', () => openDeleteConfirmation(t.id, t.description));

    actionBtns.appendChild(editBtn);
    actionBtns.appendChild(deleteBtn);

    rightDiv.appendChild(amountSpan);
    rightDiv.appendChild(actionBtns);

    card.appendChild(iconDiv);
    card.appendChild(bodyDiv);
    card.appendChild(rightDiv);

    cardsWrapper.appendChild(card);
  });
}

/**
 * Attach listeners to filter and search controls.
 */
function attachFilterListeners() {
  const searchInput = document.getElementById('filter-search');
  const typeSelect = document.getElementById('filter-type');
  const categorySelect = document.getElementById('filter-category');
  const startDateInput = document.getElementById('filter-start-date');
  const endDateInput = document.getElementById('filter-end-date');
  const resetBtn = document.getElementById('btn-clear-filters');
  const addBtn = document.getElementById('btn-add-transaction-list');

  addBtn?.addEventListener('click', () => openAddForm());

  // Debounced search
  const handleSearch = debounce((val) => {
    activeFilters.query = val;
    renderTransactionList();
  }, 250);

  searchInput?.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  typeSelect?.addEventListener('change', (e) => {
    activeFilters.type = e.target.value;
    // Reset category if switching type makes current category invalid
    activeFilters.category = 'all';
    renderTransactionList();
  });

  categorySelect?.addEventListener('change', (e) => {
    activeFilters.category = e.target.value;
    renderTransactionList();
  });

  startDateInput?.addEventListener('change', (e) => {
    activeFilters.startDate = e.target.value;
    renderTransactionList();
  });

  endDateInput?.addEventListener('change', (e) => {
    activeFilters.endDate = e.target.value;
    renderTransactionList();
  });

  resetBtn?.addEventListener('click', () => {
    activeFilters = clearFilters();
    renderTransactionList();
  });
}
