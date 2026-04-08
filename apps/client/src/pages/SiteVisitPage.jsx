import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('productId') || '';
    const productName = searchParams.get('productName') || '';
    const productImage = searchParams.get('productImage') || '';
    const isShowerEnclosure = searchParams.get('reason') === 'shower-enclosure' || !!productId;

    const [form, setForm] = useState({ customerName: '', email: '', phone: '', city: '', preferredDate: '', preferredTime: '', message: isShowerEnclosure ? 'I am interested in a Shower Enclosure and would like to request a site visit.' : '', numberOfBathrooms: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customerName || !form.email || !form.phone || !form.preferredDate) { toast.error('Please fill required fields'); return; }
        try {
            setSending(true);
            const payload = { ...form };
            if (productId) payload.productId = productId;
            if (productName) payload.productName = productName;
            if (productImage) payload.productImage = productImage;
            await bookingAPI.bookSiteVisit(payload);
            toast.success("Site visit booked! We'll confirm your appointment shortly. \uD83D\uDCD0");
            setForm({ customerName: '', email: '', phone: '', city: '', preferredDate: '', preferredTime: '', message: '', numberOfBathrooms: '' });
        } catch (e) { toast.error('Booking failed'); } finally { setSending(false); }
    };

    const inputClass = "w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300";

    return (
        <div className="bg-[#ffffff]">
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
                                <motion.div className="glass-morph p-4 sm:p-5 flex items-center gap-4 group cursor-default w-full sm:min-w-[200px]" whileHover={{ y: -2 }}>
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
                    <div className="glass-morph p-5 sm:p-8 md:p-10">
                        <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Schedule Your Visit</h2>
                        <p className="text-dark-400 text-sm mb-8">Fill in your details and we'll confirm your appointment within 24 hours.</p>

                        {productName && (
                            <div className="flex items-center gap-4 bg-accent-50 border border-accent-200 rounded-2xl p-4 mb-6">
                                {productImage && (
                                    <div className="w-16 h-16 rounded-xl bg-white border border-accent-100 flex items-center justify-center shrink-0 overflow-hidden">
                                        <img src={productImage} alt={productName} className="w-[85%] h-[85%] object-contain" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-bold text-accent-500 uppercase tracking-widest mb-0.5">Booking visit for</p>
                                    <p className="text-sm font-bold text-dark-900 leading-snug">{productName}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Name *</label><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className={inputClass} placeholder="Your full name" /></div>
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Phone *</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 XXXXX XXXXX" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className={inputClass} placeholder="your@email.com" /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Your city" /></div>
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">No. of Bathrooms</label><input value={form.numberOfBathrooms} onChange={e => setForm({ ...form, numberOfBathrooms: e.target.value })} type="number" min="1" className={inputClass} placeholder="e.g. 2" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Preferred Date *</label><input value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} type="date" className={inputClass} min={new Date().toISOString().slice(0, 10)} /></div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Preferred Time</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setForm({ ...form, preferredTime: slot })}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${form.preferredTime === slot ? 'bg-accent-500 text-white border-accent-500 shadow-md' : 'bg-white text-dark-600 border-dark-200 hover:border-accent-400 hover:text-accent-500'}`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
