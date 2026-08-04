import { useState, useEffect } from 'react';
import { useAuth } from '@context/AuthContext';
import { addressAPI } from '@api/services';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiHome, FiBriefcase, FiStar, FiLogOut } from 'react-icons/fi';
import toast from 'react-hot-toast';
import SEO from '@components/SEO';

const LABEL_OPTIONS = [
    { value: 'Home', icon: FiHome, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'Work', icon: FiBriefcase, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { value: 'Other', icon: FiMapPin, color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

const emptyAddress = {
    label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false,
};

const ProfilePage = () => {
    const { user, updateProfile, isAuthenticated, logout, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    // Address state
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [addressForm, setAddressForm] = useState({ ...emptyAddress });
    const [addressSaving, setAddressSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login'); return; }
        setName(user?.name || '');
        setPhone(user?.phone || '');
        setAddresses(user?.addresses || []);
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

    // ─── Address CRUD ────────────────────────────────
    const openAddForm = () => {
        setEditingId(null);
        setAddressForm({ ...emptyAddress, fullName: user?.name || '', phone: user?.phone || '' });
        setShowAddressForm(true);
    };

    const openEditForm = (addr) => {
        setEditingId(addr._id);
        setAddressForm({ ...addr });
        setShowAddressForm(true);
    };

    const closeForm = () => {
        setShowAddressForm(false);
        setEditingId(null);
        setAddressForm({ ...emptyAddress });
    };

    const validateAddressForm = () => {
        if (!addressForm.fullName || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
            toast.error('Please fill all required fields');
            return false;
        }
        if (!/^\d{10}$/.test(addressForm.phone)) {
            toast.error('Please enter a valid 10-digit phone number');
            return false;
        }
        if (!/^\d{6}$/.test(addressForm.pincode)) {
            toast.error('Please enter a valid 6-digit pincode');
            return false;
        }
        return true;
    };

    const handleAddressSave = async () => {
        if (!validateAddressForm()) return;
        try {
            setAddressSaving(true);
            if (editingId) {
                const res = await addressAPI.update(editingId, addressForm);
                setAddresses(res.data || []);
                toast.success('Address updated');
            } else {
                const res = await addressAPI.add(addressForm);
                setAddresses(res.data || []);
                toast.success('Address added');
            }
            await refreshProfile();
            closeForm();
        } catch (e) {
            toast.error(e?.message || 'Failed to save address');
        } finally {
            setAddressSaving(false);
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            setDeletingId(id);
            const res = await addressAPI.remove(id);
            setAddresses(res.data || []);
            await refreshProfile();
            toast.success('Address removed');
        } catch (e) {
            toast.error('Failed to delete address');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (addr) => {
        try {
            await addressAPI.update(addr._id, { ...addr, isDefault: true });
            await refreshProfile();
            toast.success('Default address updated');
        } catch (e) {
            toast.error('Failed to set default');
        }
    };

    const getLabelConfig = (label) => LABEL_OPTIONS.find(l => l.value === label) || LABEL_OPTIONS[2];

    return (
        <div className="min-h-screen bg-dark-50/40">
            <SEO
                title="My Profile"
                noindex
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-20 sm:pt-8 pb-24 sm:pb-10">
                <motion.h1
                    className="text-2xl sm:text-3xl font-display font-bold text-dark-900 mb-8"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    My Profile
                </motion.h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Left: Profile Info ───────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information Card */}
                        <motion.div
                            className="bg-white rounded-3xl p-6 shadow-sm border border-dark-100/40"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center">
                                    <FiUser className="w-4.5 h-4.5 text-accent-600" />
                                </div>
                                <h2 className="text-lg font-bold text-dark-900">Personal Information</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                                    <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-dark-100/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Email</label>
                                    <input value={user?.email || ''} disabled className="w-full px-4 py-3 border border-dark-50 rounded-2xl text-sm bg-dark-50/50 text-dark-400 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Phone</label>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 border border-dark-100/60 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" placeholder="+91 XXXXXXXXXX" />
                                </div>
                                <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-8 py-3 bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-accent-500/20 disabled:opacity-50 uppercase tracking-wider">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </motion.div>

                        {/* ── Address Book Card ───────────────── */}
                        <motion.div
                            className="bg-white rounded-3xl p-6 shadow-sm border border-dark-100/40"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                                        <FiMapPin className="w-4.5 h-4.5 text-primary-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-dark-900">Address Book</h2>
                                        <p className="text-xs text-dark-400">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={openAddForm}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-dark-900 hover:bg-dark-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm uppercase tracking-wider"
                                >
                                    <FiPlus className="w-3.5 h-3.5" /> Add New
                                </button>
                            </div>

                            {/* Address List */}
                            {addresses.length === 0 ? (
                                <div className="text-center py-10 bg-dark-50/50 rounded-2xl border border-dashed border-dark-200">
                                    <FiMapPin className="w-8 h-8 text-dark-300 mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-dark-500 mb-1">No addresses saved yet</p>
                                    <p className="text-xs text-dark-400 mb-4">Add an address to speed up your checkout</p>
                                    <button onClick={openAddForm} className="text-xs font-bold text-accent-600 hover:text-accent-500 transition-colors">
                                        + Add your first address
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {addresses.map(addr => {
                                        const labelCfg = getLabelConfig(addr.label);
                                        const LabelIcon = labelCfg.icon;
                                        return (
                                            <div
                                                key={addr._id}
                                                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${addr.isDefault ? 'border-accent-300 bg-accent-50/30' : 'border-dark-100/40 hover:border-dark-200'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${labelCfg.color}`}>
                                                                <LabelIcon className="w-3 h-3" /> {addr.label || 'Home'}
                                                            </span>
                                                            {addr.isDefault && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-200">
                                                                    <FiStar className="w-3 h-3" /> Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-bold text-dark-900">{addr.fullName}</p>
                                                        <p className="text-xs text-dark-500 mt-0.5 leading-relaxed">
                                                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                                                        </p>
                                                        <p className="text-xs text-dark-400 mt-1">📞 {addr.phone}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {!addr.isDefault && (
                                                            <button
                                                                onClick={() => handleSetDefault(addr)}
                                                                title="Set as default"
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-accent-600 hover:bg-accent-50 transition-all"
                                                            >
                                                                <FiStar className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEditForm(addr)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        >
                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddress(addr._id)}
                                                            disabled={deletingId === addr._id}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* ── Right Sidebar ────────────────────── */}
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-dark-100/40 text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent-400 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-accent-500/20">
                                <span className="text-3xl font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <p className="font-bold text-dark-900 text-lg">{user?.name}</p>
                            <p className="text-sm text-dark-400">{user?.email}</p>
                            <p className="text-xs text-dark-400 mt-1">Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                            <div className="mt-4 pt-4 border-t border-dark-100/40">
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-dark-50/70 rounded-xl py-2.5">
                                        <p className="text-lg font-bold text-dark-900">{addresses.length}</p>
                                        <p className="text-[10px] text-dark-400 font-semibold uppercase tracking-wider">Addresses</p>
                                    </div>
                                    <div className="bg-dark-50/70 rounded-xl py-2.5">
                                        <p className="text-lg font-bold text-dark-900">{user?.phone ? '✓' : '—'}</p>
                                        <p className="text-[10px] text-dark-400 font-semibold uppercase tracking-wider">Phone</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); navigate('/'); }}
                            className="w-full py-3.5 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm border border-red-100"
                        >
                            <FiLogOut className="w-4 h-4" /> Logout
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* ── Address Form Modal ──────────────────── */}
            <AnimatePresence>
                {showAddressForm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm" onClick={closeForm} />
                        <motion.div
                            className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <button onClick={closeForm} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-dark-50 flex items-center justify-center text-dark-400 hover:bg-dark-100 transition-colors">
                                <FiX className="w-4 h-4" />
                            </button>

                            <h3 className="text-lg font-bold text-dark-900 mb-1">
                                {editingId ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            <p className="text-xs text-dark-400 mb-5">This address will be available during checkout</p>

                            <div className="space-y-4">
                                {/* Label Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-dark-500 mb-2 uppercase tracking-wider">Address Type</label>
                                    <div className="flex gap-2">
                                        {LABEL_OPTIONS.map(opt => {
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setAddressForm({ ...addressForm, label: opt.value })}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${addressForm.label === opt.value
                                                        ? 'border-accent-500 bg-accent-50 text-accent-700'
                                                        : 'border-dark-100 text-dark-500 hover:border-dark-200'}`}
                                                >
                                                    <Icon className="w-3.5 h-3.5" /> {opt.value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Full Name *</label>
                                        <input value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Phone *</label>
                                        <input value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" placeholder="10-digit number" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Address Line 1 *</label>
                                    <input value={addressForm.line1} onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" placeholder="House/Flat, Building, Street" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Address Line 2</label>
                                    <input value={addressForm.line2} onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" placeholder="Area, Colony (Optional)" />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">City *</label>
                                        <input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">State *</label>
                                        <input value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-dark-500 mb-1.5 uppercase tracking-wider">Pincode *</label>
                                        <input value={addressForm.pincode} onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })} className="w-full px-3.5 py-2.5 border border-dark-100/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all" placeholder="6-digit" />
                                    </div>
                                </div>

                                {/* Set as default checkbox */}
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${addressForm.isDefault ? 'bg-accent-500 border-accent-500' : 'border-dark-200 group-hover:border-dark-300'}`}>
                                        {addressForm.isDefault && <FiCheck className="w-3 h-3 text-white" />}
                                    </div>
                                    <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="hidden" />
                                    <span className="text-sm text-dark-600 font-medium">Set as default address</span>
                                </label>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={closeForm} className="flex-1 py-3 border-2 border-dark-100 rounded-2xl text-sm font-bold text-dark-600 hover:bg-dark-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddressSave}
                                        disabled={addressSaving}
                                        className="flex-1 py-3 bg-accent-500 hover:bg-accent-400 text-white rounded-2xl text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-accent-500/20"
                                    >
                                        {addressSaving ? 'Saving...' : (editingId ? 'Update Address' : 'Save Address')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
