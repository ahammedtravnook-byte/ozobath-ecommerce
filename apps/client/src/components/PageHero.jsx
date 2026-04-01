import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

const PageHero = ({
    title,
    subtitle,
    breadcrumbs = [],
    compact = false,
    gradient = 'from-dark-950 via-dark-900 to-dark-800',
    accentColor = 'accent',
    illustration = null,
}) => {
    return (
        <section className={`relative overflow-hidden ${compact ? 'pt-28 pb-12' : 'pt-32 pb-20'}`}>
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

            {/* Decorative Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-20 -right-20 w-96 h-96 bg-${accentColor}-500/10 rounded-full blur-3xl animate-pulse`} />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`${illustration ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-center' : ''}`}>
                    {/* Left — Text Content */}
                    <div>
                        {/* Breadcrumbs */}
                        {breadcrumbs.length > 0 && (
                            <motion.nav
                                className="flex items-center gap-1.5 text-sm mb-5"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Link
                                    to="/"
                                    className="text-white/40 hover:text-white/70 transition-colors font-medium"
                                >
                                    Home
                                </Link>
                                {breadcrumbs.map((crumb, i) => (
                                    <span key={i} className="flex items-center gap-1.5">
                                        <FiChevronRight className="w-3.5 h-3.5 text-white/20" />
                                        {crumb.path ? (
                                            <Link
                                                to={crumb.path}
                                                className="text-white/40 hover:text-white/70 transition-colors font-medium"
                                            >
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className={`text-${accentColor}-400 font-semibold`}>
                                                {crumb.label}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </motion.nav>
                        )}

                        {/* Title */}
                        <motion.h1
                            className={`${compact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'} font-display font-bold text-white mb-3 tracking-tight`}
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {title}
                        </motion.h1>

                        {/* Subtitle */}
                        {subtitle && (
                            <motion.p
                                className="text-white/50 text-base md:text-lg max-w-2xl font-medium"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>

                    {/* Right — Illustration */}
                    {illustration && (
                        <motion.div
                            className="hidden lg:flex justify-center items-center"
                            initial={{ opacity: 0, scale: 0.85, x: 30 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.img
                                src={illustration}
                                alt=""
                                className="w-full max-w-[320px] h-auto drop-shadow-2xl"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default PageHero;
