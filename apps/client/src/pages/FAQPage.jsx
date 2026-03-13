import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiSearch, FiMessageCircle, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { faqAPI } from '@api/services';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const fallbackFAQs = [
    { _id: 'f1', question: 'What types of shower enclosures do you offer?', answer: 'We offer a wide range of premium shower enclosures including frameless glass, semi-frameless, sliding door, corner, walk-in, and custom-built options. All our enclosures use ISI-certified toughened glass for maximum safety.', category: 'Products' },
    { _id: 'f2', question: 'How long does installation take?', answer: 'Professional installation typically takes 2-4 hours depending on the complexity. Our certified installers ensure precise measurements and a flawless fit. We schedule installations at your convenience.', category: 'Installation' },
    { _id: 'f3', question: 'Do you provide a warranty?', answer: 'Yes! All OZOBATH products come with a comprehensive 5-year warranty covering manufacturing defects, hardware issues, and glass integrity. Extended warranty options are also available.', category: 'Warranty' },
    { _id: 'f4', question: 'Can I customize the dimensions of my enclosure?', answer: 'Absolutely! We specialize in bespoke solutions. Our team will visit your site, take precise measurements, and craft a shower enclosure tailored perfectly to your bathroom space.', category: 'Products' },
    { _id: 'f5', question: 'What is your delivery timeline?', answer: 'Standard delivery takes 7-14 business days. Express delivery (3-5 days) is available for select products. Free shipping is available on orders above ₹999.', category: 'Delivery' },
    { _id: 'f6', question: 'Do you offer site visits for consultation?', answer: 'Yes, we offer free site visits across major cities in India. Our design consultants will assess your bathroom, discuss your preferences, and recommend the best solution. Book a visit through our website.', category: 'Installation' },
    { _id: 'f7', question: 'What payment methods do you accept?', answer: 'We accept all major payment methods including credit/debit cards, UPI, net banking, and EMI options. Cash on delivery is also available for select locations.', category: 'Orders' },
    { _id: 'f8', question: 'How do I track my order?', answer: 'Once your order is shipped, you will receive a tracking link via email and SMS. You can also track your order anytime from the "Track Order" section on our website.', category: 'Orders' },
];

const categories = ['All', 'Products', 'Installation', 'Warranty', 'Delivery', 'Orders'];

const FAQPage = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openIdx, setOpenIdx] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await faqAPI.getAll();
                const data = res.data || [];
                setFaqs(data.length > 0 ? data : fallbackFAQs);
            } catch (e) {
                setFaqs(fallbackFAQs);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
        const matchesSearch = !searchQuery || faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-[#ffffff]">
            <PageHero
                title="Frequently Asked Questions"
                subtitle="Everything you need to know about OZOBATH products, installation, warranty, and more."
                breadcrumbs={[{ label: 'FAQ' }]}
                illustration="/images/illus_faq.png"
            />

            <section className="section-wrapper">
                {/* Search Bar */}
                <ScrollReveal className="max-w-2xl mx-auto mb-10">
                    <div className="relative">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-300" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-full py-4 pl-14 pr-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300 shadow-soft"
                        />
                    </div>
                </ScrollReveal>

                {/* Category Chips */}
                <ScrollReveal className="flex flex-wrap justify-center gap-2 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setOpenIdx(null); }}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                                ${activeCategory === cat
                                    ? 'bg-dark-900 text-white shadow-lg'
                                    : 'bg-white text-dark-400 hover:text-dark-900 hover:bg-dark-50 border border-dark-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </ScrollReveal>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto">
                    {loading ? (
                        /* Skeleton Loading */
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="skeleton-shimmer h-16 rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredFaqs.length === 0 ? (
                        <ScrollReveal className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-4">
                                <FiSearch className="w-8 h-8 text-accent-400" />
                            </div>
                            <h3 className="font-display font-bold text-dark-900 text-lg mb-2">No results found</h3>
                            <p className="text-dark-400 text-sm">Try a different search term or browse by category.</p>
                        </ScrollReveal>
                    ) : (
                        <ScrollReveal stagger staggerDelay={0.05} className="space-y-3">
                            {filteredFaqs.map((faq, i) => (
                                <ScrollRevealItem key={faq._id || i}>
                                    <div className="bg-white rounded-2xl border border-dark-100/50 overflow-hidden hover:shadow-soft transition-all duration-300">
                                        <button
                                            onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                            className="w-full flex items-center justify-between px-6 py-5 text-left group"
                                        >
                                            <span className="text-sm md:text-base font-semibold text-dark-900 pr-4 group-hover:text-accent-500 transition-colors">
                                                {faq.question}
                                            </span>
                                            <motion.div
                                                animate={{ rotate: openIdx === i ? 180 : 0 }}
                                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                className="shrink-0"
                                            >
                                                <FiChevronDown className={`w-5 h-5 transition-colors ${openIdx === i ? 'text-accent-500' : 'text-dark-300'}`} />
                                            </motion.div>
                                        </button>
                                        <AnimatePresence>
                                            {openIdx === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-5 text-sm text-dark-500 leading-relaxed border-t border-dark-50 pt-4">
                                                        {faq.answer}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </ScrollRevealItem>
                            ))}
                        </ScrollReveal>
                    )}
                </div>
            </section>

            {/* Contact CTA */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <ScrollReveal>
                    <div className="relative bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 rounded-[2.5rem] p-12 md:p-16 text-center overflow-hidden">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                                <FiMessageCircle className="w-7 h-7 text-accent-400" />
                            </div>
                            <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-3">
                                Still Have <span className="text-accent-400">Questions</span>?
                            </h2>
                            <p className="text-white/60 max-w-md mx-auto mb-8 text-sm">
                                Our team is here to help. Reach out to us and we'll get back to you within 24 hours.
                            </p>
                            <Link
                                to="/contact"
                                className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 hover:scale-105"
                            >
                                Contact Us <FiArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
};

export default FAQPage;
