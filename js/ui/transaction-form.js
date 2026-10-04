/* ============================================================
   KOIN — Transaction Form UI Module
   Reusable create/edit modal form with inline validation,
   focus trapping, accessibility, and double-submit prevention.
   ============================================================ */

import { getCategoriesByType } from '../data/categories.js';
import { createTransaction, updateTransaction, validateTransaction } from '../modules/transactions.js';
import { showSuccess, showError } from './notifications.js';
import { getTodayString, getIcon } from '../utils.js';

let formModalEl = null;
let modalOverlayEl = null;
let lastActiveElement = null;
let currentEditId = null;
let currentType = 'expense';
let isSubmitting = false;
let successCallbacks = [];

/**
 * Register a callback triggered when a transaction is added or updated.
 * @param {Function} cb - fn(transaction, mode: 'create'|'update')
 */
export function onTransactionSaved(cb) {
  if (typeof cb === 'function') {
    successCallbacks.push(cb);
  }
}

/**
 * Populate category <select> options dynamically based on currentType.
 * @param {string} [selectedCategory]
 */
function populateCategories(selectedCategory = '') {
  const select = document.getElementById('form-category');
  if (!select) return;

  const categories = getCategoriesByType(currentType);
  select.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Select a category';
  placeholderOption.disabled = true;
  if (!selectedCategory) placeholderOption.selected = true;
  select.appendChild(placeholderOption);

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    if (selectedCategory && cat.name === selectedCategory) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
}

/**
 * Clear all inline field validation errors and styles.
 */
function clearValidationErrors() {
  const inputs = ['amount', 'category', 'date', 'description'];
  inputs.forEach(field => {
    const el = document.getElementById(`form-${field}`);
    const err = document.getElementById(`error-${field}`);
    if (el) {
      el.classList.remove('form-input--error', 'form-select--error');
    }
    if (err) {
      err.textContent = '';
      err.hidden = true;
    }
  });
}

/**
 * Display inline validation errors for specified fields.
 * @param {object} fieldErrors - { amount?: string, category?: string, ... }
 */
function displayValidationErrors(fieldErrors) {
  clearValidationErrors();
  let firstEl = null;

  Object.entries(fieldErrors).forEach(([field, msg]) => {
    const el = document.getElementById(`form-${field}`);
    const err = document.getElementById(`error-${field}`);
    if (el) {
      el.classList.add(el.tagName === 'SELECT' ? 'form-select--error' : 'form-input--error');
      if (!firstEl) firstEl = el;
    }
    if (err) {
      err.textContent = msg;
      err.hidden = false;
    }
  });

  if (firstEl) {
    firstEl.focus();
  }
}

/**
 * Set the active transaction type ('income' or 'expense').
 * @param {'income'|'expense'} type
 * @param {string} [preserveCategory]
 */
function setFormType(type, preserveCategory = '') {
  currentType = type;
  const toggleBtns = formModalEl.querySelectorAll('.type-toggle-btn');
  toggleBtns.forEach(btn => {
    const btnType = btn.dataset.type;
    const isActive = btnType === type;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });

  populateCategories(preserveCategory);
}

/**
 * Render the inner modal markup.
 */
