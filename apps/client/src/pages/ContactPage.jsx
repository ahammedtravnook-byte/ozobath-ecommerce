import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend, FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const contactInfo = [
    { icon: FiMapPin, title: 'Visit Us', text: 'Bangalore, Karnataka, India', color: 'accent' },
    { icon: FiPhone, title: 'Call Us', text: '+91 78992 02927', href: 'tel:+917899202927', color: 'primary' },
    { icon: FiMail, title: 'Email', text: 'info@ozobath.com', href: 'mailto:info@ozobath.com', color: 'accent' },
    { icon: FiClock, title: 'Working Hours', text: 'Mon – Sat: 9AM – 7PM', color: 'primary' },
];

const socialLinks = [
    { icon: FiInstagram, label: 'Instagram', color: 'hover:from-purple-500 hover:to-pink-500' },
    { icon: FiFacebook, label: 'Facebook', color: 'hover:from-blue-600 hover:to-blue-500' },
    { icon: FiYoutube, label: 'YouTube', color: 'hover:from-red-600 hover:to-red-500' },
];

const ContactPage = () => {
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [sending, setSending] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) { toast.error('Please fill required fields'); return; }
        try {
            setSending(true);
            const { enquiryAPI } = await import('@api/services');
            await enquiryAPI.submitB2B({ ...form, type: 'contact' });
            toast.success("Message sent! We'll get back to you soon. 🎉");
            setForm({ name: '', email: '', phone: '', message: '' });
        } catch (e) { toast.error('Failed to send'); } finally { setSending(false); }
    };

    const inputClass = (field) => `w-full bg-white border-2 ${focusedField === field ? 'border-accent-500 shadow-lg shadow-accent-500/5' : 'border-dark-100'} text-dark-900 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300`;

    return (
        <div className="bg-[#FAF7F2]">
            <PageHero
                title="Contact Us"
                subtitle="Have a question or need assistance? We're here to help you create your dream bathroom."
                breadcrumbs={[{ label: 'Contact' }]}
            />

            <section className="section-wrapper">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
                    {/* Contact Info Column */}
                    <div className="lg:col-span-2">
                        <ScrollReveal stagger staggerDelay={0.1} className="space-y-5">
                            {contactInfo.map((item, i) => (
                                <ScrollRevealItem key={i}>
                                    <motion.div
                                        className="glass-morph p-5 flex items-center gap-4 group cursor-default"
                                        whileHover={{ y: -2, scale: 1.01 }}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center shrink-0 group-hover:bg-${item.color}-500 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-${item.color}-500/20`}>
                                            <item.icon className={`w-5 h-5 text-${item.color}-500 group-hover:text-white transition-colors duration-300`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-dark-900 text-sm">{item.title}</h3>
                                            {item.href ? (
                                                <a href={item.href} className="text-dark-400 text-sm hover:text-accent-500 transition-colors">{item.text}</a>
                                            ) : (
                                                <p className="text-dark-400 text-sm">{item.text}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                </ScrollRevealItem>
                            ))}
                        </ScrollReveal>

                        {/* Social Links */}
                        <ScrollReveal delay={0.3} className="mt-8">
                            <h3 className="font-bold text-dark-900 text-sm mb-4 uppercase tracking-widest">Follow Us</h3>
                            <div className="flex gap-3">
                                {socialLinks.map(({ icon: Icon, label, color }) => (
                                    <a
                                        key={label}
                                        href="#"
                                        className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-dark-100 text-dark-400 hover:text-white bg-gradient-to-br from-transparent to-transparent ${color} hover:border-transparent transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                                        aria-label={label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </ScrollReveal>

                        {/* Map placeholder */}
                        <ScrollReveal delay={0.4} className="mt-8">
                            <div className="relative rounded-3xl overflow-hidden h-48 bg-gradient-to-br from-dark-100 to-dark-50">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <FiMapPin className="w-8 h-8 text-accent-400 mx-auto mb-2" />
                                        <p className="text-dark-400 text-sm font-medium">Bangalore, India</p>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-accent-500/10 to-transparent" />
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Form Column */}
                    <ScrollReveal direction="right" className="lg:col-span-3">
                        <div className="glass-morph p-8 md:p-10">
                            <h2 className="text-2xl font-display font-bold text-dark-900 mb-2">Send Us a Message</h2>
                            <p className="text-dark-400 text-sm mb-8">Fill out the form below and our team will get back to you within 24 hours.</p>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Name *</label>
                                        <input
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField(null)}
                                            className={inputClass('name')}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Email *</label>
                                        <input
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            type="email"
                                            className={inputClass('email')}
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Phone</label>
                                    <input
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        onFocus={() => setFocusedField('phone')}
                                        onBlur={() => setFocusedField(null)}
                                        className={inputClass('phone')}
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Message *</label>
                                    <textarea
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        onFocus={() => setFocusedField('message')}
                                        onBlur={() => setFocusedField(null)}
                                        rows={5}
                                        className={inputClass('message')}
                                        placeholder="Tell us about your requirements..."
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {sending ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="w-4 h-4" /> Send Message
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
