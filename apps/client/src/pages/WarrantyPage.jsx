import { motion } from 'framer-motion';
import { FiShield } from 'react-icons/fi';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const warrantyData = [
    { type: 'Shower Systems', period: '5 Years' },
    { type: 'Faucets & Taps', period: '3 Years' },
    { type: 'Accessories', period: '2 Years' },
    { type: 'Basin Mixers', period: '5 Years' },
];

const WarrantyPage = () => (
    <div className="bg-[#ffffff]">
        <PageHero
            title="Warranty Information"
            subtitle="Your OZOBATH products are protected. Learn about our comprehensive warranty coverage."
            breadcrumbs={[{ label: 'Warranty' }]}
            compact
        />
        <section className="section-wrapper">
            <ScrollReveal className="max-w-3xl mx-auto">
                <div className="glass-morph p-8 md:p-12">
                    <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-dark-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-dark-500 prose-p:leading-relaxed">
                        <section><h2>Product Warranty</h2><p>All OZOBATH products come with a manufacturer's warranty against defects in materials and workmanship. The warranty period varies by product category.</p></section>

                        <section>
                            <h2>Warranty Coverage</h2>
                            <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                {warrantyData.map((w, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex items-center justify-between p-4 bg-white rounded-2xl border border-dark-100/50 group hover:border-accent-200 transition-all duration-300"
                                        whileHover={{ y: -2 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center group-hover:bg-accent-500 transition-all duration-300">
                                                <FiShield className="w-4 h-4 text-accent-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <span className="text-sm font-semibold text-dark-900">{w.type}</span>
                                        </div>
                                        <span className="text-sm font-bold text-accent-500">{w.period}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        <section><h2>What's Not Covered</h2><p>Damage due to improper installation, misuse, neglect, or normal wear and tear. Cosmetic damage such as scratches or fading from cleaning agents.</p></section>
                        <section><h2>Claim Process</h2><p>To file a warranty claim, submit a service request through our website or call +91 7899202927 with your order number and photographs of the issue.</p></section>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    </div>
);

export default WarrantyPage;
