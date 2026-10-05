/* ============================================================
   KOIN — Dedicated Profile Page UI Module
   Displays user identity, personal metrics, savings goal,
   salary, profile switching/addition, and data management.
   ============================================================ */

import {
  getUserProfile,
  saveUserProfile,
  clearTransactions,
} from '../modules/storage.js';
import { getAllTransactions } from '../modules/transactions.js';
import { getMonthlySummary } from '../modules/analytics.js';
import { formatCurrency, getCurrentMonth, getIcon, compressImage, escapeHTML } from '../utils.js';
import { showSuccess, showError } from './notifications.js';

let isEditing = false;

/**
 * Update the user identity in desktop sidebar.
 * @param {object} profile
 */
export function updateAppUserHeader(profile) {
  const p = profile || getUserProfile();

  // Sidebar profile info
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');
  if (sidebarName) sidebarName.textContent = p.name || 'Personal Account';
  if (sidebarRole) sidebarRole.textContent = p.occupation || 'Verified';

  // Desktop sidebar avatar
  const sidebarAvatar = document.querySelector('.sidebar-avatar');
  if (sidebarAvatar) {
    if (p.avatar) {
      sidebarAvatar.innerHTML = `<img src="${p.avatar}" alt="${escapeHTML(p.name || 'User')}" class="sidebar-avatar-img" />`;
    } else {
      sidebarAvatar.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `;
    }
  }

  // Mobile bottom dock profile button
  const bottomProfileBtn = document.getElementById('btn-bottom-profile');
  if (bottomProfileBtn) {
    const bottomIcon = bottomProfileBtn.querySelector('.nav-icon');
    if (bottomIcon) {
      if (p.avatar) {
        bottomIcon.innerHTML = `<img src="${p.avatar}" alt="${escapeHTML(p.name || 'User')}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;" />`;
      } else {
        bottomIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        `;
      }
    }
  }
}

/**
 * Render the dedicated Profile page into #page-profile.
 */
