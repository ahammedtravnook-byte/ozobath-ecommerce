// ============================================
// OZOBATH - Order Status State Machine
// ============================================
// One definition of which order status transitions are legal.
//
// Before this existed, `updateOrderStatus` assigned `req.body.status`
// directly: any status from any state. That allowed an unpaid order to be
// shipped, a refunded order to be returned to `delivered` (erasing the
// refund from its apparent state), and `pending -> confirmed` to set
// `paymentStatus: 'paid'` with no payment of any kind.
//
// The model enum constrains the VALUE. This constrains the SEQUENCE.

const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped',
  'delivered', 'cancelled', 'returned',
];

// Allowed next states, keyed by current state.
//
// Shape of the happy path:
//   pending -> confirmed -> processing -> shipped -> delivered
//
// `cancelled` is reachable only before the goods are in a courier's hands —
// cancelling a shipped order is a `returned`, which is a different business
// event with different money implications.
//
// `delivered` and `cancelled` are terminal apart from `delivered -> returned`.
// Nothing leaves `returned`: it is the end of the line.
const TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'returned'],
  delivered:  ['returned'],
  cancelled:  [],
  returned:   [],
};

const isValidStatus = (status) => ORDER_STATUSES.includes(status);

const canTransition = (from, to) => {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  return TRANSITIONS[from].includes(to);
};

// Human-readable reason, for the 400 body. Distinguishes "that isn't a
// status" from "that isn't reachable from here", and names what IS reachable
// so an operator can act on the message.
const explainTransition = (from, to) => {
  if (!isValidStatus(to)) {
    return `"${to}" is not a valid order status. Valid: ${ORDER_STATUSES.join(', ')}.`;
  }
  const allowed = TRANSITIONS[from] || [];
  if (allowed.length === 0) {
    return `Order is "${from}", which is a terminal status. It cannot be changed.`;
  }
  return `Cannot move an order from "${from}" to "${to}". Allowed from "${from}": ${allowed.join(', ')}.`;
};

module.exports = {
  ORDER_STATUSES,
  TRANSITIONS,
  isValidStatus,
  canTransition,
  explainTransition,
};
