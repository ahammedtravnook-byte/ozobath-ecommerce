import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiMenu, FiX, FiUser, FiArrowRight, FiBell, FiClock, FiTag, FiPackage } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { useNotifications } from '@context/NotificationContext';
import { productAPI, categoryAPI } from '@api/services';
import { motion, AnimatePresence } from 'framer-motion';

const RECENT_SEARCHES_KEY = 'ozobath_recent_searches';
const MAX_RECENT = 6;

const getRecentSearches = () => {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
};
const saveRecentSearch = (term) => {
    if (!term?.trim()) return;
    const prev = getRecentSearches().filter(s => s.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([term.trim(), ...prev].slice(0, MAX_RECENT)));
};
const clearRecentSearches = () => localStorage.removeItem(RECENT_SEARCHES_KEY);

const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/shop' },
    { label: 'Experience', path: '/experience-centre' },
    { label: 'B2B', path: '/b2b-enquiry' },
    { label: 'Contact', path: '/contact' },
];

/* Mini SVG wave for active indicator */
const WaveIndicator = () => (
    <svg className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[6px]" viewBox="0 0 32 6" fill="none">
        <path d="M0 3 C4 0, 8 6, 12 3 C16 0, 20 6, 24 3 C28 0, 32 6, 32 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-accent-500" />
    </svg>
);