export function renderProfilePage() {
  const container = document.getElementById('page-profile');
  if (!container) return;

  const profile = getUserProfile();
  const allTxns = getAllTransactions();
  const current = getCurrentMonth();
  const summary = getMonthlySummary(allTxns, current.year, current.month);

  // Financial calculations
  const goal = Number(profile.monthlyGoal) || 15000;
  const salary = Number(profile.salary) || 50000;
  const currentSavings = Math.max(0, summary.balance);
  const goalProgress = Math.min(100, Math.round((currentSavings / goal) * 100));

  container.innerHTML = `
    <header class="page-header profile-page-header">
      <div class="page-header-left">
        <h1 class="page-title">Profile &amp; Account</h1>
        <p class="page-subtitle">Manage your personal information, financial targets, and app preferences</p>
      </div>
    </header>

    <div class="profile-layout-grid">
      <!-- ── Left Column: Identity & Personal Details ────────── -->
      <div class="profile-col-main">
        <!-- Hero Profile Card -->
        <div class="card profile-hero-card">
          <div class="profile-hero-top">
            <div class="profile-hero-avatar-wrap">
              <div class="profile-hero-avatar" id="btn-change-avatar" role="button" tabindex="0" title="Click to upload profile photo">
                ${profile.avatar ? `
                  <img src="${profile.avatar}" alt="${escapeHTML(profile.name || 'User')}" class="profile-hero-avatar-img" />
                ` : `
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                `}
                <div class="profile-avatar-upload-overlay" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span class="profile-avatar-overlay-text">Change</span>
                </div>
              </div>
              <label for="profile-avatar-file-input" class="profile-avatar-upload-badge" title="Upload new photo">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
              <input type="file" id="profile-avatar-file-input" accept="image/*" style="display: none;" />
            </div>

            <div class="profile-hero-meta">
              <div class="profile-hero-name-row">
                <h2 class="profile-hero-name">${escapeHTML(profile.name || 'Personal Account')}</h2>
                <span class="badge badge--income" style="font-size: 11px;">Active Plan</span>
              </div>
              <p class="profile-hero-sub">
                <span>${escapeHTML(profile.occupation || 'Finance Enthusiast')}</span>
                <span class="profile-meta-sep">•</span>
                <span>${profile.age ? `${profile.age} years old` : 'Age not set'}</span>
              </p>
              <div class="profile-hero-tags">
                <span class="profile-tag">
                  ${getIcon('check')}
                  <span>Verified Personal Plan</span>
                </span>
                <span class="profile-tag profile-tag--income" style="background: var(--color-income-soft, #E8F8F1); color: var(--color-income, #16A879); font-weight: 600;">
                  <span>Monthly Salary: ${formatCurrency(salary)}</span>
                </span>
                <span class="profile-tag profile-tag--currency">
                  <span>Currency: ₹ INR</span>
                </span>
              </div>
            </div>

            <div class="profile-hero-action">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-toggle-edit-profile">
                ${isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          <!-- Edit Profile Form (Inline toggle) -->
          <div class="profile-edit-drawer ${isEditing ? 'open' : ''}" id="profile-edit-drawer">
            <form id="form-edit-profile" class="profile-edit-form" novalidate>
              <h3 class="profile-edit-title">Edit Personal Details</h3>

              <!-- Profile Photo Actions in Edit Drawer -->
              <div class="profile-photo-control-card">
                <div class="profile-photo-preview-wrap">
                  <div class="profile-photo-preview">
                    ${profile.avatar ? `<img src="${profile.avatar}" alt="Preview" />` : `
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    `}
                  </div>
                </div>
                <div class="profile-photo-actions">
                  <div class="profile-photo-actions-title">Profile Picture</div>
                  <div class="profile-photo-actions-sub">Upload a custom photo from your device, or remove it anytime.</div>
                  <div class="profile-photo-btn-row">
                    <button type="button" class="btn btn-secondary btn-xs" id="btn-upload-photo-drawer">
                      ${getIcon('camera')}
                      <span>Upload Photo</span>
                    </button>
                    ${profile.avatar ? `
                      <button type="button" class="btn btn-ghost btn-xs text-danger" id="btn-remove-photo-drawer">
                        <span>Remove Photo</span>
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
              <div class="profile-form-grid">
                <div class="form-group">
                  <label for="edit-profile-name" class="form-label">Full Name</label>
                  <input type="text" id="edit-profile-name" class="form-input" value="${escapeHTML(profile.name || '')}" placeholder="e.g. Alex Morgan" required />
                </div>
                <div class="form-group">
                  <label for="edit-profile-age" class="form-label">Age</label>
                  <input type="number" id="edit-profile-age" class="form-input" value="${profile.age || ''}" placeholder="e.g. 24" min="1" max="120" required />
                </div>
                <div class="form-group">
                  <label for="edit-profile-occupation" class="form-label">Occupation</label>
                  <input type="text" id="edit-profile-occupation" class="form-input" value="${escapeHTML(profile.occupation || '')}" placeholder="e.g. Software Engineer" required />
                </div>
                <div class="form-group">
                  <label for="edit-profile-salary" class="form-label">Monthly Salary (₹)</label>
                  <input type="number" id="edit-profile-salary" class="form-input" value="${salary}" placeholder="e.g. 50000" min="0" step="1000" required />
                </div>
                <div class="form-group">
                  <label for="edit-profile-goal" class="form-label">Monthly Savings Target (₹)</label>
                  <input type="number" id="edit-profile-goal" class="form-input" value="${goal}" placeholder="e.g. 15000" min="0" step="500" />
                </div>
              </div>
              <div class="profile-edit-actions">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-edit">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-save-profile">Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Personal Details & Financial Summary Cards -->
        <div class="profile-stats-grid">
          <div class="card profile-stat-box">
            <span class="profile-stat-box-label">Monthly Salary</span>
            <span class="profile-stat-box-val profile-stat-box-val--income">+${formatCurrency(salary)}</span>
            <span class="profile-stat-box-sub">Base monthly earnings</span>
          </div>

          <div class="card profile-stat-box">
            <span class="profile-stat-box-label">Monthly Target</span>
            <span class="profile-stat-box-val profile-stat-box-val--primary">${formatCurrency(goal)}</span>
            <div class="profile-goal-bar-wrap">
              <div class="profile-goal-bar" style="width: ${goalProgress}%;"></div>
            </div>
            <span class="profile-stat-box-sub">${goalProgress}% achieved (${formatCurrency(currentSavings)} saved)</span>
          </div>

          <div class="card profile-stat-box">
            <span class="profile-stat-box-label">Current Net Balance</span>
            <span class="profile-stat-box-val ${summary.balance >= 0 ? 'profile-stat-box-val--positive' : 'profile-stat-box-val--negative'}">
              ${formatCurrency(summary.balance)}
            </span>
            <span class="profile-stat-box-sub">${current.year} Overview</span>
          </div>

          <div class="card profile-stat-box">
            <span class="profile-stat-box-label">This Month's Inflow</span>
            <span class="profile-stat-box-val profile-stat-box-val--income">+${formatCurrency(summary.income)}</span>
            <span class="profile-stat-box-sub">${summary.incomeCount || 0} income credits</span>
          </div>

          <div class="card profile-stat-box">
            <span class="profile-stat-box-label">This Month's Outflow</span>
            <span class="profile-stat-box-val profile-stat-box-val--expense">-${formatCurrency(summary.expenses)}</span>
            <span class="profile-stat-box-sub">${summary.expenseCount || 0} expense records</span>
          </div>
        </div>
      </div>

      <!-- ── Right Column: Preferences, Backup & Danger Zone ── -->
      <div class="profile-col-side">
        <div class="card profile-settings-card">
          <h3 class="profile-card-title">Account & Data Management</h3>

          <div class="profile-menu-list">
            <!-- Export JSON -->
            <button type="button" class="profile-menu-btn" id="btn-profile-export">
              <span class="profile-menu-icon profile-menu-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </span>
              <div class="profile-menu-texts">
                <span class="profile-menu-heading">Export Data Backup</span>
                <span class="profile-menu-caption">Download all ${allTxns.length} records as JSON</span>
              </div>
              <span class="profile-menu-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>

            <!-- Replay Onboarding -->
            <button type="button" class="profile-menu-btn" id="btn-profile-walkthrough">
              <span class="profile-menu-icon profile-menu-icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </span>
              <div class="profile-menu-texts">
                <span class="profile-menu-heading">App Walkthrough</span>
                <span class="profile-menu-caption">Re-run the welcome tour & setup</span>
              </div>
              <span class="profile-menu-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          </div>

          <!-- Danger Zone -->
          <div class="profile-danger-zone">
            <h4 class="profile-danger-title">Danger Zone</h4>
            <p class="profile-danger-desc">Reset all stored income and expense records. This action cannot be undone.</p>
            <button type="button" class="btn btn-danger btn-sm btn-full" id="btn-profile-clear-data">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  attachProfileEvents();
}

