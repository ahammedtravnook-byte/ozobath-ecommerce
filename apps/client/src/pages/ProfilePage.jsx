import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { user, updateProfile, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        setName(user?.name || '');
        setPhone(user?.phone || '');
    }, [isAuthenticated, user, navigate]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateProfile({ name, phone });
        } catch (e) {
            toast.error('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="section-wrapper">
            <h1 className="text-3xl font-display font-bold text-dark-900 mb-8">My Profile</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-dark-900 mb-4">Personal Information</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={user?.email || ''} disabled className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="+91" /></div>
                            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3"><span className="text-3xl font-bold text-primary-600">{user?.name?.[0]?.toUpperCase()}</span></div>
                        <p className="font-semibold text-dark-900">{user?.name}</p>
                        <p className="text-sm text-gray-400">{user?.email}</p>
                        <p className="text-xs text-gray-400 mt-1">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }} className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors">Logout</button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
