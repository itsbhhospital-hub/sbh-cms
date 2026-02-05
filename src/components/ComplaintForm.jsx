import { useState } from 'react';
import { sheetsService } from '../services/googleSheets';
import { Send, CheckCircle, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SuccessModal = ({ isOpen, onClose, complaintId }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                    <CheckCircle strokeWidth={3} size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Ticket Registered</h3>
                {complaintId && (
                    <p className="font-mono text-lg font-bold text-slate-500 mb-4">#{complaintId}</p>
                )}
                <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                    The department has been notified. You can track this in your dashboard history.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all active:scale-95"
                >
                    Done
                </button>
            </div>
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

    const UNITS = [
        { name: 'SBH WOMEN HOSPITAL RAIPUR', short: 'Women Hospital', color: 'bg-rose-50 text-rose-700', icon: '🏥' },
        { name: 'SBH EYE HOSPITAL RAIPUR', short: 'Eye Raipur', color: 'bg-emerald-50 text-emerald-700', icon: '👁️' },
        { name: 'SBH EYE HOSPITAL FAFADIH', short: 'Eye Fafadih', color: 'bg-blue-50 text-blue-700', icon: '🏥' },
        { name: 'SBH EYE HOSPITAL BHILAI', short: 'Eye Bhilai', color: 'bg-indigo-50 text-indigo-700', icon: '🏬' }
    ];

    const DEPARTMENTS = [
        'IT', 'TPA', 'TPA ACCOUNTANT', 'HR', 'OPERATION', 'PHARMACY',
        'HOUSE KEEPING', 'MAINTENANCE', 'MARKETING', 'DOCTOR', 'ADMIN',
        'BILLING', 'FRONT OFFICE', 'STORE', 'LAB', 'NURSING', 'SECURITY', 'CCTV', 'OT', 'ICU', 'NICU', 'PICU', 'RADIOLOGY'
    ];

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
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-xs font-black text-slate-600">
                        {step}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {step === 1 ? 'Select Location' : 'Issue Details'}
                    </h2>
                </div>
            </div>

            <div className="p-6 md:p-8">
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {UNITS.map((u) => (
                            <button
                                key={u.name}
                                onClick={() => handleUnitSelect(u.name)}
                                className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-md text-left flex items-start gap-4 ${unit === u.name ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500' : 'border-slate-100 hover:border-indigo-300 bg-white'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${u.color}`}>
                                    {u.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-700 transition-colors">{u.short}</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">{u.name}</p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 self-center" size={18} />
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

                        <div className="mb-6 flex items-center gap-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-indigo-900">
                            <Building2 size={16} />
                            <span className="text-sm font-bold truncate">{unit}</span>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-1">Target Department</label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 appearance-none transition-all"
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
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 pl-1">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all h-32 resize-none placeholder:text-slate-400"
                                    placeholder="Describe the issue clearly..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {loading ? 'Submitting...' : <><Send size={16} /> Submit Ticket</>}
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
