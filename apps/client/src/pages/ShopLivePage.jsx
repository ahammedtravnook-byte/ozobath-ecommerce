import { useState, useEffect } from 'react';
import { bookingAPI } from '@api/services';
import toast from 'react-hot-toast';

const ShopLivePage = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', message: '' });
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try { setLoading(true); const res = await bookingAPI.getAvailableSlots(selectedDate); setSlots(res.data || []); } catch (e) { } finally { setLoading(false); }
        };
        fetch();
    }, [selectedDate]);

    const handleBook = async () => {
        if (!form.customerName || !form.customerEmail) { toast.error('Fill name and email'); return; }
        try { setBooking(true); await bookingAPI.bookVideoCall({ ...form, slotId: selectedSlot._id }); toast.success('Video call booked! Check your email for the link.'); setSelectedSlot(null); setForm({ customerName: '', customerEmail: '', customerPhone: '', message: '' }); } catch (e) { toast.error('Failed'); } finally { setBooking(false); }
    };

    return (
        <div className="section-wrapper">
            <div className="text-center mb-12">
                <h1 className="section-title">Shop Live via Video Call</h1>
                <p className="section-subtitle mx-auto">Get a personal product tour from our experts. See products up close, ask questions, and make the best choice — all from the comfort of your home.</p>
            </div>
            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[{ icon: '📱', title: 'Live Video Tour', desc: 'See products in real time' }, { icon: '💬', title: 'Expert Guidance', desc: 'Ask anything, get answers' }, { icon: '🎁', title: 'Exclusive Deals', desc: 'Special live shopping offers' }].map((f, i) => (
                        <div key={i} className="bg-primary-50 rounded-xl p-4 text-center"><span className="text-2xl">{f.icon}</span><h3 className="text-sm font-semibold mt-2">{f.title}</h3><p className="text-xs text-gray-500">{f.desc}</p></div>
                    ))}
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label><input value={selectedDate} onChange={e => setSelectedDate(e.target.value)} type="date" className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" min={new Date().toISOString().slice(0, 10)} /></div>
                    {loading ? <div className="py-8 text-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div></div> : slots.length === 0 ? <p className="text-gray-400 text-center py-6">No available slots for this date</p> : (
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {slots.map(slot => (
                                <button key={slot._id} onClick={() => setSelectedSlot(slot)} disabled={slot.isBooked} className={`py-3 px-2 text-sm rounded-lg border-2 transition-all font-medium ${selectedSlot?._id === slot._id ? 'border-primary-500 bg-primary-50 text-primary-700' : slot.isBooked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-200 hover:border-primary-300'}`}>
                                    {slot.startTime} - {slot.endTime}
                                </button>
                            ))}
                        </div>
                    )}
                    {selectedSlot && (
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <h3 className="font-semibold text-dark-900">Book {selectedSlot.startTime} - {selectedSlot.endTime}</h3>
                            <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Your Name *" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            <input value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} placeholder="Email *" type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="Phone" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="What products are you interested in?" rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            <button onClick={handleBook} disabled={booking} className="btn-primary w-full">{booking ? 'Booking...' : 'Book Video Call'}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ShopLivePage;
