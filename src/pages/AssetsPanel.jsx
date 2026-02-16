import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2, Search, Plus, Filter,
    AlertTriangle, CheckCircle, Clock,
    FileText, QrCode, LayoutDashboard, List, Download, ArrowRight, XCircle, ShieldAlert
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
    const [activeTab, setActiveTab] = useState('list');

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

    // --- LOGIC ENGINE FOR COUNTS & FILTERING ---
    const getAssetCategory = (asset) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Date Parsing Helper
        const parseDate = (d) => d ? new Date(d) : null;

        const nextService = parseDate(asset.nextServiceDate);
        const amcExpiry = parseDate(asset.amcExpiry);

        let categories = ['All'];
        if (asset.status === 'Active') categories.push('Active');
        if (asset.status === 'Replaced') categories.push('Replaced');

        // Service Logic
        if (nextService) {
            const diffTime = nextService - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) categories.push('Service Expired');
            else if (diffDays <= 20) categories.push('Service Due');
        }

        // AMC Logic
        if (amcExpiry) {
            const diffTime = amcExpiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) categories.push('AMC Expired');
            else if (diffDays <= 30) categories.push('AMC Expiring');
        }

        return categories;
    };

    // Derived Metrics
    const metrics = {
        total: assets.length,
        serviceDue: assets.filter(a => getAssetCategory(a).includes('Service Due')).length,
        serviceExpired: assets.filter(a => getAssetCategory(a).includes('Service Expired')).length,
        amcExpiring: assets.filter(a => getAssetCategory(a).includes('AMC Expiring')).length,
        amcExpired: assets.filter(a => getAssetCategory(a).includes('AMC Expired')).length,
    };

    const filteredAssets = assets.filter(asset => {
        const categories = getAssetCategory(asset);
        const matchesFilter = filterStatus === 'All' || categories.includes(filterStatus);
        const safeSearch = (val) => String(val || '').toLowerCase();

        const matchesSearch =
            safeSearch(asset.machineName).includes(searchTerm.toLowerCase()) ||
            safeSearch(asset.id).includes(searchTerm.toLowerCase()) ||
            safeSearch(asset.location).includes(searchTerm.toLowerCase()) ||
            safeSearch(asset.department).includes(searchTerm.toLowerCase()) ||
            safeSearch(asset.keywords).includes(searchTerm.toLowerCase()) ||
            safeSearch(asset.description).includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Service Due': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Service Expired': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'AMC Expiring': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'AMC Expired': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Replaced': return 'bg-slate-200 text-slate-600 border-slate-300';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const StatusCard = ({ title, count, icon: Icon, colorClass, filterKey }) => (
        <button
            onClick={() => setFilterStatus(filterKey)}
            className={`p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 text-left group
                ${filterStatus === filterKey
                    ? `bg-white border-${colorClass.split('-')[1]}-500 ring-2 ring-${colorClass.split('-')[1]}-500/20 shadow-lg`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-1">{title}</p>
                <p className="text-2xl font-black text-[#1f2d2a]">{count}</p>
            </div>
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1f2d2a] tracking-tight">Master Asset Command</h1>
                    <p className="text-slate-500 font-medium mt-1">Live Tracking • Service Protocols • AMC Intelligence</p>
                </div>
                <button
                    onClick={() => navigate('/assets/add')}
                    className="flex items-center gap-2 bg-[#2e7d32] text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-[#2e7d32]/20 hover:bg-[#1b5e20] transition-all transform hover:scale-[1.02]"
                >
                    <Plus size={20} />
                    Add New Asset
                </button>
            </div>

            {/* Tabs */}
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
                <div className="min-h-[400px] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[#2e7d32] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : activeTab === 'analytics' ? (
                <AssetFinancialAnalytics assets={assets} />
            ) : (
                <>
                    {/* MASTER KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatusCard
                            title="Total Assets"
                            count={metrics.total}
                            icon={Building2}
                            colorClass="bg-slate-100 text-slate-600"
                            filterKey="All"
                        />
                        <StatusCard
                            title="Service Due"
                            count={metrics.serviceDue}
                            icon={Clock}
                            colorClass="bg-amber-50 text-amber-600"
                            filterKey="Service Due"
                        />
                        <StatusCard
                            title="Service Expired"
                            count={metrics.serviceExpired}
                            icon={AlertTriangle}
                            colorClass="bg-rose-50 text-rose-600"
                            filterKey="Service Expired"
                        />
                        <StatusCard
                            title="AMC Expiring"
                            count={metrics.amcExpiring}
                            icon={ShieldAlert}
                            colorClass="bg-orange-50 text-orange-600"
                            filterKey="AMC Expiring"
                        />
                        <StatusCard
                            title="AMC Expired"
                            count={metrics.amcExpired}
                            icon={XCircle}
                            colorClass="bg-purple-50 text-purple-600"
                            filterKey="AMC Expired"
                        />
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Asset ID, Name, Dept... (e.g. 'Ventilator' or 'ICU')"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            {filterStatus !== 'All' && (
                                <button
                                    onClick={() => setFilterStatus('All')}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Clear Filter
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (filteredAssets.length === 0) return alert("No assets to export.");
                                    const headers = ["Asset ID", "Machine Name", "Department", "Location", "Next Service", "AMC Expiry", "Cost"];
                                    const csvContent = [
                                        headers.join(","),
                                        ...filteredAssets.map(asset => [
                                            asset.id,
                                            `"${asset.machineName}"`,
                                            `"${asset.department}"`,
                                            `"${asset.location}"`,
                                            asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : 'N/A',
                                            asset.amcExpiry ? new Date(asset.amcExpiry).toLocaleDateString() : 'N/A',
                                            asset.purchaseCost
                                        ].join(","))
                                    ].join("\n");
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement("a");
                                    link.href = URL.createObjectURL(blob);
                                    link.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`;
                                    link.click();
                                }}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 whitespace-nowrap"
                            >
                                <Download size={18} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8faf9] border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Asset Details</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Service Status</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">AMC Status</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Next Service</th>
                                        <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAssets.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No assets found matching your criteria.</td>
                                        </tr>
                                    ) : (
                                        filteredAssets.map((asset, index) => {
                                            const categories = getAssetCategory(asset);
                                            const isServiceExpired = categories.includes('Service Expired');
                                            const isServiceDue = categories.includes('Service Due');

                                            // Determine Row Status Color
                                            let statusBadge = { text: 'Active', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
                                            if (asset.status === 'Replaced') statusBadge = { text: 'Replaced', class: 'bg-slate-100 text-slate-500 border-slate-200' };
                                            else if (isServiceExpired) statusBadge = { text: 'Service Expired', class: 'bg-rose-50 text-rose-700 border-rose-100' };
                                            else if (isServiceDue) statusBadge = { text: 'Service Due', class: 'bg-amber-50 text-amber-700 border-amber-100' };

                                            return (
                                                <tr key={asset.id || index} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[#1f2d2a] text-sm">{asset.machineName}</span>
                                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">#{asset.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 text-sm">{asset.department}</span>
                                                            <span className="text-xs text-slate-400">{asset.location}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusBadge.class}`}>
                                                            {statusBadge.text}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {asset.amcTaken === 'Yes' ? (
                                                            <div className="text-xs font-bold text-emerald-600">Active</div>
                                                        ) : (
                                                            <div className="text-xs font-bold text-slate-400">None</div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-slate-600">
                                                        {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => navigate(`/assets/${asset.id}`)}
                                                            className="text-[#2e7d32] font-black text-xs bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all uppercase tracking-wide"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {filteredAssets.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No assets found.</div>
                            ) : (
                                filteredAssets.map((asset, index) => (
                                    <div key={asset.id || index} className="p-4 space-y-3" onClick={() => navigate(`/assets/${asset.id}`)}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-[#1f2d2a]">{asset.machineName}</h3>
                                                <p className="text-xs text-slate-400 font-bold">#{asset.id}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getStatusColor(asset.status)}`}>
                                                {asset.status || 'Active'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <p className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Next Service</p>
                                                <p className="font-bold text-slate-700">{asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '-'}</p>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-lg">
                                                <p className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Department</p>
                                                <p className="font-bold text-slate-700 truncate">{asset.department}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AssetsPanel;
