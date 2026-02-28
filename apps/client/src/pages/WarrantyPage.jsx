const WarrantyPage = () => (
    <div className="section-wrapper max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-dark-900 mb-6">Warranty Information</h1>
        <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
            <section><h2 className="text-xl font-semibold text-dark-900">Product Warranty</h2><p>All OZOBATH products come with a manufacturer's warranty against defects in materials and workmanship. The warranty period varies by product category.</p></section>
            <section><h2 className="text-xl font-semibold text-dark-900">Warranty Coverage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 not-prose mt-3">
                    {[{ type: 'Shower Systems', period: '5 Years' }, { type: 'Faucets & Taps', period: '3 Years' }, { type: 'Accessories', period: '2 Years' }, { type: 'Basin Mixers', period: '5 Years' }].map((w, i) => (
                        <div key={i} className="bg-primary-50 rounded-lg p-4 flex justify-between items-center"><span className="text-sm font-medium text-dark-900">{w.type}</span><span className="text-sm font-bold text-primary-600">{w.period}</span></div>
                    ))}
                </div>
            </section>
            <section><h2 className="text-xl font-semibold text-dark-900">What's Not Covered</h2><p>Damage due to improper installation, misuse, neglect, or normal wear and tear. Cosmetic damage such as scratches or fading from cleaning agents.</p></section>
            <section><h2 className="text-xl font-semibold text-dark-900">Claim Process</h2><p>To file a warranty claim, submit a service request through our website or call +91 7899202927 with your order number and photographs of the issue.</p></section>
        </div>
    </div>
);
export default WarrantyPage;
