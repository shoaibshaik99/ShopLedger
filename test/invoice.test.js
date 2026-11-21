const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function compareFigures(id, items, coupon) {
  const checkout = pricing.computeTotals(items, coupon);
  const order = {
    id,
    items,
    coupon,
    subtotal: checkout.subtotal,
    discount: checkout.discount,
    tax: checkout.tax,
    total: checkout.total
  };
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);

  return {
    invoiceTotals,
    invoiceLines: rows.map(({ hsn, line, gstPercent, lineTax }) => ({
      hsn, gross: line, gstPercent, tax: lineTax
    })),
    checkoutTotals: {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    },
    checkoutLines: checkout.lines.map(({ hsn, gross, gstPercent, tax }) => ({
      hsn, gross, gstPercent, tax
    }))
  };
}

// An undefined gstRate models the missing override on saved checkout lines.
test('CURRENT BEHAVIOUR: #1001 invoice uses the 5% and 12% HSN slabs', () => {
  const items = [
    { id: 1, name: 'Rice', price: 100, qty: 2, hsn: '1006', gstRate: undefined },
    { id: 2, name: 'Ghee', price: 300, qty: 1, hsn: '0405', gstRate: undefined }
  ];

  assert.deepStrictEqual(compareFigures(1001, items, ''), {
    invoiceTotals: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    invoiceLines: [
      { hsn: '1006', gross: 200, gstPercent: 5, tax: 10 },
      { hsn: '0405', gross: 300, gstPercent: 12, tax: 36 }
    ],
    checkoutTotals: { subtotal: 500, discount: 0, tax: 46, cgst: 23, sgst: 23, total: 546 },
    checkoutLines: [
      { hsn: '1006', gross: 200, gstPercent: 5, tax: 10 },
      { hsn: '0405', gross: 300, gstPercent: 12, tax: 36 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 invoice applies SAVE10 before GST', () => {
  const items = [
    { id: 3, name: 'Tea', price: 500, qty: 2, hsn: '0902', gstRate: undefined }
  ];

  assert.deepStrictEqual(compareFigures(1002, items, 'SAVE10'), {
    invoiceTotals: { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    invoiceLines: [{ hsn: '0902', gross: 1000, gstPercent: 18, tax: 162 }],
    checkoutTotals: { subtotal: 1000, discount: 100, tax: 162, cgst: 81, sgst: 81, total: 1062 },
    checkoutLines: [{ hsn: '0902', gross: 1000, gstPercent: 18, tax: 162 }]
  });
});

test('CURRENT BEHAVIOUR: #1004 invoice applies the SAVE10 cap on a 2240 subtotal', () => {
  const items = [
    { id: 2, name: 'Ghee', price: 1120, qty: 2, hsn: '0405', gstRate: undefined }
  ];

  assert.deepStrictEqual(compareFigures(1004, items, 'SAVE10'), {
    invoiceTotals: { subtotal: 2240, discount: 150, tax: 250.8, cgst: 125.4, sgst: 125.4, total: 2340.8 },
    invoiceLines: [{ hsn: '0405', gross: 2240, gstPercent: 12, tax: 250.8 }],
    checkoutTotals: { subtotal: 2240, discount: 150, tax: 250.8, cgst: 125.4, sgst: 125.4, total: 2340.8 },
    checkoutLines: [{ hsn: '0405', gross: 2240, gstPercent: 12, tax: 250.8 }]
  });
});

test('CURRENT BEHAVIOUR: #1008 invoice matches checkout for 18% lines without a coupon', () => {
  const items = [
    { id: 3, name: 'Tea', price: 100, qty: 2, hsn: '0902', gstRate: undefined },
    { id: 4, name: 'Coffee', price: 300, qty: 1, hsn: '0901', gstRate: 18 }
  ];

  const totals = { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590 };
  const lines = [
    { hsn: '0902', gross: 200, gstPercent: 18, tax: 36 },
    { hsn: '0901', gross: 300, gstPercent: 18, tax: 54 }
  ];

  assert.deepStrictEqual(compareFigures(1008, items, ''), {
    invoiceTotals: totals,
    invoiceLines: lines,
    checkoutTotals: totals,
    checkoutLines: lines
  });
});

test('invoice matches billed totals and per-line GST for mixed HSN slabs with a capped SAVE10 coupon', () => {
  const items = [
    { id: 1, name: 'Rice', price: 1120, qty: 1, hsn: '1006' },
    { id: 2, name: 'Ghee', price: 560, qty: 2, hsn: '0405' }
  ];
  const { invoiceTotals, invoiceLines, checkoutTotals, checkoutLines } =
    compareFigures(2001, items, 'SAVE10');

  assert.equal(checkoutTotals.discount, 150);
  assert.deepStrictEqual(invoiceTotals, checkoutTotals);
  assert.deepStrictEqual(invoiceLines, checkoutLines);
});
