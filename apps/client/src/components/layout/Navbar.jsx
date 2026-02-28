import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
    { label: 'Enclosures', path: '/shop/shower-enclosures' },
    { label: 'Fittings', path: '/shop/fittings' },
    { label: 'Experience', path: '/experience-centre' },
    { label: 'B2B', path: '/b2b-enquiry' },
    { label: 'Live', path: '/shop-live' },
];

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(null);
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const { itemCount } = useCart();
    const { count: wishlistCount } = useWishlist();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Check on mount
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            <motion.header
                className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${isScrolled ? 'pt-4 px-4' : 'pt-8 px-4'}
                `}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div
                    className={`w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled
                            ? 'max-w-5xl bg-white/80 backdrop-blur-xl shadow-2xl rounded-full border border-white/20 px-6 py-2'
                            : 'max-w-7xl bg-transparent px-4 py-2'
                        }`}
                >
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2 pr-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-400 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/30">
                                <span className="text-white font-bold text-sm">O</span>
                            </div>
                            <h1 className="text-xl font-display font-extrabold tracking-tight text-dark-900">
                                OZO<span className="text-accent-500">BATH</span>
                            </h1>
                        </Link>

                        {/* Desktop Navigation with Awesome Sliding Animation */}
                        <nav className="hidden lg:flex items-center gap-1 relative" onMouseLeave={() => setHoveredPath(null)}>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onMouseEnter={() => setHoveredPath(link.path)}
                                    className={`relative px-4 py-2.5 text-[12px] uppercase tracking-widest font-bold transition-colors z-10 ${location.pathname === link.path ? 'text-accent-500' : 'text-dark-600 hover:text-dark-900'
                                        }`}
                                >
                                    {link.label}
                                    {hoveredPath === link.path && (
                                        <motion.div
                                            layoutId="navbar-hover-pill"
                                            className="absolute inset-0 bg-gray-100 rounded-full -z-10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {location.pathname === link.path && !hoveredPath && (
                                        <motion.div
                                            layoutId="navbar-active-dot"
                                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent-500 rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pl-4">
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-all hover:scale-110" aria-label="Search">
                                <FiSearch className="w-5 h-5 text-dark-800" />
                            </button>

                            {/* Desktop specific actions */}
                            <div className="hidden sm:flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
                                <Link to="/wishlist" className="p-2 hover:bg-gray-100 rounded-full relative transition-all hover:scale-110" aria-label="Wishlist">
                                    <FiHeart className="w-5 h-5 text-dark-800" />
                                    {wishlistCount > 0 && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-0 right-0 w-4 h-4 bg-accent-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm">
                                            {wishlistCount}
                                        </motion.span>
                                    )}
                                </Link>
                                <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full relative transition-all hover:scale-110" aria-label="Cart">
                                    <FiShoppingBag className="w-5 h-5 text-dark-800" />
                                    {itemCount > 0 && (
                                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-0 right-0 w-4 h-4 bg-accent-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-sm">
                                            {itemCount}
                                        </motion.span>
                                    )}
                                </Link>

                                {isAuthenticated ? (
                                    <div className="flex items-center gap-2 ml-2">
                                        <Link to="/profile" className="flex items-center justify-center w-9 h-9 bg-dark-900 text-white text-sm font-bold rounded-full hover:bg-accent-500 transition-colors shadow-md hover:scale-110">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </Link>
                                    </div>
                                ) : (
                                    <Link to="/login" className="ml-2 px-6 py-2.5 bg-dark-900 text-white text-[11px] font-bold rounded-full hover:bg-accent-500 transition-all uppercase tracking-widest hover:shadow-lg shadow-sm">
                                        Sign In
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                className="lg:hidden p-2 hover:bg-dark-50 rounded-full transition-colors ml-1"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <FiX className="w-6 h-6 text-dark-900" /> : <FiMenu className="w-6 h-6 text-dark-900" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                        <motion.nav
                            className="absolute right-0 top-0 w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col pt-24 pb-8 px-6 overflow-y-auto"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="flex flex-col gap-6 flex-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className="text-2xl font-display font-medium text-dark-900 hover:text-accent-500 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <hr className="border-gray-100 my-4" />

                                <div className="flex items-center gap-6 mb-6">
                                    <Link to="/wishlist" className="flex items-center gap-3 text-dark-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative">
                                            <FiHeart className="w-6 h-6" />
                                            {wishlistCount > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 bg-accent-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
                                        </div>
                                        Wishlist
                                    </Link>
                                    <Link to="/cart" className="flex items-center gap-3 text-dark-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative">
                                            <FiShoppingBag className="w-6 h-6" />
                                            {itemCount > 0 && <span className="absolute -top-1 -right-2 w-4 h-4 bg-accent-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{itemCount}</span>}
                                        </div>
                                        Cart
                                    </Link>
                                </div>

                                <div className="mt-auto">
                                    {isAuthenticated ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-4">
                                                <div className="w-12 h-12 bg-accent-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark-900">{user?.name || 'User'}</p>
                                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                                </div>
                                            </div>
                                            <Link to="/profile" className="w-full py-4 bg-dark-900 text-white rounded-2xl flex justify-center font-bold tracking-wider" onClick={() => setIsMobileMenuOpen(false)}>MY PROFILE</Link>
                                            <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full py-4 text-dark-400 font-medium border border-gray-200 rounded-2xl">LOGOUT</button>
                                        </div>
                                    ) : (
                                        <Link to="/login" className="w-full py-4 bg-accent-500 text-white rounded-2xl flex justify-center font-bold tracking-wider uppercase" onClick={() => setIsMobileMenuOpen(false)}>Sign In / Register</Link>
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
