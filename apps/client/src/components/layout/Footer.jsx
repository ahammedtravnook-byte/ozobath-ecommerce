import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';

const footerLinks = {
    shop: [
        { label: 'Shower Enclosures', path: '/shop/shower-enclosures' },
        { label: 'Bathroom Fittings', path: '/shop/fittings' },
        { label: 'New Arrivals', path: '/shop?sort=newest' },
        { label: 'Best Sellers', path: '/shop?badge=best-seller' },
        { label: 'All Products', path: '/shop' },
    ],
    company: [
        { label: 'About Us', path: '/about' },
        { label: 'Experience Centre', path: '/experience-centre' },
        { label: 'Blog', path: '/blog' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'B2B Enquiry', path: '/b2b-enquiry' },
    ],
    support: [
        { label: 'FAQ', path: '/faq' },
        { label: 'Service Request', path: '/service-request' },
        { label: 'Order Tracking', path: '/track-order' },
        { label: 'Warranty & Care', path: '/warranty' },
        { label: 'Shipping Policy', path: '/shipping-policy' },
    ],
    legal: [
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Privacy Policy', path: '/privacy' },
    ],
};

const Footer = () => {
    return (
        <footer className="bg-dark-950 text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-display font-extrabold tracking-tight mb-4">
                            OZO<span className="text-primary-400">BATH</span>
                        </h2>
                        <p className="text-dark-300 text-sm leading-relaxed mb-6 max-w-sm">
                            Premium shower enclosures & bathroom fittings designed for Indian homes.
                            Engineered for durability, crafted for elegance.
                        </p>
                        <div className="flex flex-col gap-3 text-sm text-dark-300">
                            <a href="tel:+917899202927" className="flex items-center gap-2 hover:text-primary-400 transition-colors">
                                <FiPhone className="w-4 h-4" /> +91 78992 02927
                            </a>
                            <a href="mailto:ozobath@gmail.com" className="flex items-center gap-2 hover:text-primary-400 transition-colors">
                                <FiMail className="w-4 h-4" /> ozobath@gmail.com
                            </a>
                            <span className="flex items-start gap-2">
                                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /> India
                            </span>
                        </div>
                        {/* Social Links */}
                        <div className="flex items-center gap-3 mt-6">
                            {[FiInstagram, FiFacebook, FiYoutube].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-800 hover:bg-primary-600 transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).filter(([key]) => key !== 'legal').map(([key, links]) => (
                        <div key={key}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
                                {key === 'shop' ? 'Shop' : key === 'company' ? 'Company' : 'Support'}
                            </h3>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.path}>
                                        <Link
                                            to={link.path}
                                            className="text-sm text-dark-300 hover:text-primary-400 transition-colors duration-300"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-dark-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-dark-400">
                        © {new Date().getFullYear()} OZOBATH. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {footerLinks.legal.map((link) => (
                            <Link key={link.path} to={link.path} className="text-xs text-dark-400 hover:text-primary-400 transition-colors">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
