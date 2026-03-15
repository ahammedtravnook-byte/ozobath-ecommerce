// ============================================
// OZOBATH — Premium AI Chatbot Widget + Book Live Demo
// Navy & Cyan-Aqua design — Fully Redesigned
// ============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiExternalLink, FiCornerDownRight, FiChevronRight, FiVideo } from 'react-icons/fi';
import { chatbotData, quickGuideChips, greetingMessage, fallbackResponse } from '@data/chatbotData';

/* ─── Keyword match engine ──────────────────── */
const findBestMatch = (input) => {
    const normalised = input.toLowerCase().trim();
    if (!normalised || normalised.length < 2) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of chatbotData) {
        let score = 0;
        const words = normalised.split(/\s+/);

        for (const keyword of entry.keywords) {
            const lk = keyword.toLowerCase();
            if (normalised.includes(lk)) {
                score += lk.split(/\s+/).length * 3;
            }
            for (const word of words) {
                if (word.length >= 3 && lk.includes(word)) score += 1;
            }
        }

        const qWords = entry.question.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length >= 3 && qWords.includes(word)) score += 2;
        }

        if (score > bestScore) { bestScore = score; bestMatch = entry; }
    }

    return bestScore >= 2 ? bestMatch : null;
};

/* ─── Markdown → JSX renderer ───────────────── */
const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-primary-700">$1</strong>');
        if (processed.startsWith('• ') || processed.startsWith('- ')) {
            return <li key={i} className="ml-4 list-disc text-[13px] leading-relaxed text-dark-600" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
        }
        const numMatch = processed.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
            return <li key={i} className="ml-4 list-decimal text-[13px] leading-relaxed text-dark-600" dangerouslySetInnerHTML={{ __html: numMatch[2] }} />;
        }
        if (!processed.trim()) return <div key={i} className="h-2" />;
        return <p key={i} className="text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
};

