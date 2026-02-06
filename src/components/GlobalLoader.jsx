import React, { useEffect, useState } from 'react';
import { useLoading } from '../context/LoadingContext';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalLoader = () => {
    const { isLoading } = useLoading();
    // Use local state to handle the exit animation gracefully if needed, 
    // but AnimatePresence handles mounting/unmounting well.

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-[2px]"
                >
                    <div className="relative flex items-center justify-center">
                        {/* Outer Ring 1 - Soft Green */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute w-32 h-32 rounded-full border border-emerald-100 border-t-emerald-400"
                        />

                        {/* Outer Ring 2 - Orange Accent (Counter Rotation) */}
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute w-24 h-24 rounded-full border border-transparent border-b-orange-400/50"
                        />

                        {/* Inner Pulse Circle */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-20 h-20 bg-emerald-50 rounded-full blur-xl"
                        />

                        {/* Text Container */}
                        <div className="relative z-10 flex flex-col items-center">
                            <h1 className="text-3xl font-black tracking-tighter text-slate-800">SBH</h1>
                            <div className="flex gap-1 mt-1">
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                    className="w-1.5 h-1.5 bg-orange-500 rounded-full"
                                />
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                    className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                                />
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalLoader;
