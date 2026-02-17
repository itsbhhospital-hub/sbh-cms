import { useIntelligence } from '../context/IntelligenceContext';
import { Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AILivePulse = () => {
    const { lastSync, loading } = useIntelligence();

    return (
        <div className="fixed bottom-16 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-200 text-xs font-medium text-slate-600">
            <div className="relative flex items-center justify-center w-3 h-3">
                {loading ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                        <Radio size={12} className="text-blue-500" />
                    </motion.div>
                ) : (
                    <>
                        <motion.span
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-emerald-500 rounded-full"
                        />
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </>
                )}
            </div>

            <div className="flex flex-col leading-tight">
                <span className="uppercase tracking-wider text-[10px] text-slate-400">AI SYSTEM</span>
                <span>{loading ? 'SYNCING...' : 'LIVE MONITORING'}</span>
            </div>

            {lastSync && (
                <span className="ml-1 text-[10px] text-slate-400 border-l border-slate-200 pl-2">
                    {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            )}
        </div>
    );
};

export default AILivePulse;
