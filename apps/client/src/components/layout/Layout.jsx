import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import ChatBot from '@components/ChatBot';

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
    },
    exit: {
        opacity: 0,
        y: -8,
        transition: { duration: 0.2, ease: 'easeInOut' }
    },
};

const Layout = () => {
    const location = useLocation();
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Animated Gradient Scroll Progress Bar */}
            <div
                className="scroll-progress"
                style={{ width: `${scrollProgress}%` }}
            />

            <AnnouncementBar />
            <Navbar />
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    className="flex-grow"
                    variants={pageVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                >
                    <Outlet />
                </motion.main>
            </AnimatePresence>
            <Footer />
            <ChatBot />
        </div>
    );
};

export default Layout;
