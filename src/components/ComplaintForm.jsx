import { useState } from 'react';
import { sheetsService } from '../services/googleSheets';
import { Send, CheckCircle, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SuccessModal = ({ isOpen, onClose, complaintId }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
                    <CheckCircle className="text-green-600 animate-[bounce_1s_infinite]" size={40} />
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-2">Ticket Registered!</h3>
                {complaintId && (
                    <div className="inline-block bg-slate-100 px-4 py-1.5 rounded-lg mb-4">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ticket ID</p>
                        <p className="text-xl font-black text-slate-800">{complaintId}</p>
                    </div>
                )}
                <p className="text-slate-500 mb-8 font-medium text-sm">Your complaint has been sent to the department.</p>

                <button
                    onClick={onClose}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-black transition-all"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

const ComplaintForm = ({ onComplaintCreated }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Unit, 2: Details
    const [unit, setUnit] = useState('');
    const [department, setDepartment] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successId, setSuccessId] = useState(null);

    const UNITS = [
        { name: 'SBH WOMEN HOSPITAL RAIPUR', short: 'SBH Women', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: '🏥' },
        { name: 'SBH EYE HOSPITAL RAIPUR', short: 'SBH Eye Raipur', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '👁️' },
        { name: 'SBH EYE HOSPITAL FAFADIH', short: 'SBH Eye Fafadih', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: '🏥' },
        { name: 'SBH EYE HOSPITAL BHILAI', short: 'SBH Eye Bhilai', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '🏬' }
    ];

    const DEPARTMENTS = [
        'IT', 'TPA', 'TPA ACCOUNTANT', 'HR', 'OPERATION', 'PHARMACY',
        'HOUSE KEEPING', 'MAINTENANCE', 'MARKETING', 'DOCTOR', 'ADMIN',
        'BILLING', 'FRONT OFFICE', 'STORE', 'LAB', 'NURSING', 'SECURITY', 'CCTV', 'OT', 'ICU', 'NICU', 'PICU', 'RADIOLOGY'
    ];

    const handleUnitSelect = (selectedUnit) => {
        setUnit(selectedUnit);
        setStep(2); // Auto-advance instantly
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

            // Reset
            setDepartment('');
            setUnit('');
            setDescription('');
            setStep(1);
            if (onComplaintCreated) onComplaintCreated();
        } catch (err) {
            alert("Failed to submit complaint");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 min-h-[500px]">
                {/* STEP 1: UNIT SELECTION */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Select Hospital Unit</h2>
                        <p className="text-slate-500 font-medium mb-8">Where is the issue located?</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {UNITS.map((u) => (
                                <button
                                    key={u.name}
                                    onClick={() => handleUnitSelect(u.name)}
                                    className={`group p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center justify-between ${unit === u.name ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 hover:border-blue-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${u.color}`}>
                                            {u.icon}
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{u.name}</p>
                                            <p className="text-xs text-slate-400 font-bold mt-1">Select Unit</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: DETAILS */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-6 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Units
                        </button>

                        <div className="flex items-center gap-3 mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Selected Unit</p>
                                <p className="text-slate-800 font-bold">{unit}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-slate-800 uppercase tracking-widest mb-3 pl-1">
                                    Target Department
                                </label>
                                <div className="relative group">
                                    <select
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-slate-700 font-bold appearance-none cursor-pointer"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        required
                                        autoFocus
                                    >
                                        <option value="" className="text-gray-400">Select Department...</option>
                                        {DEPARTMENTS.sort().map(d => (
                                            <option key={d} value={d} className="py-2 text-slate-700 font-medium">{d}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-5 pointer-events-none text-slate-400">
                                        <ChevronRight size={20} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-800 uppercase tracking-widest mb-3 pl-1">
                                    Issue Description
                                </label>
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400 h-32 resize-none text-base"
                                    placeholder="Describe the issue in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:cursor-wait"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={18} /> Submit Ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} complaintId={successId} />
        </>
    );
};

export default ComplaintForm;
