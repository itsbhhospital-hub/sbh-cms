import React, { useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import TicketFlowMap from './TicketFlowMap';
import DepartmentLoadTable from './DepartmentLoadTable';
import StaffRankingCard from './StaffRankingCard';
import { AlertTriangle, Zap } from 'lucide-react';
import { normalize } from '../../utils/dataUtils';

const DirectorDashboard = () => {
    // Consume Unified Intelligence Layer
    const {
        loading,
        flowStats,
        deptStats, // DIRECT CONSUMPTION (Array)
        staffStats,
        delayRisks, // Renamed from detailedDelayRisks in Context to delayRisks
        alerts,
        lastSync
    } = useIntelligence();

    // Adapt Data Formats
    // const deptStats = ... (REMOVED: Context now provides this already formatted)

    // const delayRisks = detailedDelayRisks || []; // REMOVED: Now from context directly
    const lastUpdated = lastSync || new Date();

    if (loading) return (
        <div className="w-full h-32 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <span className="text-xs font-bold text-slate-400 animate-pulse">Initializing Intelligence Engine...</span>
        </div>
    );

    return (
        <div className="space-y-6 mb-8">
            {/* Header / Alerts Strip */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-[#1f2d2a] flex items-center gap-2 uppercase tracking-tight">
                        <Zap size={20} className="text-[#2e7d32]" fill="currentColor" />
                        Intelligence
                        <span className="text-[10px] font-black bg-[#1f2d2a] text-[#2e7d32] px-2 py-0.5 rounded-lg border border-[#2e7d32]/20">RT</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Operational Pulse • Live Sync: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>

                {/* Smart Alerts Ticker */}
                {alerts.length > 0 && (
                    <div className="flex-1 overflow-hidden h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center px-4 max-w-xl">
                        <AlertTriangle size={16} className="text-rose-500 mr-2 shrink-0 animate-pulse" />
                        <div className="flex gap-6 animate-marquee whitespace-nowrap">
                            {alerts.map((a, i) => (
                                <span key={i} className="text-[10px] font-black uppercase tracking-tight text-rose-700">{a.msg}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* 1. Ticket Flow (Full Width) */}
                <div className="md:col-span-12">
                    <TicketFlowMap stats={flowStats} />
                </div>

                {/* 2. Dept Load (Half) */}
                <div className="md:col-span-4">
                    <DepartmentLoadTable data={deptStats} />
                </div>

                {/* 3. Staff Ranking (Half) */}
                <div className="md:col-span-4">
                    <StaffRankingCard staff={staffStats} />
                </div>

                {/* 4. Delay Risk Panel */}
                <div className="md:col-span-4 bg-white rounded-3xl p-8 border border-[#dcdcdc] shadow-none">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Risk Predictions</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {delayRisks.length === 0 ? (
                            <div className="text-center py-20 text-[#2e7d32] text-[10px] font-black uppercase tracking-widest bg-[#f8faf9] rounded-2xl border border-dashed border-[#dcdcdc]">
                                System Optimized.
                            </div>
                        ) : (
                            delayRisks.map((risk, i) => (
                                <div key={i} className={`p-4 rounded-2xl border transition-all ${risk.riskLevel === 'HIGH' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-black text-[#1f2d2a] text-xs uppercase tracking-tight">#{risk.ID}</span>
                                        <span className="text-[10px] font-black text-white bg-[#1f2d2a] px-2 py-0.5 rounded-lg border border-black/10 uppercase tracking-widest">{risk.hours}h</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{risk.Department}</p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Handler</span>
                                            <span className="text-[10px] font-black text-[#1f2d2a] uppercase tracking-tight">{risk.ResolvedBy || 'Awaiting'}</span>
                                        </div>
                                        <div className="p-1.5 bg-white/50 rounded-lg"><Zap size={14} className={risk.riskLevel === 'HIGH' ? 'text-rose-500 fill-rose-500' : 'text-amber-500 fill-amber-500'} /></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DirectorDashboard;
