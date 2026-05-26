// Shared mock data matching the real schema in src/types/index.ts.
// AccountType: 'cash' | 'savings' | 'investment' | 'retirement' | 'debt'
// TransactionType: 'expense' | 'income' | 'savings'

// ── Palette ────────────────────────────────────────────────────────────
// Every chart, bar, badge and dot pulls from this one place so the system
// stays consistent. Each token has both a light- and dark-mode value plus
// a "soft" alpha variant for badges/backgrounds.
window.Palette = {
  // Semantic
  terra:    { light: '#c66b46', dark: '#e89072' },  // primary brand
  forest:   { light: '#3d6b54', dark: '#7ec99c' },  // income / positive
  red:      { light: '#b8492f', dark: '#e0826b' },  // expense / negative
  amber:    { light: '#c98a3a', dark: '#e8b878' },  // retirement / warning
  violet:   { light: '#7a6bd6', dark: '#a89be8' },  // investment
  blue:     { light: '#5a7fb8', dark: '#8aa8d6' },  // cash
  teal:     { light: '#3d8a8a', dark: '#7ec5c5' },  // savings (HYSA)

  // Extended categorical — for category breakdowns when 7 isn't enough
  mustard:  { light: '#b89535', dark: '#d4b568' },
  sage:     { light: '#6b8a52', dark: '#a8c590' },
  plum:     { light: '#9a5fa8', dark: '#c590d0' },
  rose:     { light: '#c45a82', dark: '#e890b0' },
  slate:    { light: '#6b7a85', dark: '#a0adb8' },
};

// Categorical series — rotate through in order when assigning category colors.
window.CATEGORICAL_SERIES = [
  'terra', 'forest', 'amber', 'violet', 'blue',
  'teal',  'rose',   'sage',  'plum',  'mustard',
  'red',   'slate',
];

// Account type → palette key
window.AccountTypeColor = {
  cash:       'blue',
  savings:    'teal',
  investment: 'violet',
  retirement: 'amber',
  debt:       'red',
};

// Transaction type → palette key
window.TxnTypeColor = {
  income:  'forest',
  expense: 'red',
  savings: 'terra',
};

// Helper: resolve a palette color for the active theme
window.color = (theme, key) => {
  const p = window.Palette[key];
  if (!p) return key;
  return theme.mode === 'dark' ? p.dark : p.light;
};

