import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, reviewAPI } from '@api/services';
import { useCart } from '@context/CartContext';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

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
                setProduct(res.data);
                if (res.data?._id) {
                    const revRes = await reviewAPI.getForProduct(res.data._id);
                    setReviews(revRes.data || []);
                }
            } catch (e) {
                toast.error('Product not found');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug]);

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const existing = guestCart.find(i => i.productId === product._id);
            if (existing) { existing.quantity += quantity; } else { guestCart.push({ productId: product._id, quantity, variant: selectedVariant, product }); }
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            toast.success('Added to cart! 🛒');
        } else {
            addToCart(product._id, quantity, selectedVariant);
        }
    };

    const discount = product?.mrp > product?.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;
    if (!product) return <div className="section-wrapper text-center"><h2 className="text-2xl text-gray-400">Product not found</h2></div>;

    return (
        <div className="min-h-screen bg-white">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <nav className="text-sm text-gray-400 flex items-center gap-2">
                    <Link to="/" className="hover:text-primary-600">Home</Link>
                    <span>/</span>
                    <Link to="/shop" className="hover:text-primary-600">Shop</Link>
                    {product.category?.name && <><span>/</span><span>{product.category.name}</span></>}
                    <span>/</span>
                    <span className="text-gray-700">{product.name}</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                            <img src={product.images?.[selectedImage]?.url || '/placeholder.jpg'} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        {product.images?.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                                {product.images.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-primary-500 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        {product.category?.name && <p className="text-sm text-primary-500 font-semibold uppercase tracking-wider">{product.category.name}</p>}
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900">{product.name}</h1>

                        {product.avgRating > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-400 text-lg">{'★'.repeat(Math.round(product.avgRating))}{'☆'.repeat(5 - Math.round(product.avgRating))}</span>
                                <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                            </div>
                        )}

                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-dark-900">₹{product.price?.toLocaleString()}</span>
                            {product.mrp > product.price && (
                                <>
                                    <span className="text-xl text-gray-400 line-through">₹{product.mrp?.toLocaleString()}</span>
                                    <span className="badge-sale">{discount}% OFF</span>
                                </>
                            )}
                        </div>

                        <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>

                        {/* Variants */}
                        {product.variants?.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Select Variant</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v, i) => (
                                        <button key={i} onClick={() => setSelectedVariant(v.name)} className={`px-4 py-2 text-sm rounded-lg border-2 transition-all font-medium ${selectedVariant === v.name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                                            {v.name} {v.value && `- ${v.value}`} {v.priceAdjustment > 0 && `(+₹${v.priceAdjustment})`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Add to Cart */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-gray-500 hover:bg-gray-50 text-lg">−</button>
                                <span className="px-4 py-3 text-center font-semibold min-w-[48px]">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-gray-500 hover:bg-gray-50 text-lg">+</button>
                            </div>
                            <button onClick={handleAddToCart} className="btn-primary flex-1 text-lg" disabled={product.stock === 0}>
                                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart 🛒'}
                            </button>
                        </div>

                        {product.stock > 0 && product.stock < 10 && (
                            <p className="text-sm text-red-500 font-medium">⚡ Only {product.stock} left in stock!</p>
                        )}

                        {/* Specifications */}
                        {product.specifications?.length > 0 && (
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Specifications</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {product.specifications.map((s, i) => (
                                        <div key={i} className="flex text-sm">
                                            <span className="text-gray-400 w-32 shrink-0">{s.key}</span>
                                            <span className="text-gray-700 font-medium">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SKU + Tags */}
                        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-400">
                            {product.sku && <p>SKU: <span className="text-gray-600">{product.sku}</span></p>}
                            {product.tags?.length > 0 && <p>Tags: {product.tags.map((t, i) => <Link key={i} to={`/shop?search=${t}`} className="text-primary-500 hover:underline mr-2">{t}</Link>)}</p>}
                        </div>
                    </div>
                </div>

                {/* Tabs: Description / Reviews */}
                <div className="mt-16 border-t border-gray-100">
                    <div className="flex gap-8 border-b border-gray-100">
                        {['description', 'reviews'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 text-sm font-semibold capitalize transition-colors border-b-2 ${activeTab === tab ? 'text-primary-600 border-primary-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                                {tab === 'reviews' ? `Reviews (${reviews.length})` : 'Description'}
                            </button>
                        ))}
                    </div>

                    <div className="py-8">
                        {activeTab === 'description' ? (
                            <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description || '<p>No description available.</p>' }} />
                        ) : (
                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
                                ) : (
                                    reviews.map(review => (
                                        <div key={review._id} className="border-b border-gray-50 pb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">{review.user?.name?.[0]?.toUpperCase()}</div>
                                                <div>
                                                    <p className="text-sm font-semibold text-dark-900">{review.user?.name}</p>
                                                    <span className="text-yellow-400 text-xs">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                                                </div>
                                                <span className="text-xs text-gray-400 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {review.title && <p className="text-sm font-medium text-dark-900 mb-1">{review.title}</p>}
                                            <p className="text-sm text-gray-600">{review.comment}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
