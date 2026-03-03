import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMapPin, FiClipboard, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { bookingAPI } from '@api/services';
import toast from 'react-hot-toast';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const steps = [
    { icon: FiClipboard, title: 'Free Measurement', desc: 'Professional space analysis', color: 'accent' },
    { icon: FiMapPin, title: 'Design Advice', desc: 'Expert recommendations', color: 'primary' },
    { icon: FiDollarSign, title: 'Custom Quote', desc: 'Best price for your project', color: 'accent' },
];

const SiteVisitPage = () => {
    const [form, setForm] = useState({ customerName: '', email: '', phone: '', city: '', preferredDate: '', preferredTime: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customerName || !form.email || !form.phone || !form.preferredDate) { toast.error('Please fill required fields'); return; }
        try { setSending(true); await bookingAPI.bookSiteVisit(form); toast.success("Site visit booked! We'll confirm your appointment shortly. 📐"); setForm({ customerName: '', email: '', phone: '', city: '', preferredDate: '', preferredTime: '', message: '' }); } catch (e) { toast.error('Booking failed'); } finally { setSending(false); }
    };

    const inputClass = "w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300";

    return (
        <div className="bg-[#FAF7F2]">
            <PageHero
                title="Book a Site Visit"
                subtitle="Our experts will visit your space to help you choose the perfect bathroom solutions."
                breadcrumbs={[{ label: 'Site Visit' }]}
            />

            <section className="section-wrapper">
                {/* Steps */}
                <ScrollReveal className="max-w-3xl mx-auto mb-14">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-4 md:gap-6">
                                <motion.div className="glass-morph p-5 flex items-center gap-4 group cursor-default min-w-[200px]" whileHover={{ y: -2 }}>
                                    <div className={`w-11 h-11 rounded-xl bg-${step.color}-50 flex items-center justify-center shrink-0 group-hover:bg-${step.color}-500 transition-all duration-300`}>
                                        <step.icon className={`w-5 h-5 text-${step.color}-500 group-hover:text-white transition-colors duration-300`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-dark-900 text-sm">{step.title}</h3>
                                        <p className="text-dark-400 text-xs">{step.desc}</p>
                                    </div>
                                </motion.div>
                                {i < steps.length - 1 && <div className="hidden md:block w-8 h-0.5 bg-accent-200 rounded-full" />}
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Form */}
                <ScrollReveal className="max-w-2xl mx-auto">
                    <div className="glass-morph p-8 md:p-10">
                        <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Schedule Your Visit</h2>
                        <p className="text-dark-400 text-sm mb-8">Fill in your details and we'll confirm your appointment within 24 hours.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Name *</label><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className={inputClass} placeholder="Your full name" /></div>
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Phone *</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 XXXXX XXXXX" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className={inputClass} placeholder="your@email.com" /></div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Your city" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Preferred Date *</label><input value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} type="date" className={inputClass} min={new Date().toISOString().slice(0, 10)} /></div>
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Preferred Time</label><input value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} type="time" className={inputClass} /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} className={inputClass} placeholder="Any specific requirements?" /></div>
                            <motion.button type="submit" disabled={sending} className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 disabled:opacity-50 flex items-center justify-center gap-2" whileTap={{ scale: 0.98 }}>
                                {sending ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking...</> : <><FiSend className="w-4 h-4" /> Book Site Visit</>}
                            </motion.button>
                        </form>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
};

export default SiteVisitPage;
