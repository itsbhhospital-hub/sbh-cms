import React from 'react';
import { motion } from 'framer-motion';

const PageLoader = () => {
    return (
        <div className="w-full min-h-[30vh] flex flex-col items-center justify-center p-4">
            <div className="relative flex flex-col items-center gap-3">
                {/* 🌀 FINAL MICRO GREEN SPINNER */}
                <div className="relative w-8 h-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 0.4, // Faster for premium "high-speed" feel
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="w-full h-full border-[3px] border-[#2e7d32]/10 border-t-[#2e7d32] rounded-full shadow-sm"
                    />
                </div>

                {/* 📝 MINIMAL LOADING TEXT */}
                <div className="text-center">
                    <h3 className="text-[10px] font-black text-[#2e7d32] uppercase tracking-[0.2em] mb-0.5">
                        Loading
                    </h3>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                        Synchronizing...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
