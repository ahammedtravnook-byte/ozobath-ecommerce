import { useState } from 'react';
import { enquiryAPI } from '@api/services';
import toast from 'react-hot-toast';

const B2BEnquiryPage = () => {
    const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '', requirements: '', expectedQuantity: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.companyName || !form.email || !form.requirements) { toast.error('Please fill required fields'); return; }
        try { setSending(true); await enquiryAPI.submitB2B(form); toast.success('Enquiry submitted! Our team will contact you within 24 hours.'); setForm({ companyName: '', contactPerson: '', email: '', phone: '', requirements: '', expectedQuantity: '' }); } catch (e) { toast.error('Failed'); } finally { setSending(false); }
    };

    return (
        <div className="section-wrapper">
            <div className="text-center mb-12"><h1 className="section-title">B2B / Bulk Orders</h1><p className="section-subtitle mx-auto">Partner with OZOBATH for premium bathroom solutions at scale. Special pricing for architects, builders, and interior designers.</p></div>
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 md:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Quantity</label><input value={form.expectedQuantity} onChange={e => setForm({ ...form, expectedQuantity: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. 100 units" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label><textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Describe the products and quantities you need..." /></div>
                    <button type="submit" disabled={sending} className="btn-primary w-full text-lg">{sending ? 'Submitting...' : 'Submit Enquiry'}</button>
                </form>
            </div>
        </div>
    );
};
export default B2BEnquiryPage;
