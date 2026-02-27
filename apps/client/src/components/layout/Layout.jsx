import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <AnnouncementBar />
            <Navbar />
            <motion.main
                className="flex-grow"
                variants={pageVariants}
                initial="initial"
                animate="enter"
                exit="exit"
            >
                <Outlet />
            </motion.main>
            <Footer />
        </div>
    );
};

export default Layout;
