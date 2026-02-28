import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '@api/services';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

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

    // Filters
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
            setProducts(res.data?.products || []);
            setPagination(res.data?.pagination || { total: 0, pages: 1 });
        } catch (e) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [page, search, selectedCategory, sortBy, priceRange]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        categoryAPI.getAll().then(res => setCategories(res.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (categorySlug) setSelectedCategory(categorySlug);
    }, [categorySlug]);

    const handleAddToCart = (product) => {
        if (!isAuthenticated) {
            // Guest cart
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existing = guestCart.find(i => i.productId === product._id);
            if (existing) { existing.quantity += 1; } else { guestCart.push({ productId: product._id, quantity: 1, product }); }
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            toast.success('Added to cart! 🛒');
        } else {
            addToCart(product._id, 1);
        }
    };

    const discount = (product) => product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-dark-900 via-dark-800 to-primary-900 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
                        {selectedCategory ? categories.find(c => c.slug === selectedCategory || c._id === selectedCategory)?.name || 'Shop' : 'Our Collection'}
                    </h1>
                    <p className="text-dark-300 text-lg">Premium bathroom solutions for your dream space</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative">
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64" />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Category Filter */}
                        <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }} className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>

                        {/* Sort */}
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="newest">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="popular">Most Popular</option>
                            <option value="rating">Highest Rated</option>
                        </select>

                        {/* Mobile Filter Toggle */}
                        <button onClick={() => setShowFilters(!showFilters)} className="md:hidden py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm">
                            Filters {showFilters ? '▲' : '▼'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-sm text-gray-500">{pagination.total} products</p>
                        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400'}`}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="3" rx="1" /><rect x="1" y="6" width="14" height="3" rx="1" /><rect x="1" y="11" width="14" height="3" rx="1" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Price Range Filter (mobile expandable) */}
                {showFilters && (
                    <div className="admin-card p-4 mb-6 md:hidden">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                        <div className="flex items-center gap-3">
                            <input type="number" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Min" />
                            <span className="text-gray-400">to</span>
                            <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Max" />
                            <button onClick={() => { setPage(1); fetchProducts(); }} className="btn-primary text-sm !py-2 !px-4">Apply</button>
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-300 mb-3">No products found</p>
                        <p className="text-gray-400">Try adjusting your filters</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {products.map(product => (
                            <div key={product._id} className="premium-card group">
                                <Link to={`/product/${product.slug}`} className="block">
                                    <div className="product-image-zoom aspect-square bg-gray-100">
                                        <img src={product.images?.[0]?.url || '/placeholder.jpg'} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    {discount(product) > 0 && <span className="absolute top-3 left-3 badge-sale">{discount(product)}% OFF</span>}
                                    {product.isNewArrival && <span className="absolute top-3 right-3 badge-new">New</span>}
                                </Link>
                                <div className="p-3 md:p-4">
                                    <Link to={`/product/${product.slug}`}>
                                        <p className="text-xs text-primary-500 font-medium mb-1 uppercase tracking-wider">{product.category?.name}</p>
                                        <h3 className="text-sm md:text-base font-semibold text-dark-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{product.name}</h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg font-bold text-dark-900">₹{product.price?.toLocaleString()}</span>
                                        {product.mrp > product.price && <span className="text-sm text-gray-400 line-through">₹{product.mrp?.toLocaleString()}</span>}
                                    </div>
                                    {product.avgRating > 0 && (
                                        <div className="flex items-center gap-1 mb-3">
                                            <span className="text-yellow-400 text-sm">{'★'.repeat(Math.round(product.avgRating))}</span>
                                            <span className="text-xs text-gray-400">({product.reviewCount})</span>
                                        </div>
                                    )}
                                    <button onClick={(e) => { e.preventDefault(); handleAddToCart(product); }} className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        {products.map(product => (
                            <div key={product._id} className="premium-card flex items-center gap-4 md:gap-6 p-4">
                                <Link to={`/product/${product.slug}`} className="shrink-0">
                                    <img src={product.images?.[0]?.url || '/placeholder.jpg'} alt={product.name} className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover bg-gray-100" />
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/product/${product.slug}`}>
                                        <p className="text-xs text-primary-500 font-medium uppercase tracking-wider">{product.category?.name}</p>
                                        <h3 className="text-lg font-semibold text-dark-900 mb-1 hover:text-primary-600 transition-colors">{product.name}</h3>
                                    </Link>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.shortDescription}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold text-dark-900">₹{product.price?.toLocaleString()}</span>
                                        {product.mrp > product.price && <span className="text-sm text-gray-400 line-through">₹{product.mrp?.toLocaleString()}</span>}
                                        {discount(product) > 0 && <span className="badge-sale text-xs">{discount(product)}% OFF</span>}
                                    </div>
                                </div>
                                <button onClick={() => handleAddToCart(product)} className="shrink-0 btn-primary text-sm !py-2.5 !px-6">Add to Cart</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50">← Prev</button>
                        {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                            <button key={p} onClick={() => setPage(p)} className={`px-3.5 py-2 rounded-lg text-sm font-medium ${page === p ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page === pagination.pages} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50">Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPage;
