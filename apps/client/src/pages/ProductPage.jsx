import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiShoppingCart, FiHeart, FiShare2, FiTruck, FiShield, FiCheckCircle, FiMinus, FiPlus, FiChevronRight, FiX, FiCheck } from 'react-icons/fi';
import { productAPI, reviewAPI } from '@api/services';
import RecentlyViewed, { addToRecentlyViewed } from '@components/RecentlyViewed';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import { useWishlist } from '@context/WishlistContext';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────
const getOriginalPrice = (p) => p?.compareAtPrice || p?.mrp || 0;
const getDiscountPct = (p) => {
    const orig = getOriginalPrice(p);
    return orig > p?.price ? Math.round(((orig - p.price) / orig) * 100) : 0;
};

// ─── Fractional Star Component ───────────────────
const StarRating = ({ rating = 0, size = 'sm', showCount = false, count = 0 }) => {
    const pxSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(star => {
                const filled = Math.min(1, Math.max(0, rating - (star - 1)));
                const pct = Math.round(filled * 100);
                return (
                    <div key={star} className="relative inline-block">
                        <FiStar className={`${pxSize} text-dark-200`} />
                        {pct > 0 && (
                            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
                                <FiStar className={`${pxSize} fill-amber-400 text-amber-400`} />
                            </div>
                        )}
                    </div>
                );
            })}
            {showCount && <span className="text-xs text-dark-400 ml-1 font-medium">({count})</span>}
        </div>
    );
};

// ─── Interactive Star Picker ─────────────────────
const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className="p-0.5 focus:outline-none transition-transform hover:scale-125"
            >
                <FiStar className={`w-7 h-7 transition-all duration-150 ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-dark-200 hover:text-amber-300'}`} />
            </button>
        ))}
        <span className="ml-2 text-sm text-dark-500 self-center">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}</span>
    </div>
);

