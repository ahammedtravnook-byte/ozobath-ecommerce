import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTool, FiSend, FiShield, FiClock, FiPhone } from 'react-icons/fi';
import { serviceAPI } from '@api/services';
import toast from 'react-hot-toast';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const ServiceRequestPage = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', productName: '', issueType: 'repair', description: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.description) { toast.error('Please fill required fields'); return; }
        try { setSending(true); await serviceAPI.submit(form); toast.success("Service request submitted! We'll contact you shortly. 🔧"); setForm({ name: '', email: '', phone: '', productName: '', issueType: 'repair', description: '' }); } catch (e) { toast.error('Failed'); } finally { setSending(false); }
    };

    const inputClass = "w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300";

    return (
        <div className="bg-[#ffffff]">
            <PageHero
                title="Service & Support"
                subtitle="Need help with an OZOBATH product? Submit a service request and our team will assist you promptly."
                breadcrumbs={[{ label: 'Service Request' }]}
                illustration="/images/illus_service.png"
            />

            <section className="section-wrapper">
                {/* Trust badges */}
                <ScrollReveal stagger staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                    {[
                        { icon: FiShield, title: '5-Year Warranty', desc: 'Comprehensive coverage on all products', color: 'accent' },
                        { icon: FiClock, title: '24-Hour Response', desc: 'Our team responds within one business day', color: 'primary' },
                        { icon: FiPhone, title: 'Expert Technicians', desc: 'Certified professionals for every repair', color: 'accent' },
                    ].map((b, i) => (
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
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center"><FiTool className="w-5 h-5 text-accent-500" /></div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-dark-900">Submit Service Request</h2>
                                <p className="text-dark-400 text-xs">We'll get back to you within 24 hours</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Your name" /></div>
                                <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+91 XXXXX XXXXX" /></div>
                            </div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email *</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className={inputClass} placeholder="your@email.com" /></div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Product Name</label><input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className={inputClass} placeholder="Which OZOBATH product?" /></div>
                            <div>
                                <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Issue Type</label>
                                <select value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })} className={inputClass}>
                                    <option value="repair">Repair</option>
                                    <option value="installation">Installation Help</option>
                                    <option value="replacement">Replacement</option>
                                    <option value="warranty">Warranty Claim</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div><label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Description *</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} placeholder="Describe the issue in detail..." /></div>
                            <motion.button type="submit" disabled={sending} className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 disabled:opacity-50 flex items-center justify-center gap-2" whileTap={{ scale: 0.98 }}>
                                {sending ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><FiSend className="w-4 h-4" /> Submit Request</>}
                            </motion.button>
                        </form>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
};

export default ServiceRequestPage;
