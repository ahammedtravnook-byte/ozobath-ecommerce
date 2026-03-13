import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiMenu, FiX, FiUser, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { productAPI } from '@api/services';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSearch = useCallback((value) => {
        setQuery(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (value.trim().length < 2) { setResults([]); setLoading(false); return; }

        setLoading(true);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await productAPI.getAll({ search: value.trim(), limit: 8 });
                setResults(res.data?.products || []);
            } catch (e) {
                setResults([]);
            }
            setLoading(false);
        }, 400);
    }, []);

    const handleSelect = (slug) => {
        onClose();
        navigate(`/product/${slug}`);
    };

    return (
        <motion.div
            className="fixed inset-0 z-[60] flex items-start justify-center pt-24 sm:pt-32"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-md" onClick={onClose} />
            <motion.div
                className="relative w-full max-w-2xl mx-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Search Input */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 flex items-center border-b border-dark-50">
                        <FiSearch className="w-5 h-5 text-dark-400 ml-4" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full py-4 px-4 text-base text-dark-900 placeholder:text-dark-300 bg-transparent"
                        />
                        {query && (
                            <button onClick={() => handleSearch('')} className="p-2 hover:bg-dark-50 rounded-lg mr-1">
                                <FiX className="w-4 h-4 text-dark-400" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2.5 hover:bg-dark-50 rounded-xl transition-colors mr-1">
                            <FiX className="w-5 h-5 text-dark-400" />
                        </button>
                    </div>

                    {/* Results */}
                    {query.length >= 2 && (
                        <div className="max-h-[50vh] overflow-y-auto p-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="w-8 h-8 border-3 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
                                </div>
                            ) : results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((product) => (
                                        <button
                                            key={product._id}
                                            onClick={() => handleSelect(product.slug)}
                                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-accent-50 transition-colors text-left group"
                                        >
                                            <div className="w-14 h-14 bg-dark-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                                                <img
                                                    src={product.images?.[0]?.url || '/images/product_shower_1.png'}
                                                    alt={product.name}
                                                    className="w-10 h-10 object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-dark-900 truncate group-hover:text-accent-500 transition-colors">{product.name}</p>
                                                <p className="text-xs text-dark-400">{product.category?.name || 'Product'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-dark-900">₹{product.price?.toLocaleString()}</p>
                                                {product.mrp > product.price && (
                                                    <p className="text-[10px] text-red-500 font-semibold">
                                                        {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                                                    </p>
                                                )}
                                            </div>
                                            <FiArrowRight className="w-4 h-4 text-dark-300 group-hover:text-accent-500 transition-colors shrink-0" />
                                        </button>
                                    ))}
                                    <Link
                                        to={`/shop?search=${encodeURIComponent(query)}`}
                                        onClick={onClose}
                                        className="mt-2 w-full flex items-center justify-center gap-2 py-3 text-accent-500 font-semibold text-sm hover:bg-accent-50 rounded-xl transition-colors"
                                    >
                                        View all results <FiArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-dark-400 text-sm mb-1">No products found for "{query}"</p>
                                    <p className="text-dark-300 text-xs">Try a different search term</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
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
                                src="/images/Ozo-bath-3-2.jpg.jpeg"
                                alt="OzoBath"
                                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
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
                                        src="/images/Ozo-bath-3-2.jpg.jpeg"
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
                                <div className="flex items-center gap-3 px-2 mb-4">
                                    <Link to="/wishlist" className="flex-1 flex items-center gap-3 p-3 bg-pink-50/80 rounded-2xl hover:bg-pink-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative">
                                            <FiHeart className="w-5 h-5 text-pink-500" />
                                            {wishlistCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
                                        </div>
                                        <span className="text-dark-600 font-medium text-sm">Wishlist</span>
                                    </Link>
                                    <Link to="/cart" className="flex-1 flex items-center gap-3 p-3 bg-blue-50/80 rounded-2xl hover:bg-blue-50 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative">
                                            <FiShoppingBag className="w-5 h-5 text-blue-500" />
                                            {itemCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{itemCount}</span>}
                                        </div>
                                        <span className="text-dark-600 font-medium text-sm">Cart</span>
                                    </Link>
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
                                            <Link to="/profile" className="w-full py-3.5 bg-dark-900 text-white rounded-2xl flex justify-center font-bold text-sm tracking-wider hover:bg-accent-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>MY PROFILE</Link>
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
