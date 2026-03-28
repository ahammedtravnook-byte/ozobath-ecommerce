import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'ozobath_recently_viewed';
const MAX_ITEMS = 6;

export const addToRecentlyViewed = (product) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = stored.filter(p => p._id !== product._id);
    const updated = [
      { _id: product._id, name: product.name, slug: product.slug, price: product.price, image: product.images?.[0]?.url || null },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
};

export const getRecentlyViewed = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

const RecentlyViewed = ({ currentProductId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = getRecentlyViewed().filter(p => p._id !== currentProductId);
    setItems(stored);
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-display font-bold text-dark-900 mb-4">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {items.map(product => (
          <Link
            key={product._id}
            to={`/product/${product.slug}`}
            className="group bg-white rounded-xl p-3 shadow-sm border border-dark-100/10 hover:shadow-md transition-shadow"
          >
            <div className="aspect-square bg-dark-50 rounded-lg overflow-hidden mb-2">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🚿</div>
              )}
            </div>
            <p className="text-xs font-semibold text-dark-900 truncate group-hover:text-accent-500 transition-colors">{product.name}</p>
            <p className="text-xs text-dark-500 font-bold mt-0.5">₹{product.price?.toLocaleString('en-IN')}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
