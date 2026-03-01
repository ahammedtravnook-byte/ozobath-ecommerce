import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiGrid, FiList, FiShoppingCart, FiStar, FiChevronLeft, FiChevronRight, FiX, FiSliders } from 'react-icons/fi';
import { productAPI, categoryAPI } from '@api/services';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const fallbackProducts = [
    { _id: '1', name: 'Frameless Glass Enclosure', slug: 'frameless-glass', category: { name: 'Shower Enclosures' }, price: 15599, mrp: 21999, avgRating: 5, reviewCount: 24, images: [{ url: '/images/product_shower_1.png' }] },
    { _id: '2', name: 'Sliding Door System', slug: 'sliding-door', category: { name: 'Shower Enclosures' }, price: 12499, mrp: 17999, avgRating: 4, reviewCount: 18, images: [{ url: '/images/product_shower_2.png' }] },
    { _id: '3', name: 'Corner Glass Partition', slug: 'corner-partition', category: { name: 'Shower Enclosures' }, price: 18999, mrp: 24999, avgRating: 5, reviewCount: 31, images: [{ url: '/images/product_shower_1.png' }] },
    { _id: '4', name: 'Walk-in Shower Screen', slug: 'walkin-screen', category: { name: 'Shower Enclosures' }, price: 9999, mrp: 14999, avgRating: 5, reviewCount: 42, images: [{ url: '/images/product_shower_2.png' }] },
    { _id: '5', name: 'Swing Door Enclosure', slug: 'swing-door', category: { name: 'Shower Enclosures' }, price: 13499, mrp: 18999, avgRating: 4, reviewCount: 15, images: [{ url: '/images/product_shower_1.png' }] },
    { _id: '6', name: 'Semi-Frameless Panel', slug: 'semi-frameless', category: { name: 'Shower Enclosures' }, price: 8999, mrp: 12999, avgRating: 5, reviewCount: 27, images: [{ url: '/images/product_shower_2.png' }] },
    { _id: '7', name: 'L-Shape Double Door', slug: 'l-shape-double', category: { name: 'Shower Enclosures' }, price: 22999, mrp: 29999, avgRating: 5, reviewCount: 19, images: [{ url: '/images/product_shower_1.png' }] },
    { _id: '8', name: 'Curved Glass Enclosure', slug: 'curved-glass', category: { name: 'Shower Enclosures' }, price: 26999, mrp: 34999, avgRating: 5, reviewCount: 12, images: [{ url: '/images/product_shower_2.png' }] },
];

