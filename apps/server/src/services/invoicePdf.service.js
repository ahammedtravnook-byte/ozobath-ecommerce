// ============================================
// OZOBATH - Tax Invoice PDF Renderer
// ============================================
// Renders an order's frozen `invoice` sub-document into a PDF buffer.
//
// Reads ONLY what was snapshotted onto the order at issue time. Nothing here
// consults env or recomputes tax — re-rendering an invoice from 2026 must
// produce the same document in 2030, whatever the config says by then.
//
// CURRENCY NOTE: pdfkit's built-in fonts (Helvetica et al) are WinAnsi-
// encoded and have no glyph for the rupee sign U+20B9 — it renders as a
// wrong glyph or drops out entirely. Rendering "Rs." is deliberate and is
// accepted on a GST invoice. Switching to "₹" requires embedding a Unicode
// TTF and shipping the font file with the app.

const PDFDocument = require('pdfkit');

const PAGE_MARGIN = 50;
const money = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

// ─── Layout helpers ──────────────────────────────

const hr = (doc, y) => {
  doc.strokeColor('#dddddd').lineWidth(1)
    .moveTo(PAGE_MARGIN, y).lineTo(doc.page.width - PAGE_MARGIN, y).stroke();
};

const labelValue = (doc, label, value, x, y, width) => {
  doc.fontSize(8).fillColor('#666666').font('Helvetica')
    .text(label.toUpperCase(), x, y, { width });
  doc.fontSize(10).fillColor('#111111').font('Helvetica-Bold')
    .text(value || '-', x, y + 11, { width });
};

// ─── Sections ────────────────────────────────────

const drawHeader = (doc, inv) => {
  // Trade name leads — it is the name the customer transacted with. The
  // legal name follows because a proprietorship's registered name is the
  // proprietor's own, and the invoice must carry it.
  doc.fontSize(16).fillColor('#0A3D6B').font('Helvetica-Bold')
    .text(inv.sellerTradeName || inv.sellerLegalName || 'OZOBATH', PAGE_MARGIN, PAGE_MARGIN, { width: 300 });

  doc.fontSize(9).fillColor('#444444').font('Helvetica');
  if (inv.sellerTradeName && inv.sellerLegalName) {
    doc.text(`Proprietor: ${inv.sellerLegalName}`, { width: 300 });
  }
  if (inv.sellerAddress) doc.text(inv.sellerAddress, { width: 300 });
  if (inv.sellerGstin) doc.text(`GSTIN: ${inv.sellerGstin}`);
  if (inv.sellerState) doc.text(`State: ${inv.sellerState} (${inv.sellerStateCode || '-'})`);

  doc.fontSize(16).fillColor('#111111').font('Helvetica-Bold')
    .text('TAX INVOICE', PAGE_MARGIN, PAGE_MARGIN, {
      width: doc.page.width - PAGE_MARGIN * 2,
      align: 'right',
    });

  return doc.y + 10;
};

const drawMeta = (doc, order, inv, y) => {
  hr(doc, y);
  const top = y + 12;
  const col = (doc.page.width - PAGE_MARGIN * 2) / 3;

  labelValue(doc, 'Invoice No', inv.number, PAGE_MARGIN, top, col);
  labelValue(doc, 'Invoice Date', formatDate(inv.issuedAt), PAGE_MARGIN + col, top, col);
  labelValue(doc, 'Order No', order.orderNumber, PAGE_MARGIN + col * 2, top, col);

  const second = top + 34;
  labelValue(doc, 'Place of Supply',
    `${inv.placeOfSupply || '-'} ${inv.placeOfSupplyCode ? `(${inv.placeOfSupplyCode})` : ''}`,
    PAGE_MARGIN, second, col);
  labelValue(doc, 'Payment', (order.paymentMethod || '').toUpperCase(),
    PAGE_MARGIN + col, second, col);
  labelValue(doc, 'Status', (order.paymentStatus || '').toUpperCase(),
    PAGE_MARGIN + col * 2, second, col);

  return second + 40;
};

const drawAddress = (doc, order, y) => {
  hr(doc, y);
  const top = y + 12;
  const a = order.shippingAddress || {};

  doc.fontSize(8).fillColor('#666666').font('Helvetica')
    .text('BILL TO / SHIP TO', PAGE_MARGIN, top);

  doc.fontSize(10).fillColor('#111111').font('Helvetica-Bold')
    .text(a.fullName || '-', PAGE_MARGIN, top + 12);

  doc.fontSize(9).fillColor('#444444').font('Helvetica');
  const lines = [
    a.line1, a.line2,
    [a.city, a.state, a.pincode].filter(Boolean).join(', '),
    a.phone ? `Phone: ${a.phone}` : null,
  ].filter(Boolean);
  lines.forEach((l) => doc.text(l, { width: 300 }));

  return doc.y + 14;
};

