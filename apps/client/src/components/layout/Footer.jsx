import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiFacebook, FiYoutube, FiArrowRight, FiArrowUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useState } from 'react';

const footerLinks = {
    shop: [
        { label: 'Shower Enclosures', path: '/shop/shower-enclosures' },
        { label: 'Bathroom Fittings', path: '/shop/fittings' },
        { label: 'New Arrivals', path: '/shop?sort=newest' },
        { label: 'Best Sellers', path: '/shop?badge=best-seller' },
    ],
    company: [
        { label: 'About Us', path: '/about' },
        { label: 'Experience Centre', path: '/experience-centre' },
        { label: 'Blog', path: '/blog' },
        { label: 'Contact Us', path: '/contact' },
    ],
    support: [
        { label: 'FAQ', path: '/faq' },
        { label: 'Service Request', path: '/service-request' },
        { label: 'Order Tracking', path: '/track-order' },
        { label: 'Warranty & Care', path: '/warranty' },
    ],
    legal: [
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Shipping Policy', path: '/shipping-policy' },
    ],
};

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const Footer = () => {
    const [email, setEmail] = useState('');

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-dark-950 text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Back to Top Button */}
            <div className="relative z-10 flex justify-center -mt-6">
                <button
                    onClick={scrollToTop}
                    className="w-12 h-12 bg-accent-500 hover:bg-accent-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                >
                    <FiArrowUp className="w-5 h-5" />
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={stagger}
                >
                    {/* Brand Column */}
                    <motion.div variants={fadeInUp} className="lg:col-span-4">
                        <Link to="/" className="inline-block mb-6">
                            <h2 className="text-3xl font-display font-extrabold tracking-tight">
                                OZO<span className="text-accent-500">BATH</span>
                            </h2>
                        </Link>
                        <p className="text-dark-400 text-sm leading-relaxed mb-8 max-w-xs font-medium">
                            Premium bespoke shower enclosures & bathroom fittings. Designed for modern luxury, engineered for absolute precision.
                        </p>

                        <div className="flex flex-col gap-3.5 text-sm text-dark-300 font-medium">
                            <a href="tel:+917899202927" className="flex items-center gap-3 hover:text-accent-400 transition-all duration-300 group w-fit">
                                <span className="w-9 h-9 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-center group-hover:border-accent-500/50 group-hover:bg-accent-500/10 transition-all duration-300">
                                    <FiPhone className="w-4 h-4 group-hover:text-accent-400 transition-colors" />
                                </span>
                                +91 78992 02927
                            </a>
                            <a href="mailto:ozobath@gmail.com" className="flex items-center gap-3 hover:text-accent-400 transition-all duration-300 group w-fit">
                                <span className="w-9 h-9 rounded-xl bg-dark-900 border border-dark-800 flex items-center justify-center group-hover:border-accent-500/50 group-hover:bg-accent-500/10 transition-all duration-300">
                                    <FiMail className="w-4 h-4 group-hover:text-accent-400 transition-colors" />
                                </span>
                                ozobath@gmail.com
                            </a>
                        </div>
                    </motion.div>

                    {/* Links Columns */}
                    <motion.div variants={fadeInUp} className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {['shop', 'company', 'support'].map((key) => (
                            <div key={key}>
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-5">{key}</h3>
                                <ul className="space-y-3">
                                    {footerLinks[key].map((link) => (
                                        <li key={link.path}>
                                            <Link
                                                to={link.path}
                                                className="text-sm text-dark-400 hover:text-accent-400 hover:translate-x-1 inline-flex transition-all duration-300 font-medium items-center gap-1 group"
                                            >
                                                <FiArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </motion.div>

                    {/* Newsletter Column */}
                    <motion.div variants={fadeInUp} className="lg:col-span-4">
                        <div className="bg-gradient-to-br from-dark-900 to-dark-950 p-8 rounded-3xl border border-dark-800/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />

                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-3 relative z-10">Stay Inspired</h3>
                            <p className="text-dark-400 text-sm leading-relaxed mb-6 relative z-10">
                                Get the latest design inspiration, exclusive deals & new arrivals in your inbox.
                            </p>
                            <form className="relative z-10" onSubmit={(e) => e.preventDefault()}>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email address..."
                                        className="w-full bg-dark-950/80 border border-dark-700 text-white text-sm rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-500"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-accent-500 hover:bg-accent-400 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 hover:scale-105"
                                    >
                                        <FiArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-dark-800/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap justify-center gap-6">
                            {footerLinks.legal.map((link) => (
                                <Link key={link.path} to={link.path} className="text-xs text-dark-500 hover:text-accent-400 transition-colors font-medium">
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <p className="text-xs text-dark-500 font-medium text-center">
                            © {new Date().getFullYear()} OZOBATH. Crafted with excellence.
                        </p>

                        <div className="flex items-center gap-2">
                            {[
                                { Icon: FiInstagram, color: 'hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500' },
                                { Icon: FiFacebook, color: 'hover:bg-blue-600' },
                                { Icon: FiYoutube, color: 'hover:bg-red-600' },
                            ].map(({ Icon, color }, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl bg-dark-900 border border-dark-800 ${color} hover:text-white hover:border-transparent text-dark-400 transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
