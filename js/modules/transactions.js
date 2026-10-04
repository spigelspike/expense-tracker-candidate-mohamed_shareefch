/* ============================================================
   KOIN — Transaction Service
   Validation and CRUD operations over the storage layer.
   ============================================================ */

import * as storage from './storage.js';
import { isValidCategory } from '../data/categories.js';
import { generateId, isValidDate } from '../utils.js';

const DESCRIPTION_MAX_LENGTH = 100;

/* ── Validation ───────────────────────────────────────────── */

/**
 * Validate a transaction data object.
 * @param {object} data — { type, amount, category, date, description }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTransaction(data) {
  const errors = [];

  // Type
  if (!data.type || (data.type !== 'income' && data.type !== 'expense')) {
    errors.push('Type must be "income" or "expense".');
  }

  // Amount
  const amount = Number(data.amount);
  if (!isFinite(amount) || amount <= 0) {
    errors.push('Amount must be a positive number.');
  }

  // Category
  if (!data.category || !data.category.trim()) {
    errors.push('Category is required.');
  } else if (data.type && !isValidCategory(data.type, data.category)) {
    errors.push(`"${data.category}" is not a valid category for ${data.type}.`);
  }

  // Date
  if (!data.date) {
    errors.push('Date is required.');
  } else if (!isValidDate(data.date)) {
    errors.push('Date must be a valid date in YYYY-MM-DD format.');
  }

  // Description
  const desc = (data.description || '').trim();
  if (!desc) {
    errors.push('Description is required.');
  } else if (desc.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
  }

  return { valid: errors.length === 0, errors };
}

/* ── CRUD operations ──────────────────────────────────────── */

/**
 * Create and persist a new transaction.
 * @param {object} data — { type, amount, category, date, description }
 * @returns {object} the created transaction record
 * @throws {Error} if validation or persistence fails
 */
export function createTransaction(data) {
  const validation = validateTransaction(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const record = {
    id: generateId(),
    type: data.type,
    amount: Number(data.amount),
    category: data.category.trim(),
    date: data.date,
    description: data.description.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  storage.addTransaction(record);
  return { ...record };
}

/**
 * Return all transactions (fresh copy).
 * @returns {Array}
 */
export function getAllTransactions() {
  return storage.getTransactions();
}

/**
 * Return a single transaction by ID, or null if not found.
 * @param {string} id
 * @returns {object|null}
 */
export function getTransactionById(id) {
  const all = storage.getTransactions();
  return all.find(t => t.id === id) || null;
}

/**
 * Update a transaction by ID.
 * Validates the merged result before persisting.
 * Preserves id and createdAt; sets updatedAt.
 * @param {string} id
 * @param {object} updates — partial fields to change
 * @returns {object} the updated transaction
 * @throws {Error} if not found, validation fails, or persistence fails
 */
export function updateTransaction(id, updates) {
  const existing = getTransactionById(id);
  if (!existing) {
    throw new Error(`Transaction "${id}" not found.`);
  }

  // Merge but protect immutable fields
  const merged = {
    ...existing,
    type: updates.type ?? existing.type,
    amount: updates.amount !== undefined ? Number(updates.amount) : existing.amount,
    category: updates.category ?? existing.category,
    date: updates.date ?? existing.date,
    description: updates.description ?? existing.description,
  };

  const validation = validateTransaction(merged);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const safeUpdates = {
    type: merged.type,
    amount: merged.amount,
    category: merged.category.trim(),
    date: merged.date,
    description: merged.description.trim(),
    updatedAt: new Date().toISOString(),
  };

  return storage.updateTransaction(id, safeUpdates);
}

/**
 * Delete a transaction by ID.
 * @param {string} id
 * @throws {Error} if not found or persistence fails
 */
export function removeTransaction(id) {
  storage.deleteTransaction(id);
}
