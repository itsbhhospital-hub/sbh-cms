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
        createdBy: 'Admin', // Should come from Auth Context in real app
        // New Fields
        location: '',
        department: '',
        warrantyType: '1 Year', // Default
        warrantyExpiry: '',
        amcTaken: 'No',
        amcAmount: '',
        amcStart: '',
        amcExpiry: '',
        vendorName: '',
        vendorContact: '',
        purchaseCost: '',
        responsiblePerson: '', // New
        responsibleMobile: ''  // New
    });

    // Auto-calculate Warranty Expiry
    React.useEffect(() => {
        if (formData.purchaseDate && formData.warrantyType && formData.warrantyType !== 'None') {
            const date = new Date(formData.purchaseDate);
            if (!isNaN(date.getTime())) {
                let years = 0;
                if (formData.warrantyType === '1 Year') years = 1;
                if (formData.warrantyType === '2 Years') years = 2;
                if (formData.warrantyType === '3 Years') years = 3;
                if (formData.warrantyType === '5 Years') years = 5;

                if (years > 0) {
                    date.setFullYear(date.getFullYear() + years);
                    setFormData(prev => ({ ...prev, warrantyExpiry: date.toISOString().split('T')[0] }));
                }
            }
        } else if (formData.warrantyType === 'None') {
            setFormData(prev => ({ ...prev, warrantyExpiry: '' }));
        }
    }, [formData.purchaseDate, formData.warrantyType]);

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
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#2e7d32] transition-colors"
            >
                <ArrowLeft size={20} /> Back to Assets
            </button>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-[#1f2d2a] p-8 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Register New Asset</h1>
                        <p className="text-slate-400 mt-1">Add machine details, serial numbers, and invoice records.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* Section 1: Basic Machine Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-[#2e7d32] uppercase tracking-widest border-b border-slate-100 pb-2">Machine Identity</h3>
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
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Department</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all appearance-none"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    <option value="Radiology">Radiology</option>
                                    <option value="Pathology">Pathology</option>
                                    <option value="OT">Operation Theatre (OT)</option>
                                    <option value="ICU">ICU</option>
                                    <option value="OPD">OPD</option>
                                    <option value="General Ward">General Ward</option>
                                    <option value="IT">IT / Server Room</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Installed Location</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    placeholder="e.g. Room 304, 3rd Floor"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Purchase & Vendor Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-[#2e7d32] uppercase tracking-widest border-b border-slate-100 pb-2">Purchase & Vendor</h3>
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
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Purchase Cost (₹)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    placeholder="0.00"
                                    value={formData.purchaseCost}
                                    onChange={e => setFormData({ ...formData, purchaseCost: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Vendor Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    placeholder="Supplier Name"
                                    value={formData.vendorName}
                                    onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Vendor Contact (Phone/Email)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    placeholder="Contact Details"
                                    value={formData.vendorContact}
                                    onChange={e => setFormData({ ...formData, vendorContact: e.target.value })}
                                />
                            </div>

                            {/* RESPONSIBLE PERSON FIELDS */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded w-fit">Responsible Person Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                    placeholder="e.g. Dr. Sharma"
                                    value={formData.responsiblePerson}
                                    onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-black text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded w-fit">Responsible Person Mobile (For WhatsApp Alerts)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                    placeholder="e.g. 9876543210"
                                    value={formData.responsibleMobile}
                                    onChange={e => setFormData({ ...formData, responsibleMobile: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Warranty & AMC */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-[#2e7d32] uppercase tracking-widest border-b border-slate-100 pb-2">Warranty & Support</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Warranty Type</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    value={formData.warrantyType}
                                    onChange={e => setFormData({ ...formData, warrantyType: e.target.value })}
                                >
                                    <option value="None">None</option>
                                    <option value="1 Year">1 Year Standard</option>
                                    <option value="2 Years">2 Years Extended</option>
                                    <option value="3 Years">3 Years Comprehensive</option>
                                    <option value="5 Years">5 Years Premium</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Warranty Expiry (Auto)</label>
                                <input
                                    readOnly
                                    type="date"
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-500 outline-none cursor-not-allowed"
                                    value={formData.warrantyExpiry}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">AMC Taken?</label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    value={formData.amcTaken}
                                    onChange={e => setFormData({ ...formData, amcTaken: e.target.value })}
                                >
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>
                            {formData.amcTaken === 'Yes' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">AMC Start</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                            value={formData.amcStart}
                                            onChange={e => setFormData({ ...formData, amcStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">AMC Expiry</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                            value={formData.amcExpiry}
                                            onChange={e => setFormData({ ...formData, amcExpiry: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">AMC Cost (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                            value={formData.amcAmount}
                                            onChange={e => setFormData({ ...formData, amcAmount: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Service & Uploads */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-[#2e7d32] uppercase tracking-widest border-b border-slate-100 pb-2">Service & Initial Status</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Current Service Date (Install Date)</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-[#2e7d32] transition-all"
                                    value={formData.currentServiceDate}
                                    onChange={e => setFormData({ ...formData, currentServiceDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-[#2e7d32] uppercase tracking-widest">Next Service Due (Critical)</label>
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
                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Purchase Invoice / Installation Report</label>
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
                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Initial Remarks</label>
                            <textarea
                                rows="3"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 outline-none focus:border-[#2e7d32] transition-all resize-none"
                                placeholder="Any initial condition notes..."
                                value={formData.remark}
                                onChange={e => setFormData({ ...formData, remark: e.target.value })}
                            ></textarea>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 ${loading ? 'bg-slate-400' : 'bg-[#1f2d2a] hover:bg-[#2e7d32]'}`}
                    >
                        {loading ? 'Creating Asset...' : <><Save size={20} /> Register Asset Now</>}
                    </button>

                </form>
            </div >

            {/* Success Popup */}
            {
                successId && (
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
                )
            }
        </div >
    );
};

export default AddAsset;