// Soft alpha bg for a palette color
window.softBg = (theme, key, alpha = 0.12) => {
  const hex = window.color(theme, key);
  // convert hex → rgba
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

window.FinanceData = {
  netWorth: 48492.03,
  assetsTotal: 48729.72,
  liabilitiesTotal: -237.69,
  deltaMonth: 1842.51,
  deltaPct: 3.95,

  accounts: [
    { id: 'a1', name: 'Charles Schwab Checking', accountType: 'cash',       subtype: 'Cash',        balance: 9000.00,  pct: 0.18, kind: 'asset' },
    { id: 'a2', name: 'Schwab Investing',         accountType: 'investment', subtype: 'Investment',  balance: 20836.81, pct: 0.95, kind: 'asset', est: true, recurring: '+$100.00/mo' },
    { id: 'a3', name: 'Schwab Roth IRA',          accountType: 'retirement', subtype: 'Retirement',  balance: 5191.48,  pct: 0.24, kind: 'asset', est: true, loggedDays: 16 },
    { id: 'a4', name: '401(k)',                    accountType: 'retirement', subtype: 'Retirement',  balance: 5451.00,  pct: 0.26, kind: 'asset' },
    { id: 'a5', name: 'Ally High-Yield Savings',  accountType: 'savings',    subtype: 'Savings',     balance: 8250.43,  pct: 0.38, kind: 'asset', est: true, recurring: '+$250.00/mo', loggedDays: 16 },
    { id: 'l1', name: 'Discover It',               accountType: 'debt',       subtype: 'Credit Card', balance: -10.94,  pct: 0.02, kind: 'liability' },
    { id: 'l2', name: 'Citi Custom Cash',          accountType: 'debt',       subtype: 'Credit Card', balance: 0.00,    pct: 0.00, kind: 'liability', paidOff: true },
    { id: 'l3', name: 'AMEX Blue Cash Everyday',   accountType: 'debt',       subtype: 'Credit Card', balance: -226.75, pct: 0.03, kind: 'liability' },
  ],

  netWorthHistory: [
    { month: 'May 26', value: 32500, actual: true },
    { month: 'Jun 26', value: 33800, actual: true },
    { month: 'Jul 26', value: 32100, actual: true },
    { month: 'Aug 26', value: 31900, actual: true },
    { month: 'Sep 26', value: 33400, actual: true },
    { month: 'Oct 26', value: 35200, actual: true },
    { month: 'Nov 26', value: 38900, actual: true },
    { month: 'Dec 26', value: 42100, actual: true },
    { month: 'Jan 27', value: 44600, actual: true },
    { month: 'Feb 27', value: 46500, actual: true },
    { month: 'Mar 27', value: 47800, actual: true },
    { month: 'Apr 27', value: 48200, actual: true },
    { month: 'May 27', value: 48492, actual: true },
    { month: 'Jun 27', value: 51200, actual: false },
    { month: 'Jul 27', value: 54100, actual: false },
    { month: 'Aug 27', value: 56800, actual: false },
    { month: 'Sep 27', value: 60100, actual: false },
    { month: 'Oct 27', value: 63500, actual: false },
    { month: 'Nov 27', value: 67200, actual: false },
    { month: 'Dec 27', value: 71800, actual: false },
  ],

  kpis: {
    income: 19643.00,
    expenses: 7154.60,
    netCashFlow: 12488.40,
    savingsRate: 0.044,
  },

  monthlyFlow: [
    { m: 'Jan', income: 4520, expense: 1720 },
    { m: 'Feb', income: 4540, expense: 1560 },
    { m: 'Mar', income: 4556, expense: 1520 },
    { m: 'Apr', income: 5856, expense: 1880 },
    { m: 'May', income: 170,  expense: 470, partial: true },
    { m: 'Jun', income: 0, expense: 0 },
    { m: 'Jul', income: 0, expense: 0 },
    { m: 'Aug', income: 0, expense: 0 },
    { m: 'Sep', income: 0, expense: 0 },
    { m: 'Oct', income: 0, expense: 0 },
    { m: 'Nov', income: 0, expense: 0 },
    { m: 'Dec', income: 0, expense: 0 },
  ],

  cumulativeSavings: [
    { m: 'Jan', v: 2800 },
    { m: 'Feb', v: 5780 },
    { m: 'Mar', v: 8816 },
    { m: 'Apr', v: 12792 },
    { m: 'May', v: 12492 },
    { m: 'Jun', v: 12492 },
    { m: 'Jul', v: 12492 },
    { m: 'Aug', v: 12492 },
    { m: 'Sep', v: 12492 },
    { m: 'Oct', v: 12492 },
    { m: 'Nov', v: 12492 },
    { m: 'Dec', v: 12492 },
  ],

  // Each category has a palette key — same colors used in dots, bars, and pie segments.
  categories: [
    { name: 'Other',          amount: 974.60, pct: 0.62,  paletteKey: 'slate'   },
    { name: 'Rent & Housing', amount: 162.40, pct: 0.10,  paletteKey: 'terra'   },
    { name: 'Car & Transport',amount: 141.60, pct: 0.09,  paletteKey: 'forest'  },
    { name: 'Therapy',        amount: 54.80,  pct: 0.035, paletteKey: 'violet'  },
    { name: 'Subscriptions',  amount: 33.42,  pct: 0.021, paletteKey: 'blue'    },
    { name: 'Groceries & Pharmacy', amount: 89.40, pct: 0.057, paletteKey: 'amber' },
    { name: 'Entertainment',  amount: 42.10, pct: 0.027, paletteKey: 'teal'   },
    { name: 'Socializing',    amount: 38.50, pct: 0.024, paletteKey: 'rose'   },
    { name: 'Food & Takeout', amount: 76.20, pct: 0.048, paletteKey: 'sage'   },
    { name: 'Shopping',       amount: 55.80, pct: 0.035, paletteKey: 'plum'   },
    { name: 'Cat Expenses',   amount: 28.90, pct: 0.018, paletteKey: 'mustard'},
  ],

  recurring: {
    total: 145.83,
    pctIncome: 0.04,
    items: [
      { name: 'Car & Transport', amount: 125.00, paletteKey: 'forest' },
      { name: 'Subscriptions',   amount: 20.83,  paletteKey: 'blue' },
    ],
  },

  transactions: [
    { date: 'Jan 1, 2027',  type: 'expense', category: 'Subscriptions',  recurrence: 'monthly', recCount: 13, amount: -20.00,  note: 'Disney+, Hulu, HBO Bundle' },
    { date: 'Jan 1, 2027',  type: 'expense', category: 'Subscriptions',  recurrence: 'annual',  recCount: 2,  amount: -10.00,  note: 'Annual Google One subscription' },
    { date: 'Jan 1, 2027',  type: 'expense', category: 'Car & Transport',recurrence: 'monthly', recCount: 13, amount: -125.00, note: 'Monthly car expense' },
    { date: 'Jan 1, 2027',  type: 'income',  category: 'Other Income',   recurrence: 'monthly', recCount: 13, amount: 7.00,    note: 'disney streaming credit' },
    { date: 'Dec 1, 2026',  type: 'expense', category: 'Subscriptions',  recurrence: 'split',   recSplit: 12, amount: -137.04, note: 'Piano Course bundle' },
    { date: 'May 9, 2026',  type: 'savings', category: 'HYSA',           recurrence: null,                    amount: 250.00,  note: null },
    { date: 'Apr 30, 2026', type: 'expense', category: 'Other',          recurrence: null,                    amount: -1800.00,note: null },
    { date: 'Apr 30, 2026', type: 'income',  category: 'Bonus',          recurrence: null,                    amount: 2278.00, note: 'Wellhub Bonus Y1' },
    { date: 'Apr 30, 2026', type: 'income',  category: 'Salary',         recurrence: null,                    amount: 3628.00, note: 'Wellhub Salary (after raise)' },
    { date: 'Mar 31, 2026', type: 'expense', category: 'Other',          recurrence: null,                    amount: -1480.00,note: null },
    { date: 'Mar 31, 2026', type: 'income',  category: 'Salary',         recurrence: null,                    amount: 4556.00, note: 'Wellhub Salary (before raise)' },
    { date: 'Feb 28, 2026', type: 'expense', category: 'Other',          recurrence: null,                    amount: -1500.00,note: null },
  ],
};

// ── Formatters — match src/lib/format.ts ─────────────────────────────
window.fmt = {
  money(n, opts = {}) {
    const { sign = false, abs = false, cents = true } = opts;
    const v = abs ? Math.abs(n) : n;
    const s = v.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    });
    if (sign && n > 0) return '+' + s;
    return s;
  },
  pct(n) { return (n * 100).toFixed(1) + '%'; },
  yTick(v) {
    if (Math.abs(v) >= 1000) {
      const k = v / 1000;
      return '$' + (Number.isInteger(k) ? k : k.toFixed(1)) + 'k';
    }
    return '$' + v;
  },
};
