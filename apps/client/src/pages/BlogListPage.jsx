import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiClock, FiCalendar } from 'react-icons/fi';
import { blogAPI } from '@api/services';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const fallbackBlogs = [
    { _id: 'b1', title: 'Modern Minimalist Bathroom Design Trends 2026', slug: 'minimalist-design-2026', category: 'Design', excerpt: 'Discover the latest trends in minimalist bathroom design that combine form and function beautifully.', author: { name: 'OZOBATH Team' }, publishedAt: '2026-02-24', featuredImage: { url: '/images/promo_shower_enclosure.png' } },
    { _id: 'b2', title: 'How to Choose the Perfect Shower Enclosure', slug: 'choose-shower-enclosure', category: 'Guide', excerpt: 'A comprehensive guide to selecting the right shower enclosure for your bathroom space and style.', author: { name: 'OZOBATH Team' }, publishedAt: '2026-02-18', featuredImage: { url: '/images/promo_sliding_door.png' } },
    { _id: 'b3', title: 'Premium Bathroom Fittings: Complete Buying Guide', slug: 'bathroom-fittings-guide', category: 'Guide', excerpt: 'Everything you need to know about choosing premium bathroom fittings that last a lifetime.', author: { name: 'OZOBATH Team' }, publishedAt: '2026-02-12', featuredImage: { url: '/images/hero_bathroom.png' } },
    { _id: 'b4', title: 'Frameless vs Semi-Frameless Shower Doors', slug: 'frameless-vs-semi', category: 'Comparison', excerpt: 'Compare frameless and semi-frameless options to find the best fit for your bathroom renovation.', author: { name: 'OZOBATH Team' }, publishedAt: '2026-02-05', featuredImage: { url: '/images/sale_bathroom.png' } },
    { _id: 'b5', title: '5 Bathroom Renovation Mistakes to Avoid', slug: 'renovation-mistakes', category: 'Tips', excerpt: 'Common pitfalls homeowners encounter during bathroom renovations and how to steer clear of them.', author: { name: 'OZOBATH Team' }, publishedAt: '2026-01-28', featuredImage: { url: '/images/product_shower_1.png' } },
    { _id: 'b6', title: 'The Art of Bathroom Lighting Design', slug: 'lighting-design', category: 'Design', excerpt: 'Master the art of bathroom lighting to create ambiance and highlight your shower enclosure.', author: { name: 'OZOBATH Team' }, publishedAt: '2026-01-20', featuredImage: { url: '/images/product_shower_2.png' } },
];

const categories = ['All', 'Design', 'Guide', 'Tips', 'Comparison'];

const BlogListPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await blogAPI.getAll({ page, limit: 9 });
                const data = res.data?.blogs || [];
                setBlogs(data.length > 0 ? data : fallbackBlogs);
                setPagination(res.data?.pagination || { total: fallbackBlogs.length, pages: 1 });
            } catch (e) {
                setBlogs(fallbackBlogs);
                setPagination({ total: fallbackBlogs.length, pages: 1 });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [page]);

    const filteredBlogs = activeCategory === 'All' ? blogs : blogs.filter(b => b.category === activeCategory);

    return (
        <div className="bg-[#FAF7F2]">
            <PageHero
                title="Blog & Tips"
                subtitle="Expert advice on bathroom design, maintenance, and premium solutions"
                breadcrumbs={[{ label: 'Blog' }]}
            />

            <section className="section-wrapper">
                {/* Category Filter Chips */}
                <ScrollReveal className="flex flex-wrap justify-center gap-2 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                                ${activeCategory === cat
                                    ? 'bg-dark-900 text-white shadow-lg'
                                    : 'bg-white text-dark-400 hover:text-dark-900 hover:bg-dark-50 border border-dark-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </ScrollReveal>

                {loading ? (
                    /* Skeleton Loading */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-3xl overflow-hidden">
                                <div className="skeleton-shimmer aspect-video" />
                                <div className="p-6 space-y-3">
                                    <div className="skeleton-shimmer h-4 w-20 rounded-full" />
                                    <div className="skeleton-shimmer h-6 w-full rounded-xl" />
                                    <div className="skeleton-shimmer h-4 w-3/4 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <ScrollReveal className="text-center py-20">
                        <div className="w-20 h-20 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-5">
                            <FiCalendar className="w-8 h-8 text-accent-400" />
                        </div>
                        <h3 className="font-display font-bold text-dark-900 text-xl mb-2">No Blog Posts Yet</h3>
                        <p className="text-dark-400 text-sm max-w-md mx-auto mb-8">We're working on amazing content. Check back soon for expert bathroom design tips and guides!</p>
                        <Link to="/shop" className="btn-primary text-sm">Browse Products</Link>
                    </ScrollReveal>
                ) : (
                    <>
                        {/* Featured First Post */}
                        {filteredBlogs.length > 0 && (
                            <ScrollReveal className="mb-12">
                                <Link to={`/blog/${filteredBlogs[0].slug}`} className="block group">
                                    <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-500 grid grid-cols-1 lg:grid-cols-2 gap-0">
                                        <div className="aspect-video lg:aspect-auto overflow-hidden">
                                            <img
                                                src={filteredBlogs[0].featuredImage?.url || '/images/hero_bathroom.png'}
                                                alt={filteredBlogs[0].title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="bg-accent-50 text-accent-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                                                    {filteredBlogs[0].category || 'Featured'}
                                                </span>
                                                <span className="text-dark-300 text-xs flex items-center gap-1">
                                                    <FiClock className="w-3 h-3" /> 5 min read
                                                </span>
                                            </div>
                                            <h2 className="text-2xl lg:text-3xl font-display font-bold text-dark-900 mb-3 group-hover:text-accent-500 transition-colors">
                                                {filteredBlogs[0].title}
                                            </h2>
                                            <p className="text-dark-400 text-sm leading-relaxed mb-6 line-clamp-3">
                                                {filteredBlogs[0].excerpt || 'Discover insights and expert tips for your bathroom transformation journey.'}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-dark-300 text-xs">
                                                    {new Date(filteredBlogs[0].publishedAt || filteredBlogs[0].createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-accent-500 font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                                    Read More <FiArrowRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </ScrollReveal>
                        )}

                        {/* Blog Grid */}
                        <ScrollReveal stagger staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredBlogs.slice(1).map((blog, i) => (
                                <ScrollRevealItem key={blog._id}>
                                    <Link to={`/blog/${blog.slug}`} className="block group h-full">
                                        <div className="bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                                            <div className="aspect-video overflow-hidden relative">
                                                <img
                                                    src={blog.featuredImage?.url || '/images/hero_bathroom.png'}
                                                    alt={blog.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-dark-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                                                    {blog.category || 'General'}
                                                </span>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center gap-3 text-xs text-dark-300 mb-3">
                                                    <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="w-1 h-1 bg-dark-200 rounded-full" />
                                                    <span className="flex items-center gap-1"><FiClock className="w-3 h-3" /> 5 min</span>
                                                </div>
                                                <h3 className="text-lg font-display font-bold text-dark-900 mb-2 group-hover:text-accent-500 transition-colors line-clamp-2">
                                                    {blog.title}
                                                </h3>
                                                <p className="text-dark-400 text-sm line-clamp-2 flex-1">
                                                    {blog.excerpt || 'Discover insights and expert tips for your bathroom transformation.'}
                                                </p>
                                                <div className="mt-4 pt-4 border-t border-dark-50 flex items-center justify-between">
                                                    <span className="text-dark-400 text-xs font-medium">{blog.author?.name || 'OZOBATH'}</span>
                                                    <span className="text-accent-500 text-xs font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                                        Read <FiArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </ScrollRevealItem>
                            ))}
                        </ScrollReveal>
                    </>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-14">
                        {Array.from({ length: pagination.pages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300
                                    ${page === i + 1
                                        ? 'bg-dark-900 text-white shadow-lg'
                                        : 'bg-white text-dark-400 hover:bg-dark-50 border border-dark-100'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default BlogListPage;
