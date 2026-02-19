import React, { useState, useMemo } from 'react';
import { X, ArrowRight, Building2, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

const DashboardPopup = ({ isOpen, onClose, title, complaints, onTrack }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on open
    React.useEffect(() => {
        if (isOpen) setCurrentPage(1);
    }, [isOpen, title]);

    // 🟢 OPTIMIZED: Sort once, Slice often
    const sortedComplaints = useMemo(() => {
        const mode = (title || '').trim();
        return [...complaints].sort((a, b) => {
            let dateA, dateB;
            if (mode === 'Solved') {
                dateA = new Date(String(a.ResolvedDate || a.Date || '').replace(/'/g, ''));
                dateB = new Date(String(b.ResolvedDate || b.Date || '').replace(/'/g, ''));
            } else if (mode === 'Transferred') {
                const tDateA = a.LatestTransfer?.TransferDate || a.TransferDate;
                const tDateB = b.LatestTransfer?.TransferDate || b.TransferDate;
                dateA = new Date(String(tDateA || a.Date || '').replace(/'/g, ''));
                dateB = new Date(String(tDateB || b.Date || '').replace(/'/g, ''));
            } else {
                dateA = new Date(String(a.Date || a.Timestamp || '').replace(/'/g, ''));
                dateB = new Date(String(b.Date || b.Timestamp || '').replace(/'/g, ''));
            }

            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            if (dateB - dateA !== 0) return dateB - dateA;

            const idA = parseInt(String(a.ID).replace(/\D/g, '')) || 0;
            const idB = parseInt(String(b.ID).replace(/\D/g, '')) || 0;
            return idB - idA;
        });
    }, [complaints, title]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sortedComplaints.slice(start, start + itemsPerPage);
    }, [sortedComplaints, currentPage]);

    const totalPages = Math.ceil(complaints.length / itemsPerPage);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in fade-in duration-200 max-h-[85vh] border border-[#dcdcdc]">
                {/* Header */}
                <div className="p-6 border-b border-[#dcdcdc] bg-[#f8faf9] z-10 flex justify-between items-center sticky top-0">
                    <div>
                        <h3 className="font-black text-[#1f2d2a] text-xl leading-none uppercase tracking-tight">{title} Cases</h3>
                        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">{complaints.length} Records In-System</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#cfead6] rounded-xl transition-all border border-transparent hover:border-[#2e7d32]/10 group">
                        <X size={24} className="text-slate-400 group-hover:text-[#2e7d32]" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white h-[70vh] scroll-smooth pr-[6px]">
                    {complaints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                            <Activity size={48} className="mb-4 opacity-20" />
                            <p className="font-black uppercase text-xs tracking-widest">Zero entries found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-[#f8faf9] sticky top-0 z-10 border-b border-[#dcdcdc]">
                                    <tr>
                                        <th className="p-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#2e7d32] w-20 bg-[#f8faf9]">ID</th>
                                        <th className="p-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#2e7d32] bg-[#f8faf9]">Description</th>
                                        <th className="p-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#2e7d32] w-40 text-center bg-[#f8faf9]">Department</th>
                                        <th className="p-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#2e7d32] w-32 text-center bg-[#f8faf9]">Status</th>
                                        <th className="p-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#2e7d32] w-32 text-right bg-[#f8faf9]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedData.map((c, idx) => {
                                        const ticketId = c.ID || c.id || c['Ticket ID'] || c.ComplaintID || 'N/A';
                                        const uniqueKey = `${ticketId}-${idx}`;
                                        return (
                                            <tr key={uniqueKey} className="hover:bg-[#f0f9f1] transition-colors group">
                                                <td className="p-4 py-4 font-black text-xs text-slate-400">#{ticketId}</td>
                                                <td className="p-4 py-4">
                                                    <p className="text-sm font-bold text-[#1f2d2a] line-clamp-1">{c.Description}</p>
                                                </td>
                                                <td className="p-4 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#2e7d32] bg-[#cfead6]/30 px-2 py-1 rounded border border-[#2e7d32]/10 uppercase tracking-tight">
                                                        <Building2 size={12} /> {c.Department}
                                                    </span>
                                                </td>
                                                <td className="p-4 py-4 text-center">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${c.Status === 'Open' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        c.Status === 'Solved' || c.Status === 'Closed' ? 'bg-[#cfead6] text-[#2e7d32] border-[#2e7d32]/20' :
                                                            c.Status === 'Pending' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                        {c.Status}
                                                    </span>
                                                </td>
                                                <td className="p-4 py-4 text-right">
                                                    <button
                                                        onClick={() => onTrack(c)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#dcdcdc] text-[#2e7d32] font-black text-[10px] rounded-lg hover:bg-[#2e7d32] hover:text-white hover:border-[#2e7d32] transition-all uppercase tracking-widest active:scale-95"
                                                    >
                                                        <Activity size={12} /> Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="p-4 px-6 border-t border-[#dcdcdc] bg-[#f8faf9] flex justify-between items-center z-10">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-2 rounded-lg border border-[#dcdcdc] text-slate-400 hover:bg-white hover:text-[#2e7d32] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-2 rounded-lg border border-[#dcdcdc] text-slate-400 hover:bg-white hover:text-[#2e7d32] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPopup;
