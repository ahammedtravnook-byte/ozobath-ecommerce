import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { toast.error('Please fill all fields'); return; }

        try {
            setLoading(true);
            if (isNewUser) {
                await register({ name: name || email.split('@')[0], email, password });
            } else {
                await login(email, password);
            }

            // Merge guest cart if exists
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            if (guestCart.length > 0) {
                try {
                    const api = (await import('@api/services')).cartAPI;
                    for (const item of guestCart) {
                        await api.add({ productId: item.productId, quantity: item.quantity, variant: item.variant });
                    }
                    localStorage.removeItem('guestCart');
                    toast.success('Cart items synced!');
                } catch (e) { console.error('Cart merge failed:', e); }
            }

            navigate(redirect);
        } catch (err) {
            // Check for rate limit error specifically
            if (err.message?.includes('Too many') || err.status === 429) {
                toast.error(err.message || 'Too many login attempts. Please try again in 2 minutes.', { duration: 5000 });
                return;
            }

            if (err.message?.includes('not found') || err.message?.includes('not registered')) {
                setIsNewUser(true);
                toast('New here? Create your account below! 🎉', { icon: '👋' });
            } else {
                toast.error(err.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="text-3xl font-display font-bold gradient-text">OZOBATH</Link>
                    <p className="text-gray-500 mt-2">{isNewUser ? 'Create your account' : 'Welcome back'}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-soft p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {isNewUser && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Your full name" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gmail Address</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="your.name@gmail.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" placeholder="Enter your password" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
                            {loading ? 'Please wait...' : isNewUser ? 'Create Account' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button onClick={() => setIsNewUser(!isNewUser)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            {isNewUser ? 'Already have an account? Login' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">
                    By continuing, you agree to our <Link to="/terms" className="text-primary-500 hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary-500 hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
