import React, { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalLoader = () => {
    const { isLoading, isSystemLoading } = useLoading();

    return (
        <AnimatePresence>
            {isLoading && isSystemLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                >
                    <div className="relative flex flex-col items-center justify-center">
                        <div className="relative">
                            {/* Logo Image - Only shown during system bootstrap */}
                            <motion.img
                                src="/spinner_logo.png"
                                alt="Loading..."
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-16 h-16 md:w-20 md:h-20 object-contain relative z-10 drop-shadow-xl"
                            />

                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 -m-4 border border-emerald-500/30 rounded-full border-dashed"
                            />

                            <motion.div
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                className="absolute inset-0 bg-emerald-400/20 rounded-full -z-10"
                            />
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-6 text-emerald-800 font-bold text-xs tracking-wider uppercase"
                        >
                            Syncing System
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalLoader;
