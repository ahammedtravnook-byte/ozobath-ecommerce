import { Link } from 'react-router-dom';

const ExperienceCentrePage = () => (
    <div>
        <div className="bg-gradient-to-br from-dark-900 via-dark-800 to-accent-900 text-white py-20 px-6 text-center">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Experience Centre</h1>
                <p className="text-lg text-dark-300 mb-6">Visit our showroom to experience OZOBATH products in person. Touch, feel, and explore premium bathroom solutions in our beautifully designed display spaces.</p>
                <Link to="/book-site-visit" className="btn-accent text-lg">Book a Visit →</Link>
            </div>
        </div>
        <div className="section-wrapper">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark-900 mb-4">What to Expect</h2>
                    <div className="space-y-4">
                        {['Live product demonstrations', 'Expert design consultations', 'Complete product catalog', 'Interactive displays & setups', 'Special showroom discounts', 'Free measurement & planning service'].map((f, i) => (
                            <div key={i} className="flex items-center gap-3"><div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold text-sm">{i + 1}</div><p className="text-gray-700">{f}</p></div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-primary-50 rounded-xl p-6">
                        <h3 className="font-semibold text-dark-900 mb-2">📍 Location</h3>
                        <p className="text-gray-600">Bangalore, Karnataka, India</p>
                    </div>
                    <div className="bg-primary-50 rounded-xl p-6">
                        <h3 className="font-semibold text-dark-900 mb-2">🕐 Timings</h3>
                        <p className="text-gray-600">Mon - Sat: 10:00 AM - 7:00 PM</p>
                        <p className="text-gray-600">Sunday: By Appointment Only</p>
                    </div>
                    <div className="bg-primary-50 rounded-xl p-6">
                        <h3 className="font-semibold text-dark-900 mb-2">📞 Contact</h3>
                        <p className="text-gray-600">+91 7899202927</p>
                        <p className="text-gray-600">info@ozobath.com</p>
                    </div>
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-display font-bold text-dark-900 mb-4">Can't Visit? Try Shop Live!</h2>
                <p className="text-gray-500 mb-4">Experience our products via a personal video call with our experts</p>
                <Link to="/shop-live" className="btn-primary">Book Video Call →</Link>
            </div>
        </div>
    </div>
);
export default ExperienceCentrePage;
