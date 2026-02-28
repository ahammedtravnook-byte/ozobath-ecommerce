import { Link } from 'react-router-dom';

const AboutPage = () => (
    <div>
        {/* Hero */}
        <div className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 text-white py-20 px-6 text-center">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">About OZOBATH</h1>
                <p className="text-lg text-dark-300">Crafting premium bathroom experiences since 2020. We believe every bathroom deserves to be a sanctuary.</p>
            </div>
        </div>
        <div className="section-wrapper">
            {/* Mission */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark-900 mb-4">Our Mission</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">At OZOBATH, we transform ordinary bathrooms into extraordinary spaces. Our curated collection of premium bath fixtures, accessories, and solutions reflects our commitment to quality, design, and innovation.</p>
                    <p className="text-gray-600 leading-relaxed">Every product is handpicked to ensure durability, elegance, and functionality — because your bathroom deserves the best.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[{ n: '5000+', l: 'Happy Customers' }, { n: '200+', l: 'Premium Products' }, { n: '50+', l: 'Cities Served' }, { n: '4.8★', l: 'Average Rating' }].map((s, i) => (
                        <div key={i} className="bg-primary-50 rounded-xl p-6 text-center"><p className="text-3xl font-bold text-primary-600 mb-1">{s.n}</p><p className="text-sm text-gray-600">{s.l}</p></div>
                    ))}
                </div>
            </div>
            {/* Values */}
            <div className="mb-16">
                <h2 className="text-2xl font-display font-bold text-dark-900 text-center mb-8">Why OZOBATH?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[{ icon: '✨', title: 'Premium Quality', desc: 'Only the finest materials and finishes, tested for durability and performance.' }, { icon: '🎨', title: 'Modern Design', desc: 'Contemporary aesthetics that elevate your bathroom with timeless elegance.' }, { icon: '🔧', title: 'Expert Support', desc: 'Free consultation, installation guidance, and lifetime warranty support.' }].map((v, i) => (
                        <div key={i} className="premium-card p-6 text-center"><span className="text-4xl mb-3 block">{v.icon}</span><h3 className="text-lg font-semibold text-dark-900 mb-2">{v.title}</h3><p className="text-sm text-gray-500">{v.desc}</p></div>
                    ))}
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-dark-900 mb-4">Ready to transform your bathroom?</h2>
                <Link to="/shop" className="btn-primary text-lg">Explore Our Collection</Link>
            </div>
        </div>
    </div>
);
export default AboutPage;
