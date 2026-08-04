// ============================================
// OZOBATH - Cart Controller
// ============================================
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { parseQuantity, quantityErrorMessage } = require('../utils/validateQuantity');

const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name slug price mrp images stock isActive freeDelivery deliveryCharge');
  if (!cart) cart = { items: [], totalAmount: 0 };
  sendResponse(res, 200, cart, 'Cart fetched');
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, variant } = req.body;

  // Validate before the stock check: `product.stock < quantity` is a
  // magnitude comparison, so a negative or non-numeric quantity passes it.
  const quantity = parseQuantity(req.body.quantity ?? 1);
  if (quantity === null) throw new ApiError(400, quantityErrorMessage());

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found.');
  if (product.stock < quantity) throw new ApiError(400, `Only ${product.stock} items in stock.`);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.variant === variant
  );

  if (existingIndex > -1) {
    // The resulting total is what gets charged, so validate that — not just
    // the delta. Adding to an existing line must also respect stock, which
    // the per-request check above cannot see.
    const newQuantity = parseQuantity(cart.items[existingIndex].quantity + quantity);
    if (newQuantity === null) throw new ApiError(400, quantityErrorMessage());
    if (product.stock < newQuantity) throw new ApiError(400, `Only ${product.stock} items in stock.`);

    cart.items[existingIndex].quantity = newQuantity;
    cart.items[existingIndex].price = product.price;
  } else {
    cart.items.push({ product: productId, quantity, variant, price: product.price });
  }

  cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  await cart.save();

  cart = await Cart.findById(cart._id).populate('items.product', 'name slug price mrp images stock isActive freeDelivery deliveryCharge');
  sendResponse(res, 200, cart, 'Item added to cart');
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.body;

  // `quantity < 1` is false for fractions (2.7), NaN and Infinity, all of
  // which reached the cart. parseQuantity rejects them.
  const quantity = parseQuantity(req.body.quantity);
  if (quantity === null) throw new ApiError(400, quantityErrorMessage());

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found.');

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  const product = await Product.findById(item.product);
  if (product && product.stock < quantity) throw new ApiError(400, `Only ${product.stock} items in stock.`);

  item.quantity = quantity;
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await cart.save();

  const populated = await Cart.findById(cart._id).populate('items.product', 'name slug price mrp images stock isActive freeDelivery deliveryCharge');
  sendResponse(res, 200, populated, 'Cart updated');
});

const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found.');

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await cart.save();

  const populated = await Cart.findById(cart._id).populate('items.product', 'name slug price mrp images stock isActive freeDelivery deliveryCharge');
  sendResponse(res, 200, populated, 'Item removed from cart');
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });
  sendResponse(res, 200, null, 'Cart cleared');
});

// ─── Merge Guest Cart ────────────────────────────
// Called after login when user had items in localStorage
const mergeGuestCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ productId, quantity, variant }]
  if (!items || !Array.isArray(items) || items.length === 0) {
    return sendResponse(res, 200, null, 'No items to merge');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const { isValidObjectId } = require('mongoose');

  for (const guestItem of items) {
    // Skip items with invalid MongoDB ObjectIds (e.g. guest demo items)
    if (!isValidObjectId(guestItem.productId)) continue;
    const product = await Product.findById(guestItem.productId);
    if (!product || !product.isActive) continue;

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === guestItem.productId && item.variant === guestItem.variant
    );

    // A guest cart is untrusted localStorage: skip malformed lines rather
    // than failing the whole merge, matching how invalid product ids are
    // handled above. Math.min alone let fractions through (0.5 stayed 0.5).
    const requested = parseQuantity(guestItem.quantity ?? 1);
    if (requested === null) continue;

    const qty = Math.min(requested, product.stock);
    if (qty < 1) continue;

    if (existingIndex > -1) {
      const merged = Math.min(cart.items[existingIndex].quantity + qty, product.stock);
      const newQuantity = parseQuantity(merged);
      if (newQuantity === null) continue;
      cart.items[existingIndex].quantity = newQuantity;
      cart.items[existingIndex].price = product.price;
    } else {
      cart.items.push({ product: guestItem.productId, quantity: qty, variant: guestItem.variant, price: product.price });
    }
  }

  cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  await cart.save();

  cart = await Cart.findById(cart._id).populate('items.product', 'name slug price mrp images stock isActive freeDelivery deliveryCharge');
  sendResponse(res, 200, cart, 'Guest cart merged');
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeGuestCart };

