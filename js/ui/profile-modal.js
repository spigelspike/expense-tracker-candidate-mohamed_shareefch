/* ============================================================
   KOIN — Profile Modal Module
   Interactive profile drawer & account information dialog.
   Displays user info, currency preference (₹ INR), storage status,
   and data export capabilities.
   ============================================================ */

import { getAllTransactions } from '../modules/transactions.js';
import { getMonthlySummary } from '../modules/analytics.js';
import { getUserProfile } from '../modules/storage.js';
import { formatCurrency, getCurrentMonth, getMonthLabel, getIcon } from '../utils.js';
import { showSuccess } from './notifications.js';

let isProfileModalOpen = false;

/**
 * Initialize the profile modal event listeners.
 */
export function initProfileModal() {
  const overlay = document.getElementById('profile-overlay');
  if (!overlay) return;

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeProfileModal();
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isProfileModalOpen) {
      closeProfileModal();
    }
  });

  // Wire up sidebar profile click (desktop)
  document.querySelector('.sidebar-profile')?.addEventListener('click', () => {
    openProfileModal();
  });

  // Wire up mobile bottom dock profile button
  document.getElementById('btn-bottom-profile')?.addEventListener('click', () => {
    openProfileModal();
  });
}

/**
 * Open and render the profile modal.
 */
export function openProfileModal() {
  const overlay = document.getElementById('profile-overlay');
  const modal = document.getElementById('profile-modal');
  if (!overlay || !modal) return;

  const profile = getUserProfile();
  const allTxns = getAllTransactions();
  const current = getCurrentMonth();
  const summary = getMonthlySummary(allTxns, current.year, current.month);
  const periodLabel = getMonthLabel(current.year, current.month);

  modal.innerHTML = `
    <div class="profile-modal-header">
      <div class="profile-header-user">
        <div class="profile-modal-avatar-wrap">
          ${profile.avatar ? `
            <img src="${profile.avatar}" alt="${profile.name || 'User'}" class="profile-modal-avatar-img" />
          ` : `
            <div class="profile-modal-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          `}
          <span class="profile-modal-badge" title="Active Account"></span>
        </div>
        <div class="profile-header-info">
          <h2 class="profile-modal-title" id="profile-modal-title">${profile.name || 'Personal Account'}</h2>
          <span class="profile-modal-tag">
            ${getIcon('check')}
            <span>${profile.occupation || 'Verified Personal Plan'}</span>
          </span>
        </div>
      </div>
      <button type="button" class="modal-close" id="btn-close-profile" aria-label="Close profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="profile-modal-body">
      <!-- Account Financial Snapshot -->
      <div class="profile-stats-grid">
        <div class="profile-stat-card">
          <span class="profile-stat-label">Currency</span>
          <span class="profile-stat-value profile-stat-value--currency">₹ INR</span>
          <span class="profile-stat-hint">Indian Rupee</span>
        </div>

        <div class="profile-stat-card">
          <span class="profile-stat-label">Current Balance</span>
          <span class="profile-stat-value profile-stat-value--balance">${formatCurrency(summary.balance)}</span>
          <span class="profile-stat-hint">${periodLabel}</span>
        </div>

        <div class="profile-stat-card">
          <span class="profile-stat-label">Transactions</span>
          <span class="profile-stat-value">${allTxns.length}</span>
          <span class="profile-stat-hint">Total recorded</span>
        </div>

        <div class="profile-stat-card">
          <span class="profile-stat-label">Storage Engine</span>
          <span class="profile-stat-value" style="color: #10B981;">Local v5</span>
          <span class="profile-stat-hint">Auto-synced</span>
        </div>
      </div>

      <!-- Quick Actions List -->
      <div class="profile-options-section">
        <h3 class="profile-section-title">Data & Preferences</h3>

        <div class="profile-options-list">
          <button type="button" class="profile-option-btn" id="btn-export-data">
            <span class="profile-option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </span>
            <div class="profile-option-texts">
              <span class="profile-option-name">Export Transactions (JSON)</span>
              <span class="profile-option-sub">Download offline backup of all your records</span>
            </div>
            <span class="profile-option-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="profile-modal-footer">
      <button type="button" class="btn btn-secondary btn-full" id="btn-dismiss-profile">Close</button>
    </div>
  `;

  // Attach event handlers
  document.getElementById('btn-close-profile')?.addEventListener('click', closeProfileModal);
  document.getElementById('btn-dismiss-profile')?.addEventListener('click', closeProfileModal);

  document.getElementById('btn-export-data')?.addEventListener('click', () => {
    exportTransactionsJson(allTxns);
  });

  // Show overlay with animation
  overlay.classList.add('visible');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  isProfileModalOpen = true;
}

/**
 * Close the profile modal.
 */
export function closeProfileModal() {
  const overlay = document.getElementById('profile-overlay');
  if (!overlay) return;

  overlay.classList.remove('visible');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  isProfileModalOpen = false;
}

/**
 * Trigger download of transactions as a JSON file.
 * @param {Array} txns
 */
function exportTransactionsJson(txns) {
  try {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(txns, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `koin_transactions_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showSuccess('Transactions exported successfully!');
  } catch (err) {
    console.error('Export failed:', err);
  }
}
