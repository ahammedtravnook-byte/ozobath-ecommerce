import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '@api/services';

const BlogListPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1 });

    useEffect(() => {
        const fetch = async () => {
            try { setLoading(true); const res = await blogAPI.getAll({ page, limit: 9 }); setBlogs(res.data?.blogs || []); setPagination(res.data?.pagination || { total: 0, pages: 1 }); } catch (e) { } finally { setLoading(false); }
        };
        fetch();
    }, [page]);

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="section-wrapper">
            <h1 className="section-title">Blog & Tips</h1>
            <p className="section-subtitle mb-10">Expert advice on bathroom design, maintenance, and premium solutions</p>
            {blogs.length === 0 ? <p className="text-gray-400 text-center py-12">No blog posts yet. Check back soon!</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.map(blog => (
                        <Link key={blog._id} to={`/blog/${blog.slug}`} className="premium-card group">
                            <div className="aspect-video bg-gray-100 overflow-hidden"><img src={blog.featuredImage?.url || '/placeholder.jpg'} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                            <div className="p-5">
                                {blog.category && <span className="text-xs text-primary-500 font-semibold uppercase tracking-wider">{blog.category}</span>}
                                <h2 className="text-lg font-semibold text-dark-900 mt-1 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">{blog.title}</h2>
                                <p className="text-sm text-gray-500 line-clamp-2">{blog.excerpt}</p>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                    <span>{blog.author?.name}</span>
                                    <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {pagination.pages > 1 && <div className="flex justify-center gap-2 mt-10">{Array.from({ length: pagination.pages }, (_, i) => (<button key={i} onClick={() => setPage(i + 1)} className={`px-3.5 py-2 rounded-lg text-sm ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{i + 1}</button>))}</div>}
        </div>
    );
};
export default BlogListPage;
