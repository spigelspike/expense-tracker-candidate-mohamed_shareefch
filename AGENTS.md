# Koin --- Expense Tracker

## `AGENTS.md` \| Project specification, design system, implementation workflow, and acceptance criteria

> Treat this file as the source of truth for the project. Read it before
> creating or modifying code. Follow it throughout implementation.

## 1. Project Overview

Build **Koin**, a polished, responsive Expense Tracker web
application for the LTS Software Developer Intern recruitment
assignment.

-   **Repository:** `expense-tracker-shareef`
-   **Stack:** HTML5, CSS3, Vanilla JavaScript (ES6 modules)
-   **Persistence:** Browser Local Storage
-   **Architecture:** Modular frontend, single-page application
-   **Target:** Desktop, tablet, and mobile browsers
-   **Backend:** None required

The application must allow users to add income and expense transactions,
enter amount/category/date/description, edit and delete records, view
financial summaries, filter/search transactions, and retain data after
refresh.

Prioritize correctness, clarity, usability, accessibility, and
maintainable code. Do not add features that are outside the assignment
simply to make the interface look complex.

## 2. Product and Design Direction

Create a premium, modern personal-finance experience inspired by
contemporary fintech products and the supplied visual references. Use
the references for their clean surfaces, confident use of colour,
category treatments, and approachable feel---not as layouts to copy.

The design must feel: - Premium, not generic - Minimal, not empty -
Colourful, but restrained - Spacious, not wasteful - Functional, not
decorative - Consistent across all views

Avoid generic AI-generated admin dashboards, overcrowded cards,
oversized greetings, excessive gradients, glassmorphism, neon colours,
large stock photographs, random illustrations, fake financial activity,
and decorative content that does not support expense tracking.

### 2.1 Colour tokens

Use a sophisticated light theme:

  Token             Value       Use
  ----------------- ----------- -------------------------------------
  Main background   `#F5F7FB`   App canvas
  Surface           `#FFFFFF`   Cards, dialogs, panels
  Primary text      `#172033`   Headings and key values
  Secondary text    `#697586`   Supporting labels
  Muted text        `#98A2B3`   Metadata
  Primary blue      `#3978F6`   Primary actions and selected states
  Soft blue         `#EAF1FF`   Tinted surfaces
  Purple            `#8B5CF6`   Selected categories/charts
  Soft purple       `#F2ECFF`   Tinted surfaces
  Income green      `#16A879`   Income and positive values
  Soft green        `#E8F8F1`   Income surfaces
  Expense coral     `#EF5B68`   Expenses and negative values
  Soft coral        `#FFF0F1`   Expense surfaces
  Border            `#E8ECF2`   Dividers and outlines

Define tokens centrally in `css/variables.css`. Keep category colours
consistent across the dashboard, transactions, and analytics. Never rely
on colour alone to convey transaction type.

### 2.2 Typography

Use Inter or a comparable modern sans-serif. Use tabular numerals for
monetary values where supported.

Suggested desktop scale: - Page heading: 26--30px, semibold - Section
heading: 16--19px, semibold - Main balance: 32--40px, semibold - Summary
values: 22--28px, semibold - Body: 13--15px - Supporting labels:
12--13px

Maintain clear hierarchy without making every heading or amount
oversized.

### 2.3 Surfaces, spacing, and depth

-   Main cards: 16--20px radius
-   Inputs and buttons: 10--12px radius
-   Use subtle borders and restrained shadows
-   Use a consistent 4px/8px spacing scale
-   Prefer whitespace and alignment over nested cards
-   Keep card padding consistent
-   Use gradients sparingly, only when they improve hierarchy

### 2.4 Desktop-first, fully responsive layout

Design the desktop experience intentionally; do not simply stretch a
mobile screen.

At approximately 1440px: - Use a compact sidebar around 220--240px - Use
a spacious main content area with consistent page margins - Use a
balanced dashboard grid, with a primary content column around 60--65%
and a secondary column around 35--40% - Keep content readable and avoid
filling every available gap with a widget - Allow natural scrolling; do
not force all dashboard content into one viewport

