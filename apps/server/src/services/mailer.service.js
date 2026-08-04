// ============================================
// OZOBATH - Outbound Email
// ============================================
// nodemailer was a declared dependency and SMTP was configured, but nothing
// in the codebase sent mail. This is the first sender.
//
// Two rules:
//
//   1. Sending is NEVER fatal to the caller. Email is a notification about
//      something that already happened — a paid order, an issued invoice.
//      An SMTP outage must not roll back a payment.
//
//   2. The transport is built lazily and reused. Building it per-send opens
//      a new TCP+TLS connection each time, which Gmail rate-limits.

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const isConfigured = () =>
  Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const getTransport = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 is implicit TLS; 587 upgrades via STARTTLS. Deriving this from the
    // port avoids a misconfiguration that fails with an opaque timeout.
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  return transporter;
};

// Resolves { sent: boolean, error?: string } — never rejects.
const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!isConfigured()) {
    console.warn('[mail] Skipped: SMTP is not configured.');
    return { sent: false, error: 'SMTP not configured' };
  }
  if (!to) {
    console.warn('[mail] Skipped: no recipient.');
    return { sent: false, error: 'No recipient' };
  }

  try {
    await getTransport().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
      attachments,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[mail] Send failed to ${to}: ${err.message}`);
    return { sent: false, error: err.message };
  }
};

// ─── Invoice email ───────────────────────────────

const rupees = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

const invoiceHtml = (order) => {
  const inv = order.invoice || {};
  const rows = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}${i.variant ? ` (${i.variant})` : ''}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${rupees(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('');

  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#111">
    <h2 style="color:#0A3D6B;margin-bottom:4px">Thank you for your order</h2>
    <p style="color:#555;margin-top:0">Order <strong>${order.orderNumber}</strong> is confirmed.</p>

    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead>
        <tr style="text-align:left;color:#666;font-size:12px">
          <th style="padding-bottom:6px">ITEM</th>
          <th style="padding-bottom:6px;text-align:right">QTY</th>
          <th style="padding-bottom:6px;text-align:right">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="font-size:16px"><strong>Total paid: ${rupees(order.total)}</strong></p>

    ${inv.number
      ? `<p style="color:#555;font-size:13px">Your tax invoice <strong>${inv.number}</strong> is attached as a PDF.</p>`
      : ''}

    <p style="color:#888;font-size:12px;margin-top:28px">
      ${inv.sellerLegalName || 'OZOBATH'}${inv.sellerGstin ? ` &middot; GSTIN ${inv.sellerGstin}` : ''}
    </p>
  </div>`;
};

// `pdfBuffer` is optional: an order may be confirmed before an invoice can be
// issued (see invoice.service), and the customer should still get their
// confirmation.
const sendInvoiceEmail = async (order, user, pdfBuffer) => {
  const inv = order.invoice || {};
  const to = user?.email || order.shippingAddress?.email;

  const attachments = pdfBuffer
    ? [{
        filename: `${(inv.number || order.orderNumber).replace(/\//g, '-')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }]
    : [];

  return sendMail({
    to,
    subject: inv.number
      ? `Your invoice ${inv.number} — order ${order.orderNumber}`
      : `Order ${order.orderNumber} confirmed`,
    html: invoiceHtml(order),
    text: `Order ${order.orderNumber} confirmed. Total paid ${rupees(order.total)}.`,
    attachments,
  });
};

module.exports = { sendMail, sendInvoiceEmail, isConfigured };
