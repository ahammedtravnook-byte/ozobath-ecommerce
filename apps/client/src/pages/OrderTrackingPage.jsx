import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderAPI } from '@api/services';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const steps = [
    { key: 'pending', label: 'Order Placed', icon: '📦' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

const OrderTrackingPage = () => {
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (orderId && isAuthenticated) trackOrder();
    }, []);

    const trackOrder = async () => {
        if (!orderId) { toast.error('Please enter an order ID'); return; }
        try {
            setLoading(true);
            const res = await orderAPI.getMyOrder(orderId);
            setOrder(res.data);
        } catch (e) {
            toast.error('Order not found');
            setOrder(null);
        } finally { setLoading(false); }
    };

    const currentStep = order ? steps.findIndex(s => s.key === (order.orderStatus || order.status)) : -1;

    return (
        <div className="section-wrapper">
            <div className="text-center mb-10">
                <h1 className="section-title">Track Your Order</h1>
                <p className="section-subtitle mx-auto">Enter your order ID to see real-time tracking</p>
            </div>
            <div className="max-w-2xl mx-auto">
                <div className="flex gap-3 mb-8">
                    <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Enter Order ID" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <button onClick={trackOrder} disabled={loading} className="btn-primary">{loading ? '...' : 'Track'}</button>
                </div>
                {order && (
                    <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div><p className="text-sm text-gray-400">Order #{order.orderNumber || order._id.slice(-8)}</p><p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                            <p className="text-xl font-bold">₹{order.totalAmount?.toLocaleString()}</p>
                        </div>
                        {/* Progress Steps */}
                        <div className="relative flex justify-between mb-8">
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200"><div className="h-full bg-primary-500 transition-all" style={{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%` }} /></div>
                            {steps.map((step, i) => (
                                <div key={step.key} className="relative flex flex-col items-center z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${i <= currentStep ? 'bg-primary-500' : 'bg-gray-200'}`}>{step.icon}</div>
                                    <span className={`text-xs mt-2 font-medium text-center ${i <= currentStep ? 'text-primary-600' : 'text-gray-400'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                        {/* Timeline */}
                        {order.statusHistory?.length > 0 && (
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-bold text-dark-900 mb-4">Activity Log</h3>
                                <div className="space-y-3">
                                    {order.statusHistory.map((s, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm">
                                            <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                                            <div><p className="font-medium text-dark-900 capitalize">{s.status}</p><p className="text-xs text-gray-400">{new Date(s.date || s.timestamp).toLocaleString()}</p>{s.note && <p className="text-xs text-gray-500">{s.note}</p>}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default OrderTrackingPage;
