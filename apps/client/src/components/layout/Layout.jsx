import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';

const pageVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.25, ease: 'easeInOut' }
    },
};

const Layout = () => {
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
        <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
            {/* Animated Gradient Scroll Progress Bar */}
            <div
                className="scroll-progress"
                style={{ width: `${scrollProgress}%` }}
            />

            <AnnouncementBar />
            <Navbar />
            <motion.main
                className="flex-grow"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
            >
                <Outlet />
            </motion.main>
            <Footer />
        </div>
    );
};

export default Layout;
