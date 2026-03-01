import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import toast from 'react-hot-toast';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const WishlistPage = () => {
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        const fetchWishlist = async () => {
            try {
                const { wishlistAPI } = await import('@api/services');
                const res = await wishlistAPI.get();
                setWishlist(res.data?.products || []);
            } catch (e) { toast.error('Failed to load wishlist'); }
            finally { setLoading(false); }
        };
        fetchWishlist();
    }, [isAuthenticated, navigate]);

    const removeFromWishlist = async (productId) => {
        try {
            const { wishlistAPI } = await import('@api/services');
            await wishlistAPI.remove(productId);
            setWishlist(prev => prev.filter(p => p._id !== productId));
            toast.success('Removed from wishlist');
        } catch (e) { toast.error('Failed'); }
    };

    const moveToCart = async (product) => {
        await addToCart(product._id, 1);
        removeFromWishlist(product._id);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAF7F2] pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900">My Wishlist</h1>
                    {wishlist.length > 0 && <span className="text-sm text-dark-400 font-medium">{wishlist.length} item{wishlist.length > 1 ? 's' : ''}</span>}
                </motion.div>

                {wishlist.length === 0 ? (
                    <motion.div
                        className="text-center py-24"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiHeart className="w-10 h-10 text-pink-300" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-dark-400 mb-8 max-w-sm mx-auto">Save your favorite products here and come back to them later</p>
                        <Link to="/shop" className="inline-flex items-center gap-3 bg-dark-900 hover:bg-accent-500 text-white px-8 py-4 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-lg">
                            EXPLORE PRODUCTS <FiArrowRight />
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        <AnimatePresence mode="popLayout">
                            {wishlist.map(product => (
                                <motion.div
                                    key={product._id}
                                    layout
                                    variants={fadeInUp}
                                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                                    className="bg-white rounded-3xl overflow-hidden border border-dark-100/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
                                >
                                    <Link to={`/product/${product.slug}`} className="block relative">
                                        <div className="aspect-square bg-white p-6 flex items-center justify-center overflow-hidden">
                                            <img src={product.images?.[0]?.url || '/images/product_shower_1.png'} alt={product.name} className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover:scale-110" />
                                        </div>
                                    </Link>
                                    <div className="p-4 border-t border-dark-50">
                                        <Link to={`/product/${product.slug}`}>
                                            <h3 className="text-sm font-bold text-dark-900 line-clamp-1 mb-2 group-hover:text-accent-500 transition-colors">{product.name}</h3>
                                        </Link>
                                        <p className="text-lg font-extrabold text-dark-900 mb-4">₹{product.price?.toLocaleString()}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => moveToCart(product)}
                                                className="flex-1 py-2.5 bg-dark-900 hover:bg-accent-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <FiShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                                            </button>
                                            <button
                                                onClick={() => removeFromWishlist(product._id)}
                                                className="p-2.5 bg-dark-50 text-dark-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
