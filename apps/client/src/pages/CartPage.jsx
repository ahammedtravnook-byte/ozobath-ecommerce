import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowRight, FiTag, FiTruck, FiShield, FiPercent } from 'react-icons/fi';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { couponAPI } from '@api/services';
import toast from 'react-hot-toast';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const CartPage = () => {
    const { cart, updateQuantity, removeItem, loading } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [guestCart, setGuestCart] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

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

    const total = subtotal - couponDiscount;

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

    const applyCoupon = async () => {
        if (!couponCode) return;
        try {
            setApplyingCoupon(true);
            const res = await couponAPI.validate({ code: couponCode, orderAmount: subtotal });
            setCouponDiscount(res.data?.discount || 0);
            toast.success(`Coupon applied! ₹${res.data?.discount} off`);
        } catch (e) {
            toast.error(e.message || 'Invalid coupon');
            setCouponDiscount(0);
        } finally { setApplyingCoupon(false); }
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
        <div className="min-h-screen bg-[#FAF7F2] pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900">Shopping Cart</h1>
                    {items.length > 0 && <span className="text-sm text-dark-400 font-medium">{items.length} item{items.length > 1 ? 's' : ''}</span>}
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
                                            className="bg-white rounded-2xl p-4 md:p-5 flex items-center gap-4 md:gap-6 border border-dark-100/30 hover:shadow-lg transition-shadow duration-300"
                                        >
                                            <Link to={`/product/${prod.slug}`} className="shrink-0">
                                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-dark-50 flex items-center justify-center overflow-hidden">
                                                    <img src={prod.images?.[0]?.url || '/images/product_shower_1.png'} alt={prod.name} className="w-[80%] h-[80%] object-contain" />
                                                </div>
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <Link to={`/product/${prod.slug}`}>
                                                    <h3 className="text-sm md:text-base font-bold text-dark-900 hover:text-accent-500 transition-colors truncate">{prod.name}</h3>
                                                </Link>
                                                {item.variant && <p className="text-xs text-dark-400 mt-0.5 font-medium">Variant: {item.variant}</p>}
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-lg font-extrabold text-dark-900">₹{prod.price?.toLocaleString()}</span>
                                                    {prod.mrp > prod.price && <span className="text-xs text-dark-300 line-through">₹{prod.mrp?.toLocaleString()}</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center bg-dark-50 rounded-xl overflow-hidden">
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

                                            <p className="text-lg font-extrabold text-dark-900 hidden md:block min-w-[90px] text-right">
                                                ₹{(prod.price * item.quantity)?.toLocaleString()}
                                            </p>

                                            <button
                                                onClick={() => isAuthenticated ? removeItem(item._id) : removeGuestItem(idx)}
                                                className="p-2 text-dark-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <motion.div
                                className="bg-white rounded-3xl p-6 md:p-8 border border-dark-100/30 sticky top-28"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-lg font-display font-bold text-dark-900 mb-6">Order Summary</h2>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between"><span className="text-dark-400 font-medium">Subtotal ({items.length} items)</span><span className="font-bold text-dark-900">₹{subtotal.toLocaleString()}</span></div>
                                    {totalSavings > 0 && <div className="flex justify-between"><span className="text-dark-400 font-medium">You Save</span><span className="font-bold text-green-600">-₹{totalSavings.toLocaleString()}</span></div>}
                                    <div className="flex justify-between"><span className="text-dark-400 font-medium">Shipping</span><span className="font-bold text-green-600">FREE</span></div>
                                    {couponDiscount > 0 && <div className="flex justify-between"><span className="text-dark-400 font-medium flex items-center gap-1"><FiPercent className="w-3 h-3" /> Coupon</span><span className="font-bold text-green-600">-₹{couponDiscount.toLocaleString()}</span></div>}
                                    <hr className="border-dark-100" />
                                    <div className="flex justify-between text-lg"><span className="font-display font-bold text-dark-900">Total</span><span className="font-display font-extrabold text-dark-900">₹{total.toLocaleString()}</span></div>
                                </div>

                                {/* Coupon */}
                                <div className="mt-6">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                            <input
                                                value={couponCode}
                                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="Coupon code"
                                                className="w-full pl-10 pr-4 py-3 bg-dark-50 border-0 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all uppercase"
                                            />
                                        </div>
                                        <button
                                            onClick={applyCoupon}
                                            disabled={applyingCoupon}
                                            className="px-5 py-3 bg-dark-900 text-white text-xs font-bold rounded-xl hover:bg-accent-500 transition-colors uppercase tracking-wider disabled:opacity-50"
                                        >
                                            {applyingCoupon ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="w-full mt-6 bg-accent-500 hover:bg-accent-600 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40"
                                >
                                    {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                                    <FiArrowRight />
                                </button>

                                <Link to="/shop" className="block text-center text-sm text-accent-500 hover:text-accent-600 font-semibold mt-4 transition-colors">
                                    ← Continue Shopping
                                </Link>

                                {/* Trust */}
                                <div className="mt-6 pt-6 border-t border-dark-100 flex items-center justify-center gap-6 text-dark-300">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <FiTruck className="w-4 h-4" /> Free Ship
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                                        <FiShield className="w-4 h-4" /> Secure
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
