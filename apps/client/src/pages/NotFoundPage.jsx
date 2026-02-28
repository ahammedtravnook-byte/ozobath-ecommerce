import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
            <h1 className="text-8xl font-display font-bold gradient-text mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-dark-900 mb-2">Page Not Found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved. Let's get you back on track.</p>
            <div className="flex gap-4 justify-center">
                <Link to="/" className="btn-primary">Go Home</Link>
                <Link to="/shop" className="btn-secondary">Browse Shop</Link>
            </div>
        </div>
    </div>
);
export default NotFoundPage;
