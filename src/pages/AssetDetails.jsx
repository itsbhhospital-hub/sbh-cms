import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, FileText,
    Clock, Wrench, Download, CheckCircle
} from 'lucide-react';
import { assetsService } from '../services/assetsService';
import QRCode from 'react-qr-code';

const AssetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(true);

    // Service Modal State
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [serviceForm, setServiceForm] = useState({
        serviceDate: new Date().toISOString().split('T')[0],
        nextServiceDate: '',
        remark: '',
        file: null,
        fileName: ''
    });

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const data = await assetsService.getAssetDetails(id);
            setAsset(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let fileBase64 = '';
            // If file present
            if (serviceForm.file) {
                // Logic assumed already handled in state or helper, re-using service
            }

            // For simplicity in this mock, we assume file handling logic similar to AddAsset
            // But we need to convert file object to base64 here if not happened yet.
            // Let's assume the state holds the file object for now and we convert it:
            if (serviceForm.file) {
                fileBase64 = await assetsService.fileToBase64(serviceForm.file);
            }

            await assetsService.addServiceRecord({
                id: asset.id,
                serviceDate: serviceForm.serviceDate,
                nextServiceDate: serviceForm.nextServiceDate,
                remark: serviceForm.remark
            }, fileBase64, serviceForm.fileName, serviceForm.file?.type);

            alert("Service Record Added!");
            setShowServiceModal(false);
            fetchDetails(); // Refresh
        } catch (error) {
            alert("Error adding record: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">Loading Asset Details...</div>;
    if (!asset) return <div className="p-12 text-center text-rose-500 font-black uppercase tracking-widest">Asset Not Found</div>;

    const publicLink = `${window.location.origin}/asset-view/${asset.id}`;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <button
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#2e7d32] transition-colors"
            >
                <ArrowLeft size={20} /> Back to Assets
            </button>

            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Info Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wrench size={100} />
                    </div>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="bg-[#1f2d2a] text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                                {asset.id}
                            </span>
                            <h1 className="text-3xl font-black text-[#1f2d2a] mt-3">{asset.machineName}</h1>
                            <p className="text-slate-500 font-bold mt-1">Serial: {asset.serialNumber}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border ${asset.status === 'Service Due' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                            {asset.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-8">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Date</p>
                            <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <Calendar size={18} className="text-[#2e7d32]" />
                                {new Date(asset.purchaseDate).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Next Service</p>
                            <div className="flex items-center gap-2 text-slate-700 font-bold">
                                <Clock size={18} className={asset.status === 'Service Due' ? "text-amber-500" : "text-[#2e7d32]"} />
                                {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                        {asset.invoiceLink && (
                            <a href={asset.invoiceLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 transition-colors">
                                <FileText size={16} /> Purchase Invoice
                            </a>
                        )}
                        {asset.folderLink && (
                            <a href={asset.folderLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 transition-colors">
                                <Download size={16} /> Asset Drive Folder
                            </a>
                        )}
                    </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-[#1f2d2a] rounded-3xl p-8 border border-slate-800 shadow-xl text-white flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-4 rounded-2xl mb-4">
                        <QRCode
                            value={publicLink}
                            size={128}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <h3 className="font-black text-xl tracking-tight">Digital Identity</h3>
                    <p className="text-slate-400 text-sm mt-2">Scan to view public service history and machine details.</p>

                    {window.location.hostname === 'localhost' && (
                        <div className="mt-4 p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-200 text-xs text-left">
                            <strong>⚠️ Developer Note:</strong><br />
                            You are on <code>localhost</code>. This QR code will not work on mobile.<br />
                            Access this page via your <strong>Network IP</strong> (check terminal) to test on phone.
                        </div>
                    )}
                </div>
            </div>

            {/* Service History Timeline */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black text-[#1f2d2a] uppercase tracking-wide flex items-center gap-2">
                        <Wrench className="text-[#2e7d32]" size={24} /> Service History
                    </h2>
                    <button
                        onClick={() => setShowServiceModal(true)}
                        className="flex items-center gap-2 bg-[#2e7d32] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#1b5e20] transition-colors shadow-lg shadow-[#2e7d32]/20 text-sm"
                    >
                        + Add Record
                    </button>
                </div>

                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                    {(asset.history && asset.history.length > 0) ? (
                        asset.history.map((record, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-[#2e7d32]"></div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-[#1f2d2a]">{record.name}</h4>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(record.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <a href={record.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#2e7d32] hover:bg-emerald-50 transition-colors">
                                            <Download size={14} /> View Document
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 italic">No service history records yet.</div>
                    )}
                </div>
            </div>

            {/* Add Service Modal */}
            {showServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-xl font-black text-[#1f2d2a] mb-6">Add Service Record</h2>
                        <form onSubmit={handleServiceSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Service Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                                        value={serviceForm.serviceDate}
                                        onChange={e => setServiceForm({ ...serviceForm, serviceDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-[#2e7d32] uppercase tracking-widest block mb-1">Next Due</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 font-bold text-emerald-800"
                                        value={serviceForm.nextServiceDate}
                                        onChange={e => setServiceForm({ ...serviceForm, nextServiceDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Remarks</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                                    rows="3"
                                    required
                                    value={serviceForm.remark}
                                    onChange={e => setServiceForm({ ...serviceForm, remark: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Upload Service Report</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                setServiceForm({ ...serviceForm, file: e.target.files[0], fileName: e.target.files[0].name });
                                            }
                                        }}
                                    />
                                    {serviceForm.fileName ? (
                                        <span className="text-sm font-bold text-[#2e7d32] flex items-center justify-center gap-2"><CheckCircle size={16} /> {serviceForm.fileName}</span>
                                    ) : (
                                        <span className="text-sm text-slate-400 font-bold flex items-center justify-center gap-2"><UploadCloud size={16} /> Upload PDF</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowServiceModal(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-[#1f2d2a] hover:bg-[#2e7d32] transition-colors"
                                >
                                    {submitting ? 'Saving...' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetDetails;
