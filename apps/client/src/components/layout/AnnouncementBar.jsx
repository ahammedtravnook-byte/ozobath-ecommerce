import { motion } from 'framer-motion';

const AnnouncementBar = () => {
    return (
        <motion.div
            className="announcement-bar"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <p className="text-sm tracking-wider">
                🚿 <span className="font-semibold">Free Shipping</span> on orders above ₹999 |
                <span className="ml-1 underline underline-offset-2 cursor-pointer hover:text-accent-300 transition-colors">
                    Book a Site Visit →
                </span>
            </p>
        </motion.div>
    );
};

export default AnnouncementBar;