/**
 * Attach interactive handlers for the profile page.
 */
function attachProfileEvents() {
  // Replay tour (card button still available in data management section)
  document.getElementById('btn-profile-walkthrough')?.addEventListener('click', () => {
    import('./onboarding.js').then(m => m.showOnboarding(true));
  });

  // Toggle edit drawer
  document.getElementById('btn-toggle-edit-profile')?.addEventListener('click', () => {
    isEditing = !isEditing;
    const drawer = document.getElementById('profile-edit-drawer');
    const toggleBtn = document.getElementById('btn-toggle-edit-profile');
    if (drawer) drawer.classList.toggle('open', isEditing);
    if (toggleBtn) toggleBtn.textContent = isEditing ? 'Cancel' : 'Edit Profile';
  });

  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    isEditing = false;
    const drawer = document.getElementById('profile-edit-drawer');
    const toggleBtn = document.getElementById('btn-toggle-edit-profile');
    if (drawer) drawer.classList.remove('open');
    if (toggleBtn) toggleBtn.textContent = 'Edit Profile';
  });

  // Avatar upload triggers
  const fileInput = document.getElementById('profile-avatar-file-input');
  const avatarWrap = document.getElementById('btn-change-avatar');
  const drawerUploadBtn = document.getElementById('btn-upload-photo-drawer');

  const triggerUpload = () => {
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  };

  avatarWrap?.addEventListener('click', triggerUpload);
  drawerUploadBtn?.addEventListener('click', triggerUpload);

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showSuccess('Processing image...');
      const dataUrl = await compressImage(file, 256, 256, 0.85);
      const updated = saveUserProfile({ avatar: dataUrl });
      updateAppUserHeader(updated);
      showSuccess('Profile picture updated successfully!');
      renderProfilePage();
    } catch (err) {
      showError(err.message || 'Failed to process image file.');
    }
  });



  // Remove photo
  document.getElementById('btn-remove-photo-drawer')?.addEventListener('click', () => {
    try {
      const updated = saveUserProfile({ avatar: '' });
      updateAppUserHeader(updated);
      showSuccess('Profile photo removed.');
      renderProfilePage();
    } catch {
      showError('Failed to remove profile photo.');
    }
  });

  // Save profile changes
  const form = document.getElementById('form-edit-profile');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('edit-profile-name');
    const ageInput = document.getElementById('edit-profile-age');
    const occInput = document.getElementById('edit-profile-occupation');
    const salaryInput = document.getElementById('edit-profile-salary');
    const goalInput = document.getElementById('edit-profile-goal');

    const name = nameInput?.value.trim();
    const age = parseInt(ageInput?.value, 10);
    const occupation = occInput?.value.trim();
    const salary = parseFloat(salaryInput?.value) || 50000;
    const monthlyGoal = parseFloat(goalInput?.value) || 15000;

    if (!name) {
      showError('Please enter your name.');
      nameInput?.focus();
      return;
    }
    if (!age || age < 1 || age > 120) {
      showError('Please enter a valid age between 1 and 120.');
      ageInput?.focus();
      return;
    }
    if (!occupation) {
      showError('Please enter your occupation.');
      occInput?.focus();
      return;
    }

    try {
      const updated = saveUserProfile({ name, age, occupation, salary, monthlyGoal });
      isEditing = false;
      updateAppUserHeader(updated);
      showSuccess('Profile updated successfully!');
      renderProfilePage();
    } catch {
      showError('Failed to save profile changes.');
    }
  });

  // Export JSON
  document.getElementById('btn-profile-export')?.addEventListener('click', () => {
    const allTxns = getAllTransactions();
    const profile = getUserProfile();
    const dataToExport = {
      app: 'Koin Expense Tracker',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userProfile: profile,
      transactions: allTxns,
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `koin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess('Backup exported successfully!');
  });

  // Clear All Data with properly styled UI modal
  document.getElementById('btn-profile-clear-data')?.addEventListener('click', () => {
    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    if (!confirmOverlay || !confirmModal) return;

    confirmModal.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 class="confirm-dialog-title" id="confirm-title">Clear All Records?</h3>
        <p class="confirm-dialog-text">This will permanently delete all recorded income and expense transactions. Your user profile settings will be preserved.</p>
        <div class="confirm-dialog-actions">
          <button type="button" class="btn btn-secondary" id="btn-cancel-clear">Cancel</button>
          <button type="button" class="btn btn-danger" id="btn-execute-clear">Yes, Delete All Data</button>
        </div>
      </div>
    `;

    confirmOverlay.classList.add('visible', 'active');
    confirmOverlay.removeAttribute('aria-hidden');

    const closeModal = () => {
      confirmOverlay.classList.remove('visible', 'active');
      confirmOverlay.setAttribute('aria-hidden', 'true');
    };

    document.getElementById('btn-cancel-clear')?.addEventListener('click', closeModal);
    document.getElementById('btn-execute-clear')?.addEventListener('click', () => {
      clearTransactions();
      closeModal();
      showSuccess('All transactions have been cleared.');
      renderProfilePage();
    });
  });
}
