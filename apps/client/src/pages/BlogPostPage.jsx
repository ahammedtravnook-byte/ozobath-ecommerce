import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogAPI } from '@api/services';

const BlogPostPage = () => {
    const { slug } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try { setLoading(true); const res = await blogAPI.getBySlug(slug); setBlog(res.data); } catch (e) { } finally { setLoading(false); }
        };
        fetch();
    }, [slug]);

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;
    if (!blog) return <div className="section-wrapper text-center"><h2 className="text-2xl text-gray-400">Blog post not found</h2></div>;

    return (
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
            <nav className="text-sm text-gray-400 mb-6"><Link to="/" className="hover:text-primary-600">Home</Link> / <Link to="/blog" className="hover:text-primary-600">Blog</Link> / <span className="text-gray-700">{blog.title}</span></nav>
            {blog.category && <span className="text-xs text-primary-500 font-semibold uppercase tracking-wider">{blog.category}</span>}
            <h1 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mt-2 mb-4">{blog.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
                <span>By {blog.author?.name}</span><span>·</span><span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>·</span><span>{blog.views} views</span>
            </div>
            {blog.featuredImage?.url && <img src={blog.featuredImage.url} alt={blog.title} className="w-full rounded-2xl mb-8" />}
            <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
            {blog.tags?.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{blog.tags.map((t, i) => <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">{t}</span>)}</div>}
            <Link to="/blog" className="inline-block mt-8 text-primary-600 hover:text-primary-700 font-medium">← Back to Blog</Link>
        </article>
    );
};
export default BlogPostPage;
