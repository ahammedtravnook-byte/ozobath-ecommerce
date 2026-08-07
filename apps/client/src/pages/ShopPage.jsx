import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiGrid, FiList, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight, FiX, FiSliders, FiHeart, FiChevronDown } from 'react-icons/fi';
import { productAPI, categoryAPI } from '@api/services';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { useWishlist } from '@context/WishlistContext';
import toast from 'react-hot-toast';
import SEO from '@components/SEO';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const fallbackProducts = [
    { _id: '1', name: 'Frameless Glass Enclosure', slug: 'frameless-glass', category: { name: 'Shower Enclosures' }, price: 15599, mrp: 21999, avgRating: 5, reviewCount: 24, images: [{ url: '/images/product_shower_1.webp' }] },
    { _id: '2', name: 'Sliding Door System', slug: 'sliding-door', category: { name: 'Shower Enclosures' }, price: 12499, mrp: 17999, avgRating: 4, reviewCount: 18, images: [{ url: '/images/product_shower_2.webp' }] },
    { _id: '3', name: 'Corner Glass Partition', slug: 'corner-partition', category: { name: 'Shower Enclosures' }, price: 18999, mrp: 24999, avgRating: 5, reviewCount: 31, images: [{ url: '/images/product_shower_1.webp' }] },
    { _id: '4', name: 'Walk-in Shower Screen', slug: 'walkin-screen', category: { name: 'Shower Enclosures' }, price: 9999, mrp: 14999, avgRating: 5, reviewCount: 42, images: [{ url: '/images/product_shower_2.webp' }] },
    { _id: '5', name: 'Swing Door Enclosure', slug: 'swing-door', category: { name: 'Shower Enclosures' }, price: 13499, mrp: 18999, avgRating: 4, reviewCount: 15, images: [{ url: '/images/product_shower_1.webp' }] },
    { _id: '6', name: 'Semi-Frameless Panel', slug: 'semi-frameless', category: { name: 'Shower Enclosures' }, price: 8999, mrp: 12999, avgRating: 5, reviewCount: 27, images: [{ url: '/images/product_shower_2.webp' }] },
    { _id: '7', name: 'L-Shape Double Door', slug: 'l-shape-double', category: { name: 'Shower Enclosures' }, price: 22999, mrp: 29999, avgRating: 5, reviewCount: 19, images: [{ url: '/images/product_shower_1.webp' }] },
    { _id: '8', name: 'Curved Glass Enclosure', slug: 'curved-glass', category: { name: 'Shower Enclosures' }, price: 26999, mrp: 34999, avgRating: 5, reviewCount: 12, images: [{ url: '/images/product_shower_2.webp' }] },
];

