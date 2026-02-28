import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8"><Link to="/" className="text-3xl font-display font-bold gradient-text">OZOBATH</Link><p className="text-gray-500 mt-2">Create your account</p></div>
                <div className="bg-white rounded-2xl shadow-soft p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} type="password" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <button type="submit" disabled={loading} className="btn-primary w-full text-lg">{loading ? 'Creating...' : 'Create Account'}</button>
                    </form>
                    <p className="mt-4 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Login</Link></p>
                </div>
            </div>
        </div>
    );
};
export default RegisterPage;
