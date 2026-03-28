import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiXCircle, FiChevronRight, FiRefreshCw, FiShoppingBag, FiX } from 'react-icons/fi';
import { orderAPI } from '@api/services';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const statusConfig = {
  pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200', dot: 'bg-amber-400',   bar: 'bg-amber-400',   icon: FiClock },
  confirmed:  { label: 'Confirmed',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',  dot: 'bg-blue-400',    bar: 'bg-blue-500',    icon: FiCheckCircle },
  processing: { label: 'Processing', bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200',dot: 'bg-indigo-400',  bar: 'bg-indigo-500',  icon: FiRefreshCw },
  shipped:    { label: 'Shipped',    bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200',dot: 'bg-purple-400',  bar: 'bg-purple-500',  icon: FiTruck },
  delivered:  { label: 'Delivered',  bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200', dot: 'bg-green-400',   bar: 'bg-green-500',   icon: FiCheckCircle },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',   dot: 'bg-red-400',     bar: 'bg-red-400',     icon: FiXCircle },
  returned:   { label: 'Returned',   bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200',dot: 'bg-orange-400',  bar: 'bg-orange-400',  icon: FiRefreshCw },
};

const steps = [
  { key: 'pending',    label: 'Placed' },
  { key: 'confirmed',  label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped',    label: 'Shipped' },
  { key: 'delivered',  label: 'Delivered' },
];
const stepIndex = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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
    } finally { setCancellingId(null); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
      <p className="text-dark-400 text-sm font-medium animate-pulse">Loading your orders...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-50/40">
      {/* Page Header */}
      <div className="bg-white border-b border-dark-100/40 sticky top-[64px] z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 pt-20 sm:pt-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-dark-900">My Orders</h1>
            <p className="text-dark-400 text-xs sm:text-sm mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-accent-500 hover:text-accent-600 transition-colors">
            <FiShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-10">
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 bg-white rounded-3xl border border-dark-100/40 shadow-sm mt-4"
          >
            <div className="w-20 h-20 bg-dark-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <FiPackage className="w-9 h-9 text-dark-300" />
            </div>
            <h2 className="text-xl font-bold text-dark-800 mb-2">No orders yet</h2>
            <p className="text-dark-400 text-sm mb-7 max-w-xs mx-auto">Your orders will appear here once you place one. Start exploring our premium collection.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-white px-8 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-accent-500/20"
            >
              <FiShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4 mt-2"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {orders.map(order => {
              const status = order.status || order.orderStatus || 'pending';
              const cfg = statusConfig[status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const step = stepIndex[status] ?? -1;
              const isActive = !['cancelled', 'returned'].includes(status);
              const isExpanded = expandedId === order._id;

              return (
                <motion.div
                  key={order._id}
                  variants={fadeInUp}
                  className="bg-white rounded-3xl border border-dark-100/40 shadow-sm overflow-hidden"
                >
                  {/* Status color stripe */}
                  <div className={`h-1 w-full ${cfg.bar}`} />

                  {/* Order Header — clickable to expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4"
                  >
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${cfg.text}`} />
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-dark-900">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold capitalize border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>

                    {/* Price + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-base font-extrabold text-dark-900">₹{order.total?.toLocaleString('en-IN')}</p>
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <FiChevronRight className="w-4 h-4 text-dark-300" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Item thumbnails strip (always visible) */}
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
                      {(order.items || []).slice(0, 5).map((item, i) => (
                        <div key={i} className="shrink-0">
                          <img
                            src={item.image || item.product?.images?.[0]?.url || '/placeholder.jpg'}
                            className="w-14 h-14 rounded-2xl object-cover bg-dark-50 border border-dark-100/40"
                            title={item.name || item.product?.name}
                          />
                        </div>
                      ))}
                      {(order.items || []).length > 5 && (
                        <div className="shrink-0 w-14 h-14 rounded-2xl bg-dark-50 border border-dark-100/40 flex items-center justify-center">
                          <span className="text-xs text-dark-400 font-bold">+{order.items.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded: progress + actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        {/* Progress bar */}
                        {isActive && (
                          <div className="px-5 pt-2 pb-5 border-t border-dark-50">
                            <div className="relative">
                              {/* Track line */}
                              <div className="absolute top-4 left-4 right-4 h-0.5 bg-dark-100 rounded-full" />
                              <div
                                className={`absolute top-4 left-4 h-0.5 ${cfg.bar} rounded-full transition-all duration-700`}
                                style={{ width: step > 0 ? `calc(${(step / 4) * 100}% - 0px)` : '0%' }}
                              />
                              <div className="relative flex justify-between">
                                {steps.map((s, i) => (
                                  <div key={i} className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all z-10 ${
                                      i < step ? `${cfg.bar} border-transparent text-white` :
                                      i === step ? `bg-white ${cfg.border} ${cfg.text} shadow-sm` :
                                      'bg-white border-dark-100 text-dark-300'
                                    }`}>
                                      {i < step ? '✓' : i + 1}
                                    </div>
                                    <span className={`text-[9px] font-semibold text-center leading-tight ${i <= step ? cfg.text : 'text-dark-300'}`}>{s.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="px-5 pb-5 flex flex-wrap gap-2">
                          <Link
                            to={`/track-order?orderId=${order._id}`}
                            className="flex items-center gap-2 text-xs px-4 py-2.5 bg-primary-50 text-primary-700 rounded-xl font-semibold hover:bg-primary-100 transition-colors border border-primary-100"
                          >
                            <FiTruck className="w-3.5 h-3.5" /> Track Order
                          </Link>
                          {order.trackingNumber && (
                            <span className="flex items-center gap-1.5 text-xs px-4 py-2.5 bg-dark-50 text-dark-600 rounded-xl font-mono border border-dark-100">
                              AWB: {order.trackingNumber}
                            </span>
                          )}
                          {canCancel(order) && (
                            <button
                              onClick={() => setShowCancelModal(order._id)}
                              disabled={cancellingId === order._id}
                              className="flex items-center gap-1.5 text-xs px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50"
                            >
                              <FiXCircle className="w-3.5 h-3.5" />
                              {cancellingId === order._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={() => setShowCancelModal(null)} />
            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                onClick={() => setShowCancelModal(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-dark-50 flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <FiXCircle className="w-7 h-7 text-red-500" />
              </div>

              <h3 className="text-lg font-bold text-dark-900 mb-1">Cancel this order?</h3>
              <p className="text-sm text-dark-400 mb-5">This action cannot be undone. Let us know why you're cancelling.</p>

              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)"
                rows={3}
                className="w-full border border-dark-200 rounded-2xl px-4 py-3 text-sm text-dark-900 outline-none focus:border-accent-400 transition-colors resize-none mb-4 bg-dark-50/50"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(null)}
                  className="flex-1 py-3 border-2 border-dark-100 rounded-2xl text-sm font-bold text-dark-600 hover:bg-dark-50 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancellingId}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {cancellingId ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersPage;
