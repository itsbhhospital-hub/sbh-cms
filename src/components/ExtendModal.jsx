import { useState } from 'react';
import { Clock, X } from 'lucide-react';

const ExtendModal = ({ isOpen, onClose, onConfirm, isSubmitting }) => {
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(date, reason);
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200 max-w-lg mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <Clock className="text-blue-500" size={20} /> Extend Deadline
                </h4>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            <div className="mb-4 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select New Date</label>
                    <input
                        type="date"
                        className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason for Extension</label>
                    <textarea
                        className="w-full p-4 border border-slate-200 rounded-xl text-sm font-medium h-24 resize-none outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-400 bg-slate-50"
                        placeholder="Why is more time needed?"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !date || !reason}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Extending...' : 'Confirm Extension'}
                </button>
            </div>
        </div>
    );
};

export default ExtendModal;
