import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, CheckCircle, Save } from 'lucide-react';
import { assetsService } from '../services/assetsService';

const AddAsset = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('');

    const [successId, setSuccessId] = useState(null);

    const [formData, setFormData] = useState({
        machineName: '',
        serialNumber: '',
        purchaseDate: '',
        invoiceFile: null, // Base64
        invoiceName: '',
        invoiceType: '',
        currentServiceDate: '',
        nextServiceDate: '',
        remark: '',
        createdBy: 'Admin' // Should come from Auth Context in real app
    });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64 = await assetsService.fileToBase64(file);
                setFormData(prev => ({
                    ...prev,
                    invoiceFile: base64,
                    invoiceName: file.name,
                    invoiceType: file.type
                }));
                setFileName(file.name);
            } catch (err) {
                console.error("File read error", err);
                alert("Error reading file");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await assetsService.addAsset(formData);
            if (res.status === 'success') {
                setSuccessId(res.assetId); // Trigger Popup
                // navigate('/assets'); // Removed navigation, popup handles it
            } else {
                alert(`Error: ${res.message}`);
            }
        } catch (error) {
            console.error("Submission error", error);
            alert("Failed to submit. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#2e7d32] transition-colors"
            >
                <ArrowLeft size={20} /> Back to Assets
            </button>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-[#1f2d2a] p-8 text-white">
                    <h1 className="text-2xl font-black tracking-tight">Register New Asset</h1>
                    <p className="text-slate-400 mt-1">Add machine details, serial numbers, and invoice records.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {/* Basic Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Machine Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                placeholder="e.g. X-Ray Unit A1"
                                value={formData.machineName}
                                onChange={e => setFormData({ ...formData, machineName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Serial Number</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                placeholder="SN-12345678"
                                value={formData.serialNumber}
                                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Purchase Date</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                value={formData.purchaseDate}
                                onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Current Service Date</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                value={formData.currentServiceDate}
                                onChange={e => setFormData({ ...formData, currentServiceDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-[#2e7d32] uppercase tracking-widest">Next Service Due</label>
                            <input
                                required
                                type="date"
                                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 font-black text-emerald-800 outline-none focus:border-[#2e7d32] transition-all"
                                value={formData.nextServiceDate}
                                onChange={e => setFormData({ ...formData, nextServiceDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Purchase Invoice</label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-all group cursor-pointer">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept="application/pdf,image/*"
                            />
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-[#cfead6] transition-colors">
                                    {fileName ? <CheckCircle className="text-[#2e7d32]" /> : <UploadCloud className="text-slate-400 group-hover:text-[#2e7d32]" />}
                                </div>
                                {fileName ? (
                                    <p className="text-sm font-bold text-[#2e7d32]">{fileName}</p>
                                ) : (
                                    <>
                                        <p className="text-sm font-bold text-slate-600">Click to upload invoice</p>
                                        <p className="text-xs text-slate-400">PDF or Images only</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Initial Remarks</label>
                        <textarea
                            rows="3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none focus:border-[#2e7d32] transition-all resize-none"
                            placeholder="Any initial condition notes..."
                            value={formData.remark}
                            onChange={e => setFormData({ ...formData, remark: e.target.value })}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${loading ? 'bg-slate-400' : 'bg-[#1f2d2a] hover:bg-[#2e7d32]'}`}
                    >
                        {loading ? 'Creating Asset...' : <><Save size={20} /> Register Asset Now</>}
                    </button>

                </form>
            </div>

            {/* Success Popup */}
            {successId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-[#2e7d32]" />
                        </div>
                        <h2 className="text-2xl font-black text-[#1f2d2a] mb-2">Asset Registered!</h2>
                        <p className="text-slate-500 font-medium mb-6">Successfully added to the system.</p>

                        <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-200">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Asset ID</p>
                            <p className="text-3xl font-black text-[#2e7d32] tracking-tight">{successId}</p>
                        </div>

                        <button
                            onClick={() => navigate('/assets')}
                            className="w-full py-3 rounded-xl font-bold text-white bg-[#1f2d2a] hover:bg-[#2e7d32] transition-colors"
                        >
                            Back to Assets
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddAsset;
