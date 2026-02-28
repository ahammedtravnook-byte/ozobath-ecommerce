import { useState } from 'react';
import { serviceAPI } from '@api/services';
import toast from 'react-hot-toast';

const ServiceRequestPage = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', productName: '', issueType: 'repair', description: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.description) { toast.error('Please fill required fields'); return; }
        try { setSending(true); await serviceAPI.submit(form); toast.success('Service request submitted! We\'ll contact you shortly.'); setForm({ name: '', email: '', phone: '', productName: '', issueType: 'repair', description: '' }); } catch (e) { toast.error('Failed'); } finally { setSending(false); }
    };

    return (
        <div className="section-wrapper">
            <div className="text-center mb-12"><h1 className="section-title">Service & Support</h1><p className="section-subtitle mx-auto">Need help with an OZOBATH product? Submit a service request and our team will assist you.</p></div>
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label><input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Which OZOBATH product?" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                        <select value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="repair">Repair</option><option value="installation">Installation Help</option><option value="replacement">Replacement</option><option value="warranty">Warranty Claim</option><option value="other">Other</option>
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Describe the issue..." /></div>
                    <button type="submit" disabled={sending} className="btn-primary w-full">{sending ? 'Submitting...' : 'Submit Request'}</button>
                </form>
            </div>
        </div>
    );
};
export default ServiceRequestPage;
