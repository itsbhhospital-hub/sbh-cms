import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { assetsService } from '../services/assetsService';

const PublicAssetView = () => {
    const { id } = useParams();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPublicDetails();
    }, [id]);

    const fetchPublicDetails = async () => {
        setLoading(true);
        try {
            const data = await assetsService.getPublicAssetDetails(id);
            if (data) {
                setAsset(data);
            } else {
                setError("Asset details not found.");
            }
        } catch (err) {
            setError("Unable to load asset details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-10 h-10 border-4 border-[#2e7d32] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error || !asset) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
            <div>
                <AlertTriangle size={48} className="text-slate-300 mx-auto mb-4" />
                <h1 className="text-xl font-black text-slate-700 uppercase tracking-widest">Asset Not Found</h1>
                <p className="text-slate-400 text-sm mt-2">The ID scanned is invalid or restricted.</p>
            </div>
        </div>
    );

    const isOverdue = asset.status === 'Overdue' || asset.status === 'Service Due';

    return (
        <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">

                {/* Header Banner */}
                <div className={`h-32 ${isOverdue ? 'bg-amber-500' : 'bg-[#2e7d32]'} relative flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="bg-white p-4 rounded-full shadow-lg relative z-10 -mb-16">
                        <img src="/sbh_wide.jpg" alt="Logo" className="h-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x40?text=SBH'; }} />
                    </div>
                </div>

                <div className="pt-20 px-8 pb-8 text-center">

                    <h1 className="text-2xl font-black text-[#1f2d2a] mb-1">{asset.machineName}</h1>
                    <span className="inline-block bg-slate-100 text-slate-500 font-bold px-3 py-1 text-xs rounded-lg uppercase tracking-widest mb-6">
                        ID: {asset.id}
                    </span>

                    <div className="space-y-4 text-left">
                        {/* Status Card */}
                        <div className={`p-4 rounded-2xl border flex items-center gap-4 ${isOverdue ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOverdue ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {isOverdue ? <Clock size={20} /> : <ShieldCheck size={20} />}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest opacity-60">System Status</p>
                                <p className={`text-lg font-black ${isOverdue ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {asset.status || 'Active'}
                                </p>
                            </div>
                        </div>

                        {/* Next Service */}
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calendar className="text-slate-400" size={20} />
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Next Service</p>
                                    <p className="font-bold text-[#1f2d2a]">{new Date(asset.nextServiceDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Last Remark */}
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Last Maintenance Note</p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                {asset.lastRemark || 'No remarks available.'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">SBH Assets System • Verified Identity</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PublicAssetView;
