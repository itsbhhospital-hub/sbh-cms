import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollControls = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed bottom-20 right-4 z-[150] flex flex-col gap-2">
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToTop}
                        className="p-3 bg-white border border-slate-200 text-[#2e7d32] rounded-full shadow-lg hover:bg-emerald-50 transition-all active:scale-90"
                    >
                        <ArrowUp size={20} strokeWidth={2.5} />
                    </motion.button>
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={scrollToBottom}
                        className="p-3 bg-white border border-slate-200 text-[#2e7d32] rounded-full shadow-lg hover:bg-emerald-50 transition-all active:scale-90"
                    >
                        <ArrowDown size={20} strokeWidth={2.5} />
                    </motion.button>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ScrollControls;
