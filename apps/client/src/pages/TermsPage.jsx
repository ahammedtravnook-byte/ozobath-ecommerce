import PageHero from '@components/PageHero';
import ScrollReveal from '@components/ScrollReveal';

const TermsPage = () => (
    <div className="bg-[#ffffff]">
        <PageHero
            title="Terms & Conditions"
            subtitle="Please read these terms carefully before using our website and services."
            breadcrumbs={[{ label: 'Terms & Conditions' }]}
            compact
        />
        <section className="section-wrapper">
            <ScrollReveal className="max-w-3xl mx-auto">
                <div className="glass-morph p-8 md:p-12">
                    <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-dark-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-dark-500 prose-p:leading-relaxed">
                        <section><h2>1. General</h2><p>By accessing and using the OZOBATH website, you agree to be bound by these Terms and Conditions. OZOBATH reserves the right to modify these terms at any time without prior notice.</p></section>
                        <section><h2>2. Products & Pricing</h2><p>All products listed on our website are subject to availability. Prices are inclusive of GST unless stated otherwise. OZOBATH reserves the right to modify prices without prior notice.</p></section>
                        <section><h2>3. Orders</h2><p>Placing an order constitutes an offer to purchase. OZOBATH reserves the right to accept or reject orders. Order confirmation will be sent via email.</p></section>
                        <section><h2>4. Payment</h2><p>We accept payments via Razorpay (UPI, credit/debit cards, net banking). All transactions are secured with industry-standard encryption.</p></section>
                        <section><h2>5. Cancellation & Returns</h2><p>Orders can be cancelled within 24 hours of placement. Returns are accepted within 7 days of delivery for products in original condition. Custom orders are non-refundable.</p></section>
                        <section><h2>6. Contact</h2><p>For any queries regarding these terms, please contact us at info@ozobath.com or +91 7899202927.</p></section>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    </div>
);

export default TermsPage;
