import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '@api/services';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const statusColor = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };

const OrdersPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        const fetchOrders = async () => {
            try { const res = await orderAPI.getMyOrders(); setOrders(res.data || []); } catch (e) { toast.error('Failed to load orders'); } finally { setLoading(false); }
        };
        fetchOrders();
    }, [isAuthenticated, navigate]);

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="section-wrapper">
            <h1 className="text-3xl font-display font-bold text-dark-900 mb-8">My Orders</h1>
            {orders.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-semibold text-gray-300 mb-2">No orders yet</h2>
                    <Link to="/shop" className="btn-primary mt-4">Start Shopping</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white rounded-xl p-5 md:p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                <div>
                                    <p className="text-sm text-gray-400">Order #{order.orderNumber || order._id.slice(-8)}</p>
                                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusColor[order.orderStatus || order.status] || 'bg-gray-100 text-gray-600'}`}>{order.orderStatus || order.status}</span>
                                    <span className="text-lg font-bold text-dark-900">₹{order.totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                                {(order.items || []).slice(0, 4).map((item, i) => (
                                    <img key={i} src={item.product?.images?.[0]?.url || '/placeholder.jpg'} className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0" title={item.product?.name} />
                                ))}
                                {(order.items || []).length > 4 && <span className="text-sm text-gray-400 shrink-0">+{order.items.length - 4} more</span>}
                            </div>
                            <div className="mt-4 flex gap-3">
                                <Link to={`/track-order?orderId=${order._id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Track Order →</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