/* ─── Main Component ────────────────────────── */
const ChatBot = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [showDemoTooltip, setShowDemoTooltip] = useState(false);
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Show greeting on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ id: 'greeting', type: 'bot', text: greetingMessage.text, chips: quickGuideChips }]);
        }
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    // ── Reliable scroll-to-bottom ─────────────
    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

    useEffect(() => {
        if (!hasInteracted) {
            const timer = setTimeout(() => setHasInteracted(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [hasInteracted]);

    const addBotMessage = useCallback((text, relatedQIds = [], guideLink = null, guideLinkText = null) => {
        setIsTyping(true);
        const delay = Math.min(600 + text.length * 2, 1800);

        setTimeout(() => {
            const relatedQuestions = relatedQIds
                .map(id => chatbotData.find(q => q.id === id))
                .filter(Boolean)
                .slice(0, 3);

            setMessages(prev => [...prev, {
                id: Date.now().toString(), type: 'bot', text, relatedQuestions, guideLink, guideLinkText,
            }]);
            setIsTyping(false);
        }, delay);
    }, []);

    const handleSend = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed) return;
        setHasInteracted(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: trimmed }]);
        setInput('');
        const match = findBestMatch(trimmed);
        if (match) {
            addBotMessage(match.answer, match.relatedQuestions || [], match.guideLink, match.guideLinkText);
        } else {
            addBotMessage(fallbackResponse.text, fallbackResponse.relatedQuestions);
        }
    }, [input, addBotMessage]);

    const handleChipClick = useCallback((chip) => {
        if (chip.type === 'link') { navigate(chip.path); setIsOpen(false); return; }
        const entry = chatbotData.find(q => q.id === chip.questionId);
        if (entry) {
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: entry.question }]);
            addBotMessage(entry.answer, entry.relatedQuestions || [], entry.guideLink, entry.guideLinkText);
        }
    }, [navigate, addBotMessage]);

    const handleRelatedClick = useCallback((entry) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: entry.question }]);
        addBotMessage(entry.answer, entry.relatedQuestions || [], entry.guideLink, entry.guideLinkText);
    }, [addBotMessage]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <>
            {/* ─── Book Live Demo Button ─────────── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-[100px] right-6 z-[90]"
                    >
                        <Link
                            to="/shop-live"
                            className="group relative block"
                            onMouseEnter={() => setShowDemoTooltip(true)}
                            onMouseLeave={() => setShowDemoTooltip(false)}
                        >
                            <motion.div
                                className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 text-white rounded-2xl shadow-lg shadow-accent-500/30 flex items-center justify-center hover:scale-110 transition-transform duration-300"
                                whileTap={{ scale: 0.9 }}
                            >
                                <FiVideo className="w-5 h-5" />
                            </motion.div>
                            <AnimatePresence>
                                {showDemoTooltip && (
                                    <motion.div
                                        className="absolute right-14 top-1/2 -translate-y-1/2 bg-dark-900 text-white text-[11px] font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-lg"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        Book Live Demo
                                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-dark-900 rotate-45" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Floating Chat Button ──────────── */}
            <motion.button
                className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-primary-700 to-accent-500 text-white rounded-2xl shadow-xl shadow-primary-800/30 flex items-center justify-center hover:scale-110 transition-transform duration-300"
                onClick={() => { setIsOpen(!isOpen); setHasInteracted(true); }}
                whileTap={{ scale: 0.9 }}
                aria-label="Chat with us"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <FiX className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <FiMessageCircle className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {!hasInteracted && !isOpen && (
                    <span className="absolute inset-0 rounded-2xl border-2 border-accent-400 animate-ping opacity-30" />
                )}
            </motion.button>

            {/* ─── Chat Panel ─────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-24 right-4 sm:right-6 z-[99] w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-dark-900/30 border border-white/10"
                        initial={{ opacity: 0, y: 30, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.92 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* ── Header ─────────────────────── */}
                        <div className="relative bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 px-5 py-4 shrink-0">
                            {/* Glassmorphism overlay */}
                            <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm" />
                            <div className="relative flex items-center gap-3">
                                <div className="w-12 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5 ring-1 ring-white/20">
                                    <img src="/images/Ozo-bath-3-2.jpg.jpeg" alt="OzoBath" className="w-full h-full object-contain brightness-0 invert drop-shadow-md" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-display font-bold text-sm tracking-wide">OZO Assistant</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                                        </span>
                                        <span className="text-white/40 text-[10px] font-semibold uppercase tracking-widest">Online</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
                                >
                                    <FiX className="w-5 h-5 text-white/50 hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>

                        {/* ── Messages ────────────────────── */}
                        <div
                            ref={messagesContainerRef}
                            data-lenis-prevent
                            className="flex-1 overflow-y-scroll bg-gradient-to-b from-[#EBF4FF] to-[#F5F9FF] px-4 py-5 space-y-4 custom-scrollbar"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} chat-msg-enter`}>
                                    <div className="max-w-[85%]">
                                        {/* Avatar for bot messages */}
                                        {msg.type === 'bot' && (
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-6 h-5 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-dark-200/30 overflow-hidden">
                                                    <img src="/images/Ozo-bath-3-2.jpg.jpeg" alt="OZO" className="w-full h-full object-contain mix-blend-multiply opacity-80" />
                                                </div>
                                                <span className="text-[10px] text-dark-300 font-semibold">OZO Assistant</span>
                                            </div>
                                        )}

                                        <div
                                            className={`px-4 py-3 text-[13px] leading-relaxed space-y-1
                                                ${msg.type === 'user'
                                                    ? 'bg-gradient-to-br from-primary-700 to-primary-600 text-white rounded-2xl rounded-br-lg shadow-md shadow-primary-700/20'
                                                    : 'bg-white border border-dark-100/20 text-dark-700 rounded-2xl rounded-bl-lg shadow-sm'
                                                }`}
                                        >
                                            {renderMarkdown(msg.text)}
                                        </div>

                                        {/* Quick Guide Chips */}
                                        {msg.chips && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {msg.chips.map((chip, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleChipClick(chip)}
                                                        className="text-[11px] font-semibold px-3 py-1.5 bg-white border border-accent-200/50 text-dark-600 rounded-xl hover:border-accent-400 hover:text-accent-600 hover:bg-accent-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        {chip.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Guide Link */}
                                        {msg.guideLink && (
                                            <Link
                                                to={msg.guideLink}
                                                onClick={() => setIsOpen(false)}
                                                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-600 hover:text-accent-700 transition-colors bg-accent-50 px-3 py-1.5 rounded-xl hover:bg-accent-100/60"
                                            >
                                                <FiExternalLink className="w-3 h-3" />
                                                {msg.guideLinkText || 'Learn More'}
                                            </Link>
                                        )}

                                        {/* Related Questions */}
                                        {msg.relatedQuestions?.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                <p className="text-[9px] text-dark-300 font-bold uppercase tracking-[0.15em] px-1 mb-1.5">Related Topics</p>
                                                {msg.relatedQuestions.map((rq) => (
                                                    <button
                                                        key={rq.id}
                                                        onClick={() => handleRelatedClick(rq)}
                                                        className="w-full flex items-center gap-2 text-left text-[12px] text-dark-500 font-medium px-3 py-2 bg-dark-50/40 hover:bg-accent-50 hover:text-accent-600 rounded-xl transition-all duration-200 group"
                                                    >
                                                        <FiChevronRight className="w-3 h-3 text-dark-200 group-hover:text-accent-500 transition-colors shrink-0" />
                                                        <span className="line-clamp-1">{rq.question}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex justify-start chat-msg-enter">
                                    <div className="bg-white border border-dark-100/20 rounded-2xl rounded-bl-lg px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Input Area ──────────────────── */}
                        <div className="bg-white/80 backdrop-blur-lg border-t border-dark-100/10 px-4 py-3 shrink-0">
                            <div className="flex items-center gap-2 bg-gradient-to-r from-dark-50/60 to-dark-50/40 rounded-2xl px-4 py-1 border border-dark-100/10 focus-within:border-accent-300 focus-within:shadow-sm focus-within:shadow-accent-300/10 transition-all duration-300">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about products, shipping, returns..."
                                    className="flex-1 bg-transparent text-[13px] text-dark-900 placeholder:text-dark-300 focus:outline-none py-2.5"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="p-2 bg-gradient-to-br from-primary-700 to-accent-500 text-white rounded-xl shadow-sm hover:shadow-md hover:shadow-accent-500/20 transition-all duration-200 disabled:opacity-30 disabled:shadow-none hover:scale-105 active:scale-95"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[9px] text-dark-300/60 text-center mt-2 font-medium tracking-wide">
                                Powered by OZOBATH • <Link to="/contact" onClick={() => setIsOpen(false)} className="text-accent-500 hover:text-accent-600 transition-colors">Talk to a human</Link>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
