import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetsService } from '../services/assetsService';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertOctagon, TrendingUp, DollarSign, Activity, ArrowRight } from 'lucide-react';

const DirectorDashboard = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await assetsService.getAssets();
            setAssets(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">Loading Strategic Data...</div>;

    // --- ANALYTICS LOGIC ---

    // 1. Health Distribution
    const healthyCount = assets.filter(a => (a.aiHealthScore ?? 100) > 80).length;
    const warningCount = assets.filter(a => (a.aiHealthScore ?? 100) <= 80 && (a.aiHealthScore ?? 100) > 50).length;
    const criticalCount = assets.filter(a => (a.aiHealthScore ?? 100) <= 50).length;

    const healthData = [
        { name: 'Healthy', value: healthyCount, color: '#10b981' },
        { name: 'Warning', value: warningCount, color: '#f59e0b' },
        { name: 'Critical', value: criticalCount, color: '#ef4444' },
    ];

    // 2. Replacement Candidates (Repair Cost > 50% Purchase Cost OR Critical Health)
    const replacementCandidates = assets.filter(a => {
        const cost = Number(a.purchaseCost) || 0;
        const spend = Number(a.totalServiceCost) || 0;
        const health = a.aiHealthScore ?? 100;
        return (cost > 0 && spend > 0.5 * cost) || health < 40;
    });

    const totalReplacementCost = replacementCandidates.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                <h1 className="text-3xl font-black tracking-tight mb-2">Director's Strategic Overview</h1>
                <p className="text-slate-400">High-level asset health, risk assessment, and capital planning insights.</p>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Asset Value</p>
                        <p className="text-2xl font-black text-[#1f2d2a]">
                            ₹{assets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Critical Assets</p>
                        <p className="text-2xl font-black text-rose-600">{criticalCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertOctagon size={24} /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Proj. Replacement CapEx</p>
                        <p className="text-2xl font-black text-indigo-600">₹{totalReplacementCost.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24} /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Health Distribution Chart */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-[#1f2d2a] mb-6 flex items-center gap-2">
                        <Activity className="text-slate-400" /> Asset Health Distribution
                    </h3>
                    <div className="h-64" style={{ minHeight: '250px' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <PieChart>
                                <Pie
                                    data={healthData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {healthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Replacement Candidates List */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-black text-[#1f2d2a] mb-6 text-rose-600 flex items-center gap-2">
                        <AlertOctagon /> Priority Replacement Candidates
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {replacementCandidates.length === 0 ? (
                            <p className="text-slate-400 italic">No critical replacement candidates identified.</p>
                        ) : (
                            replacementCandidates.map(asset => (
                                <div key={asset.id} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-rose-100 transition-colors"
                                    onClick={() => navigate(`/assets/${asset.id}`)}>
                                    <div>
                                        <p className="font-bold text-[#1f2d2a]">{asset.machineName}</p>
                                        <p className="text-xs text-rose-700 font-bold mt-1">
                                            Health: {asset.aiHealthScore ?? 100}% | Spend: ₹{Number(asset.totalServiceCost).toLocaleString()}
                                        </p>
                                    </div>
                                    <ArrowRight size={18} className="text-rose-400 group-hover:text-rose-600" />
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
