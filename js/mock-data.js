// STASH — Mock data (swap for real API calls later)

const STASH_MOCK = {
  user: {
    firstName: "Michael",
    lastName: "Chidi",
    initial: "M",
    businessName: "Chidi's Provisions",
    phone: "0803 123 4567",
    email: "michael@chidisprovisions.com"
  },

  today: {
    totalSales: 412800,
    salesCount: 32,
    changePct: 18.6,
    weekBars: [
      { label: "M", pct: 38 }, { label: "T", pct: 52 }, { label: "W", pct: 44 },
      { label: "T", pct: 70 }, { label: "F", pct: 60 }, { label: "S", pct: 48 },
      { label: "S", pct: 100, today: true }
    ]
  },

  topProducts: [
    { rank: "01", name: "Indomie (1 carton)", units: 56, unitLabel: "units sold", revenue: 67200, share: 32 },
    { rank: "02", name: "Coca-Cola (50cl)", units: 32, unitLabel: "units sold", revenue: 28800, share: 14 },
    { rank: "03", name: "Pure Water (75cl)", units: 28, unitLabel: "units sold", revenue: 14000, share: 7 }
  ],

  lowStock: [
    { name: "Indomie (1 carton)", remaining: "6 cartons left", pct: 18, level: "danger" },
    { name: "Coca-Cola (50cl)", remaining: "9 crates left", pct: 30, level: "warn" },
    { name: "Peak Milk (400g)", remaining: "12 units left", pct: 40, level: "warn" },
    { name: "Milo (500g tin)", remaining: "10 tins left", pct: 45, level: "warn" },
    { name: "Golden Morn (500g)", remaining: "3 packs left", pct: 12, level: "danger" },
    { name: "Pure Water (75cl)", remaining: "15 packs left", pct: 50, level: "warn" }
  ],

  insight: {
    title: "Indomie was your best-selling product today.",
    subtitle: "You sold 56 cartons, bringing in \u20A667,200 in sales."
  },

  // ---- Products (with cost + expiry + stock units for # search) ----
  products: [
    { name: "Indomie (1 carton)", qty: "17 cartons", stockUnits: 17, cost: 12000, costUnit: "carton", expiryDays: null, expired: false },
    { name: "Peak Milk (400g)", qty: "12 cartons", stockUnits: 12, cost: 3500, costUnit: "carton", expiryDays: 18, expired: false },
    { name: "Coca-Cola (50cl)", qty: "9 crates", stockUnits: 9, cost: 2800, costUnit: "crate", expiryDays: 5, expired: false },
    { name: "Golden Morn (500g)", qty: "3 packs", stockUnits: 3, cost: 2200, costUnit: "pack", expiryDays: 2, expired: false },
    { name: "Pure Water (75cl)", qty: "15 packs", stockUnits: 15, cost: 900, costUnit: "pack", expiryDays: null, expired: false },
    { name: "Milo (500g tin)", qty: "10 tins", stockUnits: 10, cost: 3100, costUnit: "tin", expiryDays: null, expired: false },
    { name: "Yoghurt (500ml)", qty: "6 bottles", stockUnits: 6, cost: 700, costUnit: "bottle", expiryDays: 0, expired: true },
    { name: "Bread (loaf)", qty: "4 loaves", stockUnits: 4, cost: 600, costUnit: "loaf", expiryDays: 1, expired: false },
    { name: "Milk (1L)", qty: "24 units", stockUnits: 24, cost: 1200, costUnit: "unit", expiryDays: 25, expired: false },
    { name: "Maltina (Can)", qty: "0 units", stockUnits: 0, cost: 550, costUnit: "can", expiryDays: null, expired: false },
    { name: "Maggi Star (Pack)", qty: "30 packs", stockUnits: 30, cost: 1800, costUnit: "pack", expiryDays: null, expired: false },
    { name: "Three Crowns Milk (400g)", qty: "8 tins", stockUnits: 8, cost: 1500, costUnit: "tin", expiryDays: null, expired: false }
  ],

  // ---- Stock records (Product | Purchased | Sold | Remaining) ----
  stockRecords: [
    { product: "Indomie (1 carton)", purchased: 20, sold: 13, remaining: 17 },
    { product: "Coca-Cola (50cl)", purchased: 15, sold: 8, remaining: 9 },
    { product: "Peak Milk (400g)", purchased: 25, sold: 11, remaining: 12 },
    { product: "Pure Water (75cl)", purchased: 30, sold: 22, remaining: 15 },
    { product: "Milo (500g tin)", purchased: 14, sold: 6, remaining: 10 },
    { product: "Golden Morn (500g)", purchased: 8, sold: 5, remaining: 3 }
  ],

  // ---- Sales ----
  sales: [
    { date: "Today, 4:20 PM", product: "Indomie (1 carton)", qty: 10, amount: 12000, profit: 2000 },
    { date: "Today, 2:05 PM", product: "Coca-Cola (50cl)", qty: 6, amount: 4800, profit: 1200 },
    { date: "Today, 11:40 AM", product: "Peak Milk (400g)", qty: 4, amount: 3600, profit: 800 },
    { date: "Yesterday, 6:10 PM", product: "Pure Water (75cl)", qty: 12, amount: 6000, profit: 1500 },
    { date: "Yesterday, 1:15 PM", product: "Golden Morn (500g)", qty: 3, amount: 2100, profit: 450 },
    { date: "Aug 25, 5:30 PM", product: "Milo (500g tin)", qty: 5, amount: 3500, profit: 900 }
  ],

  // ---- Expenses ----
  expenses: [
    { date: "Today", description: "Transport to market", category: "Logistics", amount: 3000 },
    { date: "Yesterday", description: "Shop electricity", category: "Utilities", amount: 5000 },
    { date: "Aug 25", description: "Nylon bags", category: "Supplies", amount: 1500 },
    { date: "Aug 23", description: "Shop assistant wages", category: "Salaries", amount: 15000 }
  ],

  // ---- Debts (customers owing) ----
  debts: [
    { customer: "Chinedu", amount: 20000, date: "Aug 20", status: "Outstanding" },
    { customer: "Ngozi", amount: 8500, date: "Aug 22", status: "Outstanding" },
    { customer: "Emeka", amount: 15000, date: "Aug 10", status: "Partly paid", balance: 6000 }
  ],

  // ---- Suppliers ----
  suppliers: [
    { name: "ABC Distributors", products: ["Indomie", "Peak Milk", "Coca-Cola"], outstanding: 45000 },
    { name: "Lagos Beverages Ltd", products: ["Coca-Cola", "Pure Water"], outstanding: 0 },
    { name: "Golden Foods Supply", products: ["Golden Morn", "Milo"], outstanding: 12000 }
  ],

  // ---- Supplier discovery (foundation only — built from real purchase history) ----
  supplierOffers: [
    { product: "Peak Milk (400g)", usualCost: 3500, offerCost: 3200, supplier: "Golden Foods Supply" }
  ],

  // ---- Bank reconciliation (future-ready stub) ----
  bankConnected: true,
  bankAccount: { bankName: "GTBank", accountTail: "4821" },
  bankTransactions: [
    { date: "Today, 4:32 PM", amount: 12000, description: "POS credit", status: "matched", matchedTo: "Indomie sale" },
    { date: "Today, 2:10 PM", amount: 4800, description: "Transfer received", status: "matched", matchedTo: "Coca-Cola sale" },
    { date: "Today, 11:45 AM", amount: 85000, description: "Transfer received \u2014 CHINEDU O.", status: "review", matchedTo: null },
    { date: "Yesterday, 6:15 PM", amount: -5000, description: "Debit \u2014 IKEDC", status: "unmatched", matchedTo: null }
  ],

  // ---- Invoices ----
  invoices: [
    { number: "INV-0042", customer: "Chinedu", amount: 150000, date: "Aug 27", status: "Sent" },
    { number: "INV-0041", customer: "Blessing Stores", amount: 82000, date: "Aug 24", status: "Paid" },
    { number: "INV-0040", customer: "Ngozi", amount: 30000, date: "Aug 18", status: "Overdue" },
    { number: "INV-0039", customer: "Kelvin Mart", amount: 60000, date: "Aug 15", status: "Draft" }
  ],

  // ---- Mock "detected products" response when a notebook photo is snapped/attached ----
  detectionSample: [
    { name: "Indomie (1 carton)", qty: 10, unitPrice: 1200 },
    { name: "Coca-Cola (50cl)", qty: 6, unitPrice: 800 },
    { name: "Peak Milk (400g)", qty: 4, unitPrice: 900 }
  ],
  chatHistory: [
    { id: "c1", title: "Today's sales", date: "Aug 27", messages: [
      { from: "stash", text: "Good afternoon, Michael. I'm all caught up on today's sales \u2014 what would you like to know?" }
    ]},
    { id: "c2", title: "New stock", date: "Aug 26", messages: [
      { from: "user", text: "I bought 20 cartons of Indomie today" },
      { from: "stash", text: "Got it \u2014 added 20 cartons of Indomie to your stock. Your total is now 37 cartons." }
    ]},
    { id: "c3", title: "Expenses", date: "Aug 25", messages: [
      { from: "user", text: "Spent 5000 on electricity today" },
      { from: "stash", text: "Noted \u2014 \u20A65,000 logged under Utilities for today." }
    ]},
    { id: "c4", title: "Inventory check", date: "Aug 24", messages: [
      { from: "user", text: "How much Coca-Cola do I have left?" },
      { from: "stash", text: "You have 9 crates of Coca-Cola (50cl) left." }
    ]}
  ],

  suggestions: [
    "How much did I make today?",
    "What's my top product?",
    "What should I restock?",
    "How much profit this month?"
  ],

  // ---- @ page shortcuts for chat input ----
  pageShortcuts: [
    { tag: "products", label: "Products", href: "products.html" },
    { tag: "stockrecords", label: "Stock Records", href: "stockrecords.html" },
    { tag: "sales", label: "Sales", href: "sales.html" },
    { tag: "expenses", label: "Expenses", href: "expenses.html" },
    { tag: "debts", label: "Debts", href: "debts.html" },
    { tag: "suppliers", label: "Suppliers", href: "suppliers.html" },
    { tag: "invoices", label: "Invoices", href: "invoices.html" },
    { tag: "reports", label: "Reports", href: "reports.html" }
  ]
};

function formatNaira(amount){
  const n = Math.round(Number(amount));
  const withCommas = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "\u20A6" + withCommas;
}
