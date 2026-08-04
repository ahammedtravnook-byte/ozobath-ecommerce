import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { orderAPI, paymentAPI, couponAPI, couponAutoAPI, addressAPI } from '@api/services';
import { calculateTotals, TAX_RATE, FREE_SHIPPING_THRESHOLD } from '@utils/calculateTotals';
import PhoneInput, { isValidPhone } from '@components/ui/PhoneInput';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '@components/SEO';

const CheckoutPage = () => {
    const { cart, clearCart } = useCart();
    const { user, isAuthenticated, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type, value, discount }
    const [couponLoading, setCouponLoading] = useState(false);
    const [autoApplyLoading, setAutoApplyLoading] = useState(false);
    const [suggestedCoupon, setSuggestedCoupon] = useState(null);

    const [address, setAddress] = useState({
        fullName: user?.name || '', phone: user?.phone || '',
        line1: '', line2: '', city: '', state: '', pincode: '', country: 'India',
    });
    const [saveAddress, setSaveAddress] = useState(true); // Auto-save address checkbox

    // Helper: save address to user's address book (non-blocking)
    const trySaveAddress = async (addr) => {
        try {
            // Check if this address already exists (same line1 + pincode)
            const existing = user?.addresses?.find(a => a.line1 === addr.line1 && a.pincode === addr.pincode);
            if (!existing) {
                await addressAPI.add({
                    label: 'Home',
                    fullName: addr.fullName,
                    phone: addr.phone,
                    line1: addr.line1,
                    line2: addr.line2,
                    city: addr.city,
                    state: addr.state,
                    pincode: addr.pincode,
                    isDefault: !user?.addresses?.length, // default if first address
                });
                refreshProfile(); // update context so profile page sees it
            }
        } catch (e) {
            // Non-blocking — don't break checkout flow
        }
    };

    const items = cart?.items || [];
    // Display only — the server recomputes with the same rules and its value wins.
    const { subtotal, shippingCost: shipping, tax, discount, total, taxIncluded } =
        calculateTotals(items, appliedCoupon?.discount || 0);
    const gstLabel = `${(TAX_RATE * 100).toFixed(TAX_RATE * 100 % 1 === 0 ? 0 : 2)}%`;

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login?redirect=/checkout'); return; }
        if (items.length === 0) { navigate('/cart'); return; }
        if (user?.addresses?.length > 0) {
            const addr = user.addresses[0];
            setAddress(prev => ({ ...prev, ...addr, fullName: prev.fullName || addr.fullName || user.name }));
        }
    }, [isAuthenticated, items.length, navigate, user]);

    // Re-validate coupon if subtotal changes (items removed)
    useEffect(() => {
        if (appliedCoupon) setAppliedCoupon(null);
        setCouponInput('');
    }, [subtotal]);

    // Auto-suggest best coupon
    useEffect(() => {
        if (subtotal <= 0 || appliedCoupon) { setSuggestedCoupon(null); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await couponAutoAPI.autoApply(subtotal);
                setSuggestedCoupon(res.data || null);
            } catch { setSuggestedCoupon(null); }
        }, 800);
        return () => clearTimeout(timer);
    }, [subtotal, appliedCoupon]);

    const validateAddress = () => {
        if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
            toast.error('Please fill all address fields');
            setStep(1);
            return false;
        }
        // Validated against the selected country's length rather than a
        // hardcoded 10 — the old check rejected any number carrying a
        // country code, including ones we now store.
        if (!isValidPhone(address.phone)) {
            toast.error('Please enter a valid phone number');
            setStep(1);
            return false;
        }
        if (!/^\d{6}$/.test(address.pincode)) {
            toast.error('Please enter a valid 6-digit pincode');
            setStep(1);
            return false;
        }
        return true;
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        try {
            setCouponLoading(true);
            const res = await couponAPI.validate({ code: couponInput.trim(), orderAmount: subtotal });
            const coupon = res.data;
            setAppliedCoupon(coupon);
            toast.success(`Coupon applied! You save ₹${coupon.discount}`);
        } catch (e) {
            setAppliedCoupon(null);
            toast.error(e.response?.data?.message || 'Invalid coupon code');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        toast.success('Coupon removed');
    };

    const handleAutoApply = async () => {
        if (!suggestedCoupon) return;
        try {
            setAutoApplyLoading(true);
            const res = await couponAPI.validate({ code: suggestedCoupon.code, orderAmount: subtotal });
            setAppliedCoupon(res.data);
            setSuggestedCoupon(null);
            toast.success(`Coupon ${res.data.code} auto-applied! You save ₹${res.data.discount}`);
        } catch (e) {
            setSuggestedCoupon(null);
            toast.error(e.response?.data?.message || 'Could not apply coupon');
        } finally {
            setAutoApplyLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!validateAddress()) return;

        setProcessing(true);

        // ── COD: create order immediately ────────────
        if (paymentMethod === 'cod') {
            try {
                const orderRes = await orderAPI.create({
                    shippingAddress: address,
                    paymentMethod: 'cod',
                    couponCode: appliedCoupon?.code || undefined,
                });
                const order = orderRes.data;
                await paymentAPI.cod({ orderId: order._id });
                clearCart();
                if (saveAddress) trySaveAddress(address);
                toast.success('Order placed successfully!');
                navigate(`/order-confirmation/${order._id}`);
            } catch (e) {
                toast.error(e?.message || 'Failed to place order. Please try again.');
                setStep(2);
                setProcessing(false);
            }
            return;
        }

        // ── Razorpay: no DB order until payment succeeds ──
        try {
            // Step 1: Create Razorpay payment order (server computes amount from cart)
            let payRes;
            try {
                // shippingAddress is sent here as well as at confirm: if the
                // browser never returns from the Razorpay modal, the payment
                // webhook builds the order from this snapshot, and without an
                // address that order would not be shippable.
                payRes = await paymentAPI.createOrder({
                    couponCode: appliedCoupon?.code || undefined,
                    shippingAddress: address,
                });
            } catch (e) {
                toast.error(e?.message || 'Payment gateway error. Please try again or use COD.', { duration: 5000 });
                setStep(2);
                setProcessing(false);
                return;
            }

            const razorpayOrder = payRes.data;

            // Step 2: Load Razorpay SDK
            await new Promise((resolve, reject) => {
                if (window.Razorpay) { resolve(); return; }
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load payment SDK'));
                document.body.appendChild(script);
            }).catch(() => {
                throw new Error('Failed to load payment gateway. Check your internet connection.');
            });

            // Step 3: Open Razorpay modal
            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'OzoBath',
                description: 'Premium Bath Solutions',
                // Absolute — the Razorpay modal renders in its own iframe and
                // will not resolve a site-relative path.
                image: `${window.location.origin}/apple-touch-icon.png`,
                order_id: razorpayOrder.orderId,
                handler: async (response) => {
                    // Step 4: Payment succeeded — now create order in DB
                    try {
                        const confirmRes = await paymentAPI.confirm({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            shippingAddress: address,
                            couponCode: appliedCoupon?.code || undefined,
                        });
                        const confirmedOrder = confirmRes.data;
                        clearCart();
                        if (saveAddress) trySaveAddress(address);
                        toast.success('Payment successful! Order confirmed.');
                        navigate(`/order-confirmation/${confirmedOrder.orderId}`);
                    } catch (e) {
                        toast.error('Payment received but order creation failed. Please contact support with your payment ID: ' + response.razorpay_payment_id, { duration: 8000 });
                        setStep(2);
                        setProcessing(false);
                    }
                },
                prefill: { name: address.fullName, email: user?.email, contact: address.phone },
                theme: { color: '#0A3D6B' },
                modal: {
                    ondismiss: () => {
                        // Cart is untouched — no DB order was created
                        setStep(2);
                        setProcessing(false);
                        toast('Payment cancelled. Your cart is intact.', { icon: 'ℹ️', duration: 3000 });
                    },
                    confirm_close: true,
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                // Cart is untouched — no DB order was created
                toast.error(`Payment failed: ${response.error.description}`);
                setStep(2);
                setProcessing(false);
            });
            rzp.open();

        } catch (e) {
            toast.error(e?.message || 'Checkout failed. Please try again.');
            setStep(2);
            setProcessing(false);
        }
    };

    const stepVariants = {
        hidden: { opacity: 0, x: 30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F5F9FF] to-white">
            <SEO
                title="Checkout"
                noindex
            />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <motion.h1
                    className="text-3xl font-display font-bold text-dark-900 mb-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    Checkout
                </motion.h1>

                {/* Steps */}
                <div className="flex items-center gap-1 sm:gap-2 mb-8 flex-wrap">
                    {['Shipping', 'Review', 'Payment'].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <motion.div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300
                                    ${step > i + 1 ? 'bg-green-500 text-white shadow-sm shadow-green-500/20' :
                                        step === i + 1 ? 'bg-gradient-to-br from-primary-700 to-accent-500 text-white shadow-md shadow-primary-600/20' :
                                            'bg-dark-50 text-dark-300'}`}
                                whileTap={{ scale: 0.95 }}
                            >
                                {step > i + 1 ? '✓' : i + 1}
                            </motion.div>
                            <span className={`text-xs sm:text-sm font-semibold ${step >= i + 1 ? 'text-dark-900' : 'text-dark-300'}`}>{s}</span>
                            {i < 2 && <div className={`w-6 sm:w-12 h-0.5 rounded-full transition-all duration-500 ${step > i + 1 ? 'bg-green-500' : 'bg-dark-100'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Address */}
                            {step === 1 && (
                                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10">
                                    <h2 className="text-lg font-bold text-dark-900 mb-5">Shipping Address</h2>

                                    {/* Saved addresses */}
                                    {user?.addresses?.length > 0 && (
                                        <div className="mb-5">
                                            <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-2">Saved Addresses</p>
                                            <div className="space-y-2">
                                                {user.addresses.map((addr) => (
                                                    <button
                                                        key={addr._id}
                                                        type="button"
                                                        onClick={() => setAddress({
                                                            fullName: addr.fullName || user.name,
                                                            phone: addr.phone || user.phone || '',
                                                            line1: addr.line1,
                                                            line2: addr.line2 || '',
                                                            city: addr.city,
                                                            state: addr.state,
                                                            pincode: addr.pincode,
                                                            country: 'India',
                                                        })}
                                                        className="w-full text-left p-3 rounded-xl border border-dark-100/40 hover:border-accent-400 hover:bg-accent-50/30 transition-all duration-200"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <span className="text-xs font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-md">{addr.label || 'Home'}</span>
                                                                <p className="text-sm font-semibold text-dark-900 mt-1">{addr.fullName || user.name}</p>
                                                                <p className="text-xs text-dark-500 mt-0.5">{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}, {addr.city}, {addr.state} — {addr.pincode}</p>
                                                            </div>
                                                            <span className="text-xs text-accent-500 font-semibold shrink-0 mt-1">Use →</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-3 my-4">
                                                <div className="flex-1 h-px bg-dark-100/40" />
                                                <span className="text-xs text-dark-400 font-medium">or enter a new address</span>
                                                <div className="flex-1 h-px bg-dark-100/40" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Full Name *</label><input value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} className="form-input-premium" /></div>
                                            <div><label htmlFor="checkout-phone" className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Phone *</label><PhoneInput id="checkout-phone" value={address.phone} onChange={phone => setAddress({ ...address, phone })} /></div>
                                        </div>
                                        <div><label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Address Line 1 *</label><input value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} className="form-input-premium" placeholder="House/Flat, Building, Street" /></div>
                                        <div><label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Address Line 2</label><input value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} className="form-input-premium" placeholder="Area, Colony (Optional)" /></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div><label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">City *</label><input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="form-input-premium" /></div>
                                            <div><label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">State *</label><input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="form-input-premium" /></div>
                                            <div><label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Pincode *</label><input value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} className="form-input-premium" placeholder="6-digit" /></div>
                                        </div>
                                        {/* Save address checkbox */}
                                        <label className="flex items-center gap-2.5 cursor-pointer group mt-2">
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${saveAddress ? 'bg-accent-500 border-accent-500' : 'border-dark-200 group-hover:border-dark-300'}`}>
                                                {saveAddress && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="hidden" />
                                            <span className="text-sm text-dark-600 font-medium">Save this address for future orders</span>
                                        </label>
                                        <button onClick={() => { if (validateAddress()) setStep(2); }} className="btn-primary w-full mt-2">Continue to Review →</button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Review + Payment Method */}
                            {step === 2 && (
                                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10">
                                    <h2 className="text-lg font-bold text-dark-900 mb-5">Review & Choose Payment</h2>
                                    <div className="space-y-3 mb-6">
                                        {items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 py-3 border-b border-dark-50 last:border-0">
                                                <img src={item.product?.images?.[0]?.url || '/placeholder.jpg'} className="w-16 h-16 rounded-xl object-cover bg-dark-50" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-dark-900">{item.product?.name}</p>
                                                    <p className="text-xs text-dark-400">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-bold text-dark-900">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-dark-50/50 rounded-xl p-4 mb-4">
                                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-1">Shipping to</p>
                                        <p className="text-sm text-dark-700">{address.fullName}, {address.line1}{address.line2 ? ', ' + address.line2 : ''}, {address.city}, {address.state} - {address.pincode}</p>
                                        <p className="text-xs text-dark-400 mt-1">{address.phone}</p>
                                    </div>

                                    {/* ── Payment Method Selection ─────── */}
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wider mb-3">Payment Method</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentMethod('razorpay')}
                                                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${paymentMethod === 'razorpay' ? 'border-accent-500 bg-accent-50/50 shadow-sm shadow-accent-500/10' : 'border-dark-100/30 hover:border-dark-200'}`}
                                            >
                                                <p className="text-sm font-bold text-dark-900">Pay Online</p>
                                                <p className="text-[11px] text-dark-400 mt-1">UPI, Card, Net Banking</p>
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('cod')}
                                                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${paymentMethod === 'cod' ? 'border-accent-500 bg-accent-50/50 shadow-sm shadow-accent-500/10' : 'border-dark-100/30 hover:border-dark-200'}`}
                                            >
                                                <p className="text-sm font-bold text-dark-900">Cash on Delivery</p>
                                                <p className="text-[11px] text-dark-400 mt-1">Pay when you receive</p>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                                        <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Edit Address</button>
                                        <button onClick={() => { setStep(3); handlePayment(); }} disabled={processing} className="btn-primary flex-1">
                                            {paymentMethod === 'cod' ? `Place Order ₹${total.toLocaleString()}` : `Pay ₹${total.toLocaleString()} →`}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Processing */}
                            {step === 3 && (
                                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10 text-center py-16">
                                    <motion.div
                                        className="w-16 h-16 border-4 border-accent-200 border-t-accent-500 rounded-full mx-auto mb-4"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <h2 className="text-lg font-bold text-dark-900">
                                        {paymentMethod === 'cod' ? 'Placing Your Order...' : 'Processing Payment...'}
                                    </h2>
                                    <p className="text-sm text-dark-400 mt-2">
                                        {paymentMethod === 'cod' ? 'Confirming your order' : 'Complete payment in the Razorpay window'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div>
                        <motion.div
                            className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10 sticky top-24"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <h3 className="text-lg font-bold text-dark-900 mb-4">Order Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-dark-400">Subtotal ({items.length} items)</span><span className="font-medium">₹{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-dark-400">Shipping</span><span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-medium'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                                {!taxIncluded && (
                                    <div className="flex justify-between"><span className="text-dark-400">GST ({gstLabel})</span><span className="font-medium">₹{tax.toLocaleString()}</span></div>
                                )}
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="font-medium">Discount ({appliedCoupon?.code})</span>
                                        <span className="font-semibold">−₹{discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <hr className="border-dark-50" />
                                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
                                {taxIncluded && tax > 0 && (
                                    <p className="text-xs text-dark-400">Includes ₹{tax.toLocaleString()} GST ({gstLabel})</p>
                                )}
                                {shipping > 0 && subtotal < FREE_SHIPPING_THRESHOLD && <p className="text-xs text-accent-500 font-medium">Add ₹{(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} more for FREE shipping</p>}
                            </div>

                            {/* Coupon Section */}
                            <div className="mt-5 border-t border-dark-50 pt-4">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                                        <div>
                                            <p className="text-xs font-bold text-green-700">{appliedCoupon.code} applied</p>
                                            <p className="text-[11px] text-green-600">You save ₹{appliedCoupon.discount}</p>
                                        </div>
                                        <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-2">Remove</button>
                                    </div>
                                ) : (
                                    <div>
                                        {suggestedCoupon && (
                                            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-xs font-bold text-green-700">🎟️ Best coupon: <span className="font-mono">{suggestedCoupon.code}</span></p>
                                                    <p className="text-[11px] text-green-600">Save ₹{suggestedCoupon.discount} on this order</p>
                                                </div>
                                                <button
                                                    onClick={handleAutoApply}
                                                    disabled={autoApplyLoading}
                                                    className="shrink-0 text-xs px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                                                >
                                                    {autoApplyLoading ? '...' : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-xs font-semibold text-dark-500 mb-2 uppercase tracking-wider">Have a coupon?</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                placeholder="Enter code"
                                                className="flex-1 text-sm border border-dark-100/40 rounded-xl px-3 py-2 outline-none focus:border-accent-400 transition-colors uppercase font-mono"
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponInput.trim()}
                                                className="px-3 py-2 text-xs font-bold bg-dark-900 text-white rounded-xl hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {couponLoading ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100">
                                <p className="text-xs text-green-700 font-semibold">Secure Checkout</p>
                                <p className="text-[10px] text-green-600 mt-0.5">Your payment info is encrypted and secure</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
