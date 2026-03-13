import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '@context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) { toast.error('Please fill all fields'); return; }
        if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
        try {
            setLoading(true);
            await register({ name: form.name, email: form.email, password: form.password });
            navigate('/');
        } catch (err) { toast.error(err.message || 'Registration failed'); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex bg-[#ffffff] relative overflow-hidden">
            {/* Left Panel — Decorative Image */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-dark-950">
                    <img 
                        src="/images/luxury_bathroom_auth_bg_1773420543336.png" 
                        alt="Luxury Bathroom" 
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-900/80 to-transparent" />
                </div>
                <div className="relative z-10 text-center px-12 max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-600/25">
                        <span className="text-white font-display font-bold text-2xl">O</span>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-white mb-4">
                        Join <span className="text-accent-400">OZOBATH</span>
                    </h2>
                    <p className="text-white/70 text-sm leading-relaxed mb-8">
                        Create an account to track orders, save wishlist items, and get exclusive premium deals.
                    </p>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-16 relative z-10">
                {/* Back Button */}
                <Link to="/" className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2 text-dark-400 hover:text-accent-500 font-bold text-sm tracking-widest uppercase transition-all duration-300 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-dark-100/50 shadow-sm hover:shadow-md">
                    <FiArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
                <div className="w-full max-w-md">
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/" className="inline-block">
                            <h1 className="text-3xl font-display font-extrabold tracking-tight">OZO<span className="text-accent-500">BATH</span></h1>
                        </Link>
                    </div>

                    <div className="glass-morph p-8 md:p-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-display font-bold text-dark-900 mb-1">Create Account</h2>
                            <p className="text-dark-400 text-sm">Join OZOBATH for exclusive deals and updates.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Full Name</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-5 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300" placeholder="Your full name" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email Address</label>
                                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-5 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300" placeholder="your.name@gmail.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Password</label>
                                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-5 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300" placeholder="Create a password" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Confirm Password</label>
                                <input value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} type="password" className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-5 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300" placeholder="Confirm your password" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 mt-6">{loading ? 'Creating...' : 'Create Account'}</button>
                        </form>
                        
                        <div className="mt-6 text-center text-sm text-dark-500">
                            Already have an account? <Link to="/login" className="text-accent-500 hover:text-accent-600 font-bold transition-colors">Sign In</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default RegisterPage;
