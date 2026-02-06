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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200 max-w-lg mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <Star className="text-amber-500 fill-amber-500" size={20} /> Rate Service Quality
                </h4>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            <div className="mb-6 bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50 flex flex-col items-center justify-center">
                <p className="text-xs font-black text-amber-600/60 uppercase tracking-widest mb-4">Click to Rate</p>
                <div className="flex gap-3 mb-2" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            className="transition-all hover:scale-125 focus:outline-none"
                        >
                            <Star
                                size={42}
                                className={`transition-colors duration-200 drop-shadow-sm ${(hoverRating || rating) >= star ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                            />
                        </button>
                    ))}
                </div>
                <p className="h-4 text-xs font-bold text-amber-600 transition-opacity duration-300">
                    {(hoverRating || rating) > 0 ? (['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][(hoverRating || rating) - 1]) : ''}
                </p>
            </div>

            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

export default RateModal;