const ShopPage = () => {
    const { category: categorySlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();

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
    useEffect(() => { if (categorySlug) setSelectedCategory(categorySlug); }, [categorySlug]);

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

    const discount = (product) => product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#FAF7F2]">
            {/* Hero Banner */}
            <section className="relative bg-dark-900 text-white pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-900 to-dark-800" />
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-20 w-72 h-72 bg-accent-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-20 w-56 h-56 bg-primary-500 rounded-full blur-[100px]" />
                </div>

                <motion.div
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-2 text-sm text-dark-400 mb-4">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-white">Shop</span>
                        {selectedCategory && <><span>/</span><span className="text-accent-400">{categories.find(c => c.slug === selectedCategory || c._id === selectedCategory)?.name || selectedCategory}</span></>}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-3">
                        {selectedCategory ? categories.find(c => c.slug === selectedCategory || c._id === selectedCategory)?.name || 'Shop' : 'Our Collection'}
                    </h1>
                    <p className="text-dark-400 text-lg max-w-xl">Premium bathroom solutions crafted with precision for your dream space</p>
                </motion.div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Toolbar */}
                <motion.div
                    className="bg-white rounded-2xl p-4 shadow-soft mb-8 border border-dark-100/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-wrap flex-1">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                <input
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    placeholder="Search products..."
                                    className="w-full pl-11 pr-4 py-3 bg-dark-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
                                />
                            </div>

                            {/* Category */}
                            <select
                                value={selectedCategory}
                                onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                                className="py-3 px-4 bg-dark-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 font-medium text-dark-700"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="py-3 px-4 bg-dark-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 font-medium text-dark-700"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low → High</option>
                                <option value="price_desc">Price: High → Low</option>
                                <option value="popular">Most Popular</option>
                                <option value="rating">Highest Rated</option>
                            </select>

                            {/* Mobile Filter */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="md:hidden flex items-center gap-2 py-3 px-4 bg-dark-50 rounded-xl text-sm font-medium text-dark-700 hover:bg-dark-100 transition-colors"
                            >
                                <FiSliders className="w-4 h-4" /> Filters
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="text-sm text-dark-400 font-medium">{pagination.total} products</p>
                            <div className="flex bg-dark-50 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-dark-900 text-white' : 'text-dark-400 hover:text-dark-700'}`}
                                >
                                    <FiGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-dark-900 text-white' : 'text-dark-400 hover:text-dark-700'}`}
                                >
                                    <FiList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

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
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                    >
                        {products.map(product => (
                            <motion.div key={product._id} variants={fadeInUp} className="group">
                                <div className="bg-white rounded-3xl overflow-hidden border border-dark-100/30 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1 transition-all duration-500">
                                    <Link to={`/product/${product.slug}`} className="block relative">
                                        <div className="aspect-square bg-white p-6 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={product.images?.[0]?.url || '/images/product_shower_1.png'}
                                                alt={product.name}
                                                className="w-[85%] h-[85%] object-contain transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        </div>
                                        {discount(product) > 0 && (
                                            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-lg">
                                                {discount(product)}% OFF
                                            </span>
                                        )}
                                        {product.isNewArrival && (
                                            <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl">New</span>
                                        )}
                                    </Link>
                                    <div className="p-4 border-t border-dark-50">
                                        <Link to={`/product/${product.slug}`}>
                                            <p className="text-[10px] text-accent-500 font-bold uppercase tracking-widest mb-1">{product.category?.name}</p>
                                            <h3 className="text-sm font-bold text-dark-900 line-clamp-1 mb-2 group-hover:text-accent-500 transition-colors">{product.name}</h3>
                                        </Link>
                                        <div className="flex items-center gap-1 mb-3">
                                            <div className="flex text-accent-400 text-xs gap-0.5">
                                                {[...Array(5)].map((_, s) => <FiStar key={s} className={`w-3 h-3 ${s < (product.avgRating || 0) ? 'fill-current' : 'text-dark-200'}`} />)}
                                            </div>
                                            {product.reviewCount > 0 && <span className="text-[10px] text-dark-300 ml-1">({product.reviewCount})</span>}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-extrabold text-dark-900">₹{product.price?.toLocaleString()}</span>
                                                {product.mrp > product.price && <span className="text-xs text-dark-300 line-through">₹{product.mrp?.toLocaleString()}</span>}
                                            </div>
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                                                className="w-9 h-9 bg-dark-900 hover:bg-accent-500 text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md"
                                            >
                                                <FiShoppingCart className="w-4 h-4" />
                                            </button>
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
                                className="bg-white rounded-2xl border border-dark-100/30 flex items-center gap-4 md:gap-6 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 group"
                            >
                                <Link to={`/product/${product.slug}`} className="shrink-0">
                                    <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl bg-white border border-dark-50 flex items-center justify-center overflow-hidden">
                                        <img src={product.images?.[0]?.url || '/images/product_shower_1.png'} alt={product.name} className="w-[80%] h-[80%] object-contain group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/product/${product.slug}`}>
                                        <p className="text-[10px] text-accent-500 font-bold uppercase tracking-widest">{product.category?.name}</p>
                                        <h3 className="text-base md:text-lg font-bold text-dark-900 mb-1 group-hover:text-accent-500 transition-colors">{product.name}</h3>
                                    </Link>
                                    <div className="flex items-center gap-1 mb-2">
                                        <div className="flex text-accent-400 text-xs gap-0.5">
                                            {[...Array(5)].map((_, s) => <FiStar key={s} className={`w-3 h-3 ${s < (product.avgRating || 0) ? 'fill-current' : 'text-dark-200'}`} />)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-extrabold text-dark-900">₹{product.price?.toLocaleString()}</span>
                                        {product.mrp > product.price && <span className="text-sm text-dark-300 line-through">₹{product.mrp?.toLocaleString()}</span>}
                                        {discount(product) > 0 && <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-lg">{discount(product)}% OFF</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="shrink-0 bg-dark-900 hover:bg-accent-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 hidden sm:flex items-center gap-2"
                                >
                                    <FiShoppingCart className="w-4 h-4" /> Add to Cart
                                </button>
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
