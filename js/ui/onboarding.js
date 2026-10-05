/* ============================================================
   KOIN — Onboarding & First-Time User Setup
   Walkthrough with responsive desktop (onboard_desktop_1/2/3.webp)
   and mobile (onboarding_mobile_1/2/3.webp) visual frames,
   followed by user details setup (name, age, occupation, salary, goal).
   ============================================================ */

import { isOnboardingCompleted, setOnboardingCompleted, saveUserProfile, getUserProfile } from '../modules/storage.js';
import { updateAppUserHeader } from './profile-page.js';
import { showSuccess, showError } from './notifications.js';
import { escapeHTML } from '../utils.js';

const ONBOARDING_SLIDES = [
  {
    image: 'assets/onboarding_mobile_1.webp',
    desktopImage: 'assets/onboard_desktop_1.webp',
    alt: 'Your money, all in one place',
  },
  {
    image: 'assets/onboarding_mobile_2.webp',
    desktopImage: 'assets/onboard_desktop_2.webp',
    alt: 'Know where it all goes with clear insights',
  },
  {
    image: 'assets/onboarding_mobile_3.webp',
    desktopImage: 'assets/onboard_desktop_3.webp',
    alt: 'Make every rupee count and build financial habits',
  },
];

let currentSlideIndex = 0;

/**
 * Initialize onboarding on startup.
 */
export function initOnboarding() {
  if (!isOnboardingCompleted()) {
    showOnboarding(false);
  } else {
    // Update headers with existing profile
    updateAppUserHeader();
  }
}

/**
 * Show the onboarding modal / full screen experience.
 * @param {boolean} [force=false] — force show even if already completed
 */
export function showOnboarding(force = false) {
  const root = document.getElementById('onboarding-root');
  if (!root) return;

  currentSlideIndex = 0;
  renderOnboardingView(root);
}

/**
 * Render current slide or user details form.
 * @param {HTMLElement} root
 */
function renderOnboardingView(root) {
  const isFormStep = currentSlideIndex >= ONBOARDING_SLIDES.length;
  const currentProfile = getUserProfile();

  if (!isFormStep) {
    // ── Onboarding Image Slides (1, 2, 3) ───────────────────
    const slide = ONBOARDING_SLIDES[currentSlideIndex];

    root.innerHTML = `
      <div class="onboarding-overlay" id="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Welcome Walkthrough">
        <div class="onboarding-container">
          <!-- Top Bar: Clean floating Skip Button -->
          <div class="onboarding-top-bar">
            <button type="button" class="onboarding-skip-btn" id="btn-onboard-skip" aria-label="Skip to setup">
              Skip
            </button>
          </div>

          <!-- Slide Visual Image (Responsive: Desktop 1448x1086 vs Mobile 941x1672) -->
          <div class="onboarding-slide-frame">
            <picture class="onboarding-slide-pic">
              <source media="(min-width: 769px)" srcset="${slide.desktopImage}">
              <source media="(max-width: 768px)" srcset="${slide.image}">
              <img src="${slide.desktopImage}" alt="${slide.alt}" class="onboarding-slide-img" />
            </picture>
          </div>

          <!-- Bottom: Clean Dots and Next Icon Button directly on bottom -->
          <div class="onboarding-bottom-actions">
            <div class="onboarding-dots" aria-label="Slide indicators">
              ${ONBOARDING_SLIDES.map((_, i) => `
                <span class="onboarding-dot ${i === currentSlideIndex ? 'active' : ''}"></span>
              `).join('')}
            </div>

            <!-- Single Circular Next Icon Button -->
            <button type="button" class="onboarding-next-btn" id="btn-onboard-next" aria-label="Next slide">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Next button
    document.getElementById('btn-onboard-next')?.addEventListener('click', () => {
      currentSlideIndex++;
      renderOnboardingView(root);
    });

    // Skip directly to user details form
    document.getElementById('btn-onboard-skip')?.addEventListener('click', () => {
      currentSlideIndex = ONBOARDING_SLIDES.length;
      renderOnboardingView(root);
    });

  } else {
    // ── Step 4: User Details Form (Name, Age, Occupation, Salary, Goal) ────
    root.innerHTML = `
      <div class="onboarding-overlay" id="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Profile Setup">
        <div class="onboarding-container onboarding-container--form">
          <div class="onboarding-form-card">
            <div class="onboarding-form-header">
              <img src="assets/dashboard_logo.png" alt="Koin" class="onboarding-brand-logo-center" />
              <h2 class="onboarding-form-title">Welcome to Koin</h2>
              <p class="onboarding-form-sub">Tell us a little about yourself to customize your financial journey.</p>
            </div>

            <form id="onboarding-profile-form" class="onboarding-form" novalidate>
              <div class="form-group">
                <label for="onboard-user-name" class="form-label">What's your name? <span class="required">*</span></label>
                <input type="text" id="onboard-user-name" class="form-input" placeholder="e.g. Alex Morgan" value="${escapeHTML(currentProfile.name || '')}" required autofocus />
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label for="onboard-user-age" class="form-label">Age <span class="required">*</span></label>
                  <input type="number" id="onboard-user-age" class="form-input" placeholder="e.g. 24" min="1" max="120" value="${currentProfile.age || ''}" required />
                </div>
                <div class="form-group">
                  <label for="onboard-user-occupation" class="form-label">Occupation <span class="required">*</span></label>
                  <input type="text" id="onboard-user-occupation" class="form-input" placeholder="e.g. Developer, Student" value="${escapeHTML(currentProfile.occupation || '')}" required />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label for="onboard-user-salary" class="form-label">Monthly Salary (₹ INR) <span class="required">*</span></label>
                  <input type="number" id="onboard-user-salary" class="form-input" placeholder="e.g. 50000" min="0" step="1000" value="${currentProfile.salary || 50000}" required />
                </div>
                <div class="form-group">
                  <label for="onboard-user-goal" class="form-label">Monthly Savings Target (₹ INR)</label>
                  <input type="number" id="onboard-user-goal" class="form-input" placeholder="e.g. 15000" min="0" step="500" value="${currentProfile.monthlyGoal || 15000}" />
                </div>
              </div>

              <div class="onboarding-form-actions">
                <button type="submit" class="btn btn-primary btn-full onboarding-submit-btn" id="btn-finish-onboarding">
                  <span>Start Tracking</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('onboarding-profile-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('onboard-user-name');
      const ageInput = document.getElementById('onboard-user-age');
      const occInput = document.getElementById('onboard-user-occupation');
      const salaryInput = document.getElementById('onboard-user-salary');
      const goalInput = document.getElementById('onboard-user-goal');

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
        showError('Please enter a valid age.');
        ageInput?.focus();
        return;
      }
      if (!occupation) {
        showError('Please enter your occupation.');
        occInput?.focus();
        return;
      }

      // Save user details
      const profile = saveUserProfile({ name, age, occupation, salary, monthlyGoal });
      setOnboardingCompleted(true);
      updateAppUserHeader(profile);

      // Smooth fade-out dismissal
      const overlay = document.getElementById('onboarding-overlay');
      if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          root.innerHTML = '';
          showSuccess(`Welcome aboard, ${name}!`);
        }, 300);
      } else {
        root.innerHTML = '';
        showSuccess(`Welcome aboard, ${name}!`);
      }
    });
  }
}
