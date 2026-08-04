import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiTruck, FiShield, FiTag } from 'react-icons/fi';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';
import SEO from '@components/SEO';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const CartPage = () => {
    const { cart, updateQuantity, removeItem, loading } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [guestCart, setGuestCart] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) {
            const stored = JSON.parse(localStorage.getItem('guestCart') || '[]');
            setGuestCart(stored);
        }
    }, [isAuthenticated]);

    const items = isAuthenticated ? (cart?.items || []) : guestCart;

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
    }, [items]);

    const totalSavings = useMemo(() => {
        return items.reduce((sum, item) => {
            const mrp = item.product?.mrp || item.product?.price || 0;
            return sum + ((mrp - (item.product?.price || 0)) * item.quantity);
        }, 0);
    }, [items]);

    const total = subtotal;

    const updateGuestQuantity = (idx, qty) => {
        if (qty < 1) return;
        const updated = [...guestCart];
        updated[idx].quantity = qty;
        setGuestCart(updated);
        localStorage.setItem('guestCart', JSON.stringify(updated));
    };

    const removeGuestItem = (idx) => {
        const updated = guestCart.filter((_, i) => i !== idx);
        setGuestCart(updated);
        localStorage.setItem('guestCart', JSON.stringify(updated));
        toast.success('Item removed');
    };

    const handleCheckout = () => {
        if (!isAuthenticated) navigate('/login?redirect=/checkout');
        else navigate('/checkout');
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-dark-50/30 pt-20 sm:pt-28 pb-16 sm:pb-20">
            <SEO
                title="Your Cart"
                noindex
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900">Shopping Cart</h1>
                        {items.length > 0 && <p className="text-sm text-dark-400 font-medium mt-1">{items.length} item{items.length > 1 ? 's' : ''} in your cart</p>}
                    </div>
                    <Link to="/shop" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-accent-600 hover:text-accent-700 transition-colors">
                        ← Continue Shopping
                    </Link>
                </motion.div>

                {/* Step Progress Indicator */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center gap-2 md:gap-3 mb-10"
                >
                    {[
                        { step: 1, label: 'Cart', active: true, done: false },
                        { step: 2, label: 'Checkout', active: false, done: false },
                        { step: 3, label: 'Confirm', active: false, done: false },
                    ].map((s, i) => (
                        <div key={s.step} className="flex items-center gap-2 md:gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s.active ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25 ring-4 ring-accent-500/15' : 'bg-dark-100 text-dark-400'}`}>
                                    {s.step}
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${s.active ? 'text-dark-900' : 'text-dark-300'}`}>{s.label}</span>
                            </div>
                            {i < 2 && <div className={`w-6 sm:w-10 md:w-20 h-0.5 rounded-full ${i === 0 ? 'bg-dark-200' : 'bg-dark-100'}`} />}
                        </div>
                    ))}
                </motion.div>

                {items.length === 0 ? (
                    <motion.div
                        className="text-center py-24"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="w-24 h-24 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiShoppingBag className="w-10 h-10 text-dark-300" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Your cart is empty</h2>
                        <p className="text-dark-400 mb-8 max-w-sm mx-auto">Explore our premium collection and add some products to your cart</p>
                        <Link to="/shop" className="inline-flex items-center gap-3 bg-dark-900 hover:bg-accent-500 text-white px-8 py-4 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-lg">
                            EXPLORE PRODUCTS <FiArrowRight />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <AnimatePresence mode="popLayout">
                                {items.map((item, idx) => {
                                    const prod = item.product || {};
                                    return (
                                        <motion.div
                                            key={item._id || idx}
                                            layout
                                            variants={fadeInUp}
                                            initial="hidden"
                                            animate="visible"
                                            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                                            className="bg-white rounded-2xl p-4 md:p-5 flex items-center gap-4 md:gap-5 border border-dark-100/40 hover:shadow-md hover:border-accent-200/50 transition-all duration-300"
                                        >
                                            <Link to={`/product/${prod.slug}`} className="shrink-0">
                                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-dark-50 flex items-center justify-center overflow-hidden border border-dark-100/30 group-hover:border-accent-200 transition-colors">
                                                    <img src={prod.images?.[0]?.url || '/images/product_shower_1.png'} alt={prod.name} className="w-[82%] h-[82%] object-contain hover:scale-105 transition-transform duration-300" />
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/product/${prod.slug}`}>
                                                    <h3 className="text-sm md:text-base font-bold text-dark-900 hover:text-accent-600 transition-colors line-clamp-2">{prod.name}</h3>
                                                </Link>
                                                {item.variant && <p className="text-xs text-dark-400 mt-0.5 font-medium bg-dark-50 inline-block px-2 py-0.5 rounded-lg">Variant: {item.variant}</p>}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-base md:text-lg font-extrabold text-dark-900">₹{prod.price?.toLocaleString('en-IN')}</span>
                                                    {prod.mrp > prod.price && (
                                                        <>
                                                            <span className="text-xs text-dark-300 line-through">₹{prod.mrp?.toLocaleString('en-IN')}</span>
                                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">
                                                                {Math.round(((prod.mrp - prod.price) / prod.mrp) * 100)}% OFF
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Mobile total */}
                                                <p className="text-sm font-bold text-accent-600 mt-1 md:hidden">Total: ₹{((prod.price || 0) * item.quantity).toLocaleString('en-IN')}</p>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <div className="flex items-center bg-dark-50 rounded-xl border border-dark-100/40 overflow-hidden">
                                                    <button
                                                        onClick={() => isAuthenticated ? updateQuantity(item._id, item.quantity - 1) : updateGuestQuantity(idx, item.quantity - 1)}
                                                        className="p-2.5 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors"
                                                    >
                                                        <FiMinus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="px-3 py-2 font-bold text-sm text-dark-900 min-w-[36px] text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => isAuthenticated ? updateQuantity(item._id, item.quantity + 1) : updateGuestQuantity(idx, item.quantity + 1)}
                                                        className="p-2.5 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors"
                                                    >
                                                        <FiPlus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-base font-extrabold text-dark-900 hidden md:block">
                                                    ₹{((prod.price || 0) * item.quantity).toLocaleString('en-IN')}
                                                </p>
                                                <button
                                                    onClick={() => isAuthenticated ? removeItem(item._id) : removeGuestItem(idx)}
                                                    className="p-1.5 text-dark-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <motion.div
                                className="bg-white rounded-3xl border border-dark-100/40 sticky top-28 overflow-hidden shadow-sm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {/* Summary header with gradient */}
                                <div className="bg-gradient-to-br from-primary-900 to-primary-700 px-6 pt-6 pb-5">
                                    <h2 className="text-base font-display font-bold text-white mb-4">Order Summary</h2>
                                    <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between text-white/80">
                                            <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                                            <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        {totalSavings > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-white/80">You Save</span>
                                                <span className="font-bold text-accent-300">-₹{totalSavings.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-white/80">Shipping</span>
                                            <span className="font-bold text-accent-300">FREE</span>
                                        </div>
                                        <div className="border-t border-white/20 pt-2.5 flex justify-between items-center">
                                            <span className="font-display font-bold text-white text-base">Total</span>
                                            <span className="font-display font-extrabold text-white text-xl">₹{total.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Coupon hint */}
                                    <div className="flex items-center gap-2 text-xs text-accent-600 font-semibold bg-accent-50 border border-accent-100 rounded-xl px-3 py-2.5">
                                        <FiTag className="w-3.5 h-3.5 shrink-0" />
                                        Have a coupon? Apply it at checkout
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        className="w-full bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/30 active:scale-[0.98]"
                                    >
                                        {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                                        <FiArrowRight />
                                    </button>

                                    {/* Trust badges */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-100">
                                        <div className="flex items-center gap-2 text-dark-400 text-[11px] font-semibold">
                                            <FiTruck className="w-4 h-4 text-accent-500 shrink-0" /> Free Delivery
                                        </div>
                                        <div className="flex items-center gap-2 text-dark-400 text-[11px] font-semibold">
                                            <FiShield className="w-4 h-4 text-accent-500 shrink-0" /> Secure Pay
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
