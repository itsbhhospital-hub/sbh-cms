import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Building2, Search, Plus, Filter,
    AlertTriangle, CheckCircle, Clock,
    FileText, QrCode
} from 'lucide-react';
import { assetsService } from '../services/assetsService';
import { useAuth } from '../context/AuthContext';

const AssetsPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

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
            asset.id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatus === 'All' || asset.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Service Due': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Overdue': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Retired': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
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

            {/* Analytics Cards */}
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
                        placeholder="Search by Asset ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2e7d32]/20 focus:border-[#2e7d32] outline-none transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'Active', 'Service Due', 'Retired'].map(status => (
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
                </div>
            </div>

            {/* Assets List */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Asset ID</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Machine Name</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Next Service</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">QR Access</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">Loading assets data...</td>
                                </tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No assets found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-black text-[#1f2d2a]">{asset.id}</td>
                                        <td className="p-4 font-bold text-slate-700">{asset.machineName}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getStatusColor(asset.status)}`}>
                                                {asset.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-600">
                                            {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4">
                                            <button className="flex items-center gap-1 text-slate-500 hover:text-[#2e7d32] text-xs font-bold transition-colors">
                                                <QrCode size={16} />
                                                View ID
                                            </button>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssetsPanel;
