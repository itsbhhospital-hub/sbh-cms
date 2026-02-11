import { useState } from 'react';
import { ChevronRight, Share2, X, Zap } from 'lucide-react';
import { useIntelligence } from '../context/IntelligenceContext';

const DEPARTMENTS = [
    'IT', 'TPA', 'TPA ACCOUNTANT', 'HR', 'OPERATION', 'PHARMACY',
    'HOUSE KEEPING', 'MAINTENANCE', 'MARKETING', 'DOCTOR', 'ADMIN',
    'BILLING', 'FRONT OFFICE', 'STORE', 'LAB', 'NURSING', 'SECURITY', 'CCTV', 'OT', 'ICU', 'NICU', 'PICU', 'RADIOLOGY'
];

const TransferModal = ({ isOpen, onClose, onConfirm, isSubmitting, ticket }) => {
    const [dept, setDept] = useState('');
    const [reason, setReason] = useState('');
    const { getTransferSuggestion } = useIntelligence();
    const suggestedDept = getTransferSuggestion(ticket);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(dept, reason);
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-[#dcdcdc] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-w-lg mx-auto w-full relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#2e7d32]"></div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="font-black text-[#1f2d2a] text-xl flex items-center gap-2 uppercase tracking-tight">
                        <Share2 className="text-[#2e7d32]" size={24} /> Transfer Protocol
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Inter-Departmental Handover</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#cfead6] rounded-xl transition-all border border-transparent hover:border-[#2e7d32]/10 group"
                >
                    <X size={20} className="text-slate-400 group-hover:text-[#2e7d32]" />
                </button>
            </div>

            <div className="mb-6 space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Facility / Unit</label>
                        {suggestedDept && (
                            <button
                                onClick={() => setDept(suggestedDept)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-[#2e7d32] bg-[#cfead6] px-2.5 py-1 rounded-lg border border-[#2e7d32]/10 uppercase transition-all hover:scale-105 active:scale-95"
                            >
                                <Zap size={10} fill="currentColor" /> AI Predict: {suggestedDept}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-3.5 bg-slate-50 border border-[#dcdcdc] rounded-xl font-bold text-[#1f2d2a] text-xs outline-none focus:bg-white focus:border-[#2e7d32] transition-all appearance-none shadow-none"
                            value={dept}
                            onChange={e => setDept(e.target.value)}
                        >
                            <option value="">Select Target Department...</option>
                            {DEPARTMENTS.sort().map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-4 text-slate-300 rotate-90 pointer-events-none" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Transfer Rationale</label>
                    <textarea
                        className="w-full p-4 bg-slate-50 border border-[#dcdcdc] rounded-xl text-xs font-bold h-28 resize-none outline-none focus:bg-white focus:border-[#2e7d32] transition-all placeholder:text-slate-300 text-[#1f2d2a] shadow-none"
                        placeholder="State the requirement for inter-departmental mobilization..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !dept || !reason.trim()}
                    className="w-full py-4.5 bg-[#2e7d32] text-white font-black rounded-2xl hover:bg-[#256628] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-none"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <span>Authorize Handover</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TransferModal;
