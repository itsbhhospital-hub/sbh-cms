import { useIntelligence } from '../../context/IntelligenceContext';
import { calculateWorkloadParams } from '../../services/aiCore';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const WorkloadHeatmap = () => {
    const { allTickets, aiDeptLoad } = useIntelligence();
    const { user } = useAuth();

    if (!aiDeptLoad || !allTickets) return null;

    const isSuperAdmin = ['SUPERADMIN', 'SUPER_ADMIN'].includes(String(user?.Role || '').toUpperCase().trim());
    const isUserAdmin = isSuperAdmin || String(user?.Role || '').toLowerCase().trim() === 'admin';

    // Transform AI Data into Array for rendering
    let departments = Object.keys(aiDeptLoad).map(dept => {
        const stats = aiDeptLoad[dept];
        // Re-calculate params to get color coding (or we could have done this in AI core)
        const { level, color } = calculateWorkloadParams(allTickets, dept);

        return {
            name: dept,
            ...stats,
            level,
            color
        };
    });

    // Filtering for visibility
    if (!isUserAdmin) {
        const uDept = String(user?.Department || '').toLowerCase().trim();
        departments = departments.filter(d => d.name.toLowerCase().trim() === uDept);
    }

    departments.sort((a, b) => b.open - a.open); // Sort by highest load

    const getColorClass = (color) => {
        if (color === 'red') return 'bg-rose-50 border-rose-200 text-rose-700';
        if (color === 'yellow') return 'bg-amber-50 border-amber-200 text-amber-700';
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    };

    const getIndicatorClass = (color) => {
        if (color === 'red') return 'bg-rose-500 shadow-rose-200';
        if (color === 'yellow') return 'bg-amber-500 shadow-amber-200';
        return 'bg-emerald-500 shadow-emerald-200';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    <h3 className="font-semibold text-slate-800 text-sm">AI Workload Heatmap</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    LIVE INTEL
                </span>
            </div>

            <div className="p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {departments.map((d, i) => (
                    <motion.div
                        key={d.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`relative p-3 rounded-lg border ${getColorClass(d.color)} flex flex-col gap-1`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[80%]">
                                {d.name}
                            </span>
                            <div className={`w-2 h-2 rounded-full shadow-lg ${getIndicatorClass(d.color)} animate-pulse`} />
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-2xl font-bold leading-none">{d.open}</div>
                                <div className="text-[10px] opacity-70">Active Cases</div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs font-semibold">{d.delayed}</div>
                                <div className="text-[10px] opacity-70">Delayed</div>
                            </div>
                        </div>

                        {d.level === 'Overloaded' && (
                            <div className="absolute top-0 right-0 -mt-1 -mr-1">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default WorkloadHeatmap;
