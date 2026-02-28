import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { couponAPI } from '@api/services';
import toast from 'react-hot-toast';

const CartPage = () => {
    const { cart, updateQuantity, removeItem, loading } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [guestCart, setGuestCart] = useState([]);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Load guest cart from localStorage
    useEffect(() => {
        if (!isAuthenticated) {
            const stored = JSON.parse(localStorage.getItem('guestCart') || '[]');
            setGuestCart(stored);
        }
    }, [isAuthenticated]);

    const items = isAuthenticated ? (cart?.items || []) : guestCart;

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const price = isAuthenticated
                ? (item.product?.price || 0) * item.quantity
                : (item.product?.price || 0) * item.quantity;
            return sum + price;
        }, 0);
    }, [items, isAuthenticated]);

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
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/login?redirect=/checkout');
        } else {
            navigate('/checkout');
        }
    };

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <h1 className="text-3xl font-display font-bold text-dark-900 mb-8">Shopping Cart</h1>

                {items.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-2">Your cart is empty</h2>
                        <p className="text-gray-400 mb-6">Add some premium products to get started</p>
                        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {items.map((item, idx) => {
                                const prod = item.product || {};
                                return (
                                    <div key={item._id || idx} className="bg-white rounded-xl p-4 md:p-6 shadow-sm flex items-center gap-4 md:gap-6">
                                        <Link to={`/product/${prod.slug}`}>
                                            <img src={prod.images?.[0]?.url || '/placeholder.jpg'} alt={prod.name} className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover bg-gray-100" />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/product/${prod.slug}`}>
                                                <h3 className="text-sm md:text-base font-semibold text-dark-900 hover:text-primary-600 transition-colors truncate">{prod.name}</h3>
                                            </Link>
                                            {item.variant && <p className="text-xs text-gray-400 mt-0.5">Variant: {item.variant}</p>}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-lg font-bold text-dark-900">₹{prod.price?.toLocaleString()}</span>
                                                {prod.mrp > prod.price && <span className="text-sm text-gray-400 line-through">₹{prod.mrp?.toLocaleString()}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                            <button onClick={() => isAuthenticated ? updateQuantity(item._id, item.quantity - 1) : updateGuestQuantity(idx, item.quantity - 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50">−</button>
                                            <span className="px-3 py-2 font-semibold text-sm min-w-[36px] text-center">{item.quantity}</span>
                                            <button onClick={() => isAuthenticated ? updateQuantity(item._id, item.quantity + 1) : updateGuestQuantity(idx, item.quantity + 1)} className="px-3 py-2 text-gray-500 hover:bg-gray-50">+</button>
                                        </div>
                                        <p className="text-lg font-bold text-dark-900 hidden md:block min-w-[80px] text-right">₹{(prod.price * item.quantity)?.toLocaleString()}</p>
                                        <button onClick={() => isAuthenticated ? removeItem(item._id) : removeGuestItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                                <h2 className="text-lg font-bold text-dark-900 mb-4">Order Summary</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal ({items.length} items)</span><span className="font-medium">₹{subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="text-green-600 font-medium">FREE</span></div>
                                    {couponDiscount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Coupon Discount</span><span className="text-green-600 font-medium">-₹{couponDiscount.toLocaleString()}</span></div>}
                                    <hr className="border-gray-100" />
                                    <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
                                </div>

                                {/* Coupon */}
                                <div className="mt-4">
                                    <div className="flex gap-2">
                                        <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                        <button onClick={applyCoupon} disabled={applyingCoupon} className="px-4 py-2.5 bg-dark-900 text-white text-sm font-semibold rounded-lg hover:bg-dark-800">{applyingCoupon ? '...' : 'Apply'}</button>
                                    </div>
                                </div>

                                <button onClick={handleCheckout} className="btn-primary w-full mt-6 text-lg">
                                    {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                                </button>

                                <Link to="/shop" className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium mt-4">← Continue Shopping</Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
