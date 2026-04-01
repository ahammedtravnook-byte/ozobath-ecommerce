import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { orderAPI, shippingAPI } from '@api/services';
import { useAuth } from '@context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiPackage, FiCheckCircle, FiTruck, FiMapPin, FiExternalLink } from 'react-icons/fi';

const steps = [
    { key: 'pending', label: 'Order Placed', icon: FiPackage, color: 'text-blue-500' },
    { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, color: 'text-green-500' },
    { key: 'processing', label: 'Processing', icon: FiPackage, color: 'text-yellow-500' },
    { key: 'shipped', label: 'Shipped', icon: FiTruck, color: 'text-accent-500' },
    { key: 'delivered', label: 'Delivered', icon: FiMapPin, color: 'text-green-600' },
];

const OrderTrackingPage = () => {
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const [order, setOrder] = useState(null);
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (orderId && isAuthenticated) trackOrder();
    }, []);

    const trackOrder = async () => {
        if (!orderId) { toast.error('Please enter an order ID'); return; }
        try {
            setLoading(true);
            const [orderRes, shipmentRes] = await Promise.allSettled([
                orderAPI.getMyOrder(orderId),
                shippingAPI.track(orderId),
            ]);

            if (orderRes.status === 'fulfilled') {
                setOrder(orderRes.value.data);
            } else {
                toast.error('Order not found');
                setOrder(null);
                return;
            }

            if (shipmentRes.status === 'fulfilled') {
                setShipment(shipmentRes.value.data);
            } else {
                setShipment(null); // Shipment may not exist yet
            }
        } catch (e) {
            toast.error('Failed to fetch tracking info');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const currentStep = order ? steps.findIndex(s => s.key === (order.orderStatus || order.status)) : -1;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#F5F9FF] to-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">Track Your Order</h1>
                    <p className="text-dark-400 text-sm">Enter your order ID for real-time tracking updates</p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    className="flex gap-3 mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <input
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && trackOrder()}
                        placeholder="Enter Order ID (e.g. OZO-000001)"
                        className="flex-1 form-input-premium"
                    />
                    <button
                        onClick={trackOrder}
                        disabled={loading}
                        className="btn-primary px-6 rounded-xl"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Tracking...
                            </span>
                        ) : 'Track'}
                    </button>
                </motion.div>

                {/* Results */}
                <AnimatePresence mode="wait">
                    {order && (
                        <motion.div
                            key="tracking-result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            {/* Order Header */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-xs text-dark-300 font-semibold uppercase tracking-wider">Order</p>
                                        <p className="text-lg font-display font-bold text-dark-900">#{order.orderNumber || order._id?.slice(-8)}</p>
                                        <p className="text-xs text-dark-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-dark-300 font-semibold uppercase tracking-wider">Total</p>
                                        <p className="text-xl font-black text-dark-900">₹{(order.total || order.totalAmount)?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Progress Steps — Premium */}
                                <div className="relative flex justify-between">
                                    {/* Progress line */}
                                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-dark-100">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-accent-500 to-primary-600 rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%` }}
                                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        />
                                    </div>

                                    {steps.map((s, i) => {
                                        const Icon = s.icon;
                                        const isActive = i <= currentStep;
                                        return (
                                            <motion.div
                                                key={s.key}
                                                className="relative flex flex-col items-center z-10"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1, duration: 0.3 }}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-gradient-to-br from-accent-500 to-primary-600 text-white shadow-md shadow-accent-500/20' : 'bg-dark-50 text-dark-300'}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className={`text-[10px] mt-2 font-bold text-center uppercase tracking-wider ${isActive ? 'text-dark-900' : 'text-dark-300'}`}>{s.label}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Shipment Details Card */}
                            {shipment && (
                                <motion.div
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h3 className="text-sm font-bold text-dark-900 mb-4 flex items-center gap-2">
                                        <FiTruck className="w-4 h-4 text-accent-500" /> Shipment Details
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                        {shipment.shipment?.courierName && (
                                            <div>
                                                <p className="text-[10px] text-dark-300 font-bold uppercase tracking-wider mb-1">Courier</p>
                                                <p className="text-dark-900 font-semibold">{shipment.shipment.courierName}</p>
                                            </div>
                                        )}
                                        {shipment.shipment?.awbCode && (
                                            <div>
                                                <p className="text-[10px] text-dark-300 font-bold uppercase tracking-wider mb-1">AWB Number</p>
                                                <p className="text-dark-900 font-mono font-semibold">{shipment.shipment.awbCode}</p>
                                            </div>
                                        )}
                                        {shipment.shipment?.estimatedDelivery && (
                                            <div>
                                                <p className="text-[10px] text-dark-300 font-bold uppercase tracking-wider mb-1">Est. Delivery</p>
                                                <p className="text-dark-900 font-semibold">{new Date(shipment.shipment.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                        )}
                                    </div>
                                    {shipment.shipment?.trackingUrl && (
                                        <a
                                            href={shipment.shipment.trackingUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-4 inline-flex items-center gap-2 text-accent-600 text-xs font-bold hover:text-accent-700 transition-colors bg-accent-50 px-4 py-2 rounded-xl"
                                        >
                                            <FiExternalLink className="w-3 h-3" /> Track on Courier Website
                                        </a>
                                    )}
                                </motion.div>
                            )}

                            {/* Activity Log */}
                            {order.statusHistory?.length > 0 && (
                                <motion.div
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-dark-100/10"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h3 className="text-sm font-bold text-dark-900 mb-5">Activity Log</h3>
                                    <div className="relative">
                                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-dark-100" />
                                        <div className="space-y-4">
                                            {[...order.statusHistory].reverse().map((s, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="flex items-start gap-4 text-sm relative"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <div className={`w-4 h-4 rounded-full shrink-0 relative z-10 ${i === 0 ? 'bg-gradient-to-br from-accent-500 to-primary-600 ring-4 ring-accent-100' : 'bg-dark-200'}`} />
                                                    <div className="flex-1 pb-2">
                                                        <p className="font-semibold text-dark-900 capitalize">{s.status}</p>
                                                        <p className="text-[11px] text-dark-400">{new Date(s.date || s.timestamp).toLocaleString('en-IN')}</p>
                                                        {s.note && <p className="text-xs text-dark-500 mt-0.5">{s.note}</p>}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Back Link */}
                            <div className="text-center">
                                <Link to="/my-orders" className="text-sm text-accent-500 font-semibold hover:text-accent-700 transition-colors">
                                    ← Back to My Orders
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OrderTrackingPage;
