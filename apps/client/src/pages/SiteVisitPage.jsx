import { useState } from 'react';
import { bookingAPI } from '@api/services';
import toast from 'react-hot-toast';

const SiteVisitPage = () => {
    const [form, setForm] = useState({ customerName: '', email: '', phone: '', city: '', preferredDate: '', preferredTime: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customerName || !form.email || !form.phone || !form.preferredDate) { toast.error('Please fill required fields'); return; }
        try { setSending(true); await bookingAPI.bookSiteVisit(form); toast.success('Site visit booked! We\'ll confirm your appointment shortly.'); setForm({ customerName: '', email: '', phone: '', city: '', preferredDate: '', preferredTime: '', message: '' }); } catch (e) { toast.error('Failed'); } finally { setSending(false); }
    };

    return (
        <div className="section-wrapper">
            <div className="text-center mb-12">
                <h1 className="section-title">Book a Site Visit</h1>
                <p className="section-subtitle mx-auto">Our experts will visit your space to help you choose the perfect bathroom solutions</p>
            </div>
            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[{ icon: '📐', title: 'Free Measurement', desc: 'Professional space analysis' }, { icon: '🎨', title: 'Design Advice', desc: 'Expert recommendations' }, { icon: '💰', title: 'Custom Quote', desc: 'Best price for your project' }].map((f, i) => (
                        <div key={i} className="bg-primary-50 rounded-xl p-4 text-center"><span className="text-2xl">{f.icon}</span><h3 className="text-sm font-semibold text-dark-900 mt-2">{f.title}</h3><p className="text-xs text-gray-500">{f.desc}</p></div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 md:p-8 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Your city" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label><input value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} type="date" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label><input value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} type="time" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Any specific requirements?" /></div>
                    <button type="submit" disabled={sending} className="btn-primary w-full text-lg">{sending ? 'Booking...' : 'Book Site Visit'}</button>
                </form>
            </div>
        </div>
    );
};
export default SiteVisitPage;
