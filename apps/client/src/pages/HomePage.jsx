import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiPlay, FiShoppingCart, FiStar, FiArrowUpRight, FiCheckCircle, FiTruck, FiShield, FiAward, FiChevronDown } from 'react-icons/fi';
import { productAPI, categoryAPI } from '@api/services';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// ─── FAQ DATA ──────────────────────────────
const homeFAQs = [
    { question: 'What types of shower enclosures does OZOBATH offer?', answer: 'We offer frameless, semi-frameless, sliding door, corner/neo-angle, and walk-in shower enclosures. All use premium tempered safety glass (8mm, 10mm, 12mm) with optional anti-limescale nano coating.' },
    { question: 'Do you provide free shipping?', answer: 'Yes! Free shipping on all orders above ₹999 across India. Metro cities receive delivery in 3-5 business days, while other cities take 5-7 business days.' },
    { question: 'What warranty coverage do you provide?', answer: 'Shower enclosures come with a 5-year comprehensive warranty. Faucets and basin mixers have 3 years, and accessories have 2 years coverage against manufacturing defects.' },
    { question: 'Can I visit your showroom to see products?', answer: 'Absolutely! Visit our Experience Centre in Bangalore, Karnataka. Open Monday to Saturday, 10 AM to 7 PM. Our design consultants are available for personalized recommendations.' },
    { question: 'Do you offer professional installation?', answer: 'Yes, we offer professional installation services in Bangalore within 3 days of delivery. For other metro cities, installation is available on request. All products include detailed DIY installation guides.' },
    { question: 'What payment methods do you accept?', answer: 'We accept UPI (Google Pay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), net banking, EMI, and wallet payments via Razorpay. No-cost EMI available on orders above ₹10,000.' },
];

