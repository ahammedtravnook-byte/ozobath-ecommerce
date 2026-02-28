import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiPlay, FiShoppingCart, FiStar, FiSearch, FiArrowUpRight } from 'react-icons/fi';
import { productAPI, categoryAPI } from '@api/services';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// --- FALLBACK DATA ---
const fallbackProducts = [
    { _id: '1', name: 'Partial Shower Enclosure', slug: 'partial', category: { name: 'Shower Enclosures' }, price: 559, mrp: 799, avgRating: 5, images: [{ url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop' }] },
    { _id: '2', name: 'Sliding Standard Enclosure', slug: 'sliding', category: { name: 'Shower Enclosures' }, price: 666, mrp: 850, avgRating: 4, images: [{ url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=600&auto=format&fit=crop' }] },
    { _id: '3', name: 'Swing Gold Glossy', slug: 'swing', category: { name: 'Shower Enclosures' }, price: 749, mrp: 999, avgRating: 5, images: [{ url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?q=80&w=600&auto=format&fit=crop' }] },
    { _id: '4', name: 'L-Shape Double Door', slug: 'l-shape', category: { name: 'Shower Enclosures' }, price: 699, mrp: 1049, avgRating: 5, images: [{ url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=600&auto=format&fit=crop' }] },
];

const fallbackBlogs = [
    { _id: 'b1', title: 'Going all-in with minimalist bath design', category: 'Decor', customDate: 'Aug 24, 2024', featuredImage: { url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=600&auto=format&fit=crop' } },
    { _id: 'b2', title: 'Exploring new ways of showering', category: 'Lifestyle', customDate: 'Aug 26, 2024', featuredImage: { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=600&auto=format&fit=crop' } },
    { _id: 'b3', title: 'Handmade pieces that take time to make', category: 'Craftsmanship', customDate: 'Aug 28, 2024', featuredImage: { url: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=600&auto=format&fit=crop' } },
];

const HomePage = () => {
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();

    // State
    const [trending, setTrending] = useState([]);
    const [products, setProducts] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('all');

    // Fetch dynamic content
    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                // Products
                const prodRes = await productAPI.getAll({ limit: 10 });
                if (prodRes.data?.products?.length > 0) {
                    setTrending(prodRes.data.products.slice(0, 4));
                    setProducts(prodRes.data.products.slice(0, 6)); // for grid
                } else {
                    setTrending(fallbackProducts);
                    setProducts(fallbackProducts);
                }

                // Categories
                const catRes = await categoryAPI.getAll();
                if (catRes.data?.length > 0) {
                    setCategories(catRes.data.slice(0, 3));
                }

                // Blogs
                try {
                    const blogRes = await axios.get(`${API_URL}/blogs?limit=3`);
                    if (blogRes.data?.data?.length > 0) setBlogs(blogRes.data.data.slice(0, 3));
                    else setBlogs(fallbackBlogs);
                } catch (e) { setBlogs(fallbackBlogs); }

            } catch (error) {
                console.error("Failed fetching dynamic content, using fallbacks");
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

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    const staggerRules = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };

    return (
        <div className="bg-[#FAF7F2] min-h-screen text-dark-900 font-sans overflow-hidden">

            {/* 1. HERO SECTION */}
            <section className="relative w-full flex flex-col items-center justify-center text-center overflow-hidden min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
                {/* Full-bleed background image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                    style={{ backgroundImage: `url('/images/hero_bg_decor_bath.png')` }}
                ></div>
                {/* Subtle gradient overlay to ensure white text pops */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10 z-0"></div>

                <motion.div
                    className="w-full max-w-5xl z-10 flex flex-col items-center mt-[-5vh]"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerRules}
                >
                    <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-[5.5rem] font-display font-medium text-white leading-[1.1] mb-6 tracking-tight uppercase">
                        Masterpieces Crafted <br className="hidden md:block" /> For Your Bathroom
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-white/95 text-sm md:text-base max-w-2xl mx-auto mb-10 font-medium tracking-wide">
                        Our company is happy to take up production of custom-made premium shower enclosures according to individual sizes and aesthetic needs.
                    </motion.p>

                    <motion.div variants={fadeInUp}>
                        <Link to="/shop" className="bg-white text-dark-900 px-8 py-3.5 rounded-full font-bold shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                            Explore <FiArrowUpRight className="text-base" />
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* 2. DUAL PROMO BANNERS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pink Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-rose-50 rounded-3xl p-8 lg:p-12 flex relative overflow-hidden group items-center"
                    >
                        <div className="w-1/2 z-10">
                            <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">Partial Enclosure</h3>
                            <p className="text-dark-500 text-sm mb-6">Minimalist glass highlights</p>
                            <Link to="/shop" className="text-accent-500 font-bold text-sm tracking-wider uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                                SHOP NOW <FiArrowRight />
                            </Link>
                        </div>
                        <div className="w-1/2 absolute right-0 bottom-0 h-full flex items-end">
                            <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop" alt="Partial" className="w-[120%] h-[120%] object-cover opacity-90 mix-blend-multiply group-hover:scale-105 transition-transform duration-700 origin-bottom-right" />
                        </div>
                    </motion.div>

                    {/* Blue Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ delay: 0.2 }}
                        className="bg-blue-50 rounded-3xl p-8 lg:p-12 flex relative overflow-hidden group items-center"
                    >
                        <div className="w-1/2 z-10">
                            <h3 className="text-2xl font-display font-bold text-dark-900 mb-2">Sliding Solution</h3>
                            <p className="text-dark-500 text-sm mb-6">Space-saving elegant highlights</p>
                            <Link to="/shop" className="text-accent-500 font-bold text-sm tracking-wider uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                                SHOP NOW <FiArrowRight />
                            </Link>
                        </div>
                        <div className="w-1/2 absolute right-0 bottom-0 top-0 flex items-center justify-end pr-4">
                            <img src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=400&auto=format&fit=crop" alt="Sliding" className="w-[110%] h-auto max-h-full object-cover rounded-xl shadow-lg mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 3. TRENDING PRODUCTS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <span className="text-accent-500 font-bold uppercase tracking-widest text-xs mb-3 block">Bespoke Collection</span>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900">Trending Products</h2>
                    </div>
                    <Link to="/shop" className="text-dark-900 font-bold text-sm tracking-wider uppercase border-b-2 border-dark-900 pb-1 hover:text-accent-500 hover:border-accent-500 transition-all">
                        View All Categories
                    </Link>
                </div>

                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerRules}
                >
                    {trending.map((item, i) => (
                        <motion.div key={i} variants={fadeInUp} className="group cursor-pointer flex flex-col h-full">
                            <div className="bg-[#f8f5f0] rounded-3xl p-6 mb-6 aspect-[4/5] flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-dark-900/10">
                                <Link to={`/product/${item.slug}`} className="absolute inset-0 z-10" />
                                <img src={item.images?.[0]?.url || ''} alt={item.name} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />

                                {/* Quick Add Button Overlay */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-4/5 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                    <button
                                        onClick={(e) => { e.preventDefault(); handleAddToCart(item); }}
                                        className="w-full bg-dark-900 text-white py-3 rounded-full flex items-center justify-center gap-2 hover:bg-accent-500 text-sm font-bold tracking-wider uppercase shadow-xl"
                                    >
                                        Add to cart
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col flex-1 px-2">
                                <h3 className="font-bold text-dark-900 text-lg mb-2 group-hover:text-accent-500 transition-colors line-clamp-1">{item.name}</h3>
                                <div className="flex justify-between items-center mt-auto">
                                    <div className="flex text-accent-400 text-xs">
                                        {[...Array(5)].map((_, star) => <FiStar key={star} className={star < (item.avgRating || 5) ? 'fill-current' : 'text-gray-200'} />)}
                                    </div>
                                    <span className="font-bold text-dark-900 text-xl tracking-tight">₹{item.price?.toLocaleString() || '0'}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* 4. PRODUCT FILTER COMPONENT */}
            <section className="py-24 relative">
                {/* Watermark text */}
                <div className="absolute top-10 left-0 w-full overflow-hidden flex justify-center opacity-[0.03] pointer-events-none select-none z-0">
                    <span className="text-[12rem] font-extrabold whitespace-nowrap tracking-wider font-display">PRODUCT PRODUCT</span>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                        <h2 className="text-4xl font-display font-bold text-dark-900">PRODUCT</h2>
                        <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                            {['all', 'Shower Enclosures', 'Fittings', 'Accessories'].map((tab, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-bold tracking-wider whitespace-nowrap transition-colors ${activeTab === tab ? 'text-accent-500 border-b-2 border-accent-500 pb-1' : 'text-dark-400 hover:text-dark-900'}`}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Large Featured Tile */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="lg:w-[40%] bg-[#e8eaf0] rounded-3xl relative overflow-hidden min-h-[400px]"
                        >
                            <img src="https://images.unsplash.com/photo-1595514535312-d98ebb59e5e7?q=80&w=600&auto=format&fit=crop" alt="Featured" className="absolute bottom-0 right-0 w-[90%] h-[90%] object-cover object-bottom" />
                        </motion.div>

                        {/* Grid of smaller products */}
                        <div className="lg:w-[60%] grid grid-cols-2 md:grid-cols-3 gap-6">
                            {products.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group"
                                >
                                    <div className="bg-white border-2 border-transparent hover:border-gray-50 rounded-2xl p-4 mb-3 aspect-square flex flex-col items-center justify-center relative hover:shadow-xl transition-all duration-300">
                                        <Link to={`/product/${item.slug}`} className="absolute inset-0 z-10" />
                                        <img src={item.images?.[0]?.url || ''} alt={item.name} className="w-[70%] h-[70%] object-contain mb-2 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110" />
                                    </div>
                                    <div className="flex justify-between items-center bg-white">
                                        <h4 className="font-semibold text-dark-900 text-sm truncate pr-2" title={item.name}>{item.name.replace(' Shower ', ' ')}</h4>
                                        <span className="font-bold text-accent-500 text-sm whitespace-nowrap">₹{item.price?.toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. SALE BANNER */}
            <section className="bg-slate-50 py-24 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-yellow-100/50 rounded-full blur-3xl -z-10"></div>
                <div className="absolute right-[20%] top-20 w-3 h-3 bg-accent-500 rotate-45"></div>
                <div className="absolute right-[10%] bottom-32 w-4 h-4 rounded-full border-2 border-accent-400"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-16">
                    <motion.div
                        className="lg:w-1/3 text-center lg:text-left z-10"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <p className="font-semibold tracking-wider text-dark-500 uppercase text-sm mb-4">World Best Sales</p>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-dark-900 mb-8 leading-tight">SALE ENDS IN <br /> 1 DAY</h2>
                        <Link to="/shop" className="bg-dark-900 text-white px-8 py-4 text-sm font-bold tracking-wider uppercase flex items-center gap-3 justify-center lg:justify-start w-fit mx-auto lg:mx-0 hover:bg-accent-500 transition-colors">
                            Order Now <FiArrowRight />
                        </Link>

                        {/* Decorative drawn line (Mockup of the curly arrow in ref) */}
                        <div className="hidden lg:block mt-8">
                            <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5,40 Q30,60 60,30 T110,20" stroke="#f97316" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                                <path d="M100,10 L115,18 L105,30" stroke="#f97316" strokeWidth="2" fill="none" />
                            </svg>
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-2/3 relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <img src="https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1000&auto=format&fit=crop" alt="Premium Sofa / Enclosure Placeholder" className="w-[120%] h-auto rounded-3xl z-10 relative object-cover max-h-[500px]" />
                        {/* Circle highlight */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[120%] border border-dark-900 rounded-[50%] -z-10 rotate-[10deg]"></div>
                    </motion.div>
                </div>
            </section>

            {/* 6. BLOGS SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-bold text-dark-900 mb-4">Our Blogs</h2>
                    <p className="text-dark-400">Find a bright idea to suit your taste with our great selection of bathroom styles.</p>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerRules}
                >
                    {blogs.map((blog, i) => (
                        <motion.div key={i} variants={fadeInUp} className="group cursor-pointer">
                            <div className="rounded-2xl overflow-hidden mb-6 aspect-[4/3]">
                                <img src={blog.featuredImage?.url || ''} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold text-dark-400 mb-3 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><FiStar className="text-accent-500" fill="currentColor" /> Admin</span>
                                <span>•</span>
                                <span>{new Date(blog.createdAt || blog.customDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <h3 className="text-xl font-bold text-dark-900 group-hover:text-accent-500 transition-colors">{blog.title}</h3>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

        </div>
    );
};

export default HomePage;
