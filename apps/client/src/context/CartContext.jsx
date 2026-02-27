import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '@api/services';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState({ items: [], totalAmount: 0 });
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            const res = await cartAPI.get();
            setCart(res.data || { items: [], totalAmount: 0 });
        } catch (e) {
            console.error('Cart fetch failed:', e);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const addToCart = useCallback(async (productId, quantity = 1, variant) => {
        try {
            const res = await cartAPI.add({ productId, quantity, variant });
            setCart(res.data);
            toast.success('Added to cart! 🛒');
        } catch (err) {
            toast.error(err.message || 'Failed to add to cart');
        }
    }, []);

    const updateQuantity = useCallback(async (itemId, quantity) => {
        try {
            const res = await cartAPI.update({ itemId, quantity });
            setCart(res.data);
        } catch (err) {
            toast.error(err.message || 'Failed to update');
        }
    }, []);

    const removeItem = useCallback(async (itemId) => {
        try {
            const res = await cartAPI.remove(itemId);
            setCart(res.data);
            toast.success('Item removed');
        } catch (err) {
            toast.error(err.message || 'Failed to remove');
        }
    }, []);

    const clearCart = useCallback(async () => {
        try {
            await cartAPI.clear();
            setCart({ items: [], totalAmount: 0 });
        } catch (err) {
            toast.error(err.message || 'Failed to clear cart');
        }
    }, []);

    const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const value = {
        cart, loading, itemCount,
        addToCart, updateQuantity, removeItem, clearCart, fetchCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
