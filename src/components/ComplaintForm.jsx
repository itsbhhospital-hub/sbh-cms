import { useState } from 'react';
import { sheetsService } from '../services/googleSheets';
import { Send, CheckCircle, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { DEPARTMENTS, UNITS } from '../constants/appData';

const SuccessModal = ({ isOpen, onClose, complaintId }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-none animate-in fade-in duration-200">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100 relative overflow-hidden"
            >
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-orange-500 to-rose-600"></div>
                <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle strokeWidth={3} size={40} />
                </div>
                <h3 className="text-popup-title font-black text-slate-900 mb-2">Ticket Generated</h3>
                {complaintId && (
                    <div className="bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg inline-block mb-4 tracking-widest">
                        #{complaintId}
                    </div>
                )}
                <p className="text-table-data font-bold text-slate-500 mb-8 leading-relaxed">
                    The support protocol has been initiated. Mission parameters are now visible in your dashboard.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 hover:bg-black text-white text-button font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-200 tracking-widest"
                >
                    Acknowledge
                </button>
            </motion.div>
        </div>
    );
};

const ComplaintForm = ({ onComplaintCreated }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [unit, setUnit] = useState('');
    const [department, setDepartment] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successId, setSuccessId] = useState(null);


    const handleUnitSelect = (selectedUnit) => {
        setUnit(selectedUnit);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await sheetsService.createComplaint({
                department,
                description,
                unit,
                reportedBy: user.Username
            });
            const ticketId = result.data?.id || result.id || 'Pending';
            setSuccessId(ticketId);
            setShowSuccess(true);
            setDepartment('');
            setUnit('');
            setDescription('');
            setStep(1);
            if (onComplaintCreated) onComplaintCreated();
        } catch (err) {
            alert("Failed to submit complaint");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                    <Building2 size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-600 text-[11px] font-black text-white shadow-lg shadow-orange-500/20">
                            {step}
                        </span>
                        <span className="text-label text-slate-400 font-bold tracking-widest">Step {step} of 2</span>
                    </div>
                    <h2 className="text-page-title text-slate-900 tracking-tight font-black">
                        {step === 1 ? 'Select Hospital Unit' : 'Issue Parameters'}
                    </h2>
                    <p className="text-small-info text-slate-500 font-bold mt-1 max-w-md">
                        {step === 1
                            ? 'Identify the specific hospital facility requiring attention.'
                            : 'Define the exact requirements and departmental context.'}
                    </p>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
                        {UNITS.map((u) => (
                            <button
                                key={u.name}
                                onClick={() => handleUnitSelect(u.name)}
                                className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl text-left flex items-start gap-5 ${unit === u.name ? 'border-orange-600 bg-orange-50/20 shadow-lg' : 'border-slate-100 hover:border-orange-200 bg-white'
                                    }`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner group-hover:scale-110 transition-transform ${u.color}`}>
                                    {u.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 text-base group-hover:text-orange-700 transition-colors tracking-tight leading-none mb-1">{u.short}</h3>
                                    <p className="text-label font-bold text-slate-400 tracking-widest text-[10px] truncate">{u.name}</p>
                                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                        Select Location <ChevronRight size={14} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-lg mx-auto">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft size={14} /> Back to Locations
                        </button>

                        <div className="mb-6 flex items-center gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-100 text-orange-900">
                            <Building2 size={16} />
                            <span className="text-sm font-bold truncate tracking-tight">{unit}</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-table-header tracking-widest text-slate-500 mb-2 pl-1">Primary Department</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-forms outline-none focus:ring-4 focus:ring-orange-50 focus:border-orange-600 appearance-none transition-all shadow-sm"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        required
                                        autoFocus
                                    >
                                        <option value="">Select Department...</option>
                                        {DEPARTMENTS.sort().map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-3.5 text-slate-400 rotate-90 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-table-header tracking-widest text-slate-500 mb-2 pl-1">Case Parameters (Description)</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-forms outline-none focus:ring-4 focus:ring-orange-50 focus:border-orange-600 transition-all h-32 resize-none placeholder:text-slate-300 shadow-sm"
                                    placeholder="Provide specialized details regarding the requirement..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-slate-900 hover:bg-black text-white text-button font-black rounded-2xl shadow-xl shadow-slate-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 tracking-widest"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Authorize Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} complaintId={successId} />
        </div>
    );
};

export default ComplaintForm;
