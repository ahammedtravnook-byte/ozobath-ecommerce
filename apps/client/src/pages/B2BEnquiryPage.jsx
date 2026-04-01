import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiUsers, FiBriefcase, FiPercent, FiTruck, FiArrowRight } from 'react-icons/fi';
import { enquiryAPI } from '@api/services';
import toast from 'react-hot-toast';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const benefits = [
    { icon: FiPercent, title: 'Bulk Pricing', desc: 'Competitive wholesale rates for large orders', color: 'accent' },
    { icon: FiUsers, title: 'Dedicated Manager', desc: 'Personal account manager for your projects', color: 'primary' },
    { icon: FiBriefcase, title: 'Custom Solutions', desc: 'Tailored products for your specific requirements', color: 'accent' },
    { icon: FiTruck, title: 'Priority Delivery', desc: 'Fast-track shipping for business orders', color: 'primary' },
];

const B2BEnquiryPage = () => {
    const [form, setForm] = useState({ companyName: '', contactPerson: '', email: '', phone: '', requirements: '', expectedQuantity: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.companyName || !form.email || !form.requirements) { toast.error('Please fill required fields'); return; }
        try { setSending(true); await enquiryAPI.submitB2B(form); toast.success('Enquiry submitted! Our team will contact you within 24 hours. 🎉'); setForm({ companyName: '', contactPerson: '', email: '', phone: '', requirements: '', expectedQuantity: '' }); } catch (e) { toast.error('Failed to submit'); } finally { setSending(false); }
    };

    const inputClass = "w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300";

    return (
        <div className="bg-[#ffffff]">
            <PageHero
                title="B2B / Bulk Orders"
                subtitle="Partner with OZOBATH for premium bathroom solutions at scale. Special pricing for architects, builders, and interior designers."
                breadcrumbs={[{ label: 'B2B Enquiry' }]}
                illustration="/images/illus_b2b.png"
            />

            <section className="section-wrapper">
                {/* Benefits */}
                <ScrollReveal stagger staggerDelay={0.1} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {benefits.map((b, i) => (
                        <ScrollRevealItem key={i}>
                            <motion.div className="glass-morph p-6 text-center group cursor-default" whileHover={{ y: -4 }}>
                                <div className={`w-12 h-12 rounded-2xl bg-${b.color}-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-${b.color}-500 transition-all duration-300`}>
                                    <b.icon className={`w-5 h-5 text-${b.color}-500 group-hover:text-white transition-colors duration-300`} />
                                </div>
                                <h3 className="font-bold text-dark-900 text-sm mb-1">{b.title}</h3>
                                <p className="text-dark-400 text-xs">{b.desc}</p>
                            </motion.div>
                        </ScrollRevealItem>
                    ))}
                </ScrollReveal>

                {/* Form */}
                <ScrollReveal className="max-w-2xl mx-auto">
                    <div className="glass-morph p-8 md:p-10">
                        <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Submit Your Enquiry</h2>
                        <p className="text-dark-400 text-sm mb-8">Fill out the form below and our B2B team will get back to you within 24 hours.</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Company Name *</label>
                                    <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className={inputClass} placeholder="Your company" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Contact Person</label>
                                    <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className={inputClass} placeholder="Your name" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email *</label>
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className={inputClass} placeholder="business@company.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Phone</label>
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 XXXXX XXXXX" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Expected Quantity</label>
                                <input value={form.expectedQuantity} onChange={e => setForm({ ...form, expectedQuantity: e.target.value })} className={inputClass} placeholder="e.g. 100 units" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Requirements *</label>
                                <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={4} className={inputClass} placeholder="Describe the products and quantities you need..." />
                            </div>
                            <motion.button type="submit" disabled={sending} className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 disabled:opacity-50 flex items-center justify-center gap-2" whileTap={{ scale: 0.98 }}>
                                {sending ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><FiSend className="w-4 h-4" /> Submit Enquiry</>}
                            </motion.button>
                        </form>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
};

export default B2BEnquiryPage;
