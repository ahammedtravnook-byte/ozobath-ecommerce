import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
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
    const [showPassword, setShowPassword] = useState(false);

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
        <div className="min-h-screen flex bg-[#FAF7F2] relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[120px]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px]"
                    animate={{ scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Left Panel — Decorative */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800" />

                {/* Decorative orbs */}
                <motion.div
                    className="absolute top-1/4 right-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-[80px]"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-primary-500/10 rounded-full blur-[60px]"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Floating shapes */}
                <motion.div
                    className="absolute top-[20%] right-[30%] w-4 h-4 bg-accent-400 rotate-45"
                    animate={{ y: [0, -20, 0], rotate: [45, 90, 45] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[30%] left-[35%] w-5 h-5 rounded-full border-2 border-white/10"
                    animate={{ y: [0, 15, 0], scale: [1, 1.5, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-[60%] right-[20%] w-3 h-3 rounded-full bg-primary-400/30"
                    animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Content */}
                <div className="relative z-10 text-center px-12 max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-accent-500/25">
                            <span className="text-white font-display font-bold text-2xl">O</span>
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-4">
                            Welcome to <span className="text-accent-400">OZOBATH</span>
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed mb-8">
                            Browse premium shower enclosures, manage your orders, track deliveries, and get personalized recommendations — all in one place.
                        </p>
                        <div className="flex items-center justify-center gap-3 text-accent-400/80 text-xs font-medium">
                            <span className="flex items-center gap-1.5"><FiArrowRight className="w-3 h-3" /> Free Shipping</span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <span className="flex items-center gap-1.5"><FiArrowRight className="w-3 h-3" /> 5-Year Warranty</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/" className="inline-block">
                            <h1 className="text-3xl font-display font-extrabold tracking-tight">
                                OZO<span className="text-accent-500">BATH</span>
                            </h1>
                        </Link>
                    </div>

                    <div className="glass-morph p-8 md:p-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-display font-bold text-dark-900 mb-1">
                                {isNewUser ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-dark-400 text-sm">
                                {isNewUser ? 'Join OZOBATH for exclusive deals and updates.' : 'Sign in to your OZOBATH account.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode="wait">
                                {isNewUser && (
                                    <motion.div
                                        key="name-field"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Full Name</label>
                                        <div className="relative">
                                            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                            <input
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 pl-11 pr-5 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email Address</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                    <input
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        type="email"
                                        className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 pl-11 pr-5 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300"
                                        placeholder="your.name@gmail.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Password</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                    <input
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 pl-11 pr-12 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300"
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-dark-300 hover:text-dark-500 transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Please wait...
                                    </>
                                ) : (
                                    <>
                                        {isNewUser ? 'Create Account' : 'Sign In'}
                                        <FiArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsNewUser(!isNewUser)}
                                className="text-sm text-accent-500 hover:text-accent-600 font-semibold transition-colors"
                            >
                                {isNewUser ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-dark-300 mt-6">
                        By continuing, you agree to our{' '}
                        <Link to="/terms" className="text-accent-500 hover:underline">Terms</Link> and{' '}
                        <Link to="/privacy" className="text-accent-500 hover:underline">Privacy Policy</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
