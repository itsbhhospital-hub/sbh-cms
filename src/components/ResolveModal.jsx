import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

const ResolveModal = ({ isOpen, onClose, onConfirm, isSubmitting, title = "Mark as Resolved" }) => {
    const [remark, setRemark] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm(remark);
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200 max-w-lg mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={20} /> {title}
                </h4>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Resolution Remarks</label>
                <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                    placeholder="Describe how the issue was resolved..."
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                />
            </div>

            <div className="mt-6">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Processing...' : 'Confirm Resolution'}
                </button>
            </div>
        </div>
    );
};

export default ResolveModal;
