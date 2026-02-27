import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistAPI } from '@api/services';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
    return ctx;
};

export const WishlistProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [wishlist, setWishlist] = useState({ products: [] });

    const fetchWishlist = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await wishlistAPI.get();
            setWishlist(res.data || { products: [] });
        } catch (e) {
            console.error('Wishlist fetch failed:', e);
        }
    }, [isAuthenticated]);

    useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

    const addToWishlist = useCallback(async (productId) => {
        try {
            const res = await wishlistAPI.add(productId);
            setWishlist(res.data);
            toast.success('Added to wishlist ❤️');
        } catch (err) {
            toast.error(err.message || 'Failed');
        }
    }, []);

    const removeFromWishlist = useCallback(async (productId) => {
        try {
            const res = await wishlistAPI.remove(productId);
            setWishlist(res.data);
            toast.success('Removed from wishlist');
        } catch (err) {
            toast.error(err.message || 'Failed');
        }
    }, []);

    const isInWishlist = useCallback((productId) => {
        return wishlist.products?.some((p) => (p._id || p) === productId);
    }, [wishlist]);

    const value = {
        wishlist, count: wishlist.products?.length || 0,
        addToWishlist, removeFromWishlist, isInWishlist, fetchWishlist,
    };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
