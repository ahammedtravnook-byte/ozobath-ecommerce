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
}) => {
    return (
        <section className={`relative overflow-hidden ${compact ? 'pt-28 pb-12' : 'pt-32 pb-20'}`}>
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

            {/* Decorative Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className={`absolute -top-20 -right-20 w-96 h-96 bg-${accentColor}-500/10 rounded-full blur-[120px]`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px]"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
                {/* Floating shapes */}
                <motion.div
                    className={`absolute top-1/3 right-[15%] w-3 h-3 bg-${accentColor}-400 rotate-45`}
                    animate={{ y: [0, -15, 0], rotate: [45, 90, 45] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-1/4 left-[20%] w-4 h-4 rounded-full border-2 border-white/10"
                    animate={{ y: [0, 10, 0], scale: [1, 1.3, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </section>
    );
};

export default PageHero;
