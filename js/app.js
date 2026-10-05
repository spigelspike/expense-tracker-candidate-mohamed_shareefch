/* ============================================================
   KOIN — App Coordinator
   Initialises data, coordinates page rendering, routing,
   and synchronises view updates across mutations.
   ============================================================ */
import { initNavigation, navigateTo, getActivePage, onPageChange } from './ui/navigation.js';
import { initTransactionForm, onTransactionSaved, openAddForm } from './ui/transaction-form.js';
import { renderDashboard } from './ui/dashboard.js';
import { renderTransactionList, onTransactionMutated } from './ui/transaction-list.js';
import { renderAnalyticsPage } from './ui/analytics-page.js';
import { renderProfilePage, updateAppUserHeader } from './ui/profile-page.js';
import { initOnboarding } from './ui/onboarding.js';
import { initAiOverview } from './ui/ai-overview.js';
import { getTransactions } from './modules/storage.js';
import { showError } from './ui/notifications.js';

/**
 * Re-render the view that is currently visible.
 */
export function refreshActiveView() {
  const current = getActivePage();
  switch (current) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'transactions':
      renderTransactionList();
      break;
    case 'analytics':
      renderAnalyticsPage();
      break;
    case 'profile':
      renderProfilePage();
      break;
    default:
      renderDashboard();
  }
}

/**
 * Handle page routing change.
 * @param {string} pageId
 */
function handlePageChange(pageId) {
  switch (pageId) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'transactions':
      renderTransactionList();
      break;
    case 'analytics':
      renderAnalyticsPage();
      break;
    case 'profile':
      renderProfilePage();
      break;
    default:
      renderDashboard();
  }
}

/**
 * Top-level application bootstrap.
 */
function init() {
  try {
    // 1. Test storage access early to catch permissions / private browsing issues
    getTransactions();
  } catch (err) {
    showError(`Storage warning: ${err.message}`);
  }

  // 2. Initialize transaction form modal
  initTransactionForm();

  // 3. Listen for transaction additions/updates & deletions to refresh active views
  onTransactionSaved(() => {
    refreshActiveView();
  });

  onTransactionMutated(() => {
    refreshActiveView();
  });

  // Ensure any stale service workers from localhost are unregistered
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }

  // 4b. Wire up sidebar and mobile add transaction buttons
  document.getElementById('btn-sidebar-add-transaction')?.addEventListener('click', () => {
    openAddForm('expense');
  });
  document.getElementById('btn-top-add-transaction')?.addEventListener('click', () => {
    openAddForm('expense');
  });

  // 5. Initialize router and render initial page
  initNavigation(handlePageChange);

  // 6. Set user name headers & check onboarding tour
  updateAppUserHeader();
  initOnboarding();

  // 7. Initialize AI Overview analytics
  initAiOverview();

  // Initial render for active view
  refreshActiveView();
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
