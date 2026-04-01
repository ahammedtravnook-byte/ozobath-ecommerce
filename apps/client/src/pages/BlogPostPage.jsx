import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCalendar, FiEye, FiClock, FiShare2, FiCopy, FiCheck } from 'react-icons/fi';
import { blogAPI } from '@api/services';
import PageHero from '@components/PageHero';
import ScrollReveal from '@components/ScrollReveal';

const fallbackPost = {
    title: 'Modern Minimalist Bathroom Design Trends 2026',
    category: 'Design',
    author: { name: 'OZOBATH Team' },
    publishedAt: '2026-02-24',
    views: 1234,
    featuredImage: { url: '/images/hero_bathroom.png' },
    content: `<p>The world of bathroom design is evolving rapidly, with minimalist aesthetics leading the charge. In 2026, homeowners are embracing clean lines, frameless glass, and thoughtful material choices.</p>
    <h2>1. Frameless Glass Dominance</h2>
    <p>Frameless shower enclosures continue to dominate modern bathroom designs. Their seamless appearance creates an illusion of space, making even small bathrooms feel open and airy.</p>
    <h2>2. Warm Neutral Palettes</h2>
    <p>Gone are the stark white bathrooms. This year, warm neutrals — cream, taupe, and soft beige — create inviting, spa-like atmospheres that feel both luxurious and comfortable.</p>
    <h2>3. Smart Fixtures</h2>
    <p>Technology integration in bathrooms has become mainstream. From temperature-controlled showers to LED-lit mirrors, smart fixtures add convenience without compromising on style.</p>
    <h2>4. Sustainable Materials</h2>
    <p>Eco-conscious choices like recycled glass, bamboo accessories, and water-efficient fixtures are becoming standard in premium bathroom designs.</p>`,
    tags: ['Design', 'Trends', 'Minimalist', '2026'],
};

const BlogPostPage = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await blogAPI.getBySlug(slug);
                setBlog(res.data || null);
            } catch (e) {
                setBlog(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [slug]);

    // Reading progress bar
    useEffect(() => {
        const handleScroll = () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
            setScrollProgress(progress);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const post = blog || (!loading ? fallbackPost : null);

    if (loading) {
        return (
            <div className="bg-[#ffffff]">
                <div className="pt-32 pb-20 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800">
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="skeleton-shimmer h-4 w-32 rounded-full mb-4" />
                        <div className="skeleton-shimmer h-10 w-full rounded-2xl mb-3" />
                        <div className="skeleton-shimmer h-10 w-3/4 rounded-2xl mb-6" />
                        <div className="skeleton-shimmer h-4 w-48 rounded-full" />
                    </div>
                </div>
                <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
                    <div className="skeleton-shimmer h-64 rounded-3xl mb-8" />
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton-shimmer h-4 rounded-xl" style={{ width: `${85 + Math.random() * 15}%` }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="bg-[#ffffff]">
                <PageHero title="Post Not Found" breadcrumbs={[{ label: 'Blog', path: '/blog' }, { label: 'Not Found' }]} compact />
                <div className="section-wrapper text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-5">
                        <FiEye className="w-8 h-8 text-accent-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-dark-900 mb-3">Blog Post Not Found</h2>
                    <p className="text-dark-400 text-sm mb-8 max-w-md mx-auto">The post you're looking for doesn't exist or has been removed.</p>
                    <Link to="/blog" className="btn-primary text-sm">Back to Blog</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#ffffff]">
            {/* Reading Progress Bar */}
            <div
                className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-accent-500 via-orange-500 to-primary-500 z-[100] transition-none"
                style={{ width: `${scrollProgress}%` }}
            />

            {/* Hero */}
            <section className="relative pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute -top-20 -right-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
                    <motion.nav
                        className="flex items-center gap-2 text-sm mb-6"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link to="/" className="text-white/40 hover:text-white/70 transition-colors font-medium">Home</Link>
                        <span className="text-white/20">/</span>
                        <Link to="/blog" className="text-white/40 hover:text-white/70 transition-colors font-medium">Blog</Link>
                        <span className="text-white/20">/</span>
                        <span className="text-accent-400 font-semibold line-clamp-1">{post.title}</span>
                    </motion.nav>

                    {post.category && (
                        <motion.span
                            className="inline-block bg-accent-500/20 text-accent-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            {post.category}
                        </motion.span>
                    )}

                    <motion.h1
                        className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6 leading-tight"
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                    >
                        {post.title}
                    </motion.h1>

                    <motion.div
                        className="flex flex-wrap items-center gap-4 text-white/50 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center text-white text-xs font-bold">
                                {(post.author?.name || 'O').charAt(0)}
                            </span>
                            {post.author?.name || 'OZOBATH Team'}
                        </span>
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5" />
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        {post.views && (
                            <>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <span className="flex items-center gap-1"><FiEye className="w-3.5 h-3.5" /> {post.views} views</span>
                            </>
                        )}
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="flex items-center gap-1"><FiClock className="w-3.5 h-3.5" /> 5 min read</span>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                {/* Featured Image */}
                {post.featuredImage?.url && (
                    <ScrollReveal className="mb-10">
                        <img
                            src={post.featuredImage.url}
                            alt={post.title}
                            className="w-full rounded-3xl shadow-xl shadow-dark-900/10 -mt-20 relative z-20"
                        />
                    </ScrollReveal>
                )}

                {/* Share Bar */}
                <ScrollReveal className="flex items-center gap-3 mb-10 pb-8 border-b border-dark-100">
                    <span className="text-xs font-bold text-dark-400 uppercase tracking-widest">Share</span>
                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-xs font-medium text-dark-600 hover:bg-accent-50 hover:text-accent-600 transition-all duration-300 border border-dark-100"
                    >
                        {copied ? <><FiCheck className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><FiCopy className="w-3.5 h-3.5" /> Copy Link</>}
                    </button>
                    <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-xs font-medium text-dark-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-dark-100"
                    >
                        <FiShare2 className="w-3.5 h-3.5" /> Twitter
                    </a>
                </ScrollReveal>

                {/* Article Content */}
                <ScrollReveal>
                    <div
                        className="prose prose-lg prose-gray max-w-none
                            prose-headings:font-display prose-headings:font-bold prose-headings:text-dark-900
                            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                            prose-p:text-dark-500 prose-p:leading-relaxed
                            prose-a:text-accent-500 prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-2xl prose-img:shadow-lg
                            prose-strong:text-dark-900
                            prose-blockquote:border-accent-400 prose-blockquote:bg-accent-50/50 prose-blockquote:rounded-r-2xl prose-blockquote:py-4 prose-blockquote:not-italic"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </ScrollReveal>

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <ScrollReveal className="mt-10 pt-8 border-t border-dark-100">
                        <span className="text-xs font-bold text-dark-400 uppercase tracking-widest mr-3">Tags</span>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {post.tags.map((tag, i) => (
                                <span key={i} className="px-4 py-1.5 bg-white text-dark-500 text-xs font-medium rounded-full border border-dark-100 hover:border-accent-200 hover:text-accent-600 transition-colors cursor-default">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </ScrollReveal>
                )}

                {/* Back to Blog */}
                <ScrollReveal className="mt-12">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-2 text-accent-500 font-bold text-sm hover:gap-3 transition-all duration-300"
                    >
                        <FiArrowLeft className="w-4 h-4" /> Back to Blog
                    </Link>
                </ScrollReveal>
            </article>
        </div>
    );
};

export default BlogPostPage;
