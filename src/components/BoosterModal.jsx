import React, { useState } from 'react';
import { Share2, X, Zap, AlertTriangle } from 'lucide-react';

const BoosterModal = ({ isOpen, onClose, onConfirm, isSubmitting, ticket }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl border border-[#dcdcdc] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-w-lg mx-auto w-full relative">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500"></div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h4 className="font-black text-[#1f2d2a] text-xl flex items-center gap-2 uppercase tracking-tight">
                            <Share2 className="text-amber-500" size={24} /> Priority Booster
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Administrative Escalation Protocol</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-500/10 group"
                    >
                        <X size={20} className="text-slate-400 group-hover:text-amber-500" />
                    </button>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex gap-3">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed tracking-tight">
                        Triggering a booster will send immediate WhatsApp notifications to all staff in the <span className="underline italic">{ticket?.Department}</span> department.
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalation Justification</label>
                    </div>
                    <textarea
                        className="w-full p-4 bg-slate-50 border border-[#dcdcdc] rounded-xl text-xs font-bold h-36 resize-none outline-none focus:bg-white focus:border-amber-500 transition-all placeholder:text-slate-300 text-[#1f2d2a] shadow-none"
                        placeholder="Explain why this ticket requires immediate priority attention..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reason.trim()}
                        className="w-full py-4.5 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-none"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Zap size={16} fill="currentColor" />
                                <span>Send Priority Notice</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoosterModal;
