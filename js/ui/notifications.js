/* ============================================================
   KOIN — Notifications UI Module
   Accessible, restrained toast notifications.
   Uses safe textContent, handles auto-dismiss and stack limit.
   ============================================================ */

import { getIcon } from '../utils.js';

const TOAST_CONTAINER_ID = 'toast-container';
const TOAST_DURATION = 4000;
const MAX_VISIBLE_TOASTS = 3;

/**
 * Get or verify the toast container element.
 * @returns {HTMLElement|null}
 */
function getContainer() {
  return document.getElementById(TOAST_CONTAINER_ID);
}

/**
 * Remove a toast element with exit animation.
 * @param {HTMLElement} toastEl
 */
function dismissToast(toastEl) {
  if (!toastEl || toastEl.dataset.dismissing === 'true') return;
  toastEl.dataset.dismissing = 'true';
  toastEl.classList.add('removing');

  toastEl.addEventListener('animationend', () => {
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  }, { once: true });

  // Fallback in case animationend does not fire
  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  }, 350);
}

/**
 * Create and show a toast notification.
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} message - Message text to display
 * @param {string} iconName - Key for getIcon()
 */
function createToast(type, message, iconName) {
  const container = getContainer();
  if (!container) return;

  // Enforce maximum visible toasts limit
  const activeToasts = container.querySelectorAll('.toast:not([data-dismissing="true"])');
  if (activeToasts.length >= MAX_VISIBLE_TOASTS) {
    dismissToast(activeToasts[0]);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

  // Icon container
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'toast-icon';
  iconWrapper.setAttribute('aria-hidden', 'true');
  iconWrapper.innerHTML = getIcon(iconName);

  // Content & message (using textContent for safety)
  const content = document.createElement('div');
  content.className = 'toast-content';

  const msgSpan = document.createElement('div');
  msgSpan.className = 'toast-message';
  msgSpan.textContent = String(message || '');
  content.appendChild(msgSpan);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.innerHTML = getIcon('close');

  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  toast.appendChild(iconWrapper);
  toast.appendChild(content);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Auto-dismiss timer
  const timer = setTimeout(() => {
    dismissToast(toast);
  }, TOAST_DURATION);

  // Pause on hover
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => {
    setTimeout(() => dismissToast(toast), 1500);
  });
}

/**
 * Display a success toast.
 * @param {string} message
 */
export function showSuccess(message) {
  createToast('success', message, 'check');
}

/**
 * Display an error toast.
 * @param {string} message
 */
export function showError(message) {
  createToast('error', message, 'alert-circle');
}

/**
 * Display a warning toast.
 * @param {string} message
 */
export function showWarning(message) {
  createToast('warning', message, 'warning');
}

/**
 * Display an informational toast.
 * @param {string} message
 */
export function showInfo(message) {
  createToast('info', message, 'info');
}

/**
 * Clear all currently displayed toasts immediately.
 */
export function clearNotifications() {
  const container = getContainer();
  if (!container) return;
  const toasts = container.querySelectorAll('.toast');
  toasts.forEach(t => dismissToast(t));
}
