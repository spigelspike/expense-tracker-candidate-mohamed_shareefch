/* ============================================================
   KOIN — Navigation UI Module
   Single-page routing, active link styling, and accessible state.
   ============================================================ */

const VALID_PAGES = ['dashboard', 'transactions', 'analytics', 'profile'];
const DEFAULT_PAGE = 'dashboard';

let currentPage = DEFAULT_PAGE;
let pageChangeCallbacks = [];

/**
 * Normalise a page name from a hash or string.
 * @param {string} page
 * @returns {string}
 */
function normalizePage(page) {
  if (!page) return DEFAULT_PAGE;
  const clean = page.replace(/^#/, '').toLowerCase().trim();
  return VALID_PAGES.includes(clean) ? clean : DEFAULT_PAGE;
}

/**
 * Update the visual and accessible active states in the DOM.
 * @param {string} pageId
 */
function updateDOMActiveState(pageId) {
  // 1. Pages visibility
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => {
    const isTarget = p.id === `page-${pageId}`;
    if (isTarget) {
      p.classList.add('active');
      p.removeAttribute('hidden');
    } else {
      p.classList.remove('active');
      p.setAttribute('hidden', 'true');
    }
  });

  // 2. Sidebar links
  const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  sidebarLinks.forEach(link => {
    const linkPage = link.dataset.page;
    if (linkPage === pageId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // 2b. Top Desktop Navbar pills
  const topNavPills = document.querySelectorAll('.top-nav-pills .nav-pill');
  topNavPills.forEach(pill => {
    const pillPage = pill.dataset.page;
    if (pillPage === pageId) {
      pill.classList.add('active');
      pill.setAttribute('aria-current', 'page');
    } else {
      pill.classList.remove('active');
      pill.removeAttribute('aria-current');
    }
  });

  // 2c. Sidebar profile footer card
  const sidebarProfile = document.querySelector('.sidebar-profile');
  if (sidebarProfile) {
    if (pageId === 'profile') {
      sidebarProfile.classList.add('active');
      sidebarProfile.setAttribute('aria-current', 'page');
    } else {
      sidebarProfile.classList.remove('active');
      sidebarProfile.removeAttribute('aria-current');
    }
  }

  // 3. Mobile bottom navigation buttons
  const bottomLinks = document.querySelectorAll('.bottom-nav-link[data-page]');
  bottomLinks.forEach(btn => {
    const btnPage = btn.dataset.page;
    if (btnPage === pageId) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    }
  });

  // 4. Scroll main content area back to top smoothly
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.scrollTop = 0;
  }
}

/**
 * Navigate to a specific page.
 * @param {string} pageId
 * @param {boolean} [updateHash=true]
 */
export function navigateTo(pageId, updateHash = true) {
  const target = normalizePage(pageId);
  currentPage = target;

  if (updateHash && window.location.hash !== `#${target}`) {
    window.location.hash = `#${target}`;
  }

  updateDOMActiveState(target);

  // Trigger subscribers
  pageChangeCallbacks.forEach(cb => {
    try {
      cb(target);
    } catch (err) {
      console.error('Error in pageChangeCallback:', err);
    }
  });
}

/**
 * Return current active page id.
 * @returns {string}
 */
export function getActivePage() {
  return currentPage;
}

/**
 * Register a callback whenever the page changes.
 * @param {Function} callback - fn(pageId)
 */
export function onPageChange(callback) {
  if (typeof callback === 'function') {
    pageChangeCallbacks.push(callback);
  }
}

/**
 * Initialize navigation system, event listeners, and initial route.
 * @param {Function} [initialCallback]
 */
export function initNavigation(initialCallback) {
  if (initialCallback) {
    onPageChange(initialCallback);
  }

  // 1. Sidebar clicks
  document.addEventListener('click', (e) => {
    const navLink = e.target.closest('[data-page]');
    if (navLink) {
      const page = navLink.dataset.page;
      if (VALID_PAGES.includes(page)) {
        e.preventDefault();
        navigateTo(page);
      }
    }
  });

  // 2. Hash change listener
  window.addEventListener('hashchange', () => {
    const hashPage = normalizePage(window.location.hash);
    if (hashPage !== currentPage) {
      navigateTo(hashPage, false);
    }
  });

  // 3. Initial route determination
  const initialPage = normalizePage(window.location.hash);
  navigateTo(initialPage, false);
}
