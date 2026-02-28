import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiFacebook, FiYoutube, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

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

const Footer = () => {
    return (
        <footer className="bg-dark-950 text-white relative overflow-hidden pt-20">
            {/* Massive Watermark */}
            <div className="absolute -top-10 left-0 w-full flex justify-center opacity-[0.02] pointer-events-none select-none z-0">
                <span className="text-[18vw] font-extrabold whitespace-nowrap tracking-tighter font-display leading-none">O Z O B A T H</span>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">

                    {/* Brand Column */}
                    <div className="lg:col-span-4">
                        <Link to="/" className="inline-block mb-8">
                            <h2 className="text-3xl font-display font-extrabold tracking-tight">
                                OZO<span className="text-accent-500">BATH</span>
                            </h2>
                        </Link>
                        <p className="text-dark-400 text-sm leading-relaxed mb-8 max-w-sm font-medium">
                            Premium bespoke shower enclosures & bathroom fittings. Designed for modern luxury, engineered for absolute precision.
                        </p>

                        <div className="flex flex-col gap-4 text-sm text-dark-300 font-medium">
                            <a href="tel:+917899202927" className="flex items-center gap-3 hover:text-accent-400 transition-colors group w-fit">
                                <span className="w-8 h-8 rounded-full bg-dark-900 border border-dark-800 flex items-center justify-center group-hover:border-accent-500 transition-colors">
                                    <FiPhone className="w-3.5 h-3.5 group-hover:text-accent-500" />
                                </span>
                                +91 78992 02927
                            </a>
                            <a href="mailto:ozobath@gmail.com" className="flex items-center gap-3 hover:text-accent-400 transition-colors group w-fit">
                                <span className="w-8 h-8 rounded-full bg-dark-900 border border-dark-800 flex items-center justify-center group-hover:border-accent-500 transition-colors">
                                    <FiMail className="w-3.5 h-3.5 group-hover:text-accent-500" />
                                </span>
                                ozobath@gmail.com
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {['shop', 'company', 'support'].map((key) => (
                            <div key={key}>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-6">
                                    {key.replace('_', ' ')}
                                </h3>
                                <ul className="space-y-4">
                                    {footerLinks[key].map((link) => (
                                        <li key={link.path}>
                                            <Link
                                                to={link.path}
                                                className="text-sm text-dark-400 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 font-medium"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Newsletter Column */}
                    <div className="lg:col-span-4 bg-dark-900 p-8 rounded-3xl border border-dark-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl -z-10"></div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">Stay Inspired</h3>
                        <p className="text-dark-400 text-sm leading-relaxed mb-6">
                            Subscribe to our newsletter to receive the latest design inspiration, ideas, and news directly in your inbox.
                        </p>
                        <form className="relative mt-8" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Email address..."
                                className="w-full bg-dark-950 border border-dark-800 text-white text-sm rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-accent-500 transition-colors"
                                required
                            />
                            <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-accent-500 hover:bg-white hover:text-dark-900 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105">
                                <FiArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-wrap justify-center gap-6">
                        {footerLinks.legal.map((link) => (
                            <Link key={link.path} to={link.path} className="text-xs text-dark-500 hover:text-white transition-colors font-medium">
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <p className="text-xs text-dark-500 font-medium text-center">
                        © {new Date().getFullYear()} OZOBATH E-commerce. Crafted with excellence.
                    </p>

                    <div className="flex items-center gap-2">
                        {[FiInstagram, FiFacebook, FiYoutube].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-dark-900 hover:bg-accent-500 hover:text-white text-dark-300 transition-all duration-300 hover:scale-110"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