// ─── Rating Distribution Bar ─────────────────────
const RatingDistribution = ({ reviews, avgRating, reviewCount }) => {
    const dist = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviewCount > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviewCount) * 100) : 0,
    }));
    return (
        <div className="bg-dark-50/60 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center border border-dark-100/30">
            {/* Big average */}
            <div className="text-center shrink-0">
                <p className="text-5xl font-extrabold text-dark-900">{avgRating?.toFixed(1) || '0.0'}</p>
                <StarRating rating={avgRating} size="md" />
                <p className="text-xs text-dark-400 mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
            </div>
            {/* Bars */}
            <div className="flex-1 w-full space-y-1.5">
                {dist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-dark-500 w-4 shrink-0">{star}</span>
                        <FiStar className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-2 bg-dark-200/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: (5 - star) * 0.05 }}
                            />
                        </div>
                        <span className="text-xs text-dark-400 w-7 shrink-0 text-right">{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const fallbackProduct = {
    _id: 'fp1', name: 'Premium Frameless Shower Enclosure', slug: 'premium-frameless',
    category: { name: 'Shower Enclosures' }, price: 15599, compareAtPrice: 21999, avgRating: 4.7, reviewCount: 24, stock: 15,
    shortDescription: 'Transform your bathroom into a sanctuary with our premium frameless shower enclosure.',
    description: '<p>Our Premium Frameless Shower Enclosure is the epitome of modern bathroom luxury. Crafted with 10mm toughened safety glass and premium chrome-finished hardware.</p><ul><li>10mm thick toughened safety glass</li><li>Premium chrome-finished hardware</li><li>360° pivot hinge for easy access</li><li>Anti-limescale coating</li><li>5-year comprehensive warranty</li></ul>',
    images: [{ url: '/images/product_shower_1.png' }, { url: '/images/product_shower_2.png' }],
    specifications: [
        { key: 'Material', value: '10mm Toughened Glass' },
        { key: 'Hardware', value: 'Premium Chrome SS304' },
        { key: 'Warranty', value: '5 Years' },
        { key: 'Certification', value: 'ISI Certified' },
    ],
    badges: ['best-seller'],
    sku: 'OZO-FE-001',
};

const badgeConfig = {
    'best-seller': { label: 'Best Seller', bg: 'bg-amber-500', text: 'text-white' },
    'new': { label: 'New', bg: 'bg-accent-500', text: 'text-white' },
    'featured': { label: 'Featured', bg: 'bg-primary-600', text: 'text-white' },
    'sale': { label: 'Sale', bg: 'bg-red-500', text: 'text-white' },
    'limited': { label: 'Limited', bg: 'bg-orange-500', text: 'text-white' },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const ProductPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setSelectedImage(0);
                const res = await productAPI.getBySlug(slug);
                if (res.data) {
                    setProduct(res.data);
                    addToRecentlyViewed(res.data);
                    if (res.data._id) {
                        try {
                            const revRes = await reviewAPI.getForProduct(res.data._id);
                            setReviews(revRes.data || []);
                        } catch { }
                    }
                } else {
                    setProduct(fallbackProduct);
                }
            } catch {
                setProduct(fallbackProduct);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
        window.scrollTo(0, 0);
    }, [slug]);

    const handleAddToCart = () => {
        if (!product) return;
        if (product.stock === 0) return toast.error('This product is currently out of stock');
        if (!isAuthenticated) {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existing = guestCart.find(i => i.productId === product._id && i.variant === selectedVariant);
            if (existing) existing.quantity += quantity;
            else guestCart.push({ productId: product._id, quantity, variant: selectedVariant, product });
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            toast.success('Added to cart!');
        } else {
            addToCart(product._id, quantity, selectedVariant);
        }
    };

    const handleBuyNow = () => {
        handleAddToCart();
        if (isAuthenticated) navigate('/checkout');
        else navigate('/login?redirect=/checkout');
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success('Link copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch { toast.error('Could not copy link'); }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return toast.error('Please login to submit a review');
        if (!reviewForm.comment.trim()) return toast.error('Please write a review comment');
        try {
            setIsSubmittingReview(true);
            await reviewAPI.create({ product: product._id, rating: reviewForm.rating, title: reviewForm.title, comment: reviewForm.comment });
            toast.success('Review submitted! It will appear after approval.');
            setReviewForm({ rating: 5, title: '', comment: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
            <p className="text-dark-400 text-sm font-medium animate-pulse">Loading product...</p>
        </div>
    );

    if (!product) return (
        <div className="section-wrapper text-center py-32">
            <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiShoppingCart className="w-8 h-8 text-dark-300" />
            </div>
            <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Product not found</h2>
            <p className="text-dark-400 mb-6">The product you're looking for doesn't exist</p>
            <Link to="/shop" className="btn-primary">Browse Products</Link>
        </div>
    );

    const origPrice = getOriginalPrice(product);
    const discountPct = getDiscountPct(product);
    const inWishlist = isInWishlist(product._id);

    return (
        <div className="min-h-screen bg-white">
            {/* ── Breadcrumb ───────────────────────────── */}
            <div className="bg-dark-50/50 border-b border-dark-100/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 pt-28">
                    <nav className="flex items-center gap-1.5 text-xs text-dark-400 font-medium flex-wrap">
                        <Link to="/" className="hover:text-accent-500 transition-colors">Home</Link>
                        <FiChevronRight className="w-3 h-3 shrink-0 text-dark-300" />
                        <Link to="/shop" className="hover:text-accent-500 transition-colors">Shop</Link>
                        {product.category?.name && (
                            <>
                                <FiChevronRight className="w-3 h-3 shrink-0 text-dark-300" />
                                <Link
                                    to={`/shop?category=${product.category._id || ''}`}
                                    className="hover:text-accent-500 transition-colors"
                                >
                                    {product.category.name}
                                </Link>
                            </>
                        )}
                        <FiChevronRight className="w-3 h-3 shrink-0 text-dark-300" />
                        <span className="text-dark-700 font-semibold truncate max-w-[220px]">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    {/* ── Gallery ───────────────────────────── */}
                    <motion.div variants={fadeInUp} className="space-y-4">
                        {/* Main image */}
                        <div className="relative bg-white rounded-3xl overflow-hidden border border-dark-100/40 aspect-square flex items-center justify-center p-8 group shadow-sm">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={selectedImage}
                                    src={product.images?.[selectedImage]?.url || '/images/product_shower_1.png'}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    transition={{ duration: 0.25 }}
                                />
                            </AnimatePresence>

                            {/* Badges overlay */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {discountPct > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
                                        {discountPct}% OFF
                                    </span>
                                )}
                                {product.badges?.filter(b => b !== 'sale').slice(0, 2).map(b => (
                                    <span key={b} className={`${badgeConfig[b]?.bg || 'bg-dark-700'} ${badgeConfig[b]?.text || 'text-white'} text-xs font-bold px-2.5 py-1 rounded-lg shadow-md`}>
                                        {badgeConfig[b]?.label || b}
                                    </span>
                                ))}
                            </div>

                            {/* Wishlist + Share */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <button
                                    onClick={() => inWishlist ? removeFromWishlist(product._id) : addToWishlist(product._id)}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm
                                        ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/80 backdrop-blur-sm text-dark-400 hover:text-red-500 hover:bg-white'}`}
                                >
                                    <FiHeart className={`w-4.5 h-4.5 ${inWishlist ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm text-dark-400 hover:text-accent-500 hover:bg-white flex items-center justify-center transition-all duration-300 shadow-sm"
                                >
                                    {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiShare2 className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Stock badge */}
                            {product.stock > 0 && product.stock <= 5 && (
                                <div className="absolute bottom-4 left-4 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                    Only {product.stock} left!
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images?.length > 1 && (
                            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-white
                                            ${selectedImage === i
                                                ? 'border-accent-500 shadow-lg shadow-accent-500/20 scale-105'
                                                : 'border-dark-100 opacity-60 hover:opacity-100 hover:border-dark-300'}`}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-contain p-1.5" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* ── Product Details ───────────────────── */}
                    <motion.div variants={fadeInUp} className="space-y-5">
                        {/* Category */}
                        {product.category?.name && (
                            <Link
                                to={`/shop?category=${product.category._id || ''}`}
                                className="inline-block text-accent-500 text-xs font-bold uppercase tracking-[0.2em] hover:text-accent-600 transition-colors"
                            >
                                {product.category.name}
                            </Link>
                        )}

                        <h1 className="text-3xl md:text-[2.5rem] font-display font-bold text-dark-900 leading-tight">{product.name}</h1>

                        {/* Rating + Reviews count */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <StarRating rating={product.avgRating || 0} size="md" />
                            <span className="text-sm font-bold text-dark-900">{(product.avgRating || 0).toFixed(1)}</span>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className="text-sm text-dark-400 hover:text-accent-500 transition-colors font-medium underline underline-offset-2"
                            >
                                {product.reviewCount || 0} review{(product.reviewCount || 0) !== 1 ? 's' : ''}
                            </button>
                            {product.salesCount > 0 && (
                                <span className="text-xs text-dark-400 bg-dark-50 px-2 py-0.5 rounded-full font-medium">
                                    {product.salesCount}+ sold
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-4xl font-extrabold text-dark-900">₹{product.price?.toLocaleString('en-IN')}</span>
                            {origPrice > product.price && (
                                <>
                                    <span className="text-xl text-dark-300 line-through font-medium">₹{origPrice.toLocaleString('en-IN')}</span>
                                    <span className="bg-green-50 text-green-700 border border-green-200 text-sm font-bold px-2.5 py-0.5 rounded-lg">
                                        Save {discountPct}%
                                    </span>
                                </>
                            )}
                        </div>
                        {origPrice > product.price && (
                            <p className="text-xs text-green-700 font-semibold -mt-3">
                                You save ₹{(origPrice - product.price).toLocaleString('en-IN')} on this product
                            </p>
                        )}

                        <p className="text-dark-500 leading-relaxed text-[15px]">{product.shortDescription}</p>

                        {/* Variants */}
                        {product.variants?.length > 0 && product.variants.map((variant, vi) => (
                            <div key={vi}>
                                <p className="text-xs font-bold text-dark-900 mb-2.5 uppercase tracking-wider">{variant.name}</p>
                                <div className="flex flex-wrap gap-2">
                                    {variant.options?.map((opt, oi) => (
                                        <button
                                            key={oi}
                                            onClick={() => setSelectedVariant(`${variant.name}:${opt.value}`)}
                                            className={`px-4 py-2 text-sm rounded-xl border-2 transition-all duration-200 font-semibold
                                                ${selectedVariant === `${variant.name}:${opt.value}`
                                                    ? 'border-accent-500 bg-accent-50 text-accent-700 shadow-sm shadow-accent-500/20'
                                                    : 'border-dark-100 hover:border-dark-300 text-dark-700'}`}
                                        >
                                            {opt.label || opt.value}
                                            {opt.priceModifier > 0 && <span className="text-xs text-dark-400 ml-1">(+₹{opt.priceModifier})</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Quantity + Actions */}
                        <div className="space-y-3 pt-1">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center bg-dark-50 rounded-xl border border-dark-100 overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors"
                                    >
                                        <FiMinus className="w-4 h-4" />
                                    </button>
                                    <span className="px-5 py-2.5 text-center font-bold text-dark-900 min-w-[48px] text-sm">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                                        className="p-3 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-xs text-dark-400 font-medium">
                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                </span>
                            </div>

                            {product.stock === 0 ? (
                                <div className="flex gap-3">
                                    <button disabled className="flex-1 bg-dark-100 text-dark-400 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest cursor-not-allowed">
                                        Out of Stock
                                    </button>
                                    <button
                                        onClick={() => inWishlist ? removeFromWishlist(product._id) : addToWishlist(product._id)}
                                        className={`px-5 py-4 rounded-2xl text-sm font-bold border-2 transition-all duration-300 ${inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-dark-100 hover:border-red-300 text-dark-500 hover:text-red-500'}`}
                                    >
                                        Notify Me
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 bg-dark-900 hover:bg-dark-800 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md hover:shadow-lg"
                                    >
                                        <FiShoppingCart className="w-4.5 h-4.5" />
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={handleBuyNow}
                                        className="flex-1 bg-accent-500 hover:bg-accent-400 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 shadow-md shadow-accent-500/20 hover:shadow-accent-500/40"
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Trust badges */}
                        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-dark-100/50">
                            {[
                                { icon: FiTruck, label: 'Free Shipping', sub: 'On orders ₹999+' },
                                { icon: FiShield, label: '5-Year Warranty', sub: 'Full coverage' },
                                { icon: FiCheckCircle, label: 'ISI Certified', sub: 'Safety assured' },
                            ].map(({ icon: Icon, label, sub }, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-dark-50/70 rounded-2xl text-center">
                                    <Icon className="w-5 h-5 text-accent-500" />
                                    <span className="text-[10px] font-bold text-dark-700 leading-tight">{label}</span>
                                    <span className="text-[9px] text-dark-400">{sub}</span>
                                </div>
                            ))}
                        </div>

                        {/* Specifications */}
                        {product.specifications?.length > 0 && (
                            <div className="border-t border-dark-100 pt-5">
                                <h3 className="text-xs font-bold text-dark-900 mb-3 uppercase tracking-widest">Specifications</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {product.specifications.map((s, i) => (
                                        <div key={i} className="flex justify-between text-sm bg-dark-50 rounded-xl px-3.5 py-2.5 border border-dark-100/30">
                                            <span className="text-dark-400 font-medium">{s.key}</span>
                                            <span className="text-dark-900 font-semibold">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SKU */}
                        {product.sku && (
                            <p className="text-xs text-dark-400 border-t border-dark-100 pt-4">
                                SKU: <span className="font-mono text-dark-600 font-medium">{product.sku}</span>
                            </p>
                        )}
                    </motion.div>
                </motion.div>

                {/* ── Tabs ─────────────────────────────────── */}
                <motion.div
                    className="mt-14"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Tab nav */}
                    <div className="flex gap-1 bg-dark-50 rounded-2xl p-1.5 w-fit mb-7 border border-dark-100/40">
                        {[
                            { key: 'description', label: 'Description' },
                            { key: 'specs', label: 'Specifications' },
                            { key: 'reviews', label: `Reviews (${product.reviewCount || reviews.length})` },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`py-2.5 px-5 text-sm font-bold transition-all duration-300 rounded-xl whitespace-nowrap
                                    ${activeTab === key ? 'bg-white text-dark-900 shadow-md' : 'text-dark-400 hover:text-dark-700'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-dark-100/30 shadow-sm">
                        {/* Description Tab */}
                        {activeTab === 'description' && (
                            <div
                                className="prose prose-base max-w-none text-dark-600 leading-relaxed
                                    prose-h3:text-dark-900 prose-h3:font-bold prose-h3:text-lg
                                    prose-ul:text-dark-500 prose-li:marker:text-accent-500
                                    prose-strong:text-dark-900"
                                dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }}
                            />
                        )}

                        {/* Specifications Tab */}
                        {activeTab === 'specs' && (
                            product.specifications?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {product.specifications.map((s, i) => (
                                        <div key={i} className={`flex justify-between py-3 px-4 rounded-xl text-sm ${i % 2 === 0 ? 'bg-dark-50' : 'bg-white border border-dark-50'}`}>
                                            <span className="text-dark-500 font-medium">{s.key}</span>
                                            <span className="text-dark-900 font-bold">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-dark-400 text-sm">No specifications available.</p>
                            )
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-8">
                                {/* Rating Summary */}
                                {(reviews.length > 0 || product.reviewCount > 0) && (
                                    <RatingDistribution
                                        reviews={reviews}
                                        avgRating={product.avgRating}
                                        reviewCount={product.reviewCount || reviews.length}
                                    />
                                )}

                                {/* Review Form */}
                                {isAuthenticated ? (
                                    <form onSubmit={handleReviewSubmit} className="bg-dark-50/60 rounded-2xl p-6 border border-dark-100/40">
                                        <h3 className="text-base font-bold text-dark-900 mb-5">Write a Review</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-2">Your Rating</label>
                                                <StarPicker value={reviewForm.rating} onChange={r => setReviewForm({ ...reviewForm, rating: r })} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Review Title</label>
                                                <input
                                                    value={reviewForm.title}
                                                    onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                                                    placeholder="Sum up your experience in one line"
                                                    className="w-full bg-white border border-dark-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-dark-600 uppercase tracking-wider mb-1.5">Your Review *</label>
                                                <textarea
                                                    value={reviewForm.comment}
                                                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                    placeholder="What did you like or dislike? How was the installation?"
                                                    rows={4}
                                                    required
                                                    className="w-full bg-white border border-dark-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 transition-all resize-none"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmittingReview}
                                                className="btn-primary px-8 disabled:opacity-50"
                                            >
                                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-dark-50 rounded-2xl p-6 border border-dark-100 text-center">
                                        <p className="text-sm font-semibold text-dark-900 mb-1">Have this product?</p>
                                        <p className="text-dark-400 text-sm mb-4">Log in to share your experience with others.</p>
                                        <Link to="/login" className="btn-primary text-sm px-6 py-2.5">Log In to Review</Link>
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div>
                                    <h3 className="text-base font-bold text-dark-900 mb-5 flex items-center gap-2">
                                        Customer Reviews
                                        {reviews.length > 0 && <span className="text-xs bg-dark-100 text-dark-500 px-2 py-0.5 rounded-full font-medium">{reviews.length}</span>}
                                    </h3>
                                    {reviews.length === 0 ? (
                                        <div className="text-center py-10 bg-dark-50/50 rounded-2xl border border-dashed border-dark-200">
                                            <FiStar className="w-8 h-8 text-dark-200 mx-auto mb-3" />
                                            <p className="text-dark-400 font-medium text-sm">No reviews yet</p>
                                            <p className="text-dark-300 text-xs mt-1">Be the first to review this product</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {reviews.map(review => (
                                                <div key={review._id} className="bg-white border border-dark-100/40 rounded-2xl p-5">
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
                                                                {review.user?.name?.[0]?.toUpperCase() || 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="text-sm font-bold text-dark-900">{review.user?.name || 'Anonymous'}</p>
                                                                    {review.isVerifiedPurchase && (
                                                                        <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                            <FiCheck className="w-2.5 h-2.5" /> Verified Purchase
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <StarRating rating={review.rating} size="sm" />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-dark-300 shrink-0 mt-0.5">
                                                            {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    {review.title && (
                                                        <p className="text-sm font-semibold text-dark-900 mb-1.5">{review.title}</p>
                                                    )}
                                                    <p className="text-sm text-dark-500 leading-relaxed">{review.comment}</p>
                                                    {review.helpfulCount > 0 && (
                                                        <p className="text-xs text-dark-300 mt-3">{review.helpfulCount} people found this helpful</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── Related Products ──────────────────────── */}
                {product.relatedProducts?.length > 0 && (
                    <motion.div
                        className="mt-14"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center justify-between mb-7">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900">You May Also Like</h2>
                                <p className="text-dark-400 text-sm mt-0.5">Handpicked to complement your selection</p>
                            </div>
                            <Link to="/shop" className="hidden sm:flex items-center gap-1 text-sm text-accent-500 hover:text-accent-600 font-bold transition-colors">
                                View All <FiChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3">
                            {product.relatedProducts.map((rp, i) => {
                                const rpOrig = getOriginalPrice(rp);
                                const rpDisc = getDiscountPct(rp);
                                return (
                                    <motion.div
                                        key={rp._id || i}
                                        className="shrink-0 w-[240px]"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.07 }}
                                    >
                                        <Link to={`/product/${rp.slug}`} className="group block">
                                            <div className="bg-white rounded-2xl border border-dark-100/30 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-400">
                                                <div className="aspect-square p-5 bg-white relative">
                                                    <img src={rp.images?.[0]?.url || '/images/product_shower_1.png'} alt={rp.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                                    {rpDisc > 0 && (
                                                        <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                                                            {rpDisc}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-4 border-t border-dark-50">
                                                    <p className="text-[9px] text-accent-500 font-bold uppercase tracking-widest mb-1">{rp.category?.name}</p>
                                                    <h3 className="text-xs font-bold text-dark-900 line-clamp-2 mb-2 group-hover:text-accent-500 transition-colors leading-tight">{rp.name}</h3>
                                                    <StarRating rating={rp.avgRating || 0} size="sm" showCount count={rp.reviewCount || 0} />
                                                    <div className="flex items-baseline gap-1.5 mt-2">
                                                        <span className="text-base font-extrabold text-dark-900">₹{rp.price?.toLocaleString('en-IN')}</span>
                                                        {rpOrig > rp.price && <span className="text-xs text-dark-300 line-through">₹{rpOrig.toLocaleString('en-IN')}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Recently Viewed ───────────────────────── */}
                {product && <RecentlyViewed currentProductId={product._id} />}
            </div>
        </div>
    );
};

export default ProductPage;
