import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import toast from 'react-hot-toast';

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

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="section-wrapper">
            <h1 className="text-3xl font-display font-bold text-dark-900 mb-8">My Wishlist</h1>
            {wishlist.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">💝</div>
                    <h2 className="text-2xl font-semibold text-gray-300 mb-2">Your wishlist is empty</h2>
                    <Link to="/shop" className="btn-primary mt-4">Explore Products</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {wishlist.map(product => (
                        <div key={product._id} className="premium-card group">
                            <Link to={`/product/${product.slug}`} className="block">
                                <div className="product-image-zoom aspect-square bg-gray-100">
                                    <img src={product.images?.[0]?.url || '/placeholder.jpg'} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                            </Link>
                            <div className="p-4">
                                <Link to={`/product/${product.slug}`}><h3 className="text-sm font-semibold text-dark-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{product.name}</h3></Link>
                                <p className="text-lg font-bold text-dark-900 mb-3">₹{product.price?.toLocaleString()}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => moveToCart(product)} className="flex-1 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700">Move to Cart</button>
                                    <button onClick={() => removeFromWishlist(product._id)} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;
