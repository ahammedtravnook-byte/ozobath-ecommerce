import PageHero from '@components/PageHero';
import ScrollReveal from '@components/ScrollReveal';

const PrivacyPage = () => (
    <div className="bg-[#FAF7F2]">
        <PageHero
            title="Privacy Policy"
            subtitle="Your privacy matters to us. Learn how we collect, use, and protect your information."
            breadcrumbs={[{ label: 'Privacy Policy' }]}
            compact
        />
        <section className="section-wrapper">
            <ScrollReveal className="max-w-3xl mx-auto">
                <div className="glass-morph p-8 md:p-12">
                    <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-dark-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-dark-500 prose-p:leading-relaxed">
                        <section><h2>Information We Collect</h2><p>We collect personal information you provide, including name, email, phone number, shipping address, and payment details. We also collect browsing data through cookies.</p></section>
                        <section><h2>How We Use Your Information</h2><p>Your information is used to process orders, send order updates, improve our services, and personalize your shopping experience. We never sell your data to third parties.</p></section>
                        <section><h2>Data Security</h2><p>We implement industry-standard security measures including SSL encryption, secure payment processing via Razorpay, and restricted access to personal information.</p></section>
                        <section><h2>Cookies</h2><p>We use cookies to enhance your browsing experience, remember your preferences, and provide personalized content. You can manage cookies through your browser settings.</p></section>
                        <section><h2>Your Rights</h2><p>You have the right to access, update, or delete your personal information. Contact us at info@ozobath.com for any privacy-related requests.</p></section>
                    </div>
                </div>
            </ScrollReveal>
        </section>
    </div>
);

export default PrivacyPage;
