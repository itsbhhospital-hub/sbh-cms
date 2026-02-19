import React, { useMemo, useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Building2, ClipboardList, Activity,
    ArrowRight, Zap, Target, ShieldCheck, Clock, AlertTriangle,
    TrendingUp, Users, Cpu, FileText, Globe, Sparkles, ZapOff,
    CheckCircle2, AlertCircle, BarChart3, Fingerprint, Layers
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useIntelligence } from '../context/IntelligenceContext';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

// --- V4 ADVANCED BENTO COMPONENTS ---

const BentoCard = memo(({ children, className = '', title, icon: Icon, delay = 0 }) => (
    <div
        className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col ${className}`}
    >
        {title && (
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {Icon && <Icon size={14} className="text-[#2e7d32]" />}
                    {title}
                </h3>
            </div>
        )}
        <div className="flex-1 p-5">
            {children}
        </div>
    </div>
));

const CompactStat = memo(({ label, value, colorClass, icon: Icon }) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
            <div className={`w-1 h-3 rounded-full ${colorClass.replace('text', 'bg')}`}></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight text-slate-800`}>{value}</span>
            {Icon && <Icon size={14} className={`${colorClass} opacity-50`} />}
        </div>
    </div>
));

const MainDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showLoader } = useLoading();
    const {
        stats, assetStats, trendStats, deptStats, hospitalHealth,
        stressIndex, crisisRisk, loading: intelLoading, flowStats, allTickets
    } = useIntelligence();

    // Responsive Grid Helper
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const healthData = useMemo(() => [
        { name: 'Optimal', value: assetStats.healthy, color: '#10b981' },
        { name: 'At Risk', value: assetStats.risk, color: '#f59e0b' },
        { name: 'Due/Expired', value: assetStats.void + assetStats.serviceDue, color: '#ef4444' },
    ], [assetStats.healthy, assetStats.risk, assetStats.void, assetStats.serviceDue]);

    const tickerTickets = useMemo(() => allTickets.slice(0, isMobile ? 5 : 15), [allTickets, isMobile]);

    return (
        <div className="w-full max-w-full overflow-hidden animate-in fade-in zoom-in-95 duration-500 pb-10">

            {/* 💎 V4 HEADER: ADVANCED MINIMALISM */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Fingerprint size={16} className="text-[#2e7d32]" />
                        <span className="text-[9px] font-bold text-[#2e7d32] uppercase tracking-[0.3em]">System v4.0.2</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tighter leading-none">
                        SBH <span className="font-light text-slate-400">COMMAND</span> CENTER
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol Status</p>
                        <p className="text-sm font-bold text-slate-800">{crisisRisk} PERFORMANCE</p>
                    </div>
                    <div className="h-10 w-[2px] bg-slate-200 hidden lg:block"></div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border ${crisisRisk === 'STABLE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                        <Activity size={18} className="animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider">{stressIndex}% LOAD</span>
                    </div>
                </div>
            </div>

            {/* 🍱 THE BENTO GRID (12-Column Base) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-max">

                {/* 🚀 TILE 1: MAIN COMMAND HERO (Large) */}
                <BentoCard className="md:col-span-8 lg:col-span-12 xl:col-span-7 h-full min-h-[300px]" title="Quick Launch" icon={Layers}>
                    <div className="h-full flex flex-col justify-center py-2">
                        <div className="space-y-3">
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter uppercase leading-none">
                                Operational<br />
                                <span className="text-[#2e7d32]">Intelligence</span>
                            </h2>
                            <p className="text-slate-500 text-sm font-medium max-w-md leading-relaxed">
                                Real-time monitoring of clinical flow and biomedical performance across the network.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-8">
                            <button onClick={() => { showLoader(true); navigate('/cms-panel'); }} className="px-8 py-3.5 bg-[#2e7d32] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#256628] transition-all flex items-center gap-3 shadow-md shadow-emerald-700/10 active:scale-95">
                                <ClipboardList size={16} /> TICKET PANEL
                            </button>
                            <button onClick={() => { showLoader(true); navigate('/assets'); }} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95">
                                <Building2 size={16} /> ASSET INVENTORY
                            </button>
                        </div>
                    </div>
                </BentoCard>

                {/* 📊 TILE 2: SERVICE PULSE CHART (Medium) */}
                <BentoCard className="md:col-span-12 lg:col-span-12 xl:col-span-5" title="Operational Pulse" icon={TrendingUp}>
                    <div className="w-full pt-4 relative mt-auto" style={{ height: '260px', minHeight: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                            <AreaChart data={trendStats}>
                                <defs>
                                    <linearGradient id="v4Glow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                                <Tooltip content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white border border-slate-200 p-2 rounded shadow-sm">
                                                <p className="text-[10px] font-bold text-slate-800">{payload[0].value} Activities</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Area type="monotone" dataKey="tickets" stroke="#2e7d32" strokeWidth={2} fill="url(#v4Glow)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* 🏗️ TILE 3: METRICS CLUSTER (High Density) */}
                <BentoCard className="md:col-span-6 lg:col-span-4" title="Live KPI Summary" icon={BarChart3}>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <CompactStat label="Open" value={stats.open} colorClass="text-blue-600" icon={Activity} />
                        <CompactStat label="Solved" value={stats.solved} colorClass="text-emerald-600" icon={CheckCircle2} />
                        <CompactStat label="Delayed" value={stats.delayed} colorClass="text-rose-600" icon={Clock} />
                        <CompactStat label="AMC Cover" value={`${assetStats.total > 0 ? (((assetStats.total - assetStats.risk) / assetStats.total) * 100).toFixed(0) : 100}%`} colorClass="text-indigo-600" icon={ShieldCheck} />
                        <CompactStat label="Risks" value={assetStats.risk} colorClass="text-amber-600" icon={AlertTriangle} />
                        <CompactStat label="Service" value={assetStats.serviceDue + assetStats.void} colorClass="text-purple-600" icon={Target} />
                    </div>
                </BentoCard>

                {/* 🧠 TILE 4: OPERATIONAL HEALTH (Compact) */}
                <BentoCard className="md:col-span-6 lg:col-span-4" title="Infrastructure Matrix" icon={Cpu}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Hospital Health</span>
                            <span className="text-lg font-bold text-[#2e7d32]">{hospitalHealth}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${hospitalHealth}%` }}
                                className="h-full bg-[#2e7d32]"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Active Staff</p>
                                <p className="text-sm font-bold text-slate-700">{flowStats.activeStaff || 0}</p>
                            </div>
                            <div className="text-center border-x border-slate-100">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">BioMed HLTH</p>
                                <p className="text-sm font-bold text-slate-700">{assetStats.total > 0 ? ((assetStats.healthy / assetStats.total) * 100).toFixed(0) : 100}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Escalations</p>
                                <p className="text-sm font-bold text-slate-700">{stats.delayed}</p>
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* 🛡️ TILE 5: ASSET DISTRIBUTION (Visual) */}
                <BentoCard className="md:col-span-12 lg:col-span-4" title="Asset Condition" icon={Globe}>
                    <div className="flex items-center mt-auto" style={{ height: '180px', minHeight: '180px' }}>
                        <div className="w-1/2 h-full relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                                <PieChart>
                                    <Pie data={healthData} innerRadius="65%" outerRadius="90%" paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}>
                                        {healthData.map((e, i) => <Cell key={`c-${i}`} fill={e.color} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-3 pl-4">
                            {healthData.map((d, i) => (
                                <div key={i} className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{d.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 ml-3.5">{d.value} Units</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </BentoCard>

                {/* 🔗 TILE 6: LIVE LOG TICKET TAPE (Footer Component) */}
                <div className="md:col-span-12 mt-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-8 overflow-hidden relative shadow-lg">
                        <div className="shrink-0 flex items-center gap-2 px-3 py-1 bg-[#2e7d32]/20 border border-[#2e7d32]/10 rounded-lg">
                            <Zap size={12} className="text-[#2e7d32]" />
                            <span className="text-[9px] font-bold text-[#2e7d32] uppercase tracking-[0.2em]">LIVE LOG</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex gap-12 animate-[scroll_50s_linear_infinite] whitespace-nowrap">
                                {tickerTickets.map((t, i) => (
                                    <div key={`${t.ID}-${i}`} className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className={`w-1.5 h-1.5 rounded-full ${String(t.Status).toLowerCase().includes('solved') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        <span className="text-white">#{t.ID}</span>
                                        <span className="text-slate-600">|</span>
                                        <span className="text-slate-200">{t.Department}</span>
                                        <span className="text-slate-600">|</span>
                                        <span className={String(t.Status).toLowerCase().includes('solved') ? 'text-emerald-400' : 'text-amber-400'}>{t.Status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            ` }} />
        </div>
    );
};

export default MainDashboard;
