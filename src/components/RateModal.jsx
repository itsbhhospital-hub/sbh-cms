import { useState } from 'react';
import { Star, X } from 'lucide-react';

const RateModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(rating);
    };

    return (
        <div className="bg-white p-8 rounded-2xl border border-[#dcdcdc] shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-w-lg mx-auto w-full relative">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#2e7d32]"></div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="font-black text-[#1f2d2a] text-xl flex items-center gap-2 uppercase tracking-tight">
                        <Star className="text-amber-400 fill-amber-400" size={24} /> Service Quality
                    </h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Internal Performance Metrics</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[#cfead6] rounded-xl transition-all border border-transparent hover:border-[#2e7d32]/10 group"
                >
                    <X size={20} className="text-slate-400 group-hover:text-[#2e7d32]" />
                </button>
            </div>

            <div className="mb-8 bg-[#f8faf9] p-8 rounded-3xl border border-[#dcdcdc] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(46,125,50,0.02),transparent_70%)]"></div>

                <p className="text-[10px] font-black text-[#2e7d32] uppercase tracking-widest mb-6 relative z-10">Assign Performance Rating</p>
                <div className="flex gap-4 mb-3 relative z-10" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            className="transition-all hover:scale-110 focus:outline-none"
                        >
                            <Star
                                size={44}
                                className={`transition-all duration-300 ${(hoverRating || rating) >= star ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]" : "text-slate-100"}`}
                            />
                        </button>
                    ))}
                </div>
                <div className="h-6 mt-2 relative z-10">
                    <p className="text-xs font-black text-[#2e7d32] uppercase tracking-widest animate-in fade-in duration-300">
                        {(hoverRating || rating) > 0 ? (['Sub-Standard', 'Acceptable', 'Commendable', 'Exemplary', 'Superior'][(hoverRating || rating) - 1]) : ''}
                    </p>
                </div>
            </div>

            <div className="mt-4">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className="w-full py-4.5 bg-[#2e7d32] text-white font-black rounded-2xl hover:bg-[#256628] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-none"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <span>Transmit Performance Data</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default RateModal;
