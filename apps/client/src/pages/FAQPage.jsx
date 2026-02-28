import { useState, useEffect } from 'react';
import { faqAPI } from '@api/services';

const FAQPage = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openIdx, setOpenIdx] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try { const res = await faqAPI.getAll(); setFaqs(res.data || []); } catch (e) { } finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

    return (
        <div className="section-wrapper">
            <div className="text-center mb-12">
                <h1 className="section-title">Frequently Asked Questions</h1>
                <p className="section-subtitle mx-auto">Everything you need to know about OZOBATH products and services</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
                {faqs.map((faq, i) => (
                    <div key={faq._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                            <span className="text-sm md:text-base font-semibold text-dark-900 pr-4">{faq.question}</span>
                            <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openIdx === i && <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed animate-fadeIn">{faq.answer}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default FAQPage;
