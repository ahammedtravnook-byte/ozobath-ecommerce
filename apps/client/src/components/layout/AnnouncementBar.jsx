import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const announcements = [
    '🚿 Free Shipping on orders above ₹999',
    '✨ Premium Shower Enclosures — Crafted for Perfection',
    '📞 Book a Free Site Visit — Expert Consultation',
    '🔧 5-Year Warranty on All Products',
];

const AnnouncementBar = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <motion.div
            className="announcement-bar relative"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <div className="overflow-hidden relative">
                <div className="marquee-track">
                    {[...announcements, ...announcements].map((text, i) => (
                        <span key={i} className="inline-flex items-center whitespace-nowrap px-8 text-[13px] tracking-wider">
                            {text}
                            <span className="mx-6 text-accent-500">•</span>
                        </span>
                    ))}
                </div>
            </div>

            <button
                onClick={() => setIsVisible(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close announcement"
            >
                <FiX className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
};

export default AnnouncementBar;
