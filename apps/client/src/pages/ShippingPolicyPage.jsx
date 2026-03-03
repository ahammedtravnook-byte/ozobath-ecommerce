import PageHero from '@components/PageHero';
import ScrollReveal from '@components/ScrollReveal';

const ShippingPolicyPage = () => (
    <div className="bg-[#FAF7F2]">
        <PageHero
            title="Shipping Policy"
            subtitle="Everything you need to know about delivery, shipping charges, and order tracking."
            breadcrumbs={[{ label: 'Shipping Policy' }]}
            compact
        />
        <section className="section-wrapper">
            <ScrollReveal className="max-w-3xl mx-auto">
                <div className="glass-morph p-8 md:p-12">
                    <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-dark-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-dark-500 prose-p:leading-relaxed">
                        <section><h2>Delivery Areas</h2><p>We deliver across India through our trusted logistics partners. Delivery is available to all major cities and most pin codes across the country.</p></section>
                        <section><h2>Shipping Charges</h2><p>FREE shipping on orders above ₹999. For orders below ₹999, a flat shipping fee of ₹99 applies. Heavy/bulky items may attract additional handling charges.</p></section>
                        <section><h2>Delivery Timeline</h2><p>Standard delivery: 5-7 business days. Metro cities (Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Kolkata): 3-5 business days. Remote areas may take 7-10 business days.</p></section>
                        <section><h2>Order Tracking</h2><p>Once your order is shipped, you'll receive a tracking link via email and SMS. You can also track your order from the "My Orders" section or using the Track Order page.</p></section>
                        <section><h2>Damaged Products</h2><p>If you receive a damaged product, please report it within 48 hours of delivery with photographs. We will arrange a replacement at no additional cost.</p></section>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    </div>
);

export default ShippingPolicyPage;
