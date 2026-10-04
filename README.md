# Koin — Expense Tracker

A modern, responsive personal expense tracker web application built with vanilla HTML5, CSS3, and JavaScript ES6 modules. Persists data locally in the browser with zero external dependencies.

---

## 1. Project Overview

**Koin** is designed to provide a personal finance experience inspired by contemporary fintech interfaces: clean card surfaces, purposeful category color accents, intuitive monthly period navigation, responsive charts, and robust data persistence.

- **Repository:** `expense-tracker-candidate-mohamed_shareefch`
- **Tech Stack:** HTML5, Vanilla CSS3, JavaScript (ES6 modules)
- **Persistence:** Browser `localStorage` (Key: `expenseTracker_v1`)
- **Backend:** None required (fully client-side SPA)
- **Target Devices:** Desktop (1440px+), Tablet (768px - 1024px), Mobile (375px - 430px)

---

## 2. Features Implemented

### 📊 Dashboard
- **Period Navigation:** Browse past and future months with instant data updates.
- **Net Balance Hero Card:** Prominent balance display with privacy show/hide toggle and transaction count.
- **Income & Expense Panels:** Color-coded monthly inflow (`+₹`) and outflow (`-₹`) metric cards.
- **Income vs Expenses Chart:** 6-month dual-bar SVG comparison chart with interactive hover tooltips.
- **Recent Transactions:** Quick view of the 5 latest transactions for the active period with direct link to all records.
- **Expense Breakdown:** Donut chart with category colors and percentage breakdown.
- **Polished Empty State:** Welcoming zero-data state with a quick action to add the first transaction.

### 💳 Transactions Management (Full CRUD)
- **Add Transactions:** Modal form with income/expense pill toggle, ₹ amount prefix, type-filtered category selector, calendar date, and description.
- **Edit Transactions:** Pre-populated edit modal that preserves immutable fields (`id`, `createdAt`) and sets `updatedAt`.
- **Delete Transactions:** Accessible confirmation dialog (`role="alertdialog"`) before any permanent record deletion.
- **Multi-Filter System:**
  - Case-insensitive search on description and category
  - Type filter (`All`, `Income`, `Expense`)
  - Dynamic category dropdown
  - Date range filtering (Start Date to End Date)
  - One-click filter reset
- **Responsive Presentation:**
  - Structured data table on desktop with hover actions
  - Touch-friendly transaction cards on mobile devices

### 📈 Analytics
- **Key Financial Metrics:** Total Income, Total Expenses, Net Savings, and Savings Rate percentage.
- **6-Month Comparison:** Income vs Expense bar trends with accessible ARIA labeling.
- **Category Spending Breakdown:** SVG Donut chart and horizontal bar visualization showing proportion of spending per category.
- **Actionable Insights:** Dynamically generated insights backed strictly by actual records (top spending category, savings rate health, and month-over-month change).
- **Historical Benchmarks:** Average monthly expenses and highest spending month.

### 🔔 Notifications & Accessibility
- **Toast Notifications:** Restrained, non-blocking feedback toasts for create, update, and delete actions.
- **Form Validation:** Real-time and submit-time validation with clear error messages below corresponding inputs.
- **Keyboard & Screen Reader Support:** Focus trapping in modal dialogs, Escape key handling, and ARIA roles/live regions.

---

## 3. Architecture & Folder Structure

```text
trackerly/
├── index.html                  # Single-page application shell
├── README.md                   # Project documentation & run guide
├── AGENTS (2).md               # Project specification & guidelines
├── .gitignore                  # Git ignore rules
├── css/
│   ├── reset.css               # Modern CSS reset & base settings
│   ├── variables.css           # Design tokens: typography, colors, shadows, radii
│   ├── layout.css              # Desktop sidebar, grid layout, mobile nav, modals
│   ├── components.css          # Cards, buttons, tables, chips, charts, toasts
│   └── responsive.css          # Breakpoints (1024px, 768px, 430px)
└── js/
    ├── app.js                  # Application entry point & coordinator
    ├── utils.js                # Currency (INR), date formatting, SVG icons, debounce
    ├── data/
    │   └── categories.js       # Central categories registry & metadata
    ├── modules/
    │   ├── storage.js          # LocalStorage envelope, safe reads/writes, versioning
    │   ├── transactions.js     # Transaction validation & CRUD service
    │   ├── calculations.js     # Pure financial math (totals, balance, savings rate)
    │   ├── filters.js          # Pure search, multi-filter AND logic, sorting
    │   └── analytics.js        # Monthly trends, category aggregations, insights
    └── ui/
        ├── navigation.js       # Hash-based routing (#dashboard, #transactions, #analytics)
        ├── dashboard.js        # Dashboard view rendering & period controls
        ├── transaction-list.js # Table/card list, search/filters, delete dialog
        ├── transaction-form.js # Accessible Add/Edit modal form
        ├── analytics-page.js   # Analytics view rendering & insights
        ├── charts.js           # SVG & CSS bar, donut, and horizontal charts
        └── notifications.js    # Toast alert system
```

---

## 4. Local Storage Behavior

- **Storage Key:** `expenseTracker_v1`
- **Data Envelope:**
  ```json
  {
    "version": 1,
    "transactions": [ ... ],
    "updatedAt": "2026-10-04T06:30:00.000Z"
  }
  ```
- **Integrity & Safety:**
  - Verifies written data by immediately re-reading the storage key.
  - Catches quota errors and private-browsing storage exceptions safely.
  - Corrupted JSON is flagged with user-facing warnings rather than silently discarded or overwritten.
  - All direct `localStorage` access is encapsulated in `js/modules/storage.js`.

---

## 5. How to Run Locally

Because the project uses standard ECMAScript modules (`<script type="module">`), it must be served over an HTTP/HTTPS server (browsers disallow module loading via `file://` due to CORS security policies).

### Option A: VS Code Live Server
1. Open the project folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and select **"Open with Live Server"**.
4. The application will open automatically at `http://127.0.0.1:5500`.

### Option B: Node.js (`npx serve`)
```bash
# In the project directory:
npx serve .
```

### Option C: Python 3
```bash
# In the project directory:
python -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

---

## 6. Known Limitations

- **Single Device / Local Browser:** Storage is tied to the current browser and profile. Data does not synchronize across separate devices without a cloud database.
- **Client-Side Storage Limits:** Browsers typically allocate 5MB for LocalStorage, which comfortably holds tens of thousands of transaction records for personal finance.
