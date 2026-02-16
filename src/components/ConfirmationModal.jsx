import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl transform transition-all scale-100 animate-slide-up overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b border-slate-100 ${isDangerous ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <h3 className={`text-lg font-black flex items-center gap-2 ${isDangerous ? 'text-red-700' : 'text-emerald-800'}`}>
                        <AlertTriangle size={20} className={isDangerous ? 'text-red-600' : 'text-emerald-600'} />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-slate-600 font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg font-bold text-white shadow-lg shadow-black/10 transform hover:-translate-y-0.5 transition-all ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