// Column geometry shared by the header row and the body rows, so they can
// never drift apart.
const COLS = [
  { key: 'name', label: 'Description', width: 210, align: 'left' },
  { key: 'hsn', label: 'HSN', width: 55, align: 'left' },
  { key: 'qty', label: 'Qty', width: 40, align: 'right' },
  { key: 'rate', label: 'Rate', width: 85, align: 'right' },
  { key: 'amount', label: 'Amount', width: 105, align: 'right' },
];

const drawItems = (doc, order, y) => {
  let cursor = y;

  const headerRow = () => {
    doc.rect(PAGE_MARGIN, cursor, doc.page.width - PAGE_MARGIN * 2, 20)
      .fillColor('#f2f4f7').fill();
    let x = PAGE_MARGIN + 6;
    doc.fontSize(8).fillColor('#333333').font('Helvetica-Bold');
    COLS.forEach((c) => {
      doc.text(c.label.toUpperCase(), x, cursor + 6, { width: c.width - 12, align: c.align });
      x += c.width;
    });
    cursor += 26;
  };

  headerRow();

  (order.items || []).forEach((item) => {
    // Start a new page before a row would overflow, and repeat the header
    // so a multi-page invoice stays readable.
    if (cursor > doc.page.height - 160) {
      doc.addPage();
      cursor = PAGE_MARGIN;
      headerRow();
    }

    const amount = (item.price || 0) * (item.quantity || 0);
    const values = {
      name: item.variant ? `${item.name} (${item.variant})` : item.name,
      hsn: item.hsn || '-',
      qty: String(item.quantity || 0),
      rate: money(item.price),
      amount: money(amount),
    };

    let x = PAGE_MARGIN + 6;
    doc.fontSize(9).fillColor('#111111').font('Helvetica');
    const rowTop = cursor;
    let rowHeight = 0;
    COLS.forEach((c) => {
      doc.text(values[c.key], x, rowTop, { width: c.width - 12, align: c.align });
      rowHeight = Math.max(rowHeight, doc.y - rowTop);
      x += c.width;
    });

    cursor = rowTop + Math.max(rowHeight, 14) + 6;
    hr(doc, cursor - 3);
  });

  return cursor + 6;
};

const drawTotals = (doc, order, inv, y) => {
  const boxWidth = 240;
  const x = doc.page.width - PAGE_MARGIN - boxWidth;
  let cursor = y;

  const row = (label, value, bold = false) => {
    doc.fontSize(bold ? 11 : 9)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(bold ? '#111111' : '#444444');
    doc.text(label, x, cursor, { width: boxWidth - 100, align: 'left' });
    doc.text(value, x + boxWidth - 100, cursor, { width: 100, align: 'right' });
    cursor += bold ? 18 : 15;
  };

  row('Taxable Value', money(order.taxableValue ?? order.subtotal));
  if (order.discount) row('Discount', `- ${money(order.discount)}`);
  if (order.shippingCost) row('Shipping', money(order.shippingCost));

  // The legal requirement: CGST and SGST are distinct heads and must never
  // be collapsed into one "tax" line.
  const ratePct = ((order.taxRate ?? 0) * 100).toFixed(0);
  if (inv.taxType === 'cgst_sgst') {
    row(`CGST (${(ratePct / 2).toFixed(1)}%)`, money(inv.cgst));
    row(`SGST (${(ratePct / 2).toFixed(1)}%)`, money(inv.sgst));
  } else {
    row(`IGST (${ratePct}%)`, money(inv.igst));
  }

  hr(doc, cursor + 2);
  cursor += 10;
  row('Total', money(order.total), true);

  return cursor + 10;
};

const drawFooter = (doc, inv) => {
  const y = doc.page.height - 90;
  hr(doc, y);
  doc.fontSize(8).fillColor('#666666').font('Helvetica')
    .text(
      inv.taxMode === 'inclusive'
        ? 'Prices are inclusive of GST.'
        : 'GST charged in addition to the listed price.',
      PAGE_MARGIN, y + 10, { width: 300 }
    )
    .text('This is a computer-generated invoice and does not require a signature.',
      PAGE_MARGIN, y + 22, { width: 320 });
};

// ─── Entry point ─────────────────────────────────
// Resolves to a Buffer. Rejects if the order carries no issued invoice —
// rendering a "tax invoice" for an order that was never issued one would
// fabricate a statutory document.
const renderInvoicePdf = (order) =>
  new Promise((resolve, reject) => {
    const inv = order.invoice;
    if (!inv?.number) {
      const err = new Error('Order has no issued invoice to render.');
      err.code = 'INVOICE_NOT_ISSUED';
      return reject(err);
    }

    try {
      const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
      const chunks = [];

      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      let y = drawHeader(doc, inv);
      y = drawMeta(doc, order, inv, y);
      y = drawAddress(doc, order, y);
      y = drawItems(doc, order, y);
      drawTotals(doc, order, { ...inv, taxMode: order.taxMode }, y);
      drawFooter(doc, { ...inv, taxMode: order.taxMode });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { renderInvoicePdf, money };