/* ─── Search Overlay Component ────────────── */
const SearchOverlay = ({ onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [categoryMatches, setCategoryMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState(getRecentSearches);
    const [allCategories, setAllCategories] = useState([]);
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    // Load categories once for chip display + matching
    useEffect(() => {
        categoryAPI.getAll().then(res => setAllCategories(res.data?.categories || [])).catch(() => {});
    }, []);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSearch = useCallback((value) => {
        setQuery(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (value.trim().length < 2) {
            setProducts([]); setCategoryMatches([]); setLoading(false); return;
        }

        setLoading(true);
        // Match categories locally (instant)
        const q = value.trim().toLowerCase();
        setCategoryMatches(allCategories.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3));

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await productAPI.getAll({ search: value.trim(), limit: 6 });
                setProducts(res.data?.products || []);
            } catch { setProducts([]); }
            setLoading(false);
        }, 350);
    }, [allCategories]);

    const handleSelectProduct = (slug) => {
        saveRecentSearch(query);
        setRecentSearches(getRecentSearches());
        onClose();
        navigate(`/product/${slug}`);
    };

    const handleSelectCategory = (cat) => {
        saveRecentSearch(cat.name);
        setRecentSearches(getRecentSearches());
        onClose();
        navigate(`/shop?category=${cat._id}`);
    };

    const handleRecentSearch = (term) => {
        onClose();
        navigate(`/shop?search=${encodeURIComponent(term)}`);
    };

    const handleViewAll = () => {
        saveRecentSearch(query);
        setRecentSearches(getRecentSearches());
        onClose();
        navigate(`/shop?search=${encodeURIComponent(query)}`);
    };

    const handleClearRecent = (e) => {
        e.stopPropagation();
        clearRecentSearches();
        setRecentSearches([]);
    };

    const hasResults = products.length > 0 || categoryMatches.length > 0;
    const showEmpty = query.length >= 2 && !loading && !hasResults;
    const showIdle = query.length < 2;

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-start justify-center pt-20 sm:pt-28"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
        >
            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-md" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-2xl mx-4"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Input bar */}
                    <div className="flex items-center border-b border-dark-50 px-2">
                        <FiSearch className="w-5 h-5 text-accent-500 ml-3 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && query.trim().length >= 2) handleViewAll(); }}
                            placeholder="Search products, categories..."
                            className="flex-1 py-4 px-3 text-base text-dark-900 placeholder:text-dark-300 bg-transparent focus:outline-none"
                        />
                        <div className="flex items-center gap-1 pr-2">
                            {query && (
                                <button onClick={() => handleSearch('')} className="p-2 hover:bg-dark-50 rounded-lg transition-colors">
                                    <FiX className="w-4 h-4 text-dark-400" />
                                </button>
                            )}
                            <kbd className="hidden sm:block text-[10px] text-dark-300 border border-dark-100 rounded-md px-1.5 py-0.5 font-mono">ESC</kbd>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[60vh] overflow-y-auto">

                        {/* ── Idle state: recent searches + category chips ── */}
                        {showIdle && (
                            <div className="p-4 space-y-5">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2.5">
                                            <span className="text-[11px] font-bold text-dark-400 uppercase tracking-widest">Recent Searches</span>
                                            <button onClick={handleClearRecent} className="text-[11px] text-dark-300 hover:text-red-400 transition-colors font-medium">Clear all</button>
                                        </div>
                                        <div className="space-y-0.5">
                                            {recentSearches.map((term, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleRecentSearch(term)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-50 transition-colors text-left group"
                                                >
                                                    <FiClock className="w-3.5 h-3.5 text-dark-300 shrink-0" />
                                                    <span className="text-sm text-dark-700 group-hover:text-dark-900 flex-1 truncate">{term}</span>
                                                    <FiArrowRight className="w-3.5 h-3.5 text-dark-200 group-hover:text-accent-400 transition-colors shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Category Chips */}
                                {allCategories.length > 0 && (
                                    <div>
                                        <span className="text-[11px] font-bold text-dark-400 uppercase tracking-widest mb-2.5 block">Browse Categories</span>
                                        <div className="flex flex-wrap gap-2">
                                            {allCategories.slice(0, 8).map(cat => (
                                                <button
                                                    key={cat._id}
                                                    onClick={() => handleSelectCategory(cat)}
                                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-dark-50 hover:bg-accent-50 hover:text-accent-600 text-dark-600 text-xs font-semibold rounded-full transition-colors border border-dark-100/50 hover:border-accent-200"
                                                >
                                                    <FiTag className="w-3 h-3" />
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {recentSearches.length === 0 && allCategories.length === 0 && (
                                    <p className="text-center text-sm text-dark-300 py-6">Start typing to search products...</p>
                                )}
                            </div>
                        )}

                        {/* ── Loading ── */}
                        {query.length >= 2 && loading && (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-7 h-7 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
                            </div>
                        )}

                        {/* ── Results ── */}
                        {query.length >= 2 && !loading && hasResults && (
                            <div className="p-3 space-y-1">
                                {/* Category matches */}
                                {categoryMatches.length > 0 && (
                                    <div className="mb-3">
                                        <span className="text-[10px] font-bold text-dark-400 uppercase tracking-widest px-3 block mb-1.5">Categories</span>
                                        <div className="space-y-0.5">
                                            {categoryMatches.map(cat => (
                                                <button
                                                    key={cat._id}
                                                    onClick={() => handleSelectCategory(cat)}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent-50 transition-colors text-left group"
                                                >
                                                    <span className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center shrink-0 group-hover:bg-accent-100 transition-colors">
                                                        <FiTag className="w-4 h-4 text-accent-500" />
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-dark-900 group-hover:text-accent-500 transition-colors">{cat.name}</p>
                                                        <p className="text-[11px] text-dark-400">Browse all in {cat.name}</p>
                                                    </div>
                                                    <FiArrowRight className="w-4 h-4 text-dark-200 group-hover:text-accent-400 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Product results */}
                                {products.length > 0 && (
                                    <div>
                                        {categoryMatches.length > 0 && (
                                            <span className="text-[10px] font-bold text-dark-400 uppercase tracking-widest px-3 block mb-1.5">Products</span>
                                        )}
                                        <div className="space-y-0.5">
                                            {products.map((product) => {
                                                const orig = product.compareAtPrice || product.mrp;
                                                const discPct = orig > product.price ? Math.round(((orig - product.price) / orig) * 100) : 0;
                                                return (
                                                    <button
                                                        key={product._id}
                                                        onClick={() => handleSelectProduct(product.slug)}
                                                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent-50 transition-colors text-left group"
                                                    >
                                                        <div className="w-12 h-12 bg-dark-50 rounded-xl shrink-0 overflow-hidden border border-dark-100/30">
                                                            <img
                                                                src={product.images?.[0]?.url || '/images/product_shower_1.png'}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-dark-900 truncate group-hover:text-accent-500 transition-colors">{product.name}</p>
                                                            <p className="text-[11px] text-dark-400">{product.category?.name || 'Product'}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-sm font-bold text-dark-900">₹{product.price?.toLocaleString('en-IN')}</p>
                                                            {discPct > 0 && (
                                                                <span className="text-[10px] text-emerald-600 font-bold">{discPct}% off</span>
                                                            )}
                                                        </div>
                                                        <FiArrowRight className="w-4 h-4 text-dark-200 group-hover:text-accent-400 shrink-0 ml-1" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* View all */}
                                <button
                                    onClick={handleViewAll}
                                    className="mt-2 w-full flex items-center justify-center gap-2 py-3 text-accent-500 font-semibold text-sm hover:bg-accent-50 rounded-xl transition-colors border border-accent-100 hover:border-accent-200"
                                >
                                    View all results for "{query}"
                                    <FiArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* ── No results ── */}
                        {showEmpty && (
                            <div className="text-center py-10 px-4">
                                <p className="text-3xl mb-3">🔍</p>
                                <p className="text-dark-600 font-semibold text-sm mb-1">No results for "{query}"</p>
                                <p className="text-dark-300 text-xs mb-4">Try a different spelling or browse by category</p>
                                {allCategories.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        {allCategories.slice(0, 5).map(cat => (
                                            <button
                                                key={cat._id}
                                                onClick={() => handleSelectCategory(cat)}
                                                className="px-3 py-1.5 bg-dark-50 text-dark-600 text-xs font-semibold rounded-full hover:bg-accent-50 hover:text-accent-600 transition-colors border border-dark-100/50"
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ─── Notification link resolver ────────────── */
const getNotificationLink = (notif) => {
    const d = notif.data || {};
    switch (notif.type) {
        case 'order_placed':
        case 'order_confirmed':
        case 'order_cancelled':
        case 'order_delivered':
        case 'payment_success':
        case 'payment_failed':
            return '/orders';
        case 'order_shipped':
            return d.orderId ? `/track-order?orderId=${d.orderId}` : '/orders';
        case 'review_approved':
            return d.productSlug ? `/product/${d.productSlug}` : '/orders';
        case 'coupon_applied':
        case 'first_order_discount':
            return '/shop';
        case 'welcome':
            return '/shop';
        default:
            return null;
    }
};

const NOTIF_ICONS = {
    order_placed: '🛍️', order_confirmed: '✅', order_shipped: '🚚',
    order_delivered: '📦', order_cancelled: '❌', payment_success: '💳',
    payment_failed: '⚠️', coupon_applied: '🎟️', review_approved: '⭐',
    welcome: '👋', first_order_discount: '🎁',
};

const formatRelTime = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
};

/* ─── Notification Bell Component ────────────── */
const NotificationBell = () => {
    const navigate = useNavigate();
    const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotifClick = async (notif) => {
        // Mark as read
        if (!notif.isRead) await markAsRead(notif._id);
        // Navigate to relevant page
        const link = getNotificationLink(notif);
        if (link) {
            setIsOpen(false);
            navigate(link);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 hover:bg-yellow-50 rounded-full relative transition-colors duration-200"
                aria-label="Notifications"
            >
                <FiBell className="w-[18px] h-[18px] text-dark-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-dark-100/20 overflow-hidden z-50"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-50">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-dark-900 text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-[11px] text-accent-500 font-semibold hover:text-accent-600">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <p className="text-2xl mb-2">🔔</p>
                                    <p className="text-sm text-dark-400">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(notif => {
                                    const link = getNotificationLink(notif);
                                    return (
                                        <div
                                            key={notif._id}
                                            onClick={() => handleNotifClick(notif)}
                                            className={`flex items-start gap-3 px-4 py-3 border-b border-dark-50 last:border-0 transition-colors
                                                ${link ? 'cursor-pointer hover:bg-accent-50/60' : 'cursor-default hover:bg-dark-50/40'}
                                                ${!notif.isRead ? 'bg-accent-50/30' : ''}`}
                                        >
                                            <span className="text-xl shrink-0 mt-0.5">{NOTIF_ICONS[notif.type] || '🔔'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-dark-900' : 'text-dark-600'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-[11px] text-dark-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-dark-300">{formatRelTime(notif.createdAt)}</p>
                                                    {link && <p className="text-[10px] text-accent-400 font-medium">Tap to view →</p>}
                                                </div>
                                            </div>
                                            {!notif.isRead && (
                                                <div className="w-2 h-2 bg-accent-500 rounded-full shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="px-4 py-2.5 border-t border-dark-50 flex items-center justify-between">
                                <p className="text-[10px] text-dark-300">Last 20 notifications</p>
                                <Link to="/orders" onClick={() => setIsOpen(false)} className="text-[10px] text-accent-500 font-semibold hover:text-accent-600">
                                    View orders →
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const { itemCount } = useCart();
    const { count: wishlistCount } = useWishlist();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header
                className={`sticky top-0 z-50 transition-all duration-300 ease-out
                    ${isScrolled ? 'pt-3 pb-1.5' : 'bg-white/90 backdrop-blur-md shadow-sm border-b border-dark-100/10'}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className={`flex items-center justify-between transition-all duration-300 ease-out
                            ${isScrolled
                                ? 'bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-6 py-2 border border-white/50 rounded-full'
                                : 'py-4 bg-transparent rounded-none'
                            }`}
                    >
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <img
                                src="/images/logo.png"
                                alt="OZOBATH"
                                className="h-10 w-auto group-hover:scale-105 transition-transform duration-300"
                            />
                        </Link>

                        {/* Desktop Navigation — optimized (no layoutId) */}
                        <nav className="hidden lg:flex items-center gap-0.5 relative">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`relative px-5 py-2.5 text-[13px] font-semibold transition-colors duration-200 rounded-full
                                            ${isActive
                                                ? 'text-accent-500'
                                                : 'text-dark-600 hover:text-dark-900 hover:bg-dark-50/60'
                                            }`}
                                    >
                                        {link.label}
                                        {isActive && <WaveIndicator />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                            {/* Search */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2.5 hover:bg-accent-50 rounded-full transition-colors duration-200"
                                aria-label="Search"
                            >
                                <FiSearch className="w-[18px] h-[18px] text-dark-700" />
                            </button>

                            {/* Desktop actions */}
                            <div className="hidden sm:flex items-center gap-1.5">
                                {isAuthenticated && <NotificationBell />}
                                {isAuthenticated && (
                                    <Link
                                        to="/orders"
                                        className={`p-2.5 hover:bg-accent-50 rounded-full relative transition-colors duration-200 ${location.pathname === '/orders' ? 'text-accent-500' : 'text-dark-700'}`}
                                        aria-label="My Orders"
                                        title="My Orders"
                                    >
                                        <FiPackage className="w-[18px] h-[18px]" />
                                    </Link>
                                )}
                                <Link
                                    to="/wishlist"
                                    className="p-2.5 hover:bg-pink-50 rounded-full relative transition-colors duration-200"
                                    aria-label="Wishlist"
                                >
                                    <FiHeart className="w-[18px] h-[18px] text-dark-700" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                <Link
                                    to="/cart"
                                    className="p-2.5 hover:bg-blue-50 rounded-full relative transition-colors duration-200"
                                    aria-label="Cart"
                                >
                                    <FiShoppingBag className="w-[18px] h-[18px] text-dark-700" />
                                    {itemCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-accent-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm">
                                            {itemCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="w-px h-6 bg-dark-100 mx-1" />

                                {isAuthenticated ? (
                                    <Link
                                        to="/profile"
                                        className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-primary-600/30 transition-shadow duration-300"
                                    >
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </Link>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="ml-1 px-5 py-2 bg-primary-600 text-white text-[11px] font-bold rounded-full hover:bg-accent-500 transition-colors duration-300 uppercase tracking-widest hover:shadow-lg hover:shadow-accent-500/20"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="lg:hidden p-2.5 hover:bg-dark-50 rounded-full transition-colors duration-200 ml-1"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen
                                    ? <FiX className="w-5 h-5 text-dark-900" />
                                    : <FiMenu className="w-5 h-5 text-dark-900" />
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search Overlay — functional */}
            <AnimatePresence>
                {isSearchOpen && (
                    <SearchOverlay
                        onClose={() => setIsSearchOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-[55] lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Slide-in Panel */}
                        <motion.nav
                            className="absolute right-0 top-0 w-[85%] max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* Mobile Menu Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-dark-50">
                                <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                    <img
                                        src="/images/logo.png"
                                        alt="OzoBath"
                                        className="h-8 w-auto object-contain"
                                    />
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 hover:bg-dark-50 rounded-xl transition-colors"
                                    aria-label="Close menu"
                                >
                                    <FiX className="w-5 h-5 text-dark-500" />
                                </button>
                            </div>

                            {/* Navigation Links — CSS-only transitions (no per-item motion) */}
                            <div className="flex flex-col gap-1 flex-1 px-4 pt-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center text-base font-display font-semibold py-3.5 px-4 rounded-2xl transition-colors duration-200
                                            ${location.pathname === link.path
                                                ? 'text-accent-500 bg-accent-50'
                                                : 'text-dark-900 hover:bg-dark-50 hover:text-accent-500'
                                            }`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                        {location.pathname === link.path && (
                                            <span className="ml-auto w-1.5 h-1.5 bg-accent-500 rounded-full" />
                                        )}
                                    </Link>
                                ))}

                                <hr className="border-dark-100 my-3" />

                                {/* Quick Action Links */}
                                <div className="grid grid-cols-3 gap-2 px-2 mb-4">
                                    <Link to="/wishlist" className="flex flex-col items-center gap-2 p-3 bg-pink-50/80 rounded-2xl hover:bg-pink-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative">
                                            <FiHeart className="w-5 h-5 text-pink-500" />
                                            {wishlistCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
                                        </div>
                                        <span className="text-dark-600 font-medium text-xs">Wishlist</span>
                                    </Link>
                                    <Link to="/cart" className="flex flex-col items-center gap-2 p-3 bg-blue-50/80 rounded-2xl hover:bg-blue-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative">
                                            <FiShoppingBag className="w-5 h-5 text-blue-500" />
                                            {itemCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{itemCount}</span>}
                                        </div>
                                        <span className="text-dark-600 font-medium text-xs">Cart</span>
                                    </Link>
                                    {isAuthenticated && (
                                        <Link to="/orders" className="flex flex-col items-center gap-2 p-3 bg-accent-50/80 rounded-2xl hover:bg-accent-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                            <FiPackage className="w-5 h-5 text-accent-500" />
                                            <span className="text-dark-600 font-medium text-xs">My Orders</span>
                                        </Link>
                                    )}
                                </div>

                                {/* User Section */}
                                <div className="mt-auto pb-6 space-y-3">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg shadow-primary-600/20">
                                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark-900">{user?.name || 'User'}</p>
                                                    <p className="text-xs text-dark-400">{user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link to="/profile" className="py-3.5 bg-dark-900 text-white rounded-2xl flex justify-center font-bold text-sm tracking-wider hover:bg-accent-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>MY PROFILE</Link>
                                                <Link to="/orders" className="py-3.5 bg-accent-500 text-white rounded-2xl flex justify-center font-bold text-sm tracking-wider hover:bg-accent-600 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>MY ORDERS</Link>
                                            </div>
                                            <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-3.5 text-dark-400 font-medium text-sm border border-dark-100 rounded-2xl hover:border-red-200 hover:text-red-500 transition-all">LOGOUT</button>
                                        </>
                                    ) : (
                                        <Link to="/login" className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-2xl flex justify-center font-bold text-sm tracking-wider uppercase shadow-lg shadow-primary-600/20 hover:shadow-accent-500/40 transition-all" onClick={() => setIsMobileMenuOpen(false)}>Sign In / Register</Link>
                                    )}
                                </div>
                            </div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
