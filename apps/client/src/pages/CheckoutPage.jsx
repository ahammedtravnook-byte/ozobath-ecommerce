import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { orderAPI, paymentAPI } from '@api/services';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
    const { cart, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Address, 2: Review, 3: Payment
    const [processing, setProcessing] = useState(false);

    const [address, setAddress] = useState({
        fullName: user?.name || '', phone: user?.phone || '',
        line1: '', line2: '', city: '', state: '', pincode: '', country: 'India',
    });

    const items = cart?.items || [];
    const subtotal = items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login?redirect=/checkout'); return; }
        if (items.length === 0) { navigate('/cart'); return; }
        // Pre-fill from user addresses
        if (user?.addresses?.length > 0) {
            const addr = user.addresses[0];
            setAddress(prev => ({ ...prev, ...addr, fullName: prev.fullName || addr.fullName || user.name }));
        }
    }, [isAuthenticated, items.length, navigate, user]);

    const handlePayment = async () => {
        if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
            toast.error('Please fill all address fields');
            setStep(1);
            return;
        }

        try {
            setProcessing(true);

            // Create order
            const orderRes = await orderAPI.create({
                shippingAddress: address,
                items: items.map(i => ({ product: i.product._id, quantity: i.quantity, variant: i.variant, price: i.product.price })),
                totalAmount: total,
                subtotal,
                shippingCharges: shipping,
            });
            const order = orderRes.data;

            // Create Razorpay order
            const payRes = await paymentAPI.createOrder({ amount: total, orderId: order._id });
            const razorpayOrder = payRes.data;

            // Load Razorpay
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                const options = {
                    key: razorpayOrder.keyId,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: 'OZOBATH',
                    description: 'Premium Bath Solutions',
                    order_id: razorpayOrder.orderId,
                    handler: async (response) => {
                        try {
                            await paymentAPI.verify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: order._id,
                            });
                            clearCart();
                            toast.success('Payment successful! 🎉');
                            navigate(`/order-confirmation/${order._id}`);
                        } catch (e) {
                            toast.error('Payment verification failed');
                        }
                    },
                    prefill: { name: address.fullName, email: user?.email, contact: address.phone },
                    theme: { color: '#0084f0' },
                    modal: { ondismiss: () => { setProcessing(false); toast.error('Payment cancelled'); } },
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            };
            document.body.appendChild(script);
        } catch (e) {
            toast.error(e.message || 'Checkout failed');
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Checkout</h1>

                {/* Steps */}
                <div className="flex items-center gap-2 mb-8">
                    {['Shipping', 'Review', 'Payment'].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {step > i + 1 ? '✓' : i + 1}
                            </div>
                            <span className={`text-sm font-medium ${step >= i + 1 ? 'text-dark-900' : 'text-gray-400'}`}>{s}</span>
                            {i < 2 && <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {/* Step 1: Address */}
                        {step === 1 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-dark-900 mb-4">Shipping Address</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label><input value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="House/Flat, Building, Street" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label><input value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Area, Colony (Optional)" /></div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">State *</label><input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label><input value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="btn-primary w-full mt-2">Continue to Review →</button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Review */}
                        {step === 2 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-dark-900 mb-4">Review Order</h2>
                                <div className="space-y-3 mb-6">
                                    {items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                                            <img src={item.product?.images?.[0]?.url || '/placeholder.jpg'} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-dark-900">{item.product?.name}</p>
                                                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-bold">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-sm font-semibold text-dark-900 mb-1">Shipping to:</p>
                                    <p className="text-sm text-gray-600">{address.fullName}, {address.line1}{address.line2 ? ', ' + address.line2 : ''}, {address.city}, {address.state} - {address.pincode}</p>
                                    <p className="text-sm text-gray-500">{address.phone}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Edit Address</button>
                                    <button onClick={() => { setStep(3); handlePayment(); }} className="btn-primary flex-1">Pay ₹{total.toLocaleString()} →</button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {step === 3 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm text-center py-16">
                                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <h2 className="text-lg font-bold text-dark-900">Processing Payment...</h2>
                                <p className="text-sm text-gray-400 mt-2">Please complete the payment in the Razorpay window</p>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div>
                        <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                            <h3 className="text-lg font-bold text-dark-900 mb-4">Order Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Subtotal ({items.length} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                                <hr className="border-gray-100" />
                                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
                                {shipping > 0 && <p className="text-xs text-primary-500">Add ₹{(1000 - subtotal).toLocaleString()} more for FREE shipping</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
