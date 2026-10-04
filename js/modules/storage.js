/* ============================================================
   KOIN — Storage Module
   All Local Storage access lives here. No DOM manipulation.
   ============================================================ */

const STORAGE_KEY = 'expenseTracker_v1';
const STORAGE_VERSION = 1;

/* ── Internal helpers ─────────────────────────────────────── */

function getInitialSeedData() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const pad = (d) => String(d).padStart(2, '0');

  return [
    {
      id: 'seed-inc-1',
      type: 'income',
      amount: 5450.00,
      category: 'Salary',
      date: `${y}-${m}-${pad(1)}`,
      description: 'Monthly Engineering Salary',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-inc-2',
      type: 'income',
      amount: 1200.00,
      category: 'Freelance',
      date: `${y}-${m}-${pad(2)}`,
      description: 'Mobile App UI/UX Design Contract',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-groc-1',
      type: 'expense',
      amount: 620.00,
      category: 'Groceries',
      date: `${y}-${m}-${pad(2)}`,
      description: 'Organic Market & Fresh Produce',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-groc-2',
      type: 'expense',
      amount: 440.00,
      category: 'Groceries',
      date: `${y}-${m}-${pad(3)}`,
      description: 'Costco Wholesale Bulk Supplies',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-groc-3',
      type: 'expense',
      amount: 185.30,
      category: 'Groceries',
      date: `${y}-${m}-${pad(4)}`,
      description: 'Trader Joe Gourmet Groceries',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-trans-1',
      type: 'expense',
      amount: 350.00,
      category: 'Transportation',
      date: `${y}-${m}-${pad(2)}`,
      description: 'Uber City Commute Rides',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-trans-2',
      type: 'expense',
      amount: 190.00,
      category: 'Transportation',
      date: `${y}-${m}-${pad(3)}`,
      description: 'Monthly Express Train & Metro Card',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-ent-1',
      type: 'expense',
      amount: 420.00,
      category: 'Entertainment',
      date: `${y}-${m}-${pad(2)}`,
      description: 'IMAX Cinema & Weekend Concert Tickets',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-ent-2',
      type: 'expense',
      amount: 180.00,
      category: 'Entertainment',
      date: `${y}-${m}-${pad(4)}`,
      description: 'Streaming & Gaming Subscriptions',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-rent-1',
      type: 'expense',
      amount: 950.00,
      category: 'Bills',
      date: `${y}-${m}-${pad(1)}`,
      description: 'Apartment Monthly Rent',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-rent-2',
      type: 'expense',
      amount: 130.50,
      category: 'Bills',
      date: `${y}-${m}-${pad(3)}`,
      description: 'High-speed Fiber & Electricity Bill',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
    {
      id: 'seed-health-1',
      type: 'expense',
      amount: 35.00,
      category: 'Health',
      date: `${y}-${m}-${pad(4)}`,
      description: 'Paracetamol & Wellness Vitamin Kit',
      createdAt: new Date().toISOString(),
      updatedAt: null,
    },
  ];
}

/**
 * Read and parse the stored data envelope.
 * Returns { version, transactions } or throws.
 */
function readStorage() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    // Backward compatibility: migrate from previous key if available
    if (raw === null) {
      const legacyRaw = localStorage.getItem('koin_tracker_v5');
      if (legacyRaw !== null) {
        raw = legacyRaw;
        localStorage.setItem(STORAGE_KEY, legacyRaw);
      }
    }
  } catch (err) {
    throw new Error(`Storage read failed: ${err.message}`);
  }

  if (raw === null) {
    // First run — seed default rich data matching reference
    const initial = { version: STORAGE_VERSION, transactions: getInitialSeedData() };
    try {
      writeStorage(initial);
    } catch {
      // ignore write error
    }
    return initial;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Stored data is corrupted and cannot be parsed.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Stored data has an unexpected format.');
  }

  if (parsed.version !== STORAGE_VERSION) {
    parsed.version = STORAGE_VERSION;
  }

  if (!Array.isArray(parsed.transactions)) {
    throw new Error('Transaction data is missing or invalid.');
  }

  return parsed;
}

/**
 * Write the data envelope to Local Storage.
 * Verifies the write by reading back the key.
 */
function writeStorage(data) {
  const envelope = {
    version: STORAGE_VERSION,
    transactions: data.transactions,
    updatedAt: new Date().toISOString(),
  };

  let serialised;
  try {
    serialised = JSON.stringify(envelope);
  } catch (err) {
    throw new Error(`Failed to serialise data: ${err.message}`);
  }

  try {
    localStorage.setItem(STORAGE_KEY, serialised);
  } catch (err) {
    throw new Error(`Storage write failed (quota exceeded or disabled): ${err.message}`);
  }

  // Verify write succeeded
  try {
    const check = localStorage.getItem(STORAGE_KEY);
    if (check !== serialised) {
      throw new Error('Storage verification failed: written data does not match.');
    }
  } catch (err) {
    if (err.message.includes('verification')) throw err;
    // Read-back failed but write may have succeeded — allow it
  }
}

/* ── Public API ───────────────────────────────────────────── */

/**
 * Return a fresh copy of all transactions.
 * @returns {Array} array of transaction objects
 * @throws {Error} if storage is inaccessible or corrupted
 */
export function getTransactions() {
  const data = readStorage();
  // Return a deep-ish copy so callers cannot mutate the stored array
  return data.transactions.map(t => ({ ...t }));
}

