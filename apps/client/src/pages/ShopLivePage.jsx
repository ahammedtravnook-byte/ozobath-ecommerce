import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiVideo, FiMessageSquare, FiGift, FiCalendar, FiSend, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import { bookingAPI } from '@api/services';
import toast from 'react-hot-toast';
import PageHero from '@components/PageHero';
import ScrollReveal, { ScrollRevealItem } from '@components/ScrollReveal';

const perks = [
    { icon: FiVideo, title: 'Live Video Tour', desc: 'See products in real time via HD video', color: 'accent' },
    { icon: FiMessageSquare, title: 'Expert Guidance', desc: 'Ask anything, get instant answers', color: 'primary' },
    { icon: FiGift, title: 'Exclusive Deals', desc: 'Special live shopping offers', color: 'accent' },
];

const ShopLivePage = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', message: '' });
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        const fetchSlots = async () => {
            try { setLoading(true); const res = await bookingAPI.getAvailableSlots(selectedDate); setSlots(res.data || []); } catch (e) { setSlots([]); } finally { setLoading(false); }
        };
        fetchSlots();
    }, [selectedDate]);

    const handleBook = async () => {
        if (!form.customerName || !form.customerEmail) { toast.error('Fill name and email'); return; }
        try { setBooking(true); await bookingAPI.bookVideoCall({ ...form, slotId: selectedSlot._id }); toast.success('Video call booked! Check your email for the link. 🎥'); setSelectedSlot(null); setForm({ customerName: '', customerEmail: '', customerPhone: '', message: '' }); } catch (e) { toast.error('Booking failed'); } finally { setBooking(false); }
    };

    const inputClass = "w-full bg-white border-2 border-dark-100 text-dark-900 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:border-accent-500 transition-all duration-300 placeholder:text-dark-300";

    return (
        <div className="bg-[#FAF7F2]">
            <PageHero
                title="Shop Live via Video Call"
                subtitle="Get a personal product tour from our experts. See products up close, ask questions, and make the best choice — all from home."
                breadcrumbs={[{ label: 'Shop Live' }]}
            />

            <section className="section-wrapper">
                {/* Perks */}
                <ScrollReveal stagger staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
                    {perks.map((p, i) => (
                        <ScrollRevealItem key={i}>
                            <motion.div className="glass-morph p-6 text-center group cursor-default" whileHover={{ y: -4 }}>
                                <div className={`w-12 h-12 rounded-2xl bg-${p.color}-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-${p.color}-500 transition-all duration-300`}>
                                    <p.icon className={`w-5 h-5 text-${p.color}-500 group-hover:text-white transition-colors duration-300`} />
                                </div>
                                <h3 className="font-bold text-dark-900 text-sm mb-1">{p.title}</h3>
                                <p className="text-dark-400 text-xs">{p.desc}</p>
                            </motion.div>
                        </ScrollRevealItem>
                    ))}
                </ScrollReveal>

                {/* Booking Card */}
                <ScrollReveal className="max-w-2xl mx-auto">
                    <div className="glass-morph p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center"><FiCalendar className="w-5 h-5 text-accent-500" /></div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-dark-900">Book Your Session</h2>
                                <p className="text-dark-400 text-xs">Select a date and available time slot</p>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-dark-500 uppercase tracking-widest mb-2">Select Date</label>
                            <input
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                type="date"
                                min={new Date().toISOString().slice(0, 10)}
                                className={inputClass + ' max-w-xs'}
                            />
                        </div>

                        {/* Time Slots */}
                        {loading ? (
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[...Array(6)].map((_, i) => <div key={i} className="skeleton-shimmer h-12 rounded-xl" />)}
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-10 mb-6">
                                <div className="w-16 h-16 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-3">
                                    <FiCalendar className="w-7 h-7 text-accent-400" />
                                </div>
                                <p className="text-dark-400 text-sm font-medium">No available slots for this date</p>
                                <p className="text-dark-300 text-xs mt-1">Try selecting a different date</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                                {slots.map(slot => (
                                    <button
                                        key={slot._id}
                                        onClick={() => setSelectedSlot(slot)}
                                        disabled={slot.isBooked}
                                        className={`py-3 px-3 text-sm rounded-xl border-2 transition-all duration-300 font-semibold
                                            ${selectedSlot?._id === slot._id
                                                ? 'border-accent-500 bg-accent-50 text-accent-700 shadow-md shadow-accent-500/10'
                                                : slot.isBooked
                                                    ? 'bg-dark-50 text-dark-300 cursor-not-allowed border-transparent'
                                                    : 'border-dark-100 hover:border-accent-300 text-dark-700'
                                            }`}
                                    >
                                        {slot.startTime} - {slot.endTime}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Booking Form */}
                        <AnimatePresence>
                            {selectedSlot && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="border-t border-dark-100 pt-6 space-y-4">
                                        <h3 className="font-display font-bold text-dark-900">Book {selectedSlot.startTime} — {selectedSlot.endTime}</h3>
                                        <div className="relative">
                                            <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                            <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Your Name *" className={inputClass + ' pl-12'} />
                                        </div>
                                        <div className="relative">
                                            <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                            <input value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} placeholder="Email *" type="email" className={inputClass + ' pl-12'} />
                                        </div>
                                        <div className="relative">
                                            <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
                                            <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="Phone" className={inputClass + ' pl-12'} />
                                        </div>
                                        <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="What products are you interested in?" rows={2} className={inputClass} />
                                        <motion.button onClick={handleBook} disabled={booking} className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm uppercase tracking-wider py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-accent-500/20 hover:shadow-accent-500/40 disabled:opacity-50 flex items-center justify-center gap-2" whileTap={{ scale: 0.98 }}>
                                            {booking ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking...</> : <><FiVideo className="w-4 h-4" /> Book Video Call</>}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollReveal>
            </section>
        </div>
    );
};

export default ShopLivePage;
