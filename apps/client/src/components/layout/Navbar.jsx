import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiMenu, FiX, FiUser, FiChevronDown, FiPhone } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/shop' },
    { label: 'Experience', path: '/experience-centre' },
    { label: 'B2B', path: '/b2b-enquiry' },
    { label: 'Contact', path: '/contact' },
];

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(null);
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
    }, [isMobileMenuOpen]);

    return (
        <>
            <motion.header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isScrolled ? 'py-2' : 'py-4'}
                `}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className={`flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-full
                            ${isScrolled
                                ? 'bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-6 py-2 border border-white/50'
                                : 'bg-white/70 backdrop-blur-md px-6 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-white/30'
                            }`}
                    >
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/25 group-hover:shadow-accent-500/40 transition-shadow group-hover:scale-105 transition-transform duration-300">
                                <span className="text-white font-bold text-sm">O</span>
                            </div>
                            <h1 className="text-xl font-display font-extrabold tracking-tight text-dark-900">
                                OZO<span className="text-accent-500">BATH</span>
                            </h1>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-0.5 relative" onMouseLeave={() => setHoveredPath(null)}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onMouseEnter={() => setHoveredPath(link.path)}
                                    className={`relative px-5 py-2.5 text-[13px] font-semibold transition-colors z-10
                                        ${location.pathname === link.path
                                            ? 'text-accent-500'
                                            : 'text-dark-600 hover:text-dark-900'
                                        }`}
                                >
                                    {link.label}
                                    {hoveredPath === link.path && (
                                        <motion.div
                                            layoutId="navbar-hover-pill"
                                            className="absolute inset-0 bg-accent-50 rounded-full -z-10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                    {location.pathname === link.path && !hoveredPath && (
                                        <motion.div
                                            layoutId="navbar-active-indicator"
                                            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent-500 rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                            {/* Search */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2.5 hover:bg-accent-50 rounded-full transition-all duration-300 hover:scale-105"
                                aria-label="Search"
                            >
                                <FiSearch className="w-[18px] h-[18px] text-dark-700" />
                            </button>

                            {/* Desktop specific actions */}
                            <div className="hidden sm:flex items-center gap-1.5">
                                <Link
                                    to="/wishlist"
                                    className="p-2.5 hover:bg-pink-50 rounded-full relative transition-all duration-300 hover:scale-105"
                                    aria-label="Wishlist"
                                >
                                    <FiHeart className="w-[18px] h-[18px] text-dark-700" />
                                    {wishlistCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm"
                                        >
                                            {wishlistCount}
                                        </motion.span>
                                    )}
                                </Link>

                                <Link
                                    to="/cart"
                                    className="p-2.5 hover:bg-blue-50 rounded-full relative transition-all duration-300 hover:scale-105"
                                    aria-label="Cart"
                                >
                                    <FiShoppingBag className="w-[18px] h-[18px] text-dark-700" />
                                    {itemCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-accent-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm"
                                        >
                                            {itemCount}
                                        </motion.span>
                                    )}
                                </Link>

                                <div className="w-px h-6 bg-dark-100 mx-1" />

                                {isAuthenticated ? (
                                    <Link
                                        to="/profile"
                                        className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-accent-400 to-accent-600 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-accent-500/30 transition-all duration-300 hover:scale-110"
                                    >
                                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </Link>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="ml-1 px-5 py-2 bg-dark-900 text-white text-[11px] font-bold rounded-full hover:bg-accent-500 transition-all duration-300 uppercase tracking-widest hover:shadow-lg hover:shadow-accent-500/20 hover:scale-105"
                                    >
                                        Sign In
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="lg:hidden p-2.5 hover:bg-dark-50 rounded-full transition-all duration-300 ml-1"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Menu"
                            >
                                <motion.div
                                    animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {isMobileMenuOpen
                                        ? <FiX className="w-5 h-5 text-dark-900" />
                                        : <FiMenu className="w-5 h-5 text-dark-900" />
                                    }
                                </motion.div>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Search Overlay */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-start justify-center pt-32"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div
                            className="absolute inset-0 bg-dark-900/40 backdrop-blur-md"
                            onClick={() => setIsSearchOpen(false)}
                        />
                        <motion.div
                            className="relative w-full max-w-2xl mx-4"
                            initial={{ y: -30, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: -20, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <div className="bg-white rounded-2xl shadow-2xl p-2 flex items-center">
                                <FiSearch className="w-5 h-5 text-dark-400 ml-4" />
                                <input
                                    type="text"
                                    placeholder="Search shower enclosures, fittings, accessories..."
                                    className="w-full py-4 px-4 text-base text-dark-900 placeholder:text-dark-300 focus:outline-none bg-transparent"
                                    autoFocus
                                />
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="p-2.5 hover:bg-dark-50 rounded-xl transition-colors mr-1"
                                >
                                    <FiX className="w-5 h-5 text-dark-400" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                        <motion.nav
                            className="absolute right-0 top-0 w-[85%] max-w-sm h-full bg-white shadow-2xl flex flex-col pt-24 pb-8 px-6 overflow-y-auto"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                        >
                            <div className="flex flex-col gap-2 flex-1">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.path}
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08, duration: 0.4 }}
                                    >
                                        <Link
                                            to={link.path}
                                            className={`flex items-center text-lg font-display font-semibold py-3 px-4 rounded-xl transition-all duration-300
                                                ${location.pathname === link.path
                                                    ? 'text-accent-500 bg-accent-50'
                                                    : 'text-dark-900 hover:bg-dark-50 hover:text-accent-500'
                                                }`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}

                                <hr className="border-dark-100 my-4" />

                                <div className="flex items-center gap-4 px-4 mb-4">
                                    <Link to="/wishlist" className="flex items-center gap-3 text-dark-500 font-medium text-sm hover:text-accent-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative p-2 bg-pink-50 rounded-xl">
                                            <FiHeart className="w-5 h-5 text-pink-500" />
                                            {wishlistCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
                                        </div>
                                        Wishlist
                                    </Link>
                                    <Link to="/cart" className="flex items-center gap-3 text-dark-500 font-medium text-sm hover:text-accent-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative p-2 bg-blue-50 rounded-xl">
                                            <FiShoppingBag className="w-5 h-5 text-blue-500" />
                                            {itemCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{itemCount}</span>}
                                        </div>
                                        Cart
                                    </Link>
                                </div>

                                <div className="mt-auto space-y-3">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent-50 to-orange-50 rounded-2xl">
                                                <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg shadow-accent-500/20">
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
                                        <Link to="/login" className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-orange-500 text-white rounded-2xl flex justify-center font-bold text-sm tracking-wider uppercase shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 transition-all" onClick={() => setIsMobileMenuOpen(false)}>Sign In / Register</Link>
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
