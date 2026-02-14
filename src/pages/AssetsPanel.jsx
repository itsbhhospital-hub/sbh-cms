import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2, Search, Plus, Filter,
    AlertTriangle, CheckCircle, Clock,
    FileText, QrCode, LayoutDashboard, List, Download, ArrowRight
} from 'lucide-react';
import { assetsService } from '../services/assetsService';
import { useAuth } from '../context/AuthContext';
import AssetFinancialAnalytics from '../components/AssetFinancialAnalytics';

const AssetsPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'analytics'

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const data = await assetsService.getAssets();
            setAssets(data || []);
        } catch (error) {
            console.error("Failed to load assets", error);
        } finally {
            setLoading(false);
        }
    };

    // Derived State for Analytics
    const totalAssets = assets.length;
    const serviceDue = assets.filter(a => a.status === 'Service Due' || a.status === 'Overdue').length;
    const activeAssets = assets.filter(a => a.status === 'Active').length;

    const filteredAssets = assets.filter(asset => {
        const matchesSearch =
            asset.machineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.department?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'All' || asset.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Service Due': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Replaced': return 'bg-slate-200 text-slate-600 border-slate-300';
            case 'Retired': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1f2d2a] tracking-tight">Enterprise Assets</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage infrastructure, track service history & QR identities</p>
                </div>
                <button
                    onClick={() => navigate('/assets/add')}
                    className="flex items-center gap-2 bg-[#2e7d32] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-[#2e7d32]/20 hover:bg-[#1b5e20] transition-all transform hover:scale-[1.02]"
                >
                    <Plus size={20} />
                    Add New Asset
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'list' ? 'border-[#2e7d32] text-[#2e7d32]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={18} /> Asset List
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-[#2e7d32] text-[#2e7d32]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <LayoutDashboard size={18} /> Financial Analytics
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">Loading assets data...</div>
            ) : activeTab === 'analytics' ? (
                <AssetFinancialAnalytics assets={assets} />
            ) : (
                <>
                    {/* Analytics Cards (Mini) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Assets</p>
                                <p className="text-2xl font-black text-[#1f2d2a]">{totalAssets}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Service Due</p>
                                <p className="text-2xl font-black text-[#1f2d2a]">{serviceDue}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active & Healthy</p>
                                <p className="text-2xl font-black text-[#1f2d2a]">{activeAssets}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Asset ID, Name, Dept, or Location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 items-center">
                            {['All', 'Active', 'Service Due', 'Replaced'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${filterStatus === status
                                        ? 'bg-[#2e7d32] text-white border-[#2e7d32]'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    if (filteredAssets.length === 0) return alert("No assets to export.");
                                    const headers = ["Asset ID", "Machine Name", "Department", "Location", "Status", "Next Service", "Purchase Cost", "Total Service Cost", "Vendor", "Serial Number"];
                                    const csvContent = [
                                        headers.join(","),
                                        ...filteredAssets.map(asset => [
                                            asset.id,
                                            `"${asset.machineName}"`,
                                            `"${asset.department || ''}"`,
                                            `"${asset.location || ''}"`,
                                            asset.status,
                                            asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : 'N/A',
                                            asset.purchaseCost || 0,
                                            asset.totalServiceCost || 0,
                                            `"${asset.vendorName || ''}"`,
                                            `"${asset.serialNumber || ''}"`
                                        ].join(","))
                                    ].join("\n");

                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement("a");
                                    if (link.download !== undefined) {
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute("href", url);
                                        link.setAttribute("download", `sbh_assets_export_${new Date().toISOString().split('T')[0]}.csv`);
                                        link.style.visibility = 'hidden';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 whitespace-nowrap"
                                title="Export filtered list to CSV"
                            >
                                <Download size={18} /> Export
                            </button>
                        </div>
                    </div>

                    {/* Assets List */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">ID</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Machine Name</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Dept / Location</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Health</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Next Service</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Cost (₹)</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAssets.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="p-12 text-center text-slate-400 font-medium">No assets found matching your criteria.</td>
                                        </tr>
                                    ) : (
                                        filteredAssets.map((asset, index) => {
                                            const health = asset.aiHealthScore ?? 100;
                                            return (
                                                <tr key={asset.id || index} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-black text-[#1f2d2a]">{asset.id}</td>
                                                    <td className="p-4 font-bold text-slate-700">
                                                        {asset.machineName}
                                                        {asset.parentId && <span className="block text-xs text-slate-400 font-normal">Rep. of {asset.parentId}</span>}
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-slate-600">
                                                        <div className="font-bold text-[#1f2d2a]">{asset.department || '-'}</div>
                                                        <div className="text-xs text-slate-400">{asset.location}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getStatusColor(asset.status)}`}>
                                                            {asset.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${health > 80 ? 'bg-emerald-500' : health > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                                            <span className="font-bold text-slate-700">{health}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-slate-600">
                                                        {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-slate-800">
                                                        {asset.purchaseCost ? `₹${Number(asset.purchaseCost).toLocaleString()}` : '-'}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => navigate(`/assets/${asset.id}`)}
                                                            className="text-[#2e7d32] font-bold text-sm bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all"
                                                        >
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filteredAssets.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 font-medium">No assets found.</div>
                            ) : (
                                filteredAssets.map((asset, index) => {
                                    const health = asset.aiHealthScore ?? 100;
                                    const urgency = asset.aiUrgencyScore ?? 0;
                                    return (
                                        <div key={asset.id || index} className="p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{asset.id}</span>
                                                        {urgency > 50 && <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 rounded">High Urgency</span>}
                                                    </div>
                                                    <h3 className="font-bold text-[#1f2d2a] text-lg">{asset.machineName}</h3>
                                                    {asset.parentId && <p className="text-xs text-slate-400">Rep. of {asset.parentId}</p>}
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(asset.status)}`}>
                                                    {asset.status || 'Active'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${health > 80 ? 'bg-emerald-500' : health > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                                                    <span className="text-xs font-bold text-slate-600">Health: {health}%</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Next Service</p>
                                                    <p className="font-medium text-slate-700">{asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '-'}</p>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Cost</p>
                                                    <p className="font-medium text-slate-700">{asset.purchaseCost ? `₹${Number(asset.purchaseCost).toLocaleString()}` : '-'}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate(`/assets/${asset.id}`)}
                                                className="w-full text-[#2e7d32] font-bold text-sm bg-emerald-50 py-2.5 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                View Details <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AssetsPanel;