At tablet widths, collapse or compact the sidebar and adapt grids. At
mobile widths, use a compact header, single-column content,
touch-friendly controls, bottom navigation, and transaction cards
instead of a squeezed table. Prevent horizontal overflow at every
breakpoint.

## 3. Application Architecture

Use vanilla HTML, CSS, and JavaScript ES modules. Keep business logic
separate from DOM rendering and persistence. Avoid unnecessary
abstractions, global mutable state, and duplicated calculations.

### 3.1 Recommended project structure

``` text
expense-tracker-shareef/
├── index.html
├── README.md
├── AGENTS.md
├── .gitignore
├── assets/
│   └── icons/
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
└── js/
    ├── app.js
    ├── data/
    │   └── categories.js
    ├── modules/
    │   ├── storage.js
    │   ├── transactions.js
    │   ├── calculations.js
    │   ├── filters.js
    │   └── analytics.js
    ├── ui/
    │   ├── navigation.js
    │   ├── dashboard.js
    │   ├── transaction-list.js
    │   ├── transaction-form.js
    │   ├── analytics-page.js
    │   ├── charts.js
    │   └── notifications.js
    └── utils.js
```

Adjust file names only when there is a clear reason. Keep modules
focused and avoid creating files that only wrap one trivial expression.

### 3.2 Responsibilities

-   `app.js`: initialize app, load data, coordinate page rendering and
    refresh dependent views after mutations.
-   `categories.js`: central category definitions and category
    validation.
-   `storage.js`: all Local Storage reads/writes, parsing, versioning,
    and storage error handling.
-   `transactions.js`: transaction validation and CRUD operations.
-   `calculations.js`: pure financial totals and balance calculations.
-   `filters.js`: pure search, filter, and sorting functions.
-   `analytics.js`: monthly and category aggregations and chart-ready
    data.
-   `navigation.js`: accessible navigation and active view state.
-   `dashboard.js`: dashboard rendering and dashboard-specific
    interactions.
-   `transaction-list.js`: transaction list/table/cards and filter
    controls.
-   `transaction-form.js`: reusable create/edit form and validation
    display.
-   `analytics-page.js`: analytics page composition and period
    selection.
-   `charts.js`: chart rendering only; no business calculations or
    persistence.
-   `notifications.js`: accessible success/error/warning/info messages.
-   `utils.js`: currency/date formatting, ID generation, and other
    genuinely shared helpers.

## 4. Transaction Data Model

Use one consistent structure:

``` javascript
{
  id: "unique_id",
  type: "income", // "income" or "expense"
  amount: 2500,
  category: "Salary",
  date: "2026-10-04",
  description: "Monthly payment",
  createdAt: "2026-10-04T10:30:00.000Z",
  updatedAt: null
}
```

Rules: - `id` is unique and stable. - `type` is exactly `income` or
`expense`. - `amount` is finite and greater than zero. - `category` is
allowed for the selected type. - `date` is a valid `YYYY-MM-DD` calendar
date. - `description` is trimmed, non-empty, and length-limited. - Keep
numeric amounts in the data model; format only for display. - Preserve
`id` and `createdAt` when editing. - Update `updatedAt` on successful
edits. - Do not mutate input records unexpectedly.

For reliable money arithmetic, use integer paise internally where
appropriate or otherwise apply a consistent precision strategy. Do not
introduce inconsistent rounding.

## 5. Categories

Define categories in `js/data/categories.js`.

### Expense

-   Food
-   Transportation
-   Shopping
-   Bills
-   Entertainment
-   Health
-   Education
-   Travel
-   Groceries
-   Other

### Income

-   Salary
-   Freelance
-   Business
-   Investment
-   Gift
-   Other

Export: - `INCOME_CATEGORIES` - `EXPENSE_CATEGORIES` -
`getCategoriesByType(type)` - `isValidCategory(type, category)`

Do not duplicate category arrays in UI files. Use a consistent
icon/colour mapping where icons are available; never let missing icons
break the UI.

## 6. Core Functionality and Module Contracts

Implement these functions with clear contracts and predictable
errors/results.

### 6.1 `storage.js`

Required: - `getTransactions()` - `saveTransactions(transactions)` -
`addTransaction(transaction)` - `updateTransaction(id, updates)` -
`deleteTransaction(id)` - `clearTransactions()` (only for an explicit
user-requested clear action)