/**
 * Overwrite all transactions.
 * @param {Array} transactions
 * @throws {Error} on invalid input or write failure
 */
export function saveTransactions(transactions) {
  if (!Array.isArray(transactions)) {
    throw new Error('saveTransactions expects an array.');
  }
  writeStorage({ transactions });
}

/**
 * Append a single transaction.
 * @param {object} transaction
 * @throws {Error} on write failure
 */
export function addTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object') {
    throw new Error('addTransaction expects a transaction object.');
  }
  const data = readStorage();
  data.transactions.push(transaction);
  writeStorage(data);
}

/**
 * Update a transaction by ID (shallow merge).
 * @param {string} id
 * @param {object} updates — fields to merge
 * @returns {object} the updated transaction
 * @throws {Error} if the ID is not found or write fails
 */
export function updateTransaction(id, updates) {
  const data = readStorage();
  const index = data.transactions.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error(`Transaction with id "${id}" not found.`);
  }
  data.transactions[index] = { ...data.transactions[index], ...updates };
  writeStorage(data);
  return { ...data.transactions[index] };
}

/**
 * Remove a transaction by ID.
 * @param {string} id
 * @throws {Error} if the ID is not found or write fails
 */
export function deleteTransaction(id) {
  const data = readStorage();
  const before = data.transactions.length;
  data.transactions = data.transactions.filter(t => t.id !== id);
  if (data.transactions.length === before) {
    throw new Error(`Transaction with id "${id}" not found.`);
  }
  writeStorage(data);
}

/**
 * Remove all transactions. Only for explicit user action.
 * @throws {Error} on write failure
 */
export function clearTransactions() {
  writeStorage({ transactions: [] });
}

/* ── User Profile & Onboarding Storage ───────────────────────── */

const PROFILE_KEY = 'koin_user_profile_v1';
const PROFILES_KEY = 'koin_user_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'koin_active_profile_id_v1';
const ONBOARDING_KEY = 'koin_onboarding_completed_v1';

const DEFAULT_PROFILE = {
  id: 'profile_default',
  name: 'Alex Morgan',
  age: 24,
  occupation: 'Software Developer',
  salary: 50000,
  monthlyGoal: 15000,
  currency: 'INR',
  joinedDate: '2026-10-01',
  avatar: 'assets/default_avatar.jpg',
};

/**
 * Retrieve list of all user profiles.
 * @returns {Array<object>}
 */
export function getAllProfiles() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) {
      const current = getUserProfileLegacy();
      const initial = [{ ...DEFAULT_PROFILE, ...current, id: current.id || 'profile_default' }];
      localStorage.setItem(PROFILES_KEY, JSON.stringify(initial));
      return initial;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list : [{ ...DEFAULT_PROFILE }];
  } catch {
    return [{ ...DEFAULT_PROFILE }];
  }
}

function getUserProfileLegacy() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Retrieve active user profile or default.
 * @returns {object}
 */
export function getUserProfile() {
  try {
    const profiles = getAllProfiles();
    const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    const found = profiles.find(p => p.id === activeId);
    if (found) return { ...DEFAULT_PROFILE, ...found };
    return { ...DEFAULT_PROFILE, ...profiles[0] };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Save / update active user profile.
 * @param {object} profileUpdates
 * @returns {object}
 */
export function saveUserProfile(profileUpdates) {
  try {
    const profiles = getAllProfiles();
    const current = getUserProfile();
    const targetId = profileUpdates.id || current.id || 'profile_default';

    let exists = false;
    const updatedProfiles = profiles.map(p => {
      if (p.id === targetId) {
        exists = true;
        return { ...p, ...profileUpdates, id: targetId };
      }
      return p;
    });

    if (!exists) {
      updatedProfiles.push({ ...DEFAULT_PROFILE, ...profileUpdates, id: targetId });
    }

    localStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, targetId);
    const active = updatedProfiles.find(p => p.id === targetId) || updatedProfiles[0];
    localStorage.setItem(PROFILE_KEY, JSON.stringify(active));
    return active;
  } catch (err) {
    console.error('Failed to save user profile:', err);
    throw err;
  }
}

/**
 * Add a new profile and set it as active.
 * @param {object} profileData
 * @returns {object}
 */
export function addNewProfile(profileData) {
  try {
    const newId = 'profile_' + Date.now();
    const newProfile = {
      ...DEFAULT_PROFILE,
      ...profileData,
      id: newId,
      joinedDate: new Date().toISOString().slice(0, 10),
    };
    const profiles = getAllProfiles();
    profiles.push(newProfile);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, newId);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    return newProfile;
  } catch (err) {
    console.error('Failed to add profile:', err);
    throw err;
  }
}

/**
 * Switch active profile by ID.
 * @param {string} profileId
 * @returns {object|null}
 */
export function switchActiveProfile(profileId) {
  try {
    const profiles = getAllProfiles();
    const target = profiles.find(p => p.id === profileId);
    if (target) {
      localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(target));
      return target;
    }
    return null;
  } catch (err) {
    console.error('Failed to switch profile:', err);
    return null;
  }
}

/**
 * Check whether the user has completed first-time onboarding.
 * @returns {boolean}
 */
export function isOnboardingCompleted() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set onboarding completion status.
 * @param {boolean} [completed=true]
 */
export function setOnboardingCompleted(completed = true) {
  try {
    localStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set onboarding status:', err);
  }
}
