import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { assetsService } from '../services/assetsService';

const PublicAssetView = () => {
    const { id } = useParams();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [age, setAge] = useState('');

    useEffect(() => {
        fetchPublicDetails();
    }, [id]);

    const fetchPublicDetails = async () => {
        setLoading(true);
        try {
            const data = await assetsService.getPublicAssetDetails(id);
            if (data) {
                setAsset(data);
                if (data.purchaseDate) {
                    setAge(calculateAge(data.purchaseDate));
                }
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

    const calculateAge = (dateString) => {
        const today = new Date();
        const birthDate = new Date(dateString);
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        return `${years} Years ${months} Months ${days} Days Old`;
    };

    // --- LOGIC ENGINES ---
    const getServiceStatus = (nextDate) => {
        if (!nextDate) return { text: 'N/A', color: 'text-slate-400', bg: 'bg-slate-100', icon: Clock };
        const today = new Date();
        const next = new Date(nextDate);
        next.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = next - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'OVERDUE', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle };
        if (diffDays <= 20) return { text: 'DUE SOON', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle };
        return { text: 'OK', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle };
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { text: 'Not Active', color: 'text-slate-400', bg: 'bg-slate-50' };
        const today = new Date();
        const exp = new Date(expiryDate);
        exp.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { text: 'EXPIRED', color: 'text-rose-600', bg: 'bg-rose-50', title: 'Expired' };
        if (diffDays <= 30) return { text: 'EXPIRING SOON', color: 'text-amber-600', bg: 'bg-amber-50', title: 'Expiring' };
        return { text: 'ACTIVE', color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Active' };
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

    const isReplaced = asset.checkStatus === 'Replaced' || asset.status === 'Replaced' || asset.status === 'Retired';
    const serviceStat = getServiceStatus(asset.nextServiceDate);
    const amcStat = getExpiryStatus(asset.amcExpiry);
    const warrantyStat = getExpiryStatus(asset.warrantyExpiry);

    return (
        <div className="min-h-screen bg-[#f8faf9] py-8 px-4 flex justify-center">
            <div className={`w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative ${isReplaced ? 'grayscale' : ''}`}>

                {/* HEADLINE */}
                <div className="bg-[#1f2d2a] p-6 text-center pt-8 pb-10 relative overflow-hidden">
                    <div className="relative z-10">
                        <img src="/sbh_wide.jpg" alt="SBH" className="h-8 mx-auto mb-4 object-contain brightness-0 invert" />
                        <h1 className="text-xl font-black text-white tracking-wide">{asset.machineName}</h1>
                        <p className="text-emerald-400 font-bold text-sm mt-1 tracking-widest uppercase">ID: {asset.id}</p>
                    </div>
                </div>

                <div className="px-6 pb-8 -mt-6 relative z-10 space-y-6">

                    {/* MACHINE AGE CARD */}
                    <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Machine Age</p>
                        <p className="text-[#1f2d2a] font-black text-lg">{age || 'N/A'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Since {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'Unknown'}</p>
                    </div>

                    {/* BASIC INFO GRID */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Model</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{asset.machineName}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Serial No</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{asset.serialNumber || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Department</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{asset.department || 'N/A'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase">Location</p>
                            <p className="text-xs font-bold text-slate-700 truncate">{asset.location || 'N/A'}</p>
                        </div>
                    </div>

                    {/* SERVICE STATUS */}
                    <div className={`p-4 rounded-xl border-2 ${serviceStat.bg} ${serviceStat.border} flex items-center justify-between`}>
                        <div>
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Service Status</p>
                            <div className={`flex items-center gap-2 font-black text-lg ${serviceStat.color}`}>
                                <serviceStat.icon size={20} />
                                {serviceStat.text}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Next Due</p>
                            <p className="font-bold text-slate-700 text-sm">{asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    {/* WARRANTY & AMC */}
                    <div className="space-y-3">
                        {/* Warranty */}
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Warranty</p>
                                <p className={`text-xs font-black mt-0.5 ${warrantyStat.color}`}>{warrantyStat.text}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400">Valid Till</p>
                                <p className="text-xs font-bold text-slate-700">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        {/* AMC */}
                        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">AMC Subscription</p>
                                <p className={`text-xs font-black mt-0.5 ${amcStat.color}`}>
                                    {asset.amcTaken === 'Yes' ? amcStat.text : 'NOT SUBSCRIBED'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400">Valid Till</p>
                                <p className="text-xs font-bold text-slate-700">{asset.amcExpiry ? new Date(asset.amcExpiry).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-8 text-center opacity-40">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1f2d2a]">SBH Group Of Hospitals</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#1f2d2a] mt-1">Automated Generated System</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PublicAssetView;
