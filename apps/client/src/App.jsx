import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import AppRouter from './router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@context/AuthContext';
import { CartProvider } from '@context/CartContext';
import { WishlistProvider } from '@context/WishlistContext';

function App() {
    const location = useLocation();

    // ─── Lenis Smooth Scroll ────────────────────────
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    // ─── Scroll to top on route change ─────────────
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: '#1a1b1e',
                                color: '#fff',
                                borderRadius: '12px',
                                padding: '16px',
                                fontSize: '14px',
                            },
                        }}
                    />
                    <AnimatePresence mode="wait">
                        <AppRouter key={location.pathname} />
                    </AnimatePresence>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
