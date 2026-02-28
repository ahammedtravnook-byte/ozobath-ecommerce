import { useState } from 'react';
import toast from 'react-hot-toast';

const ContactPage = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) { toast.error('Please fill required fields'); return; }
        try {
            setSending(true);
            const { enquiryAPI } = await import('@api/services');
            await enquiryAPI.submitB2B({ ...form, type: 'contact' });
            toast.success('Message sent! We\'ll get back to you soon.');
            setForm({ name: '', email: '', phone: '', message: '' });
        } catch (e) { toast.error('Failed to send'); } finally { setSending(false); }
    };

    return (
        <div className="section-wrapper">
            <div className="text-center mb-12">
                <h1 className="section-title">Contact Us</h1>
                <p className="section-subtitle mx-auto">Have a question or need assistance? We're here to help!</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                {/* Contact Info */}
                <div className="space-y-6">
                    {[{ icon: '📍', title: 'Visit Us', text: 'Bangalore, Karnataka, India' }, { icon: '📞', title: 'Call Us', text: '+91 7899202927' }, { icon: '✉️', title: 'Email', text: 'info@ozobath.com' }, { icon: '🕐', title: 'Working Hours', text: 'Mon - Sat: 9AM - 7PM' }].map((item, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 text-2xl">{item.icon}</div>
                            <div><h3 className="font-semibold text-dark-900">{item.title}</h3><p className="text-sm text-gray-500">{item.text}</p></div>
                        </div>
                    ))}
                    <div className="mt-6">
                        <h3 className="font-semibold text-dark-900 mb-3">Follow Us</h3>
                        <div className="flex gap-3">
                            {['Instagram', 'Facebook', 'YouTube'].map(s => <span key={s} className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer">{s}</span>)}
                        </div>
                    </div>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Message *</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                    <button type="submit" disabled={sending} className="btn-primary w-full">{sending ? 'Sending...' : 'Send Message'}</button>
                </form>
            </div>
        </div>
    );
};
export default ContactPage;