function renderModalTemplate() {
  if (!formModalEl) return;

  formModalEl.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title" id="modal-title">Add Transaction</h2>
      <button type="button" class="modal-close" id="btn-close-modal" aria-label="Close dialog">
        ${getIcon('close')}
      </button>
    </div>

    <form id="transaction-form" class="modal-body" novalidate>
      <div class="form-group mb-4">
        <label class="form-label">Type</label>
        <div class="type-toggle" role="radiogroup" aria-label="Transaction Type">
          <button type="button" class="type-toggle-btn active" data-type="expense" role="radio" aria-checked="true">Expense</button>
          <button type="button" class="type-toggle-btn" data-type="income" role="radio" aria-checked="false">Income</button>
        </div>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="form-amount">Amount</label>
        <div class="input-group">
          <span class="input-prefix" aria-hidden="true">₹</span>
          <input type="number" id="form-amount" class="form-input" placeholder="0.00" step="0.01" min="0.01" required autocomplete="off">
        </div>
        <span class="form-error" id="error-amount" hidden></span>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="form-category">Category</label>
        <select id="form-category" class="form-select" required></select>
        <span class="form-error" id="error-category" hidden></span>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="form-date">Date</label>
        <input type="date" id="form-date" class="form-input" required>
        <span class="form-error" id="error-date" hidden></span>
      </div>

      <div class="form-group mb-4">
        <label class="form-label" for="form-description">Description</label>
        <input type="text" id="form-description" class="form-input" placeholder="e.g. Grocery shopping" maxlength="100" required autocomplete="off">
        <span class="form-error" id="error-description" hidden></span>
      </div>

      <div class="modal-footer" style="padding: var(--space-4) 0 0 0; border-top: 1px solid var(--color-border); margin-top: var(--space-4);">
        <button type="button" class="btn btn-secondary" id="btn-cancel-modal">Cancel</button>
        <button type="submit" class="btn btn-primary" id="btn-submit-modal">Save</button>
      </div>
    </form>
  `;

  // Attach event listeners inside the modal
  const closeBtn = document.getElementById('btn-close-modal');
  const cancelBtn = document.getElementById('btn-cancel-modal');
  const form = document.getElementById('transaction-form');
  const typeBtns = formModalEl.querySelectorAll('.type-toggle-btn');

  closeBtn?.addEventListener('click', closeForm);
  cancelBtn?.addEventListener('click', closeForm);

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setFormType(btn.dataset.type);
    });
  });

  form.addEventListener('submit', handleFormSubmit);

  // Clear errors when typing
  ['amount', 'category', 'date', 'description'].forEach(field => {
    const el = document.getElementById(`form-${field}`);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('form-input--error', 'form-select--error');
        const err = document.getElementById(`error-${field}`);
        if (err) {
          err.textContent = '';
          err.hidden = true;
        }
      });
    }
  });
}

/**
 * Handle form submission.
 * @param {Event} e
 */
function handleFormSubmit(e) {
  e.preventDefault();
  if (isSubmitting) return;

  const amountInput = document.getElementById('form-amount');
  const categorySelect = document.getElementById('form-category');
  const dateInput = document.getElementById('form-date');
  const descInput = document.getElementById('form-description');
  const submitBtn = document.getElementById('btn-submit-modal');

  const rawData = {
    type: currentType,
    amount: amountInput.value.trim(),
    category: categorySelect.value,
    date: dateInput.value.trim(),
    description: descInput.value.trim(),
  };

  // Perform client validation
  const validation = validateTransaction(rawData);
  if (!validation.valid) {
    const fieldErrors = {};
    validation.errors.forEach(err => {
      if (err.toLowerCase().includes('amount')) fieldErrors.amount = err;
      else if (err.toLowerCase().includes('category')) fieldErrors.category = err;
      else if (err.toLowerCase().includes('date')) fieldErrors.date = err;
      else if (err.toLowerCase().includes('description')) fieldErrors.description = err;
    });
    displayValidationErrors(fieldErrors);
    return;
  }

  isSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    let saved;
    const isEdit = Boolean(currentEditId);

    if (isEdit) {
      saved = updateTransaction(currentEditId, rawData);
      showSuccess('Transaction updated successfully.');
    } else {
      saved = createTransaction(rawData);
      showSuccess('Transaction added successfully.');
    }

    closeForm();

    // Notify listeners to refresh views
    successCallbacks.forEach(cb => {
      try {
        cb(saved, isEdit ? 'update' : 'create');
      } catch (err) {
        console.error('Error in onTransactionSaved callback:', err);
      }
    });
  } catch (err) {
    showError(err.message || 'Failed to save transaction.');
  } finally {
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = currentEditId ? 'Update' : 'Add Transaction';
    }
  }
}

/**
 * Trap focus within the modal for accessibility.
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    closeForm();
    return;
  }

  if (e.key === 'Tab') {
    const focusable = formModalEl.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/**
 * Open form modal in "Add" mode.
 * @param {'income'|'expense'} [initialType='expense']
 */
export function openAddForm(initialType = 'expense') {
  lastActiveElement = document.activeElement;
  currentEditId = null;

  renderModalTemplate();

  const titleEl = document.getElementById('modal-title');
  const submitBtn = document.getElementById('btn-submit-modal');
  const dateInput = document.getElementById('form-date');

  if (titleEl) titleEl.textContent = initialType === 'income' ? 'Add Income' : 'Add Expense';
  if (submitBtn) submitBtn.textContent = 'Add Transaction';

  setFormType(initialType === 'income' ? 'income' : 'expense');
  if (dateInput) dateInput.value = getTodayString();

  modalOverlayEl.classList.add('active');
  modalOverlayEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  document.addEventListener('keydown', handleKeyDown);

  setTimeout(() => {
    const amountInput = document.getElementById('form-amount');
    amountInput?.focus();
  }, 50);
}

/**
 * Open form modal in "Edit" mode with pre-populated values.
 * @param {object} transaction
 */
export function openEditForm(transaction) {
  if (!transaction || !transaction.id) return;

  lastActiveElement = document.activeElement;
  currentEditId = transaction.id;

  renderModalTemplate();

  const titleEl = document.getElementById('modal-title');
  const submitBtn = document.getElementById('btn-submit-modal');
  const amountInput = document.getElementById('form-amount');
  const dateInput = document.getElementById('form-date');
  const descInput = document.getElementById('form-description');

  if (titleEl) titleEl.textContent = 'Edit Transaction';
  if (submitBtn) submitBtn.textContent = 'Save Changes';

  setFormType(transaction.type || 'expense', transaction.category || '');

  if (amountInput) amountInput.value = transaction.amount;
  if (dateInput) dateInput.value = transaction.date || getTodayString();
  if (descInput) descInput.value = transaction.description || '';

  modalOverlayEl.classList.add('active');
  modalOverlayEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  document.addEventListener('keydown', handleKeyDown);

  setTimeout(() => {
    amountInput?.focus();
  }, 50);
}

/**
 * Close the transaction form modal and return focus.
 */
export function closeForm() {
  if (!modalOverlayEl) return;

  modalOverlayEl.classList.remove('active');
  modalOverlayEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleKeyDown);

  currentEditId = null;
  clearValidationErrors();

  if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
    lastActiveElement.focus();
  }
}

/**
 * Initialize the form modal DOM bindings and overlay click detection.
 * @param {Function} [onSavedCallback]
 */
export function initTransactionForm(onSavedCallback) {
  modalOverlayEl = document.getElementById('modal-overlay');
  formModalEl = document.getElementById('transaction-modal');

  if (onSavedCallback) {
    onTransactionSaved(onSavedCallback);
  }

  // Close when clicking directly on overlay background
  modalOverlayEl?.addEventListener('click', (e) => {
    if (e.target === modalOverlayEl) {
      closeForm();
    }
  });

  // Mobile navigation central add button
  const mobileAddBtn = document.getElementById('btn-add-mobile');
  mobileAddBtn?.addEventListener('click', () => {
    openAddForm();
  });
}
