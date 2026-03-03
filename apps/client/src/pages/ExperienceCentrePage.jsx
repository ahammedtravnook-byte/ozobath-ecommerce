import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiMessageSquare, FiStar, FiMapPin, FiClock, FiPhone, FiMail, FiArrowRight, FiVideo } from 'react-icons/fi';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const features = [
    { icon: FiPlay, title: 'Live Product Demos', desc: 'See our products in action with hands-on demonstrations by experts', color: 'accent' },
    { icon: FiMessageSquare, title: 'Expert Consultations', desc: 'Get personalized design advice tailored to your bathroom space', color: 'primary' },
    { icon: FiStar, title: 'Interactive Displays', desc: 'Touch, feel, and experience premium materials and finishes', color: 'accent' },
    { icon: FiMapPin, title: 'Complete Catalog', desc: 'Browse our entire range of shower enclosures and bath fittings', color: 'primary' },
    { icon: FiArrowRight, title: 'Showroom Discounts', desc: 'Exclusive in-store offers and deals not available online', color: 'accent' },
    { icon: FiArrowRight, title: 'Free Measurement', desc: 'Complimentary measurement and planning service for your project', color: 'primary' },
];

const ExperienceCentrePage = () => (
    <div className="bg-[#FAF7F2]">
        <PageHero
            title="Experience Centre"
            subtitle="Visit our showroom to experience OZOBATH products in person. Touch, feel, and explore premium bathroom solutions."
            breadcrumbs={[{ label: 'Experience Centre' }]}
        />

        <section className="section-wrapper">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-20">
                {/* Features */}
                <ScrollReveal direction="left">
                    <span className="text-accent-500 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">What to Expect</span>
                    <h2 className="text-3xl font-display font-bold text-dark-900 mb-8">Your Premium <span className="gradient-text">Showroom Experience</span></h2>

                    <ScrollReveal stagger staggerDelay={0.08} className="space-y-4">
                        {features.map((f, i) => (
                            <ScrollRevealItem key={i}>
                                <motion.div className="glass-morph p-5 flex items-center gap-4 group cursor-default" whileHover={{ y: -2 }}>
                                    <div className={`w-11 h-11 rounded-xl bg-${f.color}-50 flex items-center justify-center shrink-0 group-hover:bg-${f.color}-500 transition-all duration-300`}>
                                        <f.icon className={`w-5 h-5 text-${f.color}-500 group-hover:text-white transition-colors duration-300`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-dark-900 text-sm">{f.title}</h3>
                                        <p className="text-dark-400 text-xs">{f.desc}</p>
                                    </div>
                                </motion.div>
                            </ScrollRevealItem>
                        ))}
                    </ScrollReveal>
                </ScrollReveal>

                {/* Info Cards */}
                <ScrollReveal direction="right" className="space-y-5">
                    {[
                        { icon: FiMapPin, title: 'Location', lines: ['Bangalore,  Karnataka, India'], color: 'accent' },
                        { icon: FiClock, title: 'Timings', lines: ['Mon – Sat: 10:00 AM — 7:00 PM', 'Sunday: By Appointment Only'], color: 'primary' },
                        { icon: FiPhone, title: 'Contact', lines: ['+91 78992 02927'], color: 'accent' },
                        { icon: FiMail, title: 'Email', lines: ['info@ozobath.com'], color: 'primary' },
                    ].map((info, i) => (
                        <motion.div key={i} className="glass-morph p-6 group cursor-default" whileHover={{ y: -2 }}>
                            <div className="flex items-start gap-4">
                                <div className={`w-11 h-11 rounded-xl bg-${info.color}-50 flex items-center justify-center shrink-0 group-hover:bg-${info.color}-500 transition-all duration-300`}>
                                    <info.icon className={`w-5 h-5 text-${info.color}-500 group-hover:text-white transition-colors duration-300`} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-dark-900 text-sm mb-1">{info.title}</h3>
                                    {info.lines.map((line, j) => <p key={j} className="text-dark-400 text-sm">{line}</p>)}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <Link
                        to="/book-site-visit"
                        className="btn-primary w-full text-center text-sm flex items-center justify-center gap-2 mt-6"
                    >
                        Book a Visit <FiArrowRight className="w-4 h-4" />
                    </Link>
                </ScrollReveal>
            </div>
        </section>

        {/* Video CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <ScrollReveal>
                <div className="relative bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900 rounded-[2.5rem] p-12 md:p-16 text-center overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px]" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-6">
                            <FiVideo className="w-7 h-7 text-accent-400" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-3">
                            Can't Visit? Try <span className="text-accent-400">Shop Live!</span>
                        </h2>
                        <p className="text-white/60 max-w-md mx-auto mb-8 text-sm">
                            Experience our products via a personal video call with our experts — from the comfort of your home.
                        </p>
                        <Link to="/shop-live" className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 hover:scale-105">
                            Book Video Call <FiArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    </div>
);

export default ExperienceCentrePage;
