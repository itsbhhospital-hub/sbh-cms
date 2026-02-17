import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

const MobileWelcome = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Detect if running on native mobile (Android or iOS)
        const platform = Capacitor.getPlatform();
        const isNative = platform === 'android' || platform === 'ios';

        // Also check localStorage to see if we've shown it this session
        const hasSeenWelcome = sessionStorage.getItem('sbh_mobile_welcome_shown');

        if (isNative && !hasSeenWelcome) {
            setShouldRender(true);
            setIsVisible(true);

            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                setIsVisible(false);
                sessionStorage.setItem('sbh_mobile_welcome_shown', 'true');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    if (!shouldRender) return null;

    return (
        <AnimatePresence onExitComplete={() => setShouldRender(false)}>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] bg-[#1f2d2a] flex flex-col items-center justify-center p-6"
                >
                    {/* Background Subtle Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#2e7d32]/10 to-transparent pointer-events-none" />

                    <div className="relative flex flex-col items-center">
                        {/* Logo Animation */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: [0.16, 1, 0.3, 1],
                                delay: 0.2
                            }}
                            className="w-32 h-32 mb-8 bg-white rounded-3xl p-6 shadow-2xl flex items-center justify-center border border-white/10"
                        >
                            <img
                                src="/logo.png"
                                alt="SBH Logo"
                                className="w-full h-full object-contain"
                            />
                        </motion.div>

                        {/* Text Animation */}
                        <div className="text-center">
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="text-white text-2xl font-black uppercase tracking-[0.2em] mb-2"
                            >
                                Welcome To
                            </motion.h1>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.8, delay: 1 }}
                                className="h-1 bg-[#2e7d32] rounded-full mb-3 mx-auto max-w-[120px]"
                            />
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                                className="text-[#cfead6] text-3xl font-black uppercase tracking-tighter"
                            >
                                SBH Group
                            </motion.h2>
                        </div>

                        {/* Subtext */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ duration: 1, delay: 1.5 }}
                            className="mt-12 text-white/60 text-[10px] font-black uppercase tracking-[0.3em]"
                        >
                            Infrastructure by Naman Mishra
                        </motion.p>
                    </div>

                    {/* Loading Indicator at Bottom */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="absolute bottom-12 flex gap-1"
                    >
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full"
                            />
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MobileWelcome;
