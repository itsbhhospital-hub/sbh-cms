import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Download, ExternalLink, MapPin, Building, Activity, FileText } from 'lucide-react';
import { assetsService } from '../services/assetsService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PublicAssetView = () => {
    const { id } = useParams();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [age, setAge] = useState('');
    const qrRef = useRef(null);

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
        return `${years} Years, ${months} Months`;
    };

    const downloadPDF = () => {
        const input = qrRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Asset_${asset.id}.pdf`);
        });
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

    const isReplaced = asset.status === 'Replaced' || asset.status === 'Retired';

    // Status Logic (Use Backend Data if available, fallback to frontend)
    // Backend returns: warrantyStatus, warrantyColor, amcStatus, amcColor
    const serviceStat = getServiceStatus(asset.nextServiceDate);

    return (
        <div className="min-h-screen bg-[#f8faf9] py-8 px-4 flex flex-col items-center">

            <div ref={qrRef} className={`w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative ${isReplaced ? 'grayscale' : ''}`}>

                {/* HEADLINE */}
                <div className="bg-[#1f2d2a] p-8 text-center pt-10 pb-12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4 border-b border-white/10 pb-2">Property of SBH Group of Hospitals</p>
                        <img src="/sbh_wide.jpg" alt="SBH" className="h-12 mx-auto mb-4 object-contain brightness-0 invert opacity-90" />
                        <h1 className="text-2xl font-black text-white tracking-wide leading-tight px-4">{asset.machineName}</h1>
                        <div className="mt-3 inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm shadow-sm">
                            <span className={`w-2 h-2 rounded-full ${isReplaced ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                            <p className="text-emerald-50 font-black text-sm tracking-widest uppercase">{asset.id}</p>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-8 -mt-6 relative z-10 space-y-6">

                    {/* STATUS BANNER */}
                    {isReplaced && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 text-rose-800">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-wide">Asset Replaced</h3>
                                <div className="text-xs mt-1 font-medium opacity-80">
                                    <p>This asset is no longer in active service.</p>
                                    {asset.replacementInfo && (
                                        <p className="mt-1 font-bold">Replaced by: {asset.replacementInfo.newAssetId}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* KEY METRICS GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                            <Activity size={20} className="text-[#2e7d32] mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Machine Age</p>
                            <p className="text-[#1f2d2a] font-black text-lg mt-1">{age || 'N/A'}</p>
                        </div>
                        <div className={`bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center ${serviceStat.bg}`}>
                            <serviceStat.icon size={20} className={serviceStat.color} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{serviceStat.text === 'OK' ? 'Service Status' : 'Attention Needed'}</p>
                            <p className={`font-black text-lg mt-1 ${serviceStat.color}`}>{serviceStat.text}</p>
                        </div>
                    </div>

                    {/* DETAILS LIST */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100/50">
                        <div className="flex justify-between p-4 bg-white/50 first:rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md text-slate-400 border border-slate-100 shadow-sm"><ShieldCheck size={14} /></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Serial No</span>
                            </div>
                            <span className="text-sm font-black text-slate-700">{asset.serialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-white/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md text-slate-400 border border-slate-100 shadow-sm"><Building size={14} /></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Department</span>
                            </div>
                            <span className="text-sm font-black text-slate-700">{asset.department || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-white/50">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md text-slate-400 border border-slate-100 shadow-sm"><MapPin size={14} /></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Location</span>
                            </div>
                            <span className="text-sm font-black text-slate-700">{asset.location || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-4 bg-white/50 last:rounded-b-2xl">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md text-slate-400 border border-slate-100 shadow-sm"><Calendar size={14} /></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Install Date</span>
                            </div>
                            <span className="text-sm font-black text-slate-700">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>

                    {/* AMC & WARRANTY STATUS (Using Backend Data) */}
                    <div className="grid grid-cols-1 gap-3">
                        {/* Warranty */}
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${asset.warrantyColor === 'green' ? 'bg-emerald-500' : asset.warrantyColor === 'orange' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warranty Status</p>
                                <p className={`text-sm font-black mt-0.5 ${asset.warrantyColor === 'green' ? 'text-emerald-600' : asset.warrantyColor === 'orange' ? 'text-amber-600' : 'text-red-600'}`}>
                                    {asset.warrantyStatus}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Expires</span>
                                <p className="text-xs font-bold text-slate-700">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>

                        {/* AMC */}
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${asset.amcColor === 'green' ? 'bg-indigo-500' : asset.amcColor === 'orange' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AMC Subscription</p>
                                <p className={`text-sm font-black mt-0.5 ${asset.amcColor === 'green' ? 'text-indigo-600' : asset.amcColor === 'orange' ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {asset.amcStatus}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Expires</span>
                                <p className="text-xs font-bold text-slate-700">{asset.amcExpiry ? new Date(asset.amcExpiry).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="pt-6 text-center">
                        <div className="w-12 h-1 bg-slate-100 mx-auto rounded-full mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">SBH Group Of Hospitals</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#2e7d32]/40 mt-1">Official Asset Verification System</p>
                    </div>

                </div>
            </div>

            {/* ACTION BUTTONS (Outside PDF Capture) */}
            <div className="mt-8 flex gap-4 w-full max-w-lg px-2">
                <button
                    onClick={downloadPDF}
                    className="flex-1 bg-[#1f2d2a] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1f2d2a]/20 active:scale-95 transition-transform"
                >
                    <Download size={20} />
                    Download Record
                </button>
            </div>
        </div>
    );
};

export default PublicAssetView;
