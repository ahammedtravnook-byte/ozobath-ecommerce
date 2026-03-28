import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderAPI } from '@api/services';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const statusColor = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
};

const statusStep = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null); // orderId
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data?.orders || []);
    } catch { toast.error('Failed to load orders'); } finally { setLoading(false); }
  };

  const canCancel = (order) => {
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) return false;
    if (order.status === 'pending') return true;
    const hoursSince = (Date.now() - new Date(order.createdAt)) / 3600000;
    return hoursSince <= 1;
  };

  const handleCancelOrder = async () => {
    if (!showCancelModal) return;
    try {
      setCancellingId(showCancelModal);
      await orderAPI.cancel(showCancelModal, cancelReason || 'Cancelled by customer');
      toast.success('Order cancelled successfully');
      setShowCancelModal(null);
      setCancelReason('');
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="section-wrapper">
      <h1 className="text-3xl font-display font-bold text-dark-900 mb-2">My Orders</h1>
      <p className="text-dark-400 text-sm mb-8">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-400 mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm mb-6">Your orders will appear here once you place one</p>
          <Link to="/shop" className="btn-primary mt-4">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = order.status || order.orderStatus || 'pending';
            const step = statusStep[status] ?? -1;
            return (
              <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-dark-100/10 overflow-hidden">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-dark-50">
                  <div>
                    <p className="text-sm font-bold text-dark-900">#{order.orderNumber || order._id.slice(-8)}</p>
                    <p className="text-xs text-dark-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusColor[status] || 'bg-gray-100 text-gray-600'}`}>
                      {status}
                    </span>
                    <span className="text-base font-bold text-dark-900">₹{order.total?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Order Progress Bar (only for active orders) */}
                {!['cancelled', 'returned'].includes(status) && (
                  <div className="px-5 py-3 bg-dark-50/30">
                    <div className="flex items-center gap-0">
                      {['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'].map((s, i) => (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${i <= step ? 'bg-accent-500 text-white' : 'bg-dark-100 text-dark-300'}`}>
                            {i < step ? '✓' : i + 1}
                          </div>
                          <div className={`hidden sm:block text-[9px] font-semibold ml-1 ${i <= step ? 'text-accent-500' : 'text-dark-300'}`}>{s}</div>
                          {i < 4 && <div className={`flex-1 h-0.5 mx-1 transition-all ${i < step ? 'bg-accent-500' : 'bg-dark-100'}`} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Preview */}
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                    {(order.items || []).slice(0, 4).map((item, i) => (
                      <div key={i} className="shrink-0 text-center">
                        <img
                          src={item.image || item.product?.images?.[0]?.url || '/placeholder.jpg'}
                          className="w-14 h-14 rounded-xl object-cover bg-dark-50"
                          title={item.name || item.product?.name}
                        />
                        <p className="text-[9px] text-dark-300 mt-1 w-14 truncate">{item.name || item.product?.name}</p>
                      </div>
                    ))}
                    {(order.items || []).length > 4 && (
                      <span className="text-xs text-dark-400 shrink-0">+{order.items.length - 4} more</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/track-order?orderId=${order._id}`}
                      className="text-xs px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-semibold hover:bg-primary-100 transition-colors"
                    >
                      Track Order →
                    </Link>
                    {order.trackingNumber && (
                      <span className="text-xs px-4 py-2 bg-dark-50 text-dark-500 rounded-xl font-mono">
                        AWB: {order.trackingNumber}
                      </span>
                    )}
                    {canCancel(order) && (
                      <button
                        onClick={() => setShowCancelModal(order._id)}
                        disabled={cancellingId === order._id}
                        className="text-xs px-4 py-2 bg-red-50 text-red-500 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm" onClick={() => setShowCancelModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-dark-900 mb-2">Cancel Order?</h3>
            <p className="text-sm text-dark-400 mb-4">Please let us know why you want to cancel this order.</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={3}
              className="w-full border border-dark-100 rounded-xl px-3 py-2 text-sm text-dark-900 outline-none focus:border-accent-400 transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(null)} className="flex-1 py-2.5 border border-dark-100 rounded-xl text-sm font-semibold text-dark-600 hover:bg-dark-50 transition-colors">
                Keep Order
              </button>
              <button onClick={handleCancelOrder} disabled={cancellingId} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {cancellingId ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
