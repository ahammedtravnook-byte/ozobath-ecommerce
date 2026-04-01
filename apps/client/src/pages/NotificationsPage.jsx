import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiTrash2, FiCheckCircle, FiPackage, FiStar, FiTag, FiTruck, FiAlertCircle, FiGift, FiX } from 'react-icons/fi';
import { useNotifications } from '@context/NotificationContext';
import PageHero from '@components/PageHero';
import toast from 'react-hot-toast';

/* ─── Constants ──────────────────────────────── */
const NOTIF_META = {
    order_placed:         { emoji: '🛍️', icon: FiPackage,     color: 'bg-blue-50   text-blue-500',   pill: 'bg-blue-100 text-blue-700'  },
    order_confirmed:      { emoji: '✅', icon: FiCheckCircle, color: 'bg-green-50  text-green-500',  pill: 'bg-green-100 text-green-700' },
    order_shipped:        { emoji: '🚚', icon: FiTruck,       color: 'bg-indigo-50 text-indigo-500', pill: 'bg-indigo-100 text-indigo-700'},
    order_delivered:      { emoji: '📦', icon: FiPackage,     color: 'bg-teal-50   text-teal-500',   pill: 'bg-teal-100 text-teal-700'   },
    order_cancelled:      { emoji: '❌', icon: FiX,           color: 'bg-red-50    text-red-500',    pill: 'bg-red-100 text-red-700'     },
    payment_success:      { emoji: '💳', icon: FiCheckCircle, color: 'bg-emerald-50 text-emerald-500',pill: 'bg-emerald-100 text-emerald-700'},
    payment_failed:       { emoji: '⚠️', icon: FiAlertCircle, color: 'bg-orange-50 text-orange-500', pill: 'bg-orange-100 text-orange-700'},
    coupon_applied:       { emoji: '🎟️', icon: FiTag,         color: 'bg-purple-50 text-purple-500', pill: 'bg-purple-100 text-purple-700'},
    review_approved:      { emoji: '⭐', icon: FiStar,        color: 'bg-yellow-50 text-yellow-500', pill: 'bg-yellow-100 text-yellow-700'},
    welcome:              { emoji: '👋', icon: FiBell,        color: 'bg-pink-50   text-pink-500',   pill: 'bg-pink-100 text-pink-700'   },
    first_order_discount: { emoji: '🎁', icon: FiGift,        color: 'bg-rose-50   text-rose-500',   pill: 'bg-rose-100 text-rose-700'   },
};

const DEFAULT_META = { emoji: '🔔', icon: FiBell, color: 'bg-gray-50 text-gray-500', pill: 'bg-gray-100 text-gray-600' };

const getLink = (notif) => {
    const d = notif.data || {};
    switch (notif.type) {
        case 'order_placed': case 'order_confirmed': case 'order_cancelled':
        case 'order_delivered': case 'payment_success': case 'payment_failed':
            return '/orders';
        case 'order_shipped':
            return d.orderId ? `/track-order?orderId=${d.orderId}` : '/orders';
        case 'review_approved':
            return d.productSlug ? `/product/${d.productSlug}` : '/orders';
        case 'coupon_applied': case 'first_order_discount':
            return '/shop';
        case 'welcome':
            return '/shop';
        default:
            return null;
    }
};

const formatRelTime = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 6) return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
};

const groupByDate = (notifications) => {
    const groups = {};
    notifications.forEach(n => {
        const d = new Date(n.createdAt);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let label;
        if (d.toDateString() === today.toDateString()) label = 'Today';
        else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
        else label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(n);
    });
    return groups;
};

/* ─── Card ───────────────────────────────────── */
const NotifCard = ({ notif, onRead, onDelete, index }) => {
    const navigate = useNavigate();
    const meta = NOTIF_META[notif.type] || DEFAULT_META;
    const link = getLink(notif);

    const handleClick = async () => {
        if (!notif.isRead) await onRead(notif._id);
        if (link) navigate(link);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.28, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                ${!notif.isRead
                    ? 'bg-accent-50/40 border-accent-200/60 hover:bg-accent-50/70'
                    : 'bg-white border-dark-100/60 hover:bg-dark-50/60'
                }`}
            onClick={handleClick}
        >
            {/* Unread dot */}
            {!notif.isRead && (
                <span className="absolute top-4 right-10 w-2 h-2 rounded-full bg-accent-500 shrink-0" />
            )}

            {/* Icon */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${meta.color}`}>
                {meta.emoji}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold leading-snug ${!notif.isRead ? 'text-dark-900' : 'text-dark-700'}`}>
                        {notif.title}
                    </p>
                    <span className="text-[10px] text-dark-300 shrink-0 mt-0.5">{formatRelTime(notif.createdAt)}</span>
                </div>
                <p className="text-xs text-dark-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                {link && (
                    <p className="text-[11px] text-accent-500 font-semibold mt-1.5 group-hover:text-accent-600 transition-colors">
                        Tap to view →
                    </p>
                )}
            </div>

            {/* Delete */}
            <button
                onClick={e => { e.stopPropagation(); onDelete(notif._id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 shrink-0 mt-0.5"
            >
                <FiTrash2 className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
};

/* ─── Page ───────────────────────────────────── */
const NotificationsPage = () => {
    const { notifications, loading, fetchNotifications, markAsRead, markAllRead, deleteNotification, unreadCount } = useNotifications();
    const [filter, setFilter] = useState('all'); // all | unread

    useEffect(() => { fetchNotifications(); }, []);

    const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
    const grouped = groupByDate(filtered);

    const handleMarkAllRead = async () => {
        await markAllRead();
        toast.success('All notifications marked as read');
    };

    const handleDelete = async (id) => {
        await deleteNotification(id);
        toast.success('Notification removed');
    };

    return (
        <div className="bg-[#fafafa] min-h-screen">
            <PageHero
                title="Notifications"
                subtitle="Stay updated with your orders, offers, and account activity."
                breadcrumbs={[{ label: 'Notifications' }]}
            />

            <section className="section-wrapper max-w-2xl mx-auto">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 bg-white border border-dark-100 rounded-xl p-1">
                        {['all', 'unread'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200
                                    ${filter === f ? 'bg-dark-900 text-white shadow-sm' : 'text-dark-400 hover:text-dark-700'}`}
                            >
                                {f === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : f === 'all' ? 'All' : 'Unread'}
                            </button>
                        ))}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="flex items-center gap-1.5 text-xs font-semibold text-accent-500 hover:text-accent-600 transition-colors"
                        >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton-shimmer h-20 rounded-2xl" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 rounded-full bg-dark-50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔔</span>
                        </div>
                        <p className="text-dark-500 font-semibold text-base">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </p>
                        <p className="text-dark-300 text-sm mt-1">
                            {filter === 'unread' ? 'No unread notifications.' : 'Order updates and offers will appear here.'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {Object.entries(grouped).map(([label, items]) => (
                                <motion.div key={label} layout>
                                    <p className="text-[11px] font-bold text-dark-400 uppercase tracking-widest mb-3 px-1">{label}</p>
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {items.map((notif, i) => (
                                                <NotifCard
                                                    key={notif._id}
                                                    notif={notif}
                                                    index={i}
                                                    onRead={markAsRead}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    );
};

export default NotificationsPage;
