import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Banknote, TrendingUp, AlertTriangle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AssetFinancialAnalytics = ({ assets }) => {

    // 1. Calculate Key Metrics
    const metrics = useMemo(() => {
        const totalAssetValue = assets.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
        const totalServiceSpend = assets.reduce((sum, a) => sum + (Number(a.totalServiceCost) || 0), 0);
        const replacementCount = assets.filter(a => a.status === 'Replaced').length;
        const maintenanceRatio = totalAssetValue > 0 ? ((totalServiceSpend / totalAssetValue) * 100).toFixed(1) : 0;

        return { totalAssetValue, totalServiceSpend, replacementCount, maintenanceRatio };
    }, [assets]);

    // 2. Prepare Chart Data
    const costDistributionData = useMemo(() => {
        // Group by Status (Active vs Replaced)
        const activeValue = assets.filter(a => a.status !== 'Replaced').reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
        const replacedValue = assets.filter(a => a.status === 'Replaced').reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
        return [
            { name: 'Active Assets', value: activeValue },
            { name: 'Retired/Replaced', value: replacedValue }
        ];
    }, [assets]);

    const topSpendersData = useMemo(() => {
        // Top 5 assets by Service Cost
        return [...assets]
            .sort((a, b) => (Number(b.totalServiceCost) || 0) - (Number(a.totalServiceCost) || 0))
            .slice(0, 5)
            .map(a => ({
                name: a.machineName,
                cost: Number(a.totalServiceCost) || 0
            }));
    }, [assets]);

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700">No Financial Data</h3>
                <p className="text-slate-400 text-sm mt-2">Add assets to view analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Banknote size={20} /></div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Asset Value</h4>
                    </div>
                    <p className="text-2xl font-black text-[#1f2d2a]">₹{metrics.totalAssetValue.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><TrendingUp size={20} /></div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Service Spend</h4>
                    </div>
                    <p className="text-2xl font-black text-[#1f2d2a]">₹{metrics.totalServiceSpend.toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{metrics.maintenanceRatio}% of Asset Value</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={20} /></div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">High Maintenance</h4>
                    </div>
                    <p className="text-2xl font-black text-[#1f2d2a]">
                        {assets.filter(a => (Number(a.totalServiceCost) || 0) > (Number(a.purchaseCost) || 0) * 0.5).length}
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Assets &gt; 50% Cost in Service</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={20} /></div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Replaced Assets</h4>
                    </div>
                    <p className="text-2xl font-black text-[#1f2d2a]">{metrics.replacementCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Distribution Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-[#1f2d2a] mb-6">Asset Value Distribution</h3>
                    <div className="h-64 w-full" style={{ minHeight: '250px', minWidth: '100px' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <PieChart>
                                <Pie
                                    data={costDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {costDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Spenders Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-[#1f2d2a] mb-6">Top 5 Highest Service Costs</h3>
                    <div className="h-64 w-full" style={{ minHeight: '250px', minWidth: '100px' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart
                                data={topSpendersData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cost" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetFinancialAnalytics;
