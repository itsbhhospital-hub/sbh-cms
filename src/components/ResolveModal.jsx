import React, { useState } from 'react';
import { CheckCircle, X, Zap } from 'lucide-react';
import { useIntelligence } from '../context/IntelligenceContext';

const ResolveModal = ({ isOpen, onClose, onConfirm, isSubmitting, title = "Mark as Resolved", ticket }) => {
    const [remark, setRemark] = useState('');
    const { getResolverRecommendation } = useIntelligence();
    const recommendedStaff = getResolverRecommendation(ticket?.Department);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(remark);
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-[#dcdcdc] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-w-lg mx-auto w-full relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#2e7d32]"></div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="font-black text-[#1f2d2a] text-xl flex items-center gap-2 uppercase tracking-tight">
                        <CheckCircle className="text-[#2e7d32]" size={24} /> {title}
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">System Resolution Protocol</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#cfead6] rounded-xl transition-all border border-transparent hover:border-[#2e7d32]/10 group"
                >
                    <X size={20} className="text-slate-400 group-hover:text-[#2e7d32]" />
                </button>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-3 px-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolution Parameters</label>
                    {recommendedStaff && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-[#2e7d32] bg-[#cfead6] px-2.5 py-1 rounded-lg border border-[#2e7d32]/10 uppercase">
                            <Zap size={10} fill="currentColor" /> AI Best Resolver: {recommendedStaff}
                        </span>
                    )}
                </div>
                <textarea
                    className="w-full p-4 bg-slate-50 border border-[#dcdcdc] rounded-xl text-xs font-bold h-36 resize-none outline-none focus:bg-white focus:border-[#2e7d32] transition-all placeholder:text-slate-300 text-[#1f2d2a] shadow-none"
                    placeholder="Describe the clinical or administrative resolution steps taken..."
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                />
            </div>

            <div className="mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !remark.trim()}
                    className="w-full py-4.5 bg-[#2e7d32] text-white font-black rounded-2xl hover:bg-[#256628] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-none"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span>Finalize Resolution</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ResolveModal;
