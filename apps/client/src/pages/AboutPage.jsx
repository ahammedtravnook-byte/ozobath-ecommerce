import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiAward, FiTarget, FiHeart, FiZap, FiTruck, FiShield, FiStar, FiArrowRight, FiUsers, FiMapPin, FiCheckCircle, FiShoppingBag } from 'react-icons/fi';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

// Animated counter component
const AnimatedCounter = ({ end, suffix = '', prefix = '' }) => {
    const [count, setCount] = useState(0);
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const duration = 2000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [inView, end]);

    return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const stats = [
    { icon: FiUsers, number: 5000, suffix: '+', label: 'Happy Customers', color: 'accent' },
    { icon: FiShoppingBag, number: 200, suffix: '+', label: 'Premium Products', color: 'primary' },
    { icon: FiMapPin, number: 50, suffix: '+', label: 'Cities Served', color: 'accent' },
    { icon: FiStar, number: 4.8, suffix: '★', label: 'Average Rating', color: 'primary' },
];

const values = [
    { icon: FiAward, title: 'Premium Quality', desc: 'Only the finest toughened glass and premium-grade hardware, ISI-certified for safety and durability.', color: 'accent' },
    { icon: FiTarget, title: 'Precision Engineering', desc: 'Every enclosure is precision-measured and custom-fitted for a flawless, gap-free installation.', color: 'primary' },
    { icon: FiHeart, title: 'Customer First', desc: 'Dedicated support from consultation to installation, with a 5-year comprehensive warranty.', color: 'accent' },
    { icon: FiZap, title: 'Modern Design', desc: 'Contemporary aesthetics with frameless, minimalist styles that elevate any bathroom space.', color: 'primary' },
    { icon: FiTruck, title: 'Fast Delivery', desc: 'Pan-India delivery with professional white-glove installation service at your doorstep.', color: 'accent' },
    { icon: FiShield, title: 'Trusted Brand', desc: 'Over 5,000 delighted customers across India trust OZOBATH for their bathroom transformations.', color: 'primary' },
];

const timeline = [
    { year: '2020', title: 'Founded in Bangalore', desc: 'OZOBATH was born from a vision to revolutionize Indian bathrooms with world-class shower enclosures.' },
    { year: '2021', title: 'Pan-India Expansion', desc: 'Expanded operations to 15+ cities with a network of certified installation partners.' },
    { year: '2023', title: '3,000+ Installations', desc: 'Crossed the milestone of 3,000 successful installations with a 4.8-star average rating.' },
    { year: '2026', title: 'Experience Centre Launch', desc: 'Launched immersive experience centres where customers can touch, feel, and visualize their dream bathrooms.' },
];

const AboutPage = () => {
    return (
        <div className="bg-[#ffffff]">
            <PageHero
                title="About OZOBATH"
                subtitle="Crafting premium bathroom experiences since 2020. We believe every bathroom deserves to be a sanctuary."
                breadcrumbs={[{ label: 'About Us' }]}
                illustration="/images/illus_about.png"
            />

            {/* ── Mission + Stats ─────────────────────── */}
            <section className="section-wrapper">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
                    <ScrollReveal direction="left">
                        <span className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Our Story</span>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-6">
                            Transforming Ordinary Bathrooms Into <span className="gradient-text">Extraordinary Spaces</span>
                        </h2>
                        <p className="text-dark-500 leading-relaxed mb-4">
                            At OZOBATH, we transform ordinary bathrooms into extraordinary spaces. Our curated collection of premium bath fixtures, accessories, and solutions reflects our commitment to quality, design, and innovation.
                        </p>
                        <p className="text-dark-500 leading-relaxed mb-8">
                            Every product is handpicked to ensure durability, elegance, and functionality — because your bathroom deserves the best. From frameless glass enclosures to precision-engineered fittings, we bring world-class quality to Indian homes.
                        </p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 text-accent-500 font-bold text-sm uppercase tracking-wider hover:gap-3 transition-all duration-300 group"
                        >
                            Explore Our Collection <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    </ScrollReveal>

                    {/* Stats Grid */}
                    <ScrollReveal direction="right">
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    className="glass-morph p-6 text-center group cursor-default"
                                    whileHover={{ y: -4 }}
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-${stat.color}-500 transition-colors duration-300`}>
                                        <stat.icon className={`w-5 h-5 text-${stat.color}-500 group-hover:text-white transition-colors duration-300`} />
                                    </div>
                                    <p className="text-3xl font-display font-extrabold text-dark-900 mb-1">
                                        <AnimatedCounter end={stat.number} suffix={stat.suffix} />
                                    </p>
                                    <p className="text-dark-400 text-sm font-medium">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* ── Timeline ────────────────────────────── */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-50/30 to-transparent" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <ScrollReveal className="text-center mb-16">
                        <span className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">Our Journey</span>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900">The OZOBATH Story</h2>
                    </ScrollReveal>

                    <div className="relative">
                        {/* Center line */}
                        <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-200 via-accent-400 to-accent-200 hidden md:block" />

                        {timeline.map((item, i) => (
                            <ScrollReveal key={i} direction={i % 2 === 0 ? 'left' : 'right'} delay={i * 0.1}>
                                <div className={`flex items-center gap-8 mb-12 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                        <span className="text-accent-500 font-display font-extrabold text-2xl">{item.year}</span>
                                        <h3 className="text-lg font-display font-bold text-dark-900 mt-1 mb-2">{item.title}</h3>
                                        <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                    <div className="hidden md:flex w-10 h-10 rounded-full bg-accent-500 border-4 border-white shadow-lg shadow-accent-500/20 items-center justify-center shrink-0 z-10">
                                        <FiCheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 hidden md:block" />
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Values ──────────────────────────────── */}
            <section className="section-wrapper">
                <ScrollReveal className="text-center mb-14">
                    <span className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-3 block">Why Choose Us</span>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-dark-900 mb-4">Why OZOBATH?</h2>
                    <p className="text-dark-400 max-w-2xl mx-auto">Six pillars that define our commitment to delivering the finest bathroom experience.</p>
                </ScrollReveal>

                <ScrollReveal stagger staggerDelay={0.08} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {values.map((value, i) => (
                        <ScrollRevealItem key={i}>
                            <div className="glass-morph p-8 text-center group cursor-default h-full">
                                <div className={`w-14 h-14 rounded-2xl bg-${value.color}-50 flex items-center justify-center mx-auto mb-5 group-hover:bg-${value.color}-500 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-${value.color}-500/20 group-hover:scale-110`}>
                                    <value.icon className={`w-6 h-6 text-${value.color}-500 group-hover:text-white transition-colors duration-300`} />
                                </div>
                                <h3 className="text-lg font-display font-bold text-dark-900 mb-2">{value.title}</h3>
                                <p className="text-dark-400 text-sm leading-relaxed">{value.desc}</p>
                            </div>
                        </ScrollRevealItem>
                    ))}
                </ScrollReveal>
            </section>

            {/* ── CTA Section ─────────────────────────── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <ScrollReveal>
                    <div className="relative bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
                                Ready to Transform Your <span className="text-accent-400">Bathroom</span>?
                            </h2>
                            <p className="text-white/60 max-w-md mx-auto mb-10 text-base">
                                Explore our premium collection and find the perfect shower enclosure for your space.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Link to="/shop" className="btn-primary text-sm">
                                    Explore Collection <FiArrowRight className="w-4 h-4 ml-2 inline" />
                                </Link>
                                <Link to="/contact" className="btn-outline-white text-sm">
                                    Get in Touch
                                </Link>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
};

export default AboutPage;