const ShopPage = () => {
    const { category: categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [viewMode, setViewMode] = useState('grid');

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState(categorySlug || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
    const [priceRange, setPriceRange] = useState([0, 50000]);
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [showFilters, setShowFilters] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const params = { page, limit: 12 };
            if (search) params.search = search;
            if (selectedCategory) params.category = selectedCategory;
            if (sortBy) params.sort = sortBy;
            if (priceRange[0] > 0) params.minPrice = priceRange[0];
            if (priceRange[1] < 50000) params.maxPrice = priceRange[1];

            const res = await productAPI.getAll(params);
            if (res.data?.products?.length > 0) {
                setProducts(res.data.products);
                setPagination(res.data.pagination || { total: res.data.products.length, pages: 1 });
            } else {
                setProducts(fallbackProducts);
                setPagination({ total: fallbackProducts.length, pages: 1 });
            }
        } catch (e) {
            setProducts(fallbackProducts);
            setPagination({ total: fallbackProducts.length, pages: 1 });
        } finally {
            setLoading(false);
        }
    }, [page, search, selectedCategory, sortBy, priceRange]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => {
        categoryAPI.getAll().then(res => setCategories(res.data || [])).catch(() => { });
    }, []);

    // Sync state with URL params (Params and SearchParams)
    useEffect(() => {
        const queryCategory = searchParams.get('category');
        const querySearch = searchParams.get('search');
        const querySort = searchParams.get('sort');
        const queryPage = searchParams.get('page');

        if (categorySlug) {
            setSelectedCategory(categorySlug);
        } else if (queryCategory) {
            setSelectedCategory(queryCategory);
        } else if (!queryCategory && !categorySlug) {
            setSelectedCategory('');
        }

        if (querySearch !== null) setSearch(querySearch);
        if (querySort) setSortBy(querySort);
        if (queryPage) setPage(Number(queryPage));

        // Smooth scroll to top when category changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [categorySlug, searchParams]);

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
        }
    };

    const isShowerEnclosure = (product) =>
        product?.category?.slug === 'shower-enclosures' || product?.category?.name?.toLowerCase().includes('shower');

    const handleBookVisit = (e, product) => {
        e.preventDefault();
        const img = encodeURIComponent(product.images?.[0]?.url || '');
        const name = encodeURIComponent(product.name || '');
        navigate(`/book-site-visit?productId=${product._id}&productName=${name}&productImage=${img}`);
    };

    const discount = (product) => product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#ffffff]">
            <SEO
                title="Shop All Products"
                description="Browse premium shower enclosures, glass partitions, shower panels and bathroom fittings from OzoBath. Free shipping above Rs.999 across India."
            />
            {/* Hero Banner */}
            <section className="relative bg-dark-900 text-white pt-8 sm:pt-16 md:pt-20 pb-8 sm:pb-10 md:pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-900 to-dark-800" />
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-20 w-56 h-56 bg-primary-500 rounded-full blur-3xl" />
                </div>
                <motion.div
                    className="max-width-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-dark-400 mb-3">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-white">Shop</span>
                        {selectedCategory && <><span>/</span><span className="text-accent-400">{categories.find(c => c.slug === selectedCategory || c._id === selectedCategory)?.name || selectedCategory}</span></>}
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold mb-2">
                        {selectedCategory ? categories.find(c => c.slug === selectedCategory || c._id === selectedCategory)?.name || 'Shop' : 'Our Collection'}
                    </h1>
                    <p className="text-dark-400 text-sm sm:text-lg max-w-xl">Premium bathroom solutions crafted with precision for your dream space</p>
                </motion.div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                {/* ── Desktop Toolbar ─────────────────────── */}
                <motion.div
                    className="hidden md:block bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 border border-dark-100/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-wrap flex-1">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                <input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search products..."
                                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all font-medium"
                                />
                            </div>
                            <div className="h-8 w-px bg-dark-100 hidden lg:block mx-1" />

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-dark-400 uppercase tracking-widest hidden lg:block mr-1">Category</span>
                                <div className="relative">
                                    <select 
                                        value={selectedCategory} 
                                        onChange={e => { setSelectedCategory(e.target.value); setPage(1); }} 
                                        className="py-3 px-5 pr-10 bg-dark-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 font-bold text-dark-700 cursor-pointer hover:bg-dark-100 transition-all appearance-none"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-dark-400 uppercase tracking-widest hidden lg:block mr-1">Sort By</span>
                                <div className="relative">
                                    <select 
                                        value={sortBy} 
                                        onChange={e => setSortBy(e.target.value)} 
                                        className="py-3 px-5 pr-10 bg-dark-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 font-bold text-dark-700 cursor-pointer hover:bg-dark-100 transition-all appearance-none"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="price_asc">Price: Low → High</option>
                                        <option value="price_desc">Price: High → Low</option>
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                    </select>
                                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                            <p className="text-xs font-bold text-dark-400 uppercase tracking-widest">{pagination.total} products</p>
                            <div className="flex bg-dark-50 p-1 rounded-2xl border border-dark-100/50">
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-dark-900 text-white shadow-lg shadow-dark-900/20' : 'text-dark-400 hover:text-dark-700 hover:bg-dark-100'}`}><FiGrid className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-dark-900 text-white shadow-lg shadow-dark-900/20' : 'text-dark-400 hover:text-dark-700 hover:bg-dark-100'}`}><FiList className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="md:hidden mb-8">
                    {/* Search bar */}
                    <div className="relative mb-4 group">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-accent-500 transition-colors" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search products..."
                            className="w-full pl-11 pr-4 py-4 bg-white border border-dark-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all shadow-sm font-medium"
                        />
                    </div>

                    {/* Filter + Sort row */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-dark-100 rounded-2xl text-sm font-bold text-dark-900 shadow-sm active:scale-95 transition-all"
                        >
                            <FiSliders className="w-4 h-4 text-accent-500" />
                            Filters
                            {(selectedCategory || search) && <span className="w-1.5 h-1.5 bg-accent-500 rounded-full" />}
                        </button>
                        <div className="flex-1 relative">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full py-4 pl-4 pr-10 bg-white border border-dark-100 rounded-2xl text-sm font-bold text-dark-900 shadow-sm focus:outline-none focus:border-accent-500 appearance-none"
                            >
                                <option value="newest">Sort: New</option>
                                <option value="price_asc">Price ↑</option>
                                <option value="price_desc">Price ↓</option>
                                <option value="popular">Popular</option>
                                <option value="rating">Rated</option>
                            </select>
                            <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
                        </div>
                        <div className="flex bg-white border border-dark-100 rounded-2xl overflow-hidden shadow-sm">
                            <button onClick={() => setViewMode('grid')} className={`px-3.5 transition-all duration-300 ${viewMode === 'grid' ? 'bg-dark-900 text-white' : 'text-dark-400'}`}><FiGrid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('list')} className={`px-3.5 transition-all duration-300 ${viewMode === 'list' ? 'bg-dark-900 text-white' : 'text-dark-400'}`}><FiList className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Results count */}
                    <p className="text-[10px] text-dark-400 font-black uppercase tracking-widest mt-4 px-2">{pagination.total} products found</p>
                </div>

                {/* ── Mobile Filter Bottom Drawer ───────────── */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-end md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
                            <motion.div
                                className="relative w-full bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-10"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* Handle */}
                                <div className="w-10 h-1 bg-dark-200 rounded-full mx-auto mb-5" />

                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-dark-900">Filter Products</h3>
                                    <button onClick={() => setShowFilters(false)} className="w-9 h-9 rounded-xl bg-dark-50 flex items-center justify-center">
                                        <FiX className="w-4 h-4 text-dark-500" />
                                    </button>
                                </div>

                                {/* Category filter */}
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-dark-900 uppercase tracking-widest mb-3">Category</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => { setSelectedCategory(''); setPage(1); }}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${!selectedCategory ? 'bg-dark-900 text-white border-dark-900' : 'border-dark-100 text-dark-500 hover:border-dark-300'}`}
                                        >
                                            All
                                        </button>
                                        {categories.map(c => (
                                            <button
                                                key={c._id}
                                                onClick={() => { setSelectedCategory(c._id); setPage(1); }}
                                                className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedCategory === c._id ? 'bg-accent-500 text-white border-accent-500 shadow-lg shadow-accent-500/20' : 'border-dark-100 text-dark-500 hover:border-accent-300'}`}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-dark-900 uppercase tracking-widest mb-3">Sort By</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[['newest', 'Newest First'], ['price_asc', 'Price: Low → High'], ['price_desc', 'Price: High → Low'], ['popular', 'Most Popular'], ['rating', 'Highest Rated']].map(([val, label]) => (
                                            <button
                                                key={val}
                                                onClick={() => setSortBy(val)}
                                                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-left ${sortBy === val ? 'bg-dark-900 text-white border-dark-900' : 'border-dark-100 text-dark-600'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Apply button */}
                                <button
                                    onClick={() => { setShowFilters(false); setPage(1); }}
                                    className="w-full py-4 bg-accent-500 hover:bg-accent-400 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-accent-500/20"
                                >
                                    Apply Filters
                                </button>
                                {(selectedCategory || search) && (
                                    <button
                                        onClick={() => { setSelectedCategory(''); setSearch(''); setPage(1); setShowFilters(false); }}
                                        className="w-full py-3 text-sm text-dark-400 font-semibold mt-2 hover:text-dark-600 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Products Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
                        <p className="text-dark-400 text-sm font-medium animate-pulse">Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <motion.div
                        className="text-center py-24"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiSearch className="w-8 h-8 text-dark-300" />
                        </div>
                        <p className="text-2xl font-display font-bold text-dark-900 mb-2">No products found</p>
                        <p className="text-dark-400 mb-6">Try adjusting your filters or search terms</p>
                        <button
                            onClick={() => { setSearch(''); setSelectedCategory(''); setSortBy('newest'); setPage(1); }}
                            className="btn-primary text-sm"
                        >
                            Clear All Filters
                        </button>
                    </motion.div>
                ) : viewMode === 'grid' ? (
                    <motion.div
                        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        {products.map(product => (
                            <motion.div key={product._id} variants={fadeInUp} className="group">
                                <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-dark-100/30 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                                    <Link to={`/product/${product.slug}`} className="block relative">
                                        <div className="aspect-square bg-white p-4 sm:p-6 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={product.images?.[0]?.url || '/images/product_shower_1.webp'}
                                                alt={product.name}
                                                className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        </div>
                                        {discount(product) > 0 && (
                                            <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shadow-lg">
                                                {discount(product)}% OFF
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product._id); }}
                                            className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90
                                                ${isInWishlist(product._id) ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-sm text-dark-300 hover:text-red-500'}`}
                                        >
                                            <FiHeart className={`w-3.5 h-3.5 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                                        </button>
                                    </Link>
                                    <div className="p-3 sm:p-4 border-t border-dark-50 flex flex-col flex-1">
                                        <Link to={`/product/${product.slug}`} className="flex-1">
                                            <p className="text-[9px] sm:text-[10px] text-accent-500 font-bold uppercase tracking-widest mb-1">{product.category?.name}</p>
                                            <h3 className="text-xs sm:text-sm font-bold text-dark-900 line-clamp-2 mb-2 group-hover:text-accent-500 transition-colors leading-snug">{product.name}</h3>
                                        </Link>
                                        <div className="flex items-center gap-0.5 mb-2">
                                            {[...Array(5)].map((_, s) => <FiStar key={s} className={`w-2.5 h-2.5 text-accent-400 ${s < (product.avgRating || 0) ? 'fill-current' : 'text-dark-200'}`} />)}
                                            {product.reviewCount > 0 && <span className="text-[9px] text-dark-300 ml-1">({product.reviewCount})</span>}
                                        </div>
                                        <div className="flex flex-col gap-2.5 mt-auto">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm sm:text-base font-extrabold text-dark-900">₹{product.price?.toLocaleString()}</span>
                                                    {product.mrp > product.price && <span className="text-[10px] text-dark-300 line-through ml-1.5">₹{product.mrp?.toLocaleString()}</span>}
                                                </div>
                                                {!isShowerEnclosure(product) && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                                                        className="w-9 h-9 bg-dark-900 hover:bg-accent-500 text-white rounded-xl sm:flex hidden items-center justify-center transition-all duration-300 active:scale-95 shadow-md shrink-0"
                                                    >
                                                        <FiShoppingCart className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {isShowerEnclosure(product) ? (
                                                <button
                                                    onClick={(e) => handleBookVisit(e, product)}
                                                    className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.97] shadow-sm"
                                                >
                                                    Book Visit
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                                                    className="w-full py-3.5 bg-dark-900 hover:bg-accent-500 text-white rounded-xl sm:hidden flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.97] shadow-sm"
                                                >
                                                    <FiShoppingCart className="w-3.5 h-3.5" /> ADD TO CART
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div className="space-y-4" initial="hidden" animate="visible" variants={stagger}>
                        {products.map(product => (
                            <motion.div
                                key={product._id}
                                variants={fadeInUp}
                                className="bg-white rounded-2xl border border-dark-100/20 flex flex-row items-center gap-4 sm:gap-6 p-4 md:p-6 hover:shadow-xl hover:border-accent-500/20 transition-all duration-500 group relative overflow-hidden"
                            >
                                <Link to={`/product/${product.slug}`} className="shrink-0">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl bg-dark-50/50 border border-dark-100/10 flex items-center justify-center overflow-hidden">
                                        <img src={product.images?.[0]?.url || '/images/product_shower_1.webp'} alt={product.name} className="w-[85%] h-[85%] object-contain group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <p className="text-[10px] sm:text-[11px] text-accent-500 font-bold uppercase tracking-[0.15em] mb-1 sm:mb-1.5">{product.category?.name || 'Sanitary & Accessories'}</p>
                                            <Link to={`/product/${product.slug}`}>
                                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-dark-900 leading-tight group-hover:text-accent-500 transition-colors line-clamp-2">{product.name}</h3>
                                            </Link>
                                        </div>
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product._id); }}
                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 shrink-0 ml-4
                                                ${isInWishlist(product._id) ? 'bg-red-50 text-red-500' : 'bg-dark-50 text-dark-300 hover:text-red-500 hover:bg-red-50'}`}
                                            aria-label="Add to wishlist"
                                        >
                                            <FiHeart className={`w-4 h-4 sm:w-[1.125rem] sm:h-[1.125rem] ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1.5 mb-3">
                                        <div className="flex text-accent-400 text-xs gap-0.5">
                                            {[...Array(5)].map((_, s) => <FiStar key={s} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${s < (product.avgRating || 0) ? 'fill-current' : 'text-dark-200'}`} />)}
                                        </div>
                                        {product.reviewCount > 0 && <span className="text-[10px] sm:text-[11px] text-dark-300 font-medium ml-1">({product.reviewCount})</span>}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-auto">
                                        <div className="flex items-baseline gap-2 sm:gap-3">
                                            <span className="text-base sm:text-xl md:text-2xl font-black text-dark-900 tracking-tight">₹{product.price?.toLocaleString()}</span>
                                            {product.mrp > product.price && <span className="text-[11px] sm:text-sm text-dark-300 line-through opacity-70">₹{product.mrp?.toLocaleString()}</span>}
                                            {discount(product) > 0 && <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 sm:bg-emerald-50 sm:px-2 sm:py-0.5 rounded-lg">{discount(product)}% OFF</span>}
                                        </div>

                                        {isShowerEnclosure(product) ? (
                                            <button
                                                onClick={(e) => handleBookVisit(e, product)}
                                                className="bg-accent-500 hover:bg-accent-600 text-white h-10 sm:h-12 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20 active:scale-95"
                                            >
                                                Book Visit
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                                                className="bg-dark-900 hover:bg-accent-500 text-white h-10 sm:h-12 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-dark-900/10 hover:shadow-accent-500/20 active:scale-95 group/btn"
                                            >
                                                <FiShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                <span>ADD TO CART</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="w-10 h-10 bg-white border border-dark-100 rounded-xl text-sm disabled:opacity-30 hover:bg-dark-50 flex items-center justify-center transition-colors"
                        >
                            <FiChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300
                                    ${page === p ? 'bg-dark-900 text-white shadow-lg' : 'bg-white border border-dark-100 hover:bg-dark-50 text-dark-700'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                            disabled={page === pagination.pages}
                            className="w-10 h-10 bg-white border border-dark-100 rounded-xl text-sm disabled:opacity-30 hover:bg-dark-50 flex items-center justify-center transition-colors"
                        >
                            <FiChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPage;
