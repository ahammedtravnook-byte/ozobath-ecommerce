import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiSearch, FiArrowRight } from 'react-icons/fi';

const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-4 py-20 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-20 right-[15%] w-72 h-72 bg-accent-500/5 rounded-full blur-[100px]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-20 left-[10%] w-96 h-96 bg-primary-500/5 rounded-full blur-[120px]"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Floating shapes */}
                <motion.div
                    className="absolute top-[30%] right-[20%] w-4 h-4 bg-accent-400/20 rotate-45"
                    animate={{ y: [0, -20, 0], rotate: [45, 90, 45] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[25%] left-[25%] w-3 h-3 rounded-full bg-primary-400/20"
                    animate={{ y: [0, 15, 0], scale: [1, 1.5, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-[15%] left-[30%] w-5 h-5 rounded-full border-2 border-accent-300/20"
                    animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <motion.div
                className="relative z-10 max-w-2xl w-full text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* SVG Illustration — Shower Head */}
                <motion.div
                    className="mx-auto mb-8 w-48 h-48 relative"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        {/* Shower head */}
                        <motion.rect x="70" y="20" width="60" height="12" rx="6" fill="#E88A2D" fillOpacity="0.9" />
                        <motion.rect x="95" y="32" width="10" height="35" rx="5" fill="#C4C6CA" />
                        {/* Water drops */}
                        <motion.circle cx="80" cy="80" r="3" fill="#0084f0" fillOpacity="0.6"
                            animate={{ y: [0, 40, 80], opacity: [0.8, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        />
                        <motion.circle cx="95" cy="80" r="2.5" fill="#0084f0" fillOpacity="0.5"
                            animate={{ y: [0, 50, 90], opacity: [0.7, 0.4, 0] }}
                            transition={{ duration: 2.3, repeat: Infinity, delay: 0.3 }}
                        />
                        <motion.circle cx="110" cy="80" r="3" fill="#0084f0" fillOpacity="0.6"
                            animate={{ y: [0, 45, 85], opacity: [0.8, 0.5, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
                        />
                        <motion.circle cx="87" cy="85" r="2" fill="#0084f0" fillOpacity="0.4"
                            animate={{ y: [0, 35, 70], opacity: [0.6, 0.3, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: 0.9 }}
                        />
                        <motion.circle cx="103" cy="82" r="2.5" fill="#0084f0" fillOpacity="0.5"
                            animate={{ y: [0, 42, 78], opacity: [0.7, 0.4, 0] }}
                            transition={{ duration: 2.1, repeat: Infinity, delay: 0.4 }}
                        />
                        {/* Floor puddle */}
                        <motion.ellipse cx="100" cy="175" rx="40" ry="6" fill="#0084f0" fillOpacity="0.08"
                            animate={{ rx: [35, 45, 35] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </svg>
                </motion.div>

                {/* Glassmorphism card */}
                <div className="glass-morph p-10 md:p-14">
                    <motion.h1
                        className="text-8xl md:text-9xl font-display font-extrabold gradient-text mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        404
                    </motion.h1>

                    <motion.h2
                        className="text-2xl md:text-3xl font-display font-bold text-dark-900 mb-3"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        Page Not Found
                    </motion.h2>

                    <motion.p
                        className="text-dark-400 text-base max-w-md mx-auto mb-10 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        Oops! The page you're looking for seems to have gone down the drain. Let's get you back to exploring premium bathroom solutions.
                    </motion.p>

                    {/* Action buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-accent-500 text-white font-bold text-sm rounded-full hover:bg-accent-600 transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 hover:scale-105 uppercase tracking-wider"
                        >
                            <FiHome className="w-4 h-4" /> Go Home
                        </Link>
                        <Link
                            to="/shop"
                            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-dark-900 text-white font-bold text-sm rounded-full hover:bg-accent-500 transition-all duration-300 shadow-lg hover:shadow-accent-500/20 hover:scale-105 uppercase tracking-wider"
                        >
                            <FiShoppingBag className="w-4 h-4" /> Browse Shop
                        </Link>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        className="pt-6 border-t border-dark-100/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                    >
                        <p className="text-dark-300 text-xs font-semibold uppercase tracking-widest mb-4">Quick Links</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {[
                                { label: 'Shower Enclosures', path: '/shop/shower-enclosures' },
                                { label: 'Contact Us', path: '/contact' },
                                { label: 'FAQ', path: '/faq' },
                                { label: 'Track Order', path: '/track-order' },
                            ].map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="text-xs font-medium text-dark-500 hover:text-accent-500 bg-dark-50 hover:bg-accent-50 px-4 py-2 rounded-full transition-all duration-300 inline-flex items-center gap-1.5 group"
                                >
                                    {link.label}
                                    <FiArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFoundPage;