Requirements: - Use a versioned key such as `expenseTracker_v1`. -
Handle absent, malformed, or inaccessible storage safely. - Do not
silently overwrite corrupted user data. - Keep all direct `localStorage`
access in this module. - Do not access the DOM. - Ensure a failed write
does not appear as a successful mutation. - Document whether functions
return values or throw errors.

### 6.2 `transactions.js`

Required: - `createTransaction(data)` - `getAllTransactions()` -
`getTransactionById(id)` - `updateTransaction(id, updates)` -
`removeTransaction(id)` - `validateTransaction(data)`

Requirements: - Validate before mutation. - Generate unique IDs. -
Validate type, amount, category, date, and description. - Prevent
partial updates if persistence fails. - Preserve immutable fields during
edits. - Handle missing IDs clearly. - Use `storage.js`,
`categories.js`, and `utils.js`. - Remain independent of the DOM.

### 6.3 `calculations.js`

Required pure functions: - `calculateTotalIncome(transactions)` -
`calculateTotalExpenses(transactions)` -
`calculateBalance(transactions)` -
`calculateMonthlyIncome(transactions, year, month)` -
`calculateMonthlyExpenses(transactions, year, month)` -
`calculateMonthlyBalance(transactions, year, month)` -
`calculateSavingsRate(income, expenses)` -
`calculateTransactionSummary(transactions)`

Requirements: - Income adds to balance; expense subtracts. - Monthly
functions must account for both year and month. - Handle empty arrays
and zero values. - Do not mutate inputs. - Return numeric values, not
formatted strings. - Defensively handle invalid records without
crashing.

### 6.4 `filters.js`

Required pure functions: - `filterByType(transactions, type)` -
`filterByCategory(transactions, category)` -
`filterByDateRange(transactions, startDate, endDate)` -
`filterByMonth(transactions, year, month)` -
`searchTransactions(transactions, query)` -
`filterTransactions(transactions, filters)` -
`sortTransactions(transactions)` - `clearFilters()`

Requirements: - Search descriptions and categories case-insensitively. -
Support combined filters using AND logic. - Empty or absent filters must
not remove valid records. - Do not mutate the original array. - Sort
newest first with a consistent secondary order. - Handle invalid or
missing filter values safely.

### 6.5 `analytics.js`

Required: - `getMonthlySummary(transactions, year, month)` -
`getMonthlyTrends(transactions, numberOfMonths)` -
`getCategoryBreakdown(transactions, year, month)` -
`getTopExpenseCategories(transactions, year, month, limit)` -
`getHighestSpendingMonth(transactions)` -
`getAverageMonthlyExpenses(transactions, numberOfMonths)` -
`getSavingsInsights(transactions, year, month)`

Requirements: - Return chart-ready, structured data. - Group by year and
month correctly. - Calculate category amounts and percentages from
expenses only. - Handle months with no records. - Generate insights only
when supported by available data. - Reuse `calculations.js` rather than
duplicating formulas. - Do not access the DOM or Local Storage.

### 6.6 `utils.js`

Implement reusable helpers as needed: - `formatCurrency(amount)` using
`Intl.NumberFormat` for INR - `formatDate(date)` - `generateId()` -
`getCurrentMonth()` - `isValidDate(date)` - `formatPercentage(value)` -
`debounce(callback, delay)` if needed - `escapeHTML(value)` only if
string-based HTML rendering cannot be avoided

Use safe DOM APIs such as `textContent` for user-provided values. Do not
treat escaping as a substitute for safe rendering.

## 7. Page Specifications

### 7.1 Application shell

Build `index.html`, CSS foundations, and `app.js`.

Desktop: - Left navigation with Koin identity, Dashboard,
Transactions, Analytics, and a compact profile area. - Main area with a
consistent page header and content container. - Active navigation state
must be obvious but understated.

Mobile: - Compact header and bottom navigation. - A prominent central
add action is acceptable only if it is functional. - Ensure all
navigation controls remain accessible.

Navigation must change views without a full page reload. Use semantic
landmarks and avoid fake pages or non-functional controls.

### 7.2 Dashboard

