import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const directionVariants = {
    up: { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -60 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1 } },
    fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

const ScrollReveal = ({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.7,
    className = '',
    once = true,
    threshold = 0.15,
    stagger = false,
    staggerDelay = 0.1,
    as = 'div',
}) => {
    const [ref, inView] = useInView({ triggerOnce: once, threshold });
    const variants = directionVariants[direction] || directionVariants.up;

    const MotionComponent = motion[as] || motion.div;

    if (stagger) {
        return (
            <MotionComponent
                ref={ref}
                className={className}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: staggerDelay, delayChildren: delay },
                    },
                }}
            >
                {children}
            </MotionComponent>
        );
    }

    return (
        <MotionComponent
            ref={ref}
            className={className}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={{
                hidden: variants.hidden,
                visible: {
                    ...variants.visible,
                    transition: {
                        duration,
                        delay,
                        ease: [0.16, 1, 0.3, 1],
                    },
                },
            }}
        >
            {children}
        </MotionComponent>
    );
};

// Child wrapper for staggered items
export const ScrollRevealItem = ({
    children,
    direction = 'up',
    className = '',
    duration = 0.6,
}) => {
    const variants = directionVariants[direction] || directionVariants.up;
    return (
        <motion.div
            className={className}
            variants={{
                hidden: variants.hidden,
                visible: {
                    ...variants.visible,
                    transition: { duration, ease: [0.16, 1, 0.3, 1] },
                },
            }}
        >
            {children}
        </motion.div>
    );
};

export default ScrollReveal;
