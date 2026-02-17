import { useIntelligence } from '../../context/IntelligenceContext';
import { motion } from 'framer-motion';
import { Award, Zap, Star } from 'lucide-react';

const AIExcellenceRegistry = () => {
    const { aiStaffScores } = useIntelligence();

    if (!aiStaffScores) return null;

    // Convert scores object to sorted array
    const topPerformers = Object.keys(aiStaffScores)
        .map(username => ({
            username,
            score: aiStaffScores[username]
        }))
        .filter(u => u.score > 0) // Only active
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Top 5

    if (topPerformers.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <div className="flex items-center gap-2">
                    <Award size={16} className="text-indigo-500" />
                    <h3 className="font-semibold text-slate-800 text-sm">AI Excellence Registry</h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    TOP 5
                </span>
            </div>

            <div className="p-2 space-y-2">
                {topPerformers.map((staff, i) => (
                    <motion.div
                        key={staff.username}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative font-bold text-slate-300 text-lg w-6 text-center italic">
                                #{i + 1}
                                {i === 0 && <span className="absolute -top-1 -right-1 text-yellow-400"><Award size={12} fill="currentColor" /></span>}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-700">{staff.username}</h4>
                                <div className="flex items-center gap-1">
                                    <div className="h-1 w-16 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500"
                                            style={{ width: `${staff.score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600 leading-none">
                                {staff.score}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">AI SCORE</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-slate-50 p-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                Calculated on Speed + Quality + Volume
            </div>
        </div>
    );
};

export default AIExcellenceRegistry;
