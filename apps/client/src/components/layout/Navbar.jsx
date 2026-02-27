import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';

const navLinks = [
    { label: 'Shower Enclosures', path: '/shop/shower-enclosures' },
    { label: 'Fittings', path: '/shop/fittings' },
    { label: 'Experience Centre', path: '/experience-centre' },
    { label: 'B2B Enquiry', path: '/b2b-enquiry' },
    { label: 'Contact', path: '/contact' },
    { label: 'Shop Live', path: '/shop-live' },
];

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();
    const { itemCount } = useCart();
    const { count: wishlistCount } = useWishlist();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <>
            <motion.header
                className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled
                        ? 'bg-white/95 backdrop-blur-xl shadow-soft'
                        : 'bg-white'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-18">
                        {/* Logo */}
                        <Link to="/" className="flex-shrink-0">
                            <h1 className="text-2xl font-display font-extrabold tracking-tight text-dark-900">
                                OZO<span className="text-primary-600">BATH</span>
                            </h1>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`text-sm font-medium transition-all duration-300 hover:text-primary-600 relative group ${location.pathname === link.path ? 'text-primary-600' : 'text-dark-600'
                                        }`}
                                >
                                    {link.label}
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-600 transition-all duration-300 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                                        }`} />
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button className="p-2.5 hover:bg-dark-50 rounded-xl transition-colors" aria-label="Search">
                                <FiSearch className="w-5 h-5 text-dark-600" />
                            </button>
                            <Link to="/wishlist" className="p-2.5 hover:bg-dark-50 rounded-xl transition-colors relative" aria-label="Wishlist">
                                <FiHeart className="w-5 h-5 text-dark-600" />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center font-bold">
                                        {wishlistCount}
                                    </span>
                                )}
                            </Link>
                            <Link to="/cart" className="p-2.5 hover:bg-dark-50 rounded-xl transition-colors relative" aria-label="Cart">
                                <FiShoppingBag className="w-5 h-5 text-dark-600" />
                                {itemCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary-600 text-white text-2xs rounded-full flex items-center justify-center font-bold">
                                        {itemCount}
                                    </span>
                                )}
                            </Link>

                            {isAuthenticated ? (
                                <div className="hidden sm:flex items-center gap-2">
                                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 bg-dark-50 text-dark-900 text-sm font-medium rounded-xl hover:bg-dark-100 transition-all duration-300">
                                        <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        {user?.name?.split(' ')[0] || 'Profile'}
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="px-3 py-2 text-sm text-dark-400 hover:text-red-500 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-900 text-white text-sm font-medium rounded-xl hover:bg-dark-800 transition-all duration-300">
                                    <FiUser className="w-4 h-4" />
                                    Login
                                </Link>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                className="lg:hidden p-2.5 hover:bg-dark-50 rounded-xl transition-colors"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Menu"
                            >
                                {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                        <motion.nav
                            className="absolute right-0 top-0 w-80 h-full bg-white shadow-2xl p-8 pt-24 overflow-y-auto"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <div className="flex flex-col gap-6">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.path}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            to={link.path}
                                            className="text-lg font-medium text-dark-700 hover:text-primary-600 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                <hr className="border-dark-100" />
                                {isAuthenticated ? (
                                    <div className="space-y-3">
                                        <Link to="/profile" className="btn-secondary text-center block">My Profile</Link>
                                        <Link to="/orders" className="btn-secondary text-center block">My Orders</Link>
                                        <button onClick={logout} className="w-full text-sm text-red-500 py-2">Logout</button>
                                    </div>
                                ) : (
                                    <Link to="/login" className="btn-primary text-center">Sign In / Register</Link>
                                )}
                            </div>
                        </motion.nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
