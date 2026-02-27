// ============================================
// OZOBATH - Cart Controller
// ============================================
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/apiError');
const { sendResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name slug price images stock isActive');
  if (!cart) cart = { items: [], totalAmount: 0 };
  sendResponse(res, 200, cart, 'Cart fetched');
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found.');
  if (product.stock < quantity) throw new ApiError(400, `Only ${product.stock} items in stock.`);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.variant === variant
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += quantity;
    cart.items[existingIndex].price = product.price;
  } else {
    cart.items.push({ product: productId, quantity, variant, price: product.price });
  }

  cart.totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  await cart.save();

  cart = await Cart.findById(cart._id).populate('items.product', 'name slug price images stock');
  sendResponse(res, 200, cart, 'Item added to cart');
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId, quantity } = req.body;
  if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1.');

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found.');

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  const product = await Product.findById(item.product);
  if (product && product.stock < quantity) throw new ApiError(400, `Only ${product.stock} items in stock.`);

  item.quantity = quantity;
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await cart.save();

  sendResponse(res, 200, cart, 'Cart updated');
});

const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found.');

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  await cart.save();

  sendResponse(res, 200, cart, 'Item removed from cart');
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });
  sendResponse(res, 200, null, 'Cart cleared');
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