Build a clean financial overview with this hierarchy:

1.  Compact welcome/page header and period selector.
2.  One prominent Total Balance card with show/hide control and month
    context.
3.  Two compact summary panels: Total Income and Total Expenses.
4.  A primary Income vs Expenses chart.
5.  Recent Transactions list with up to five newest entries and a View
    All action.
6.  A concise category breakdown with amounts and percentages.
7.  A clear Add Transaction action.

On desktop, use a balanced two-column grid. Do not make every section a
separate oversized card. On mobile, stack sections naturally.

All values must come from the transaction service and calculation
modules. Period changes and successful mutations must refresh dependent
content. Provide polished empty states.

Do not add bank cards, transfers, crypto, investment features,
referrals, fictional notifications, or decorative landscape photography.

### 7.3 Transactions page

Build a dedicated record-management view.

Include: - Page title and Add Transaction action. - Search by
description/category. - Type filter: All, Income, Expense. - Category
filter. - Date range or month filter. - Clear filters action. - Readable
transaction table on desktop. - Responsive transaction cards on
mobile. - Edit and Delete actions. - Confirmation before deletion. -
Empty state and no-filter-results state.

All filters must work together and update results immediately. Use the
shared transaction service for mutations and the shared form for
add/edit. Show understandable success and error feedback. Do not
duplicate transaction logic in the UI.

### 7.4 Analytics page

Build a focused financial analysis view.

Include: - Period selector. - Total income, expenses, net balance, and
savings rate when meaningful. - A prominent monthly
income-versus-expense chart. - Category-wise expense visualization. -
Monthly spending comparison/trend. - A small number of data-supported
insights.

Use restrained blue, purple, green, and coral accents. Charts must have
clear labels, legends, currency formatting, and accessible text
summaries. Avoid excessive chart panels. Handle insufficient history and
empty datasets honestly. All values must come from `analytics.js`.

### 7.5 Add/Edit Transaction form

Create one reusable accessible form.

Fields: - Type selector for Income/Expense. - Amount with ₹ prefix. -
Dynamic category selector. - Date picker. - Description.

Desktop: - Compact modal or side panel with clear hierarchy.

Mobile: - Responsive bottom sheet or full-screen form.

Requirements: - Add and edit modes. - Populate fields in edit mode. -
Inline validation and useful messages. - Prevent duplicate
submissions. - Keep entered values if saving fails. - Close after
successful save. - Reset for a new transaction. - Keyboard navigation,
visible focus, Escape handling where appropriate, and focus management.

Do not add unsupported card/payment/banking fields.

### 7.6 Charts

`charts.js` is responsible for rendering, not calculating.

Provide: - Monthly income vs expense comparison. - Category-wise expense
breakdown. - Monthly expense trend.

Use CSS-based charts or a lightweight library only if justified and
compatible with the assignment. Charts must be responsive, readable,
data-driven, and accessible. Do not hardcode values or manipulate
transaction records inside the renderer.

### 7.7 Notifications

`notifications.js` should provide: - `showSuccess(message)` -
`showError(message)` - `showWarning(message)` - `showInfo(message)` -
`clearNotifications()`

Use restrained accessible toast notifications, safe text rendering,
sensible dismissal, and non-overlapping placement. Never expose stack
traces or raw technical errors to users.

## 8. Interaction and Accessibility

-   Use semantic HTML and a logical heading hierarchy.
-   Label every form field.
-   Support keyboard navigation.
-   Provide visible focus states.
-   Ensure adequate colour contrast.
-   Do not rely on colour alone for meaning.
-   Give icon-only controls accessible names.
-   Make dialogs keyboard accessible and manage focus.
-   Use ARIA live regions appropriately.
-   Respect reduced-motion preferences.
-   Avoid inline event handlers.
-   Every visible button, link, selector, and icon control must have a
    real action.

## 9. Engineering Standards

-   Use ES6 modules with explicit imports and exports.
-   Prefer `const`; use `let` only when reassignment is required.
-   Use small, single-purpose functions and descriptive names.
-   Avoid global mutable state.
-   Separate business logic, persistence, and DOM rendering.
-   Avoid duplicated formulas and repeated category definitions.
-   Use `textContent` for untrusted text.
-   Never use `eval()`.
-   Do not use inline event attributes.
-   Avoid unnecessary dependencies.
-   Add comments where they clarify non-obvious intent.
-   Keep event listeners from being registered repeatedly during
    re-rendering.
