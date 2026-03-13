import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiShoppingCart, FiHeart, FiShare2, FiTruck, FiShield, FiCheckCircle, FiMinus, FiPlus, FiChevronRight } from 'react-icons/fi';
import { productAPI, reviewAPI } from '@api/services';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fallbackProduct = {
    _id: 'fp1', name: 'Premium Frameless Shower Enclosure', slug: 'premium-frameless',
    category: { name: 'Shower Enclosures' }, price: 15599, mrp: 21999, avgRating: 5, reviewCount: 24, stock: 15,
    shortDescription: 'Transform your bathroom into a sanctuary with our premium frameless shower enclosure. Precision-engineered with 10mm toughened glass and premium chrome fittings.',
    description: '<p>Our Premium Frameless Shower Enclosure is the epitome of modern bathroom luxury. Crafted with 10mm toughened safety glass and premium chrome-finished hardware, this enclosure offers a sleek, minimalist look that enhances any bathroom space.</p><h3>Key Features</h3><ul><li>10mm thick toughened safety glass</li><li>Premium chrome-finished hardware</li><li>360° pivot hinge for easy access</li><li>Anti-limescale coating for easy maintenance</li><li>5-year comprehensive warranty</li></ul>',
    images: [{ url: '/images/product_shower_1.png' }, { url: '/images/product_shower_2.png' }, { url: '/images/promo_shower_enclosure.png' }],
    specifications: [
        { key: 'Material', value: '10mm Toughened Glass' },
        { key: 'Hardware', value: 'Premium Chrome SS304' },
        { key: 'Warranty', value: '5 Years' },
        { key: 'Certification', value: 'ISI Certified' },
    ],
    sku: 'OZO-FE-001',
    tags: ['shower', 'frameless', 'premium'],
};

