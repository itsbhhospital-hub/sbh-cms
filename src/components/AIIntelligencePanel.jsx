import React from 'react';
import {
    Activity, AlertTriangle, AlertOctagon,
    CheckCircle, Thermometer, TrendingUp,
    Cpu, Wrench, Shield, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const AIIntelligencePanel = ({ asset }) => {
    // Default values if AI data is missing (e.g. before first run)
    const health = asset.aiHealthScore ?? 100;
    const urgency = asset.aiUrgencyScore ?? 0;
    const predictions = asset.aiPredictions || [];
    const recommendations = asset.aiRecommendations || [];
    const lastAnalysis = asset.aiLastAnalysis ? new Date(asset.aiLastAnalysis).toLocaleString() : 'Pending...';

    // Health Color Logic
    const getHealthColor = (score) => {
        if (score > 80) return '#10b981'; // Emerald
        if (score > 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Rose
    };

    // Urgency Color Logic
    const getUrgencyColor = (score) => {
        if (score < 30) return '#10b981'; // Green (Low Urgency)
        if (score < 70) return '#f59e0b'; // Amber
        return '#ef4444'; // Red (High Urgency)
    };

    const healthData = [
        { name: 'Health', value: health },
        { name: 'Loss', value: 100 - health }
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 text-white">
                            <Cpu className="text-indigo-300" />
                            Asset Intelligence Engine
                        </h2>
                        <p className="text-indigo-100 text-sm font-medium mt-1">
                            Real-time predictive analysis & decision support.
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-indigo-200 mt-4 opacity-90 font-bold">
                            Last Analysis: {lastAnalysis}
                        </p>
                    </div>
                </div>
                {/* Background Pattern */}
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <Activity size={200} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Health Score Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest self-start mb-4">Machine Health Score</h3>
                    <div className="w-48 h-48 relative" style={{ minWidth: "192px", minHeight: "192px" }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
                            <PieChart>
                                <Pie
                                    data={healthData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    startAngle={180}
                                    endAngle={0}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell key="health" fill={getHealthColor(health)} />
                                    <Cell key="loss" fill="#f1f5f9" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                            <span className="text-4xl font-black text-slate-800">{health}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase">/ 100</span>
                        </div>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-sm font-medium text-slate-600">
                            {health > 80 ? "Optimal Performance" : health > 50 ? "Requires Attention" : "Critical Condition"}
                        </p>
                    </div>
                </div>

                {/* Urgency Score Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Repair Urgency Index</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700">Urgency Level</span>
                                <span style={{ color: getUrgencyColor(urgency) }}>{urgency}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${urgency}%`, backgroundColor: getUrgencyColor(urgency) }}
                                ></div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                <Activity size={14} /> Risk Factors
                            </h4>
                            <ul className="space-y-2">
                                {asset.status === 'Overdue' && (
                                    <li className="text-sm font-medium text-rose-600 flex items-center gap-2">
                                        <AlertOctagon size={14} /> Service Overdue
                                    </li>
                                )}
                                {predictions.length > 0 && (
                                    <li className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                        <AlertTriangle size={14} /> Predicted Part Failures
                                    </li>
                                )}
                                {urgency < 30 && predictions.length === 0 && (
                                    <li className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                        <CheckCircle size={14} /> No immediate risks detected
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Predictions */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-1">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Thermometer size={16} /> Failure Predictions
                    </h3>
                    {predictions.length > 0 ? (
                        <div className="space-y-3">
                            {predictions.map((pred, idx) => (
                                <div key={idx} className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle size={16} /> {pred}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100">
                            <CheckCircle className="mx-auto text-emerald-400 mb-2" size={32} />
                            <p className="text-sm font-bold text-slate-400">System Stable</p>
                        </div>
                    )}
                </div>

                {/* Recommendations */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp size={16} /> AI Recommendations
                    </h3>
                    {recommendations.length > 0 ? (
                        <div className="space-y-3">
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-4 ${rec.type === 'CRITICAL' ? 'bg-rose-50 border-rose-100' :
                                    rec.type === 'ACTION' ? 'bg-amber-50 border-amber-100' :
                                        'bg-indigo-50 border-indigo-100'
                                    }`}>
                                    <div className={`p-2 rounded-lg shrink-0 ${rec.type === 'CRITICAL' ? 'bg-rose-100 text-rose-600' :
                                        rec.type === 'ACTION' ? 'bg-amber-100 text-amber-600' :
                                            'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {rec.type === 'CRITICAL' ? <AlertOctagon size={20} /> : rec.type === 'ACTION' ? <Wrench size={20} /> : <Shield size={20} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-black text-sm uppercase tracking-wider mb-1 ${rec.type === 'CRITICAL' ? 'text-rose-800' :
                                            rec.type === 'ACTION' ? 'text-amber-800' :
                                                'text-indigo-800'
                                            }`}>
                                            {rec.type}
                                        </h4>
                                        <p className="text-slate-700 font-medium text-sm">{rec.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400 italic">No specific recommendations at this time.</div>
                    )}
                </div>
            </div>

            {/* Life Expectancy Estimate */}
            <div className="bg-emerald-900 rounded-3xl p-6 text-emerald-100 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-800 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Est. Remaining Life</p>
                        <p className="text-xl font-bold text-white">
                            {Math.max(0, 10 - ((new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365))).toFixed(1)} Years
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-emerald-400 font-medium">Based on current health degradation rate.</p>
                </div>
            </div>
        </div>
    );
};

export default AIIntelligencePanel;