-   Do not rewrite unrelated files.
-   Inspect existing files before modifying them.
-   Ensure all module imports and exports are consistent.

## 10. Validation and Error Handling

Validate required fields, amount, category, type, date, and description
before mutation.

-   Amount must be finite and greater than zero.
-   Type must be `income` or `expense`.
-   Category must be valid for that type.
-   Date must be a real date in the expected format.
-   Description must be trimmed, non-empty, and length-limited.
-   Prevent duplicate form submission.
-   Catch storage read/write failures.
-   Never silently discard corrupted data.
-   Do not report success before persistence succeeds.
-   Keep the UI usable when no records exist.
-   Show concise, actionable error messages.

## 11. Implementation Workflow

Work incrementally and follow this sequence:

1.  Read this `AGENTS.md` and inspect the repository.
2.  Establish the design tokens, reset, layout, and application shell.
3.  Implement categories and utility helpers.
4.  Implement Local Storage with versioning and safe error handling.
5.  Implement transaction validation and CRUD.
6.  Implement calculations and test financial edge cases.
7.  Implement filters and sorting.
8.  Implement analytics aggregation.
9.  Build the transaction form and transaction list.
10. Build the dashboard and charts.
11. Build the analytics page.
12. Integrate all views through `app.js`.
13. Test full workflows, accessibility, and responsive layouts.
14. Complete README and submission checks.

After each major step: - Review changed files. - Check
imports/exports. - Run available tests or manually verify the relevant
behaviour. - Fix issues before proceeding. - Do not claim a feature is
complete unless implemented and verified.

## 12. Testing and Acceptance Criteria

### Transactions

-   Create income and expense records.
-   Edit records and preserve immutable fields.
-   Delete only after confirmation.
-   Reject invalid data.
-   Prevent duplicate submissions.

### Calculations

-   Verify total income, total expenses, balance, monthly totals, and
    savings rate.
-   Test empty arrays, zero income/expenses, invalid records, and
    transactions across years.

### Filters

-   Test each filter individually.
-   Test combined filters.
-   Test case-insensitive search.
-   Test clearing filters.
-   Test sorting and date ranges.

### Persistence

-   Refresh after adding, editing, and deleting.
-   Confirm saved data is retained.
-   Handle missing, malformed, and inaccessible Local Storage without
    crashing or silently overwriting data.

### Analytics

-   Verify monthly and category aggregations.
-   Verify percentages and trends.
-   Verify empty and insufficient-data states.
-   Confirm all charts update after mutations.

### Responsive checks

Test at approximately: - 375px mobile - 430px mobile - 768px tablet -
1024px laptop - 1440px desktop

### Final quality

-   No broken imports.
-   No critical console errors.
-   No horizontal overflow.
-   No non-functional controls.
-   No unsafe user-content injection.
-   Accessible forms, navigation, and dialogs.
-   Clear empty/error states.
-   Accurate README instructions.

## 13. README and Submission

Create a concise `README.md` containing: - Project overview - Features
actually implemented - Technologies - Folder structure - How to run
locally using VS Code Live Server or another suitable static server -
Local Storage behaviour - Screenshots, only when real screenshots are
available - Known limitations

Use repository name `expense-tracker-shareef`. Keep `.gitignore`
appropriate. Do not include secrets, unrelated files, or claims about
features that do not exist.

## 14. Definition of Done

The project is complete only when: - Required CRUD operations work. -
Amount, category, date, and description are validated. - Totals and
balance are accurate. - Filters and search work individually and
together. - Data persists across refreshes. - Desktop, tablet, and
mobile layouts are usable. - Analytics reflect actual records. - Errors
and empty states are handled. - The interface follows this design system
consistently. - README setup instructions match the actual project. -
The latest completed code is ready to push to GitHub.

**Final principle:** build a clean, premium, practical expense tracker.
Prefer clarity and correctness over visual noise, feature creep, or
unnecessary complexity.
