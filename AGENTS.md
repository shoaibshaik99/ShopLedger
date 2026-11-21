# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and body-parser 1 for JSON requests.
- Plain HTML, CSS, and browser JavaScript served from `public/`.
- `data/db.json` is the app's persistent store.

## Module map

- `routes/customers.js` lists Khata customers and records settlements.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` lists products and active coupons.
- `routes/reports.js` serves the dashboard, GST reconciliation, pricing preview, and database export.
- `lib/coupons.js` normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats and normalizes dates and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, updates stock and reservations, and summarizes inventory.
- `lib/invoice.js` recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` manages Khata balances, charges, reversals, and settlements.
- `lib/orders.js` adds, retrieves, filters, and cancels orders.
- `lib/pricing.js` calculates checkout totals, allocating coupon discounts across lines before GST.
- `lib/reports.js` summarizes dashboard figures and compares stored order totals and GST with invoice calculations.
- `lib/store.js` reads and writes the JSON store and maintains its audit log.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js` or `npm start`. The port defaults to 3000 and can be set with `PORT`.
- Run tests with `node --test`. The repo currently has no tests, and `npm test` is a failing placeholder.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules covered by the ticket.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout uses HSN rates and taxes discounted line amounts. The invoice independently calculates GST on full line amounts and falls back to the default GST rate when the saved line has no rate.

Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
