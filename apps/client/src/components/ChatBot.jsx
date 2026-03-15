// ============================================
// OZOBATH — Premium AI Chatbot Widget
// Glassmorphism design with FAQ matching
// ============================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiExternalLink, FiCornerDownRight, FiChevronRight } from 'react-icons/fi';
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

        // Keyword matching
        for (const keyword of entry.keywords) {
            const lk = keyword.toLowerCase();
            if (normalised.includes(lk)) {
                score += lk.split(/\s+/).length * 3; // multi-word keywords score higher
            }
            // partial word match
            for (const word of words) {
                if (word.length >= 3 && lk.includes(word)) {
                    score += 1;
                }
            }
        }

        // Question similarity
        const qWords = entry.question.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length >= 3 && qWords.includes(word)) {
                score += 2;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    return bestScore >= 2 ? bestMatch : null;
};

/* ─── Simple Markdown → JSX renderer ────────── */
const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        // Bold
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        if (processed.startsWith('• ') || processed.startsWith('- ')) {
            return <li key={i} className="ml-4 list-disc text-sm" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
        }
        // Numbered list
        const numMatch = processed.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
            return <li key={i} className="ml-4 list-decimal text-sm" dangerouslySetInnerHTML={{ __html: numMatch[2] }} />;
        }
        // Empty line = spacer
        if (!processed.trim()) return <br key={i} />;
        // Normal
        return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
};

const ChatBot = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    // Show greeting on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ id: 'greeting', type: 'bot', text: greetingMessage.text, chips: quickGuideChips }]);
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Auto-scroll
    useEffect(() => {
        if (messagesContainerRef.current) {
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTo({
                        top: messagesContainerRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        }
    }, [messages, isTyping]);

    // Pulse notification after 5 seconds
    useEffect(() => {
        if (!hasInteracted) {
            const timer = setTimeout(() => setHasInteracted(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [hasInteracted]);

    // Lock body scroll when chatbot is open
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
        }
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    const addBotMessage = useCallback((text, relatedQIds = [], guideLink = null, guideLinkText = null) => {
        setIsTyping(true);
        const delay = Math.min(800 + text.length * 3, 2000);

        setTimeout(() => {
            const relatedQuestions = relatedQIds
                .map(id => chatbotData.find(q => q.id === id))
                .filter(Boolean)
                .slice(0, 3);

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'bot',
                text,
                relatedQuestions,
                guideLink,
                guideLinkText,
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
        if (chip.type === 'link') {
            navigate(chip.path);
            setIsOpen(false);
            return;
        }
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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* ─── Floating Button ────────────────── */}
            <motion.button
                className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-gradient-to-br from-accent-500 to-orange-500 text-white rounded-full shadow-xl shadow-accent-500/30 flex items-center justify-center hover:scale-110 transition-transform duration-300"
                onClick={() => { setIsOpen(!isOpen); setHasInteracted(true); }}
                whileTap={{ scale: 0.9 }}
                aria-label="Chat with us"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <FiX className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <FiMessageCircle className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Pulse ring */}
                {!hasInteracted && !isOpen && (
                    <span className="absolute inset-0 rounded-full border-2 border-accent-400 animate-ping opacity-40" />
                )}
            </motion.button>

            {/* ─── Chat Panel ─────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed bottom-24 right-4 sm:right-6 z-[99] w-[calc(100vw-2rem)] sm:w-[400px] h-[520px] flex flex-col rounded-3xl overflow-hidden shadow-2xl shadow-dark-900/20"
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.9 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 px-5 py-4 flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/5">
                                <img src="/images/logo.png" alt="Ozo Assistant" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-display font-bold text-sm">OZO Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <span className="text-white/50 text-[11px] font-medium">Online • Instant replies</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <FiX className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-[#FAF7F2] p-4 flex flex-col gap-4 min-h-0 relative">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex shrink-0 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%]">
                                        <div
                                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1
                                                ${msg.type === 'user'
                                                    ? 'bg-gradient-to-br from-accent-500 to-orange-500 text-white rounded-br-md shadow-md shadow-accent-500/15'
                                                    : 'bg-white border border-dark-100/30 text-dark-700 rounded-bl-md shadow-sm'
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
                                                        className="text-[11px] font-semibold px-3 py-1.5 bg-white border border-dark-100/40 text-dark-700 rounded-full hover:border-accent-400 hover:text-accent-600 hover:bg-accent-50 transition-all shadow-sm"
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
                                                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-500 hover:text-accent-600 transition-colors bg-accent-50 px-3 py-1.5 rounded-full"
                                            >
                                                <FiExternalLink className="w-3 h-3" />
                                                {msg.guideLinkText || 'Learn More'}
                                            </Link>
                                        )}

                                        {/* Related Questions */}
                                        {msg.relatedQuestions?.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                <p className="text-[10px] text-dark-400 font-semibold uppercase tracking-wider px-1">Related</p>
                                                {msg.relatedQuestions.map((rq) => (
                                                    <button
                                                        key={rq.id}
                                                        onClick={() => handleRelatedClick(rq)}
                                                        className="w-full flex items-center gap-2 text-left text-[12px] text-dark-600 font-medium px-3 py-2 bg-dark-50/60 hover:bg-accent-50 hover:text-accent-600 rounded-xl transition-colors"
                                                    >
                                                        <FiCornerDownRight className="w-3 h-3 text-dark-300 shrink-0" />
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
                                <div className="flex justify-start shrink-0">
                                    <div className="bg-white border border-dark-100/30 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-dark-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-2 shrink-0" />
                        </div>

                        {/* Input */}
                        <div className="bg-white border-t border-dark-100/20 px-4 py-3 shrink-0">
                            <div className="flex items-center gap-2 bg-dark-50/60 rounded-2xl px-4 py-1.5">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    className="flex-1 bg-transparent text-sm text-dark-900 placeholder:text-dark-300 focus:outline-none py-2"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="p-2.5 bg-gradient-to-br from-accent-500 to-orange-500 text-white rounded-xl shadow-md shadow-accent-500/20 hover:shadow-accent-500/40 transition-all disabled:opacity-40 disabled:shadow-none hover:scale-105"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-dark-300 text-center mt-2 font-medium">Powered by OZOBATH • <Link to="/contact" onClick={() => setIsOpen(false)} className="text-accent-500 hover:underline">Talk to a human</Link></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatBot;
