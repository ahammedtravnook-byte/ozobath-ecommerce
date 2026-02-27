import { motion } from 'framer-motion';

const HomePage = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero Banner - Dynamic from API */}
            <section className="relative h-screen flex items-center justify-center bg-dark-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-dark-950/80 via-dark-950/40 to-dark-950/80 z-10" />
                <div className="relative z-20 text-center px-4">
                    <motion.h1
                        className="text-hero font-display font-extrabold text-white mb-6"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Premium Shower Enclosures
                        <br />
                        <span className="gradient-text">For Indian Homes</span>
                    </motion.h1>
                    <motion.p
                        className="text-lg text-dark-300 max-w-xl mx-auto mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        Engineered for durability. Crafted for elegance. Designed thoughtfully to fix what others overlook.
                    </motion.p>
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <a href="/shop" className="btn-primary">View Products</a>
                        <a href="/book-site-visit" className="btn-secondary !border-white/30 !text-white hover:!bg-white hover:!text-dark-900">
                            Book Site Visit — ₹59
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Placeholder sections — will be dynamic from API */}
            <section className="section-wrapper text-center">
                <h2 className="section-title">Category Tiles</h2>
                <p className="section-subtitle mx-auto">Dynamic categories will load here from the admin panel</p>
            </section>

            <section className="section-wrapper text-center bg-surface-muted">
                <h2 className="section-title">Best Sellers</h2>
                <p className="section-subtitle mx-auto">Featured products will be loaded dynamically</p>
            </section>

            <section className="section-wrapper text-center">
                <h2 className="section-title">Trust Badges</h2>
                <p className="section-subtitle mx-auto">USP icons will be managed from admin</p>
            </section>

            <section className="section-wrapper text-center bg-dark-950 text-white">
                <h2 className="section-title !text-white">Video Section</h2>
                <p className="section-subtitle mx-auto !text-dark-300">Brand video will play here</p>
            </section>

            <section className="section-wrapper text-center">
                <h2 className="section-title">Customer Testimonials</h2>
                <p className="section-subtitle mx-auto">Real customer reviews carousel</p>
            </section>

            <section className="section-wrapper text-center bg-surface-muted">
                <h2 className="section-title">FAQ Section</h2>
                <p className="section-subtitle mx-auto">Accordion FAQ from database</p>
            </section>
        </motion.div>
    );
};

export default HomePage;
