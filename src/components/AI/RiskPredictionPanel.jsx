import { useIntelligence } from '../../context/IntelligenceContext';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const RiskPredictionPanel = () => {
    const { aiRiskReport } = useIntelligence();

    if (!aiRiskReport) return null;

    // Sort by Risk Score descending
    const highRisks = aiRiskReport.sort((a, b) => b.score - a.score).slice(0, 5); // Show top 5

    if (highRisks.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center opacity-70">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                    <TrendingUp className="text-emerald-500" />
                </div>
                <h3 className="text-slate-800 font-semibold">System Healthy</h3>
                <p className="text-slate-500 text-sm">No significant delay risks detected by AI.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-500" />
                    <h3 className="font-semibold text-slate-800 text-sm">AI Delay Predictions</h3>
                </div>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {highRisks.length} CRITICAL
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {highRisks.map((risk, i) => (
                    <motion.div
                        key={risk.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1 rounded">{risk.id}</span>
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                {risk.score}% RISK
                            </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium mb-1">
                            {risk.dept} Department
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                            {risk.reasons.map((r, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                    <Clock size={10} />
                                    {r}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
            <div className="bg-slate-50 p-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                AI Prediction Engine • Updates every 20s
            </div>
        </div>
    );
};

export default RiskPredictionPanel;