// ─── FAQ Accordion Item ────────────────────
const FAQItem = ({ item, isOpen, onToggle, index }) => (
    <motion.div
        className="border border-dark-100/40 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-300"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
        >
            <div className="flex items-center gap-4 flex-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${isOpen ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25' : 'bg-accent-50 text-accent-500'}`}>
                    {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className={`font-semibold text-sm md:text-base transition-colors duration-300 ${isOpen ? 'text-accent-500' : 'text-dark-900 group-hover:text-accent-500'}`}>
                    {item.question}
                </h3>
            </div>
            <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className={`shrink-0 ml-4 p-1 rounded-lg ${isOpen ? 'text-accent-500' : 'text-dark-300'}`}
            >
                <FiChevronDown className="w-5 h-5" />
            </motion.div>
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                        <div className="pl-12">
                            <div className="w-10 h-0.5 bg-gradient-to-r from-accent-400 to-orange-400 rounded-full mb-3" />
                            <p className="text-dark-500 text-sm leading-relaxed">{item.answer}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

// ─── FAQ Section ───────────────────────────
const FAQAccordionSection = () => {
    const [openIndex, setOpenIndex] = useState(0);
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
            >
                {/* Left — Title */}
                <motion.div variants={fadeInUp} className="lg:col-span-2">
                    <span className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">Got Questions?</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-dark-400 text-base mb-8 leading-relaxed">
                        Find quick answers to common questions about our products, shipping, warranty, and more.
                    </p>
                    <Link
                        to="/faq"
                        className="inline-flex items-center gap-3 bg-dark-900 hover:bg-accent-500 text-white px-8 py-4 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-lg hover:shadow-accent-500/30"
                    >
                        View All FAQs <FiArrowRight />
                    </Link>
                </motion.div>

                {/* Right — Accordion */}
                <div className="lg:col-span-3 space-y-3">
                    {homeFAQs.map((item, i) => (
                        <FAQItem
                            key={i}
                            item={item}
                            index={i}
                            isOpen={openIndex === i}
                            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
                        />
                    ))}
                </div>
            </motion.div>
        </section>
    );
};

// ─── FALLBACK DATA ────────────────────────
const fallbackProducts = [
    { _id: '1', name: 'Frameless Glass Enclosure', slug: 'frameless-glass', category: { name: 'Shower Enclosures' }, price: 15599, mrp: 21999, avgRating: 5, images: [{ url: '/images/product_shower_1.png' }] },
    { _id: '2', name: 'Sliding Door System', slug: 'sliding-door', category: { name: 'Shower Enclosures' }, price: 12499, mrp: 17999, avgRating: 4, images: [{ url: '/images/product_shower_2.png' }] },
    { _id: '3', name: 'Corner Glass Partition', slug: 'corner-partition', category: { name: 'Shower Enclosures' }, price: 18999, mrp: 24999, avgRating: 5, images: [{ url: '/images/product_shower_1.png' }] },
    { _id: '4', name: 'Walk-in Shower Screen', slug: 'walkin-screen', category: { name: 'Shower Enclosures' }, price: 9999, mrp: 14999, avgRating: 5, images: [{ url: '/images/product_shower_2.png' }] },
];

const fallbackBlogs = [
    { _id: 'b1', title: 'Modern Minimalist Bathroom Design Trends 2026', slug: 'minimalist-design-2026', category: 'Design', customDate: 'Feb 24, 2026', featuredImage: { url: '/images/promo_shower_enclosure.png' } },
    { _id: 'b2', title: 'How to Choose the Perfect Shower Enclosure', slug: 'choose-shower-enclosure', category: 'Guide', customDate: 'Feb 18, 2026', featuredImage: { url: '/images/promo_sliding_door.png' } },
    { _id: 'b3', title: 'Premium Bathroom Fittings: Complete Buying Guide', slug: 'bathroom-fittings-guide', category: 'Guide', customDate: 'Feb 12, 2026', featuredImage: { url: '/images/hero_bathroom.png' } },
];

const fallbackTestimonials = [
    { _id: 't1', name: 'Rajesh Kumar', location: 'Mumbai', rating: 5, text: 'The shower enclosure completely transformed our bathroom. Premium quality glass and flawless installation. Highly recommended!' },
    { _id: 't2', name: 'Priya Sharma', location: 'Delhi', rating: 5, text: 'Exceptional craftsmanship and attention to detail. The sliding door system works beautifully and looks stunning.' },
    { _id: 't3', name: 'Amit Patel', location: 'Bangalore', rating: 5, text: 'Best investment for our new home. The frameless design gives our bathroom a luxurious, open feel.' },
];

const trustBadges = [
    { icon: FiTruck, label: 'Free Shipping', sublabel: 'Orders above ₹999' },
    { icon: FiShield, label: '5-Year Warranty', sublabel: 'Complete protection' },
    { icon: FiAward, label: 'Premium Quality', sublabel: 'ISI Certified glass' },
    { icon: FiCheckCircle, label: 'Expert Install', sublabel: 'Professional fitting' },
];

// ─── ANIMATION VARIANTS ────────────────────
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const fadeInLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const fadeInRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const staggerFast = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

// ─── COMPONENT ────────────────────────────
const HomePage = () => {
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const heroRef = useRef(null);

    // State
    const [trending, setTrending] = useState([]);
    const [products, setProducts] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    // Parallax for hero
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    });
    const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    // Fetch dynamic content
    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const prodRes = await productAPI.getAll({ limit: 10 });
                if (prodRes.data?.products?.length > 0) {
                    setTrending(prodRes.data.products.slice(0, 4));
                    setProducts(prodRes.data.products.slice(0, 6));
                } else {
                    setTrending(fallbackProducts);
                    setProducts(fallbackProducts);
                }

                const catRes = await categoryAPI.getAll();
                if (catRes.data?.length > 0) {
                    setCategories(catRes.data.slice(0, 3));
                }

                try {
                    const blogRes = await axios.get(`${API_URL}/blogs?limit=3`);
                    if (blogRes.data?.data?.length > 0) setBlogs(blogRes.data.data.slice(0, 3));
                    else setBlogs(fallbackBlogs);
                } catch (e) { setBlogs(fallbackBlogs); }

            } catch (error) {
                console.error("Using fallback content");
                setTrending(fallbackProducts);
                setProducts(fallbackProducts);
                setBlogs(fallbackBlogs);
            }
        };
        fetchHomeData();
    }, []);

    const handleAddToCart = (product) => {
        if (!isAuthenticated) {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existing = guestCart.find(i => i.productId === product._id);
            if (existing) existing.quantity += 1;
            else guestCart.push({ productId: product._id, quantity: 1, product });
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            toast.success('Added to cart! 🛒');
        } else {
            addToCart(product._id, 1);
            toast.success('Added to cart!');
        }
    };

    return (
        <div className="bg-[#FAF7F2] min-h-screen text-dark-900 font-sans overflow-hidden">

            {/* ═══════════════════════════════════════════
                1. HERO SECTION
            ═══════════════════════════════════════════ */}
            <section ref={heroRef} className="relative w-full min-h-screen flex items-center overflow-hidden pt-28 pb-16">
                {/* Background Image with Parallax */}
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{ y: heroY }}
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
                        style={{ backgroundImage: `url('/images/hero_bathroom.png')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-950/70 via-dark-900/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950/30 via-transparent to-transparent" />
                </motion.div>

                <motion.div
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
                    style={{ opacity: heroOpacity }}
                >
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={stagger}
                            className="text-white"
                        >
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
                                <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-white/90">Premium Collection</span>
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] mb-6 tracking-tight">
                                Make Your{' '}
                                <span className="relative inline-block">
                                    <span className="text-accent-400">Bathroom</span>
                                    <motion.svg
                                        className="absolute -bottom-2 left-0 w-full"
                                        viewBox="0 0 200 12" fill="none"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 1, duration: 1, ease: "easeInOut" }}
                                    >
                                        <motion.path
                                            d="M2 8 C50 2, 150 2, 198 8"
                                            stroke="#E88A2D"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            fill="none"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ delay: 1, duration: 1.2 }}
                                        />
                                    </motion.svg>
                                </span>
                                <br />
                                Unique & Modern.
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-white/80 text-base md:text-lg max-w-lg mb-10 leading-relaxed font-medium">
                                Transform your space with premium bespoke shower enclosures. Crafted with precision, designed for modern luxury.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4">
                                <Link
                                    to="/shop"
                                    className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 hover:scale-105 transition-all duration-300"
                                >
                                    Discover Now <FiArrowUpRight className="text-lg" />
                                </Link>
                                <button className="flex items-center gap-3 text-white/90 hover:text-white font-semibold text-sm group transition-colors">
                                    <span className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                                        <FiPlay className="w-4 h-4 ml-0.5" />
                                    </span>
                                    Watch Video
                                </button>
                            </motion.div>

                            {/* Trust Stat */}
                            <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-3">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white/50 bg-accent-${i * 100 + 200} flex items-center justify-center text-[10px] font-bold text-white`}>
                                            {['R', 'P', 'A', 'S'][i - 1]}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-white/90 text-sm font-semibold">Loved by 3,500+ customers</p>
                                    <div className="flex items-center gap-1 text-accent-400">
                                        {[...Array(5)].map((_, i) => <FiStar key={i} className="w-3 h-3 fill-current" />)}
                                        <span className="text-white/60 text-xs ml-1">4.9/5</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Floating Product Card */}
                        <motion.div
                            className="hidden lg:flex justify-end"
                            initial={{ opacity: 0, y: 50, rotate: 3 }}
                            animate={{ opacity: 1, y: 0, rotate: 0 }}
                            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="relative">
                                <div className="glass-card p-6 rounded-3xl max-w-[280px] transform hover:scale-105 transition-all duration-500">
                                    <div className="bg-white rounded-2xl p-4 mb-4">
                                        <img
                                            src="/images/product_shower_1.png"
                                            alt="Featured Product"
                                            className="w-full h-40 object-contain"
                                        />
                                    </div>
                                    <h3 className="font-bold text-dark-900 text-sm mb-1">Frameless Enclosure</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-accent-500 font-extrabold text-lg">₹15,599</span>
                                        <span className="text-dark-300 text-xs line-through">₹21,999</span>
                                    </div>
                                </div>

                                {/* Floating badge */}
                                <motion.div
                                    className="absolute -top-4 -right-4 bg-accent-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-accent-500/30 text-xs font-bold"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    30% OFF
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <span className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-semibold">Scroll</span>
                    <div className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
                        <motion.div
                            className="w-1 h-2 bg-white/60 rounded-full"
                            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                2. TRUST BADGES
            ═══════════════════════════════════════════ */}
            <section className="relative -mt-16 z-20 max-w-6xl mx-auto px-4">
                <motion.div
                    className="bg-white rounded-3xl shadow-xl shadow-dark-900/5 p-8 grid grid-cols-2 md:grid-cols-4 gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerFast}
                >
                    {trustBadges.map((badge, i) => (
                        <motion.div
                            key={i}
                            variants={fadeInUp}
                            className="flex items-center gap-4 group cursor-default"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-accent-50 flex items-center justify-center group-hover:bg-accent-500 transition-colors duration-300 shrink-0">
                                <badge.icon className="w-5 h-5 text-accent-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <div>
                                <p className="font-bold text-dark-900 text-sm">{badge.label}</p>
                                <p className="text-dark-400 text-xs">{badge.sublabel}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                3. DUAL PROMO BANNERS
            ═══════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                >
                    {/* Promo 1 */}
                    <motion.div
                        variants={fadeInLeft}
                        className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] p-8 lg:p-10 flex items-center overflow-hidden group min-h-[280px] cursor-pointer hover:shadow-xl transition-shadow duration-500"
                    >
                        <div className="w-1/2 relative z-10">
                            <span className="text-accent-500 text-xs font-bold uppercase tracking-widest">Featured</span>
                            <h3 className="text-2xl lg:text-3xl font-display font-bold text-dark-900 mb-2 mt-1">Shower Enclosures</h3>
                            <p className="text-dark-400 text-sm mb-6 leading-relaxed">Premium frameless glass for modern bathrooms</p>
                            <Link to="/shop/shower-enclosures" className="inline-flex items-center gap-2 text-accent-500 font-bold text-sm uppercase tracking-wider group-hover:gap-3 transition-all duration-300">
                                SHOP NOW <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-center justify-center p-4">
                            <img
                                src="/images/promo_shower_enclosure.png"
                                alt="Shower Enclosure"
                                className="w-full h-full object-contain group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-700 ease-out"
                            />
                        </div>
                        {/* Decorative circle */}
                        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-accent-200/30 rounded-full blur-2xl" />
                    </motion.div>

                    {/* Promo 2 */}
                    <motion.div
                        variants={fadeInRight}
                        className="relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[2rem] p-8 lg:p-10 flex items-center overflow-hidden group min-h-[280px] cursor-pointer hover:shadow-xl transition-shadow duration-500"
                    >
                        <div className="w-1/2 relative z-10">
                            <span className="text-primary-500 text-xs font-bold uppercase tracking-widest">Popular</span>
                            <h3 className="text-2xl lg:text-3xl font-display font-bold text-dark-900 mb-2 mt-1">Bathroom Fittings</h3>
                            <p className="text-dark-400 text-sm mb-6 leading-relaxed">Precision engineered hardware & accessories</p>
                            <Link to="/shop/fittings" className="inline-flex items-center gap-2 text-primary-500 font-bold text-sm uppercase tracking-wider group-hover:gap-3 transition-all duration-300">
                                SHOP NOW <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="absolute right-0 bottom-0 w-1/2 h-full flex items-center justify-center p-4">
                            <img
                                src="/images/promo_sliding_door.png"
                                alt="Bathroom Fittings"
                                className="w-full h-full object-contain group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700 ease-out"
                            />
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-200/30 rounded-full blur-2xl" />
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                4. TRENDING PRODUCTS
            ═══════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <motion.div
                    className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                >
                    <motion.div variants={fadeInUp} className="max-w-xl">
                        <span className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">Bespoke Collection</span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900">Trending Products</h2>
                        <p className="text-dark-400 mt-3 text-base">Handpicked premium shower enclosures loved by our customers</p>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                        <Link to="/shop" className="text-dark-900 font-bold text-sm tracking-wider uppercase border-b-2 border-dark-900 pb-1 hover:text-accent-500 hover:border-accent-500 transition-all duration-300 inline-flex items-center gap-2">
                            View All <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={stagger}
                >
                    {trending.map((item, i) => (
                        <motion.div key={item._id || i} variants={fadeInUp} className="group cursor-pointer flex flex-col h-full">
                            <div className="bg-white rounded-3xl p-5 mb-4 aspect-[4/5] flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:shadow-xl group-hover:shadow-dark-900/8 border border-dark-100/50 group-hover:border-accent-200">
                                <Link to={`/product/${item.slug}`} className="absolute inset-0 z-10" />
                                <img src={item.images?.[0]?.url || '/images/product_shower_1.png'} alt={item.name} className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover:scale-110" />

                                {/* Quick Add Button */}
                                <div className="absolute bottom-4 left-4 right-4 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 z-20">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(item); }}
                                        className="w-full bg-dark-900 hover:bg-accent-500 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold tracking-wider uppercase shadow-xl transition-colors duration-300"
                                    >
                                        <FiShoppingCart className="w-4 h-4" /> Add to cart
                                    </button>
                                </div>

                                {/* Discount badge */}
                                {item.mrp > item.price && (
                                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg z-20">
                                        {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% Off
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col flex-1 px-1">
                                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider mb-1">{item.category?.name || 'Shower Enclosures'}</p>
                                <h3 className="font-bold text-dark-900 text-base mb-2 group-hover:text-accent-500 transition-colors line-clamp-1">{item.name}</h3>
                                <div className="flex justify-between items-center mt-auto">
                                    <div className="flex text-accent-400 text-xs gap-0.5">
                                        {[...Array(5)].map((_, star) => (
                                            <FiStar key={star} className={star < (item.avgRating || 5) ? 'fill-current' : 'text-dark-200'} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.mrp > item.price && <span className="text-dark-300 text-xs line-through">₹{item.mrp?.toLocaleString()}</span>}
                                        <span className="font-extrabold text-dark-900 text-lg">₹{item.price?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                5. PRODUCT SHOWCASE WITH TABS
            ═══════════════════════════════════════════ */}
            <section className="py-20 relative">
                {/* Watermark text */}
                <div className="absolute top-16 left-0 w-full overflow-hidden flex justify-center opacity-[0.02] pointer-events-none select-none z-0">
                    <span className="text-[12rem] font-extrabold whitespace-nowrap tracking-wider font-display">PRODUCT PRODUCT</span>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold text-dark-900">
                            PRODUCT
                        </motion.h2>
                        <motion.div variants={fadeInUp} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
                            {['all', 'Shower Enclosures', 'Fittings', 'Accessories'].map((tab, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-bold tracking-wider whitespace-nowrap transition-all duration-300 px-4 py-2 rounded-full
                                        ${activeTab === tab
                                            ? 'bg-dark-900 text-white shadow-lg'
                                            : 'text-dark-400 hover:text-dark-900 hover:bg-dark-100'
                                        }`}
                                >
                                    {tab === 'all' ? 'ALL' : tab.toUpperCase()}
                                </button>
                            ))}
                        </motion.div>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Large Featured Tile */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="lg:w-[38%] bg-gradient-to-br from-dark-100 to-dark-50 rounded-3xl relative overflow-hidden min-h-[420px] group"
                        >
                            <img
                                src="/images/sale_bathroom.png"
                                alt="Featured Product"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 z-10">
                                <span className="badge-featured mb-2">Featured</span>
                                <h3 className="text-white font-display font-bold text-xl">Premium Collection</h3>
                            </div>
                        </motion.div>

                        {/* Grid of smaller products */}
                        <motion.div
                            className="lg:w-[62%] grid grid-cols-2 md:grid-cols-3 gap-4"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerFast}
                        >
                            {products.map((item, i) => (
                                <motion.div
                                    key={item._id || i}
                                    variants={fadeInUp}
                                    className="group"
                                >
                                    <div className="bg-white border-2 border-transparent hover:border-accent-200 rounded-2xl p-4 mb-2 aspect-square flex flex-col items-center justify-center relative hover:shadow-lg transition-all duration-400">
                                        <Link to={`/product/${item.slug}`} className="absolute inset-0 z-10" />
                                        <img
                                            src={item.images?.[0]?.url || '/images/product_shower_1.png'}
                                            alt={item.name}
                                            className="w-[75%] h-[75%] object-contain transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <h4 className="font-semibold text-dark-900 text-xs truncate pr-2" title={item.name}>
                                            {item.name.length > 18 ? item.name.substring(0, 18) + '...' : item.name}
                                        </h4>
                                        <span className="font-bold text-accent-500 text-sm whitespace-nowrap">₹{item.price?.toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                6. SALE BANNER
            ═══════════════════════════════════════════ */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-amber-50/50" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-200/20 rounded-full blur-[100px]" />

                {/* Decorative elements */}
                <div className="absolute right-[25%] top-20 w-3 h-3 bg-accent-500 rotate-45 animate-pulse" />
                <div className="absolute right-[15%] bottom-28 w-4 h-4 rounded-full border-2 border-accent-400/50" />
                <div className="absolute left-[10%] top-32 w-6 h-6 rounded-full bg-accent-100" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-16 relative z-10">
                    <motion.div
                        className="lg:w-2/5 text-center lg:text-left"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <motion.p variants={fadeInUp} className="font-semibold tracking-[0.2em] text-dark-400 uppercase text-xs mb-4">
                            Premium Bathroom Sale
                        </motion.p>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-dark-900 mb-8 leading-tight">
                            SALE ENDS IN <br />
                            <span className="text-accent-500">1 DAY</span>
                        </motion.h2>
                        <motion.div variants={fadeInUp}>
                            <Link
                                to="/shop"
                                className="inline-flex items-center gap-3 bg-dark-900 hover:bg-accent-500 text-white px-8 py-4 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-300 shadow-xl hover:shadow-accent-500/30"
                            >
                                Order Now <FiArrowRight />
                            </Link>
                        </motion.div>

                        {/* Decorative arrow */}
                        <motion.div
                            variants={fadeInUp}
                            className="hidden lg:block mt-8"
                        >
                            <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
                                <path d="M5,40 Q30,60 60,30 T110,20" stroke="#E88A2D" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                                <path d="M100,10 L115,18 L105,30" stroke="#E88A2D" strokeWidth="2" fill="none" />
                            </svg>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="lg:w-3/5 relative"
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <img
                            src="/images/sale_bathroom.png"
                            alt="Premium Bathroom Sale"
                            className="w-full h-auto rounded-3xl shadow-2xl shadow-dark-900/10 relative z-10 max-h-[480px] object-cover"
                        />
                        {/* Circle highlight */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] h-[115%] border border-accent-300/30 rounded-[50%] rotate-[8deg]" />
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                7. TESTIMONIALS
            ═══════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <motion.div
                    className="text-center mb-14"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                >
                    <motion.span variants={fadeInUp} className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">
                        What Our Customers Say
                    </motion.span>
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold text-dark-900">
                        Customer Reviews
                    </motion.h2>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={stagger}
                >
                    {fallbackTestimonials.map((testimonial, i) => (
                        <motion.div
                            key={testimonial._id}
                            variants={fadeInUp}
                            className="bg-white rounded-3xl p-8 border border-dark-100/50 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1 transition-all duration-500 group"
                        >
                            <div className="flex text-accent-400 gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, s) => (
                                    <FiStar key={s} className="w-4 h-4 fill-current" />
                                ))}
                            </div>
                            <p className="text-dark-600 text-sm leading-relaxed mb-6 line-clamp-3">"{testimonial.text}"</p>
                            <div className="flex items-center gap-3 pt-4 border-t border-dark-50">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-dark-900 text-sm">{testimonial.name}</p>
                                    <p className="text-dark-400 text-xs">{testimonial.location}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                8. BLOGS SECTION
            ═══════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <motion.div
                    className="text-center max-w-2xl mx-auto mb-14"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                >
                    <motion.span variants={fadeInUp} className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">
                        From Our Blog
                    </motion.span>
                    <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">
                        Our Blogs
                    </motion.h2>
                    <motion.p variants={fadeInUp} className="text-dark-400">
                        Find bright ideas to transform your bathroom with our expert guides and design inspiration.
                    </motion.p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={stagger}
                >
                    {blogs.map((blog, i) => (
                        <motion.div
                            key={blog._id}
                            variants={fadeInUp}
                            className="group cursor-pointer"
                        >
                            <Link to={`/blog/${blog.slug || blog._id}`}>
                                <div className="rounded-3xl overflow-hidden mb-5 aspect-[4/3] relative">
                                    <img
                                        src={blog.featuredImage?.url || '/images/hero_bathroom.png'}
                                        alt={blog.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-sm text-dark-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                                            {blog.category || 'Design'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-dark-400 mb-3 font-medium">
                                    <span>{new Date(blog.createdAt || blog.customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="w-1 h-1 bg-dark-300 rounded-full" />
                                    <span>5 min read</span>
                                </div>
                                <h3 className="text-lg font-bold text-dark-900 group-hover:text-accent-500 transition-colors duration-300 line-clamp-2">
                                    {blog.title}
                                </h3>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                9. FAQ ACCORDION
            ═══════════════════════════════════════════ */}
            <FAQAccordionSection />

            {/* ═══════════════════════════════════════════
                10. NEWSLETTER CTA
            ═══════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <motion.div
                    className="relative bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Decorative glows */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px]" />

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                            Get Exclusive <span className="text-accent-400">Deals</span>
                        </h2>
                        <p className="text-white/60 max-w-md mx-auto mb-10 text-base">
                            Subscribe and get 10% off your first order. Plus, be the first to know about new collections and exclusive offers.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-accent-500 transition-colors backdrop-blur-sm"
                            />
                            <button className="bg-accent-500 hover:bg-accent-400 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 hover:scale-105 whitespace-nowrap">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </motion.div>
            </section>

        </div>
    );
};

export default HomePage;