const ProductPage = () => {
    const { slug } = useParams();
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await productAPI.getBySlug(slug);
                if (res.data) {
                    setProduct(res.data);
                    if (res.data._id) {
                        try {
                            const revRes = await reviewAPI.getForProduct(res.data._id);
                            setReviews(revRes.data || []);
                        } catch (e) { }
                    }
                } else {
                    setProduct(fallbackProduct);
                }
            } catch (e) {
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
        if (!isAuthenticated) {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existing = guestCart.find(i => i.productId === product._id);
            if (existing) existing.quantity += quantity;
            else guestCart.push({ productId: product._id, quantity, variant: selectedVariant, product });
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            toast.success('Added to cart! 🛒');
        } else {
            addToCart(product._id, quantity, selectedVariant);
        }
    };

    const handleAddToWishlist = async () => {
        if (!product) return;
        if (isAuthenticated) {
            try {
                const { wishlistAPI } = await import('@api/services');
                await wishlistAPI.add(product._id);
                toast.success('Added to wishlist! ❤️');
            } catch (e) {
                toast.error('Failed to add to wishlist');
            }
        } else {
            const guestWishlist = JSON.parse(localStorage.getItem('guestWishlist') || '[]');
            const existing = guestWishlist.find(i => i._id === product._id);
            if (!existing) {
                guestWishlist.push(product);
                localStorage.setItem('guestWishlist', JSON.stringify(guestWishlist));
                toast.success('Added to wishlist! ❤️');
            } else {
                toast('Already in wishlist!', { icon: '❤️' });
            }
        }
    };

    const discount = product?.mrp > product?.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

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

    return (
        <div className="min-h-screen bg-[#ffffff]">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4">
                <nav className="flex items-center gap-2 text-sm text-dark-400 font-medium">
                    <Link to="/" className="hover:text-accent-500 transition-colors">Home</Link>
                    <FiChevronRight className="w-3 h-3" />
                    <Link to="/shop" className="hover:text-accent-500 transition-colors">Shop</Link>
                    {product.category?.name && <><FiChevronRight className="w-3 h-3" /><span>{product.category.name}</span></>}
                    <FiChevronRight className="w-3 h-3" />
                    <span className="text-dark-900 font-semibold truncate max-w-[200px]">{product.name}</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    {/* Gallery */}
                    <motion.div variants={fadeInUp} className="space-y-4">
                        <div className="bg-white rounded-3xl overflow-hidden border border-dark-100/30 aspect-square flex items-center justify-center p-8 relative group">
                            <img
                                src={product.images?.[selectedImage]?.url || '/images/product_shower_1.png'}
                                alt={product.name}
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                            {discount > 0 && (
                                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>
                        {product.images?.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300
                                            ${selectedImage === i ? 'border-accent-500 shadow-lg shadow-accent-500/20' : 'border-dark-100 opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-contain bg-white p-1" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Details */}
                    <motion.div variants={fadeInUp} className="space-y-6">
                        {product.category?.name && (
                            <span className="text-accent-500 text-xs font-bold uppercase tracking-[0.2em]">{product.category.name}</span>
                        )}
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900 leading-tight">{product.name}</h1>

                        {/* Rating */}
                        <div className="flex items-center gap-3">
                            <div className="flex text-accent-400 gap-0.5">
                                {[...Array(5)].map((_, i) => <FiStar key={i} className={`w-4 h-4 ${i < (product.avgRating || 0) ? 'fill-current' : 'text-dark-200'}`} />)}
                            </div>
                            <span className="text-sm text-dark-400 font-medium">({product.reviewCount || 0} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-extrabold text-dark-900">₹{product.price?.toLocaleString()}</span>
                            {product.mrp > product.price && (
                                <>
                                    <span className="text-xl text-dark-300 line-through">₹{product.mrp?.toLocaleString()}</span>
                                    <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-lg">Save {discount}%</span>
                                </>
                            )}
                        </div>

                        <p className="text-dark-500 leading-relaxed text-base">{product.shortDescription}</p>

                        {/* Variants */}
                        {product.variants?.length > 0 && (
                            <div>
                                <p className="text-sm font-bold text-dark-900 mb-3 uppercase tracking-wider">Select Variant</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedVariant(v.name)}
                                            className={`px-5 py-2.5 text-sm rounded-xl border-2 transition-all font-semibold
                                                ${selectedVariant === v.name
                                                    ? 'border-accent-500 bg-accent-50 text-accent-700'
                                                    : 'border-dark-100 hover:border-dark-300 text-dark-700'}`}
                                        >
                                            {v.name} {v.value && `- ${v.value}`} {v.priceAdjustment > 0 && `(+₹${v.priceAdjustment})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Actions */}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center bg-dark-50 rounded-xl overflow-hidden">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3.5 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors">
                                    <FiMinus className="w-4 h-4" />
                                </button>
                                <span className="px-5 py-3 text-center font-bold text-dark-900 min-w-[48px]">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="p-3.5 text-dark-500 hover:text-dark-900 hover:bg-dark-100 transition-colors">
                                    <FiPlus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-1 gap-3">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-dark-900 hover:bg-accent-500 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-accent-500/30 disabled:opacity-50"
                                    disabled={product.stock === 0}
                                >
                                    <FiShoppingCart className="w-5 h-5" />
                                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                                <button
                                    onClick={handleAddToWishlist}
                                    className="w-[56px] bg-dark-50 hover:bg-red-50 text-dark-400 hover:text-red-500 py-4 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md border border-dark-100"
                                    aria-label="Add to wishlist"
                                >
                                    <FiHeart className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {product.stock > 0 && product.stock < 10 && (
                            <p className="text-sm text-red-500 font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Only {product.stock} left in stock!
                            </p>
                        )}

                        {/* Trust Features */}
                        <div className="grid grid-cols-3 gap-3 pt-4">
                            {[
                                { icon: FiTruck, label: 'Free Shipping' },
                                { icon: FiShield, label: '5-Year Warranty' },
                                { icon: FiCheckCircle, label: 'ISI Certified' },
                            ].map(({ icon: Icon, label }, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 p-3 bg-dark-50 rounded-2xl text-center">
                                    <Icon className="w-5 h-5 text-accent-500" />
                                    <span className="text-[10px] font-bold text-dark-600 uppercase tracking-wider">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Specifications */}
                        {product.specifications?.length > 0 && (
                            <div className="border-t border-dark-100 pt-6">
                                <h3 className="text-sm font-bold text-dark-900 mb-4 uppercase tracking-wider">Specifications</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {product.specifications.map((s, i) => (
                                        <div key={i} className="flex justify-between text-sm bg-dark-50 rounded-xl px-4 py-3">
                                            <span className="text-dark-400">{s.key}</span>
                                            <span className="text-dark-900 font-semibold">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SKU + Tags */}
                        <div className="border-t border-dark-100 pt-4 space-y-2 text-sm text-dark-400">
                            {product.sku && <p>SKU: <span className="text-dark-700 font-medium">{product.sku}</span></p>}
                            {product.tags?.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span>Tags:</span>
                                    {product.tags.map((t, i) => (
                                        <Link key={i} to={`/shop?search=${t}`} className="text-accent-500 bg-accent-50 px-2.5 py-0.5 rounded-lg text-xs font-semibold hover:bg-accent-100 transition-colors">{t}</Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Tabs: Description / Reviews */}
                <motion.div
                    className="mt-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex gap-1 bg-dark-50 rounded-2xl p-1.5 w-fit mb-8">
                        {['description', 'reviews'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 px-6 text-sm font-bold capitalize transition-all duration-300 rounded-xl
                                    ${activeTab === tab ? 'bg-white text-dark-900 shadow-md' : 'text-dark-400 hover:text-dark-700'}`}
                            >
                                {tab === 'reviews' ? `Reviews (${reviews.length})` : 'Description'}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-dark-100/30">
                        {activeTab === 'description' ? (
                            <div className="prose prose-lg max-w-none text-dark-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />
                        ) : (
                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-dark-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FiStar className="w-7 h-7 text-dark-300" />
                                        </div>
                                        <p className="text-dark-400 font-medium">No reviews yet. Be the first to review!</p>
                                    </div>
                                ) : (
                                    reviews.map(review => (
                                        <div key={review._id} className="border-b border-dark-50 pb-6 last:border-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-sm font-bold text-white shadow-md">
                                                    {review.user?.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-dark-900">{review.user?.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex text-accent-400 text-xs gap-0.5">
                                                            {[...Array(5)].map((_, i) => <FiStar key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-dark-200'}`} />)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-dark-300 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {review.title && <p className="text-sm font-semibold text-dark-900 mb-1">{review.title}</p>}
                                            <p className="text-sm text-dark-500 leading-relaxed">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Related Products — You May Also Like */}
                {product.relatedProducts?.length > 0 && (
                    <motion.div
                        className="mt-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-dark-900">You May Also Like</h2>
                                <p className="text-dark-400 text-sm mt-1 font-medium">Handpicked products that complement your selection</p>
                            </div>
                            <Link to="/shop" className="text-sm text-accent-500 hover:text-accent-600 font-bold hidden sm:flex items-center gap-1 transition-colors">
                                View All <FiChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4">
                            {product.relatedProducts.map((rp, i) => {
                                const rpDiscount = rp.compareAtPrice > rp.price ? Math.round(((rp.compareAtPrice - rp.price) / rp.compareAtPrice) * 100) : 0;
                                return (
                                    <motion.div
                                        key={rp._id || i}
                                        className="shrink-0 w-[260px]"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                    >
                                        <Link to={`/product/${rp.slug}`} className="group block">
                                            <div className="bg-white rounded-3xl border border-dark-100/30 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-dark-900/5 hover:-translate-y-1">
                                                {/* Image */}
                                                <div className="aspect-square p-4 bg-white relative overflow-hidden">
                                                    <img
                                                        src={rp.images?.[0]?.url || '/images/product_shower_1.png'}
                                                        alt={rp.name}
                                                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    {rpDiscount > 0 && (
                                                        <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow">
                                                            {rpDiscount}% OFF
                                                        </span>
                                                    )}
                                                    {rp.badges?.includes('new') && (
                                                        <span className="absolute top-3 right-3 bg-accent-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Info */}
                                                <div className="p-4 pt-0">
                                                    <h3 className="text-sm font-bold text-dark-900 mb-1.5 line-clamp-2 group-hover:text-accent-500 transition-colors">{rp.name}</h3>
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <div className="flex text-accent-400 gap-0.5">
                                                            {[...Array(5)].map((_, j) => <FiStar key={j} className={`w-3 h-3 ${j < (rp.avgRating || 0) ? 'fill-current' : 'text-dark-200'}`} />)}
                                                        </div>
                                                        <span className="text-[10px] text-dark-400 font-medium">({rp.reviewCount || 0})</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-extrabold text-dark-900">₹{rp.price?.toLocaleString()}</span>
                                                        {rp.compareAtPrice > rp.price && (
                                                            <span className="text-xs text-dark-300 line-through">₹{rp.compareAtPrice?.toLocaleString()}</span>
                                                        )}
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
            </div>
        </div>
    );
};

export default ProductPage;
