import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sheetsService } from '../services/googleSheets';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, AlertTriangle, Search, Calendar, Hash, X, Building2, User, ArrowRight, RefreshCw, Star, BarChart3, TrendingUp } from 'lucide-react';

import { memo } from 'react';

// safeGet is no longer needed as data is normalized in googleSheets.js


const PerformanceWidget = ({ complaints, user }) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const stats = useMemo(() => {
        const role = (user?.Role || '').toLowerCase();
        const username = (user?.Username || '').toLowerCase();

        // 1. Calculate MY Stats (as Resolver) - Only count CLOSED tickets
        const myResolved = complaints.filter(c =>
            (c.ResolvedBy || '').toLowerCase() === username &&
            ((c.Status || '').toLowerCase() === 'closed' || (c.Status || '').toLowerCase() === 'solved')
        );

        let totalDays = 0;
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let ratedCount = 0;
        let totalRating = 0;

        myResolved.forEach(c => {
            const openDate = new Date(c.Date);
            const closeDate = new Date(c.ResolvedDate);
            if (!isNaN(openDate) && !isNaN(closeDate)) {
                const diffTime = Math.max(0, closeDate - openDate);
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                totalDays += diffDays;
            }
            const r = Number(c.Rating);
            if (r > 0) {
                ratingCounts[r] = (ratingCounts[r] || 0) + 1;
                totalRating += r;
                ratedCount++;
            }
        });

        const avgDays = myResolved.length ? (totalDays / myResolved.length).toFixed(1) : '0';
        const avgRating = ratedCount ? (totalRating / ratedCount).toFixed(1) : 'N/A';
        const efficiency = myResolved.length ? Math.min(100, Math.max(0, (1 / (totalDays / myResolved.length || 1)) * 100)).toFixed(0) : '0';

        // 2. Admin Leaderboard Data
        const leaderboard = [];
        if (role === 'admin') {
            const resolverMap = {};
            complaints.forEach(c => {
                const r = c.ResolvedBy;
                if (!r) return;
                if (!resolverMap[r]) resolverMap[r] = { name: r, resolved: 0, totalRating: 0, count: 0 };
                resolverMap[r].resolved++;
                if (c.Rating) {
                    resolverMap[r].totalRating += Number(c.Rating);
                    resolverMap[r].count++;
                }
            });
            Object.values(resolverMap).forEach(s => {
                leaderboard.push({
                    name: s.name,
                    resolved: s.resolved,
                    rating: s.count ? (s.totalRating / s.count).toFixed(1) : '-'
                });
            });
            leaderboard.sort((a, b) => b.resolved - a.resolved);
        }

        return { myResolvedCount: myResolved.length, avgDays, avgRating, efficiency, ratingCounts, leaderboard };
    }, [complaints, user]);

    return (
        <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* My Performance Card */}
                {(user?.Role || '').toLowerCase() !== 'admin' && (
                    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-700 transform group-hover:scale-110">
                            <TrendingUp size={120} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Work Efficiency</h3>
                                <p className="text-4xl font-black flex items-baseline gap-2">
                                    {stats.efficiency}<span className="text-lg opacity-60">%</span>
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-8 border-l border-white/20 pl-6">
                                <div>
                                    <p className="text-2xl font-black">{stats.myResolvedCount}</p>
                                    <p className="text-[10px] font-bold uppercase text-white/60">Tickets</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{stats.avgDays}</p>
                                    <p className="text-[10px] font-bold uppercase text-white/60">Avg Days</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-amber-300 flex items-center gap-1">
                                        {stats.avgRating} <Star size={16} fill="currentColor" />
                                    </p>
                                    <p className="text-[10px] font-bold uppercase text-white/60">Rating</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-sm transition-all"
                        >
                            {showAdvanced ? 'Close Intelligence View' : 'Open Work Intelligence'}
                        </button>
                    </div>
                )}

                {/* Admin Team Trigger */}
                {user?.Role === 'admin' && (
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        className="bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-blue-200 hover:shadow-xl transition-all text-left flex flex-col justify-between h-full group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm border border-blue-100">
                                <BarChart3 size={28} />
                            </div>
                            <ArrowRight size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 mb-1">Team Efficiency</h3>
                            <p className="text-sm text-slate-500 font-medium">Analyze resolution times & ratings</p>
                        </div>
                    </button>
                )}

                {/* Work Profile Snapshot (Small Card) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hidden lg:flex flex-col justify-between overflow-hidden relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">Operational Pulse</p>
                    </div>
                    <div className="h-12 w-full flex items-end gap-1 px-1">
                        {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-100 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Advanced Intelligence Panel */}
            {showAdvanced && (
                <div className="bg-white rounded-[2rem] p-8 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-12 animate-in zoom-in-95 duration-500 shadow-2xl shadow-indigo-100/50">
                    <div>
                        <h4 className="text-sm font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={16} className="text-indigo-600" /> Rating Distribution
                        </h4>
                        <div className="space-y-4">
                            {[5, 4, 3, 2, 1].map(r => {
                                const count = stats.ratingCounts[r] || 0;
                                const pct = stats.myResolvedCount ? (count / stats.myResolvedCount * 100) : 0;
                                return (
                                    <div key={r} className="flex items-center gap-4">
                                        <div className="w-8 text-xs font-black text-slate-400 flex items-center gap-0.5">{r}<Star size={10} fill="currentColor" /></div>
                                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-400 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.3)] transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <div className="w-10 text-right text-xs font-black text-slate-900">{count}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col justify-center text-center p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                        <div className="inline-flex w-16 h-16 items-center justify-center p-4 bg-white rounded-2xl text-indigo-600 mb-4 shadow-sm mx-auto">
                            <Clock size={32} />
                        </div>
                        <h5 className="text-xl font-black text-slate-900 mb-2">Efficiency Analysis</h5>
                        <p className="text-sm text-slate-600 leading-relaxed font-bold">
                            You resolve complaints in {stats.avgDays} days on average.
                            Your work impact score is **{stats.efficiency}%** based on current targets.
                        </p>
                    </div>
                </div>
            )}

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                                    <BarChart3 size={24} />
                                </div>
                                <h3 className="font-black text-2xl text-slate-900">Team Analytics</h3>
                            </div>
                            <button onClick={() => setShowLeaderboard(false)} className="p-2.5 hover:bg-slate-200 rounded-full transition-all"><X size={24} /></button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-4">
                            <table className="w-full text-left">
                                <thead className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="p-4">Rank & User</th>
                                        <th className="p-4 text-center">Efficiency</th>
                                        <th className="p-4 text-right">Avg Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats.leaderboard.map((s, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm ${i === 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-black text-slate-800">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase ring-1 ring-emerald-200">
                                                    <CheckCircle size={14} /> {s.resolved} Fixed
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1 font-black text-lg text-slate-900">
                                                    {s.rating} <Star size={16} className="text-amber-500" fill="currentColor" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- RE-USABLE MEMOIZED ITEM TO PREVENT LAG ---
const ComplaintItem = memo(({ complaint, onClick }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Solved':
            case 'Closed': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div onClick={() => onClick(complaint)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 cursor-pointer hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusBadge(complaint.Status)}`}>{complaint.Status}</span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">#{complaint.ID}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 font-inter">{complaint.Description}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{complaint.Department} • {complaint.ReportedBy} • {complaint.Unit}</p>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-emerald-500" />
            </div>
        </div>
    );
});

const ComplaintList = ({ onlyMyComplaints = false }) => {
    const { user } = useAuth();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Actions
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [actionMode, setActionMode] = useState(null);

    // Deep Linking
    const [searchParams] = useSearchParams();
    const ticketIdParam = searchParams.get('ticketId');

    useEffect(() => {
        if (ticketIdParam && complaints.length > 0) {
            const found = complaints.find(c => String(c.ID) === String(ticketIdParam));
            if (found) {
                // Open modal if ticket ID matches URL param
                openDetailModal(found);
            }
        }
    }, [ticketIdParam, complaints.length]); // Only trigger on length change or param change
    const [remark, setRemark] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0); // NEW: For hover effect
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // IMMUTABLE RATING LOGIC: Fetch separate ratings sheet
    const [immutableRatings, setImmutableRatings] = useState([]);

    useEffect(() => { loadComplaints(); }, []);

    const loadComplaints = async () => {
        try {
            // Parallel Fetch for Performance
            const [complaintsData, ratingsData] = await Promise.all([
                sheetsService.getComplaints(true),
                sheetsService.getRatings(true)
            ]);
            setComplaints(complaintsData);
            setImmutableRatings(ratingsData || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Helper: Check if a ticket ID exists in the immutable ratings ledger
    const hasImmutableRating = (ticketId) => {
        if (!ticketId) return false;
        // Check local state first (Optimistic) or immutable ledger
        const local = complaints.find(c => c.ID === ticketId)?.Rating;
        if (local) return true;

        const tid = String(ticketId).toLowerCase();
        return immutableRatings.some(r => String(r.ID || r['Ticket ID']).toLowerCase() === tid);
    };

    // Helper: Get the rating value from immutable ledger if main sheet is empty
    const getImmutableRatingValue = (ticketId) => {
        const tid = String(ticketId).toLowerCase();
        const found = immutableRatings.find(r => String(r.ID || r['Ticket ID']).toLowerCase() === tid);
        return found ? found.Rating : null;
    };

    const openDetailModal = (complaint) => {
        // MERGE: Ensure we have the latest rating info even if main sheet is stale
        const ledgerRating = getImmutableRatingValue(complaint.ID);
        const mergedComplaint = {
            ...complaint,
            Rating: complaint.Rating || ledgerRating, // Trust Ledger if Main is empty
        };

        setSelectedComplaint(mergedComplaint);
        setActionMode(null);
        setRemark('');
        setTargetDate('');
        setRating(0); // Reset rating
        setDetailModalOpen(true);
    };

    // --- RE-OPEN CHECK ---
    const canReopen = (complaint) => {
        const resolvedDateStr = complaint.ResolvedDate || complaint.Date; // Fallback
        if (!resolvedDateStr) return true; // Safety
        const resolvedTime = new Date(resolvedDateStr).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - resolvedTime) / (1000 * 60 * 60);
        return hoursDiff <= 24; // Only allow if within 24 hours
    };

    const handleConfirmAction = async () => {
        if (!selectedComplaint || !actionMode) return;
        const ticketId = selectedComplaint.ID;
        if (!ticketId) return alert("Error: Ticket ID is missing.");

        // --- OPTIMISTIC UPDATE (Instant Feedback) ---
        const previousComplaints = [...complaints];
        const optimisticStatus = (actionMode === 'Resolve' || actionMode === 'Close' || actionMode === 'Rate' || actionMode === 'Force Close') ?
            (actionMode === 'Force Close' ? 'Force Close' : 'Closed') :
            (actionMode === 'Re-open' ? 'Open' : selectedComplaint.Status);

        setComplaints(prev => prev.map(c => {
            if (c.ID === ticketId) {
                return {
                    ...c,
                    Status: optimisticStatus,
                    Rating: actionMode === 'Rate' ? rating : c.Rating, // Immediate Rating Update
                    Remark: remark || c.Remark
                };
            }
            return c;
        }));

        setIsSubmitting(true);
        try {
            let newStatus = selectedComplaint.Status;
            if (actionMode === 'Resolve' || actionMode === 'Close' || actionMode === 'Rate' || actionMode === 'Force Close') {
                newStatus = actionMode === 'Force Close' ? 'Force Close' : 'Closed';
            }
            if (actionMode === 'Extend') newStatus = 'Extend';
            if (actionMode === 'Re-open') newStatus = 'Open';

            await sheetsService.updateComplaintStatus(ticketId, newStatus, user.Username, remark, targetDate, rating);

            // RESET ALL STATES TO CLEAN UP
            setActionMode(null);
            setRemark('');
            setRating(0);
            setTargetDate('');
            setSelectedComplaint(null); // Clear selection to ensure UI refreshes correctly
            setDetailModalOpen(false);
            setShowSuccess(true);

            // Force refresh data (Sync with backend)
            setTimeout(() => {
                loadComplaints();
            }, 600);

        } catch (error) {
            console.error(error);
            alert("Failed to update status.");
            setComplaints(previousComplaints); // Revert on error
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            const role = (user.Role || '').toLowerCase();
            const userDept = (user.Department || '').toLowerCase();
            const username = (user.Username || '').toLowerCase();
            const complaintDept = (c.Department || '').toLowerCase();
            const reportedBy = (c.ReportedBy || '').toLowerCase();

            let isVisible = false;
            if (onlyMyComplaints) {
                if (reportedBy === username) isVisible = true;
            } else {
                if (role === 'admin') isVisible = true;
                else if (userDept && complaintDept === userDept) isVisible = true;
                else if (reportedBy === username) isVisible = true;
            }
            if (!isVisible) return false;

            const status = c.Status;
            if (filter !== 'All' && status !== filter) return false;

            const term = searchTerm.toLowerCase();
            return (c.ID || '').toLowerCase().includes(term) || (c.Description || '').toLowerCase().includes(term);
        }).sort((a, b) => new Date(b.Date) - new Date(a.Date));
    }, [complaints, filter, searchTerm, user, onlyMyComplaints]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Open': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Solved':
            case 'Closed': return 'bg-rose-50 text-rose-700 border-rose-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <PerformanceWidget complaints={complaints} user={user} />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">

                    {/* Filter Tabs */}
                    <div className="flex p-1 bg-slate-100/80 rounded-xl w-full xl:w-auto overflow-x-auto no-scrollbar">
                        {['All', 'Open', 'Closed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-72 group">
                            <Search className="absolute left-3 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-400"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={loadComplaints}
                            disabled={loading}
                            className={`p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 ${loading ? 'cursor-wait' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="p-4 grid gap-3">
                    {filteredComplaints.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 font-bold">No tickets found.</div>
                    ) : (
                        filteredComplaints.map((c, i) => (
                            <ComplaintItem key={c.ID || i} complaint={c} onClick={openDetailModal} />
                        ))
                    )}
                </div>
            </div>

            {/* DETAIL MODAL - Optimized Fixed Position */}
            {detailModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-6 lg:p-12 animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setDetailModalOpen(false)} />

                    <div className="relative bg-white w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] rounded-none md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300 ease-out">

                        {/* LEFT: TICKET JOURNEY (Timeline) */}
                        <div className="w-full md:w-1/2 bg-slate-50 border-r border-slate-100 flex flex-col">
                            <div className="p-6 border-b border-slate-200 bg-white">
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border ${getStatusBadge(selectedComplaint.Status)}`}>
                                    {selectedComplaint.Status}
                                </span>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Ticket #{selectedComplaint.ID}</h1>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={12} /> Opened {new Date(selectedComplaint.Date).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 sticky top-0 bg-slate-50 py-2 z-10">Ticket Journey</h4>
                                <div className="space-y-6 relative ml-2">
                                    {/* Vertical Line */}
                                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-200"></div>

                                    {/* Creation Node */}
                                    <div className="relative pl-8 group">
                                        <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10 group-hover:scale-125 transition-transform"></div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm relative group-hover:border-blue-200 transition-colors">
                                            <p className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                                                <span>Ticket Created</span>
                                                <span className="font-mono opacity-50 text-[10px]">{new Date(selectedComplaint.Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                            <p className="text-sm font-medium text-slate-800">
                                                Request by <span className="font-bold text-slate-900">{selectedComplaint.ReportedBy}</span> in <span className="text-blue-600">{selectedComplaint.Department}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* History Nodes */}
                                    {(selectedComplaint.History || '').split('\n').map((log, i) => {
                                        if (log.includes('Ticket Created')) return null; // Skip duplicate creation log if present
                                        const isResolution = log.toLowerCase().includes('resolved') || log.toLowerCase().includes('closed');
                                        const isExtension = log.toLowerCase().includes('extended');

                                        return (
                                            <div key={i} className="relative pl-8 group animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 group-hover:scale-125 transition-transform ${isResolution ? 'bg-emerald-500' : isExtension ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                                <p className="text-[10px] font-bold text-slate-400 mb-1">{log.match(/\[(.*?)\]/)?.[1] || 'Update'}</p>
                                                <p className="text-xs font-medium text-slate-700 bg-white/50 p-2 rounded-lg border border-transparent group-hover:bg-white group-hover:border-slate-200 transition-all">
                                                    {log.split(']').pop().trim()}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: DETAILS & ACTIONS */}
                        <div className="w-full md:w-1/2 flex flex-col bg-white overflow-hidden max-h-[50vh] md:max-h-full">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={16} className="text-slate-400" /> Issue Details</h3>
                                <button onClick={() => setDetailModalOpen(false)} className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={18} className="text-slate-500" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* Description Box */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Issue Description</h4>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {selectedComplaint.Description}
                                    </p>
                                </div>

                                {/* Meta Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            {selectedComplaint.Status === 'Closed' ? 'Final Resolver' : 'Assigned To'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                {selectedComplaint.Status === 'Closed' ? <CheckCircle size={12} /> : <User size={12} />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{selectedComplaint.ResolvedBy || 'Pending'}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Date</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className={selectedComplaint.TargetDate ? "text-slate-600" : "text-slate-300"} />
                                            <span className="text-xs font-bold text-slate-700">{selectedComplaint.TargetDate || 'Not Set'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RESOLUTION REPORT (Gold Card) */}
                                {(selectedComplaint.Status === 'Solved' || selectedComplaint.Status === 'Closed') && (
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl -mr-16 -mt-16 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star size={12} fill="currentColor" /> Resolution Report</h4>

                                        <div className="flex justify-between items-end mb-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-600/70 uppercase">User Rating</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-3xl font-black text-amber-600">{selectedComplaint.Rating || '-'}</span>
                                                    <span className="text-xs font-bold text-amber-600/60 mt-2">/ 5</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={16} className={i < Number(selectedComplaint.Rating) ? "text-amber-500 fill-amber-500" : "text-amber-200"} />
                                                ))}
                                            </div>
                                        </div>

                                        {selectedComplaint.Rating && (
                                            <div className="bg-white/60 p-3 rounded-xl border border-amber-100/50 backdrop-blur-sm">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">User Feedback</p>
                                                <p className="text-xs font-medium text-slate-700 italic">"{selectedComplaint.Remark}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50">
                                {actionMode ? (
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200 max-w-lg mx-auto w-full">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                                {actionMode === 'Rate' ? 'Rate Service Quality' : (actionMode === 'Resolve' || actionMode === 'Close' || actionMode === 'Force Close') ? 'Force Close Ticket' : actionMode}
                                            </h4>
                                            <button onClick={() => setActionMode(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                                        </div>

                                        {actionMode === 'Rate' && (
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
                                                                className={`transition-colors duration-200 drop-shadow-sm ${(hoverRating || rating) >= star ? "text-amber-400 fill-amber-400" : "text-slate-200"
                                                                    }`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="h-4 text-xs font-bold text-amber-600 transition-opacity duration-300">
                                                    {(hoverRating || rating) > 0 ? (['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][(hoverRating || rating) - 1]) : ''}
                                                </p>
                                            </div>
                                        )}

                                        {actionMode === 'Extend' && (
                                            <div className="mb-4">
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select New Date</label>
                                                <input type="date" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                                            </div>
                                        )}

                                        <div className="relative">
                                            <textarea
                                                className="w-full p-4 border border-slate-200 rounded-xl text-sm font-medium h-32 resize-none outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                                                placeholder={actionMode === 'Rate' ? "Write a remark... (Why this rating?)" : "Reason for this action..."}
                                                value={remark}
                                                onChange={e => setRemark(e.target.value)}
                                            />
                                        </div>

                                        <div className="mt-6">
                                            <button
                                                onClick={handleConfirmAction}
                                                disabled={isSubmitting || (actionMode === 'Rate' && rating === 0)}
                                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>Processing...</>
                                                ) : (
                                                    <>Confirm {actionMode}</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {/* Dept/Admin Action: Close (Only for Dept Staff or Admin) */}
                                        {selectedComplaint.Status === 'Open' &&
                                            (user.Role === 'admin' || (user.Department || '').toLowerCase() === (selectedComplaint.Department || '').toLowerCase()) && (
                                                <>
                                                    <button onClick={() => setActionMode('Resolve')} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all">Close Ticket</button>
                                                    <button onClick={() => setActionMode('Extend')} className="flex-1 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50">Extend</button>
                                                </>
                                            )}

                                        {/* Reporter Action: Rate (Simple Button, No Animation) */}
                                        {selectedComplaint.Status === 'Closed' &&
                                            !selectedComplaint.Rating &&
                                            !hasImmutableRating(selectedComplaint.ID) && // Check Immutable Ledger
                                            (selectedComplaint.ReportedBy || '').toLowerCase() === (user.Username || '').toLowerCase() && (
                                                <button
                                                    onClick={() => setActionMode('Rate')}
                                                    className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md active:scale-95"
                                                >
                                                    Rate This Service
                                                </button>
                                            )}

                                        {/* Reporter Action: Re-open (Only if Closed) */}
                                        {selectedComplaint.Status === 'Closed' &&
                                            canReopen(selectedComplaint) &&
                                            (selectedComplaint.ReportedBy || '').toLowerCase() === (user.Username || '').toLowerCase() && (
                                                <button onClick={() => setActionMode('Re-open')} className="flex-1 py-3 bg-white text-rose-600 font-bold rounded-xl border border-rose-100 hover:bg-rose-50 transition-all shadow-sm">
                                                    Re-open Ticket
                                                </button>
                                            )}

                                        {/* Force Close Fallback for Admin */}
                                        {user.Role === 'admin' && selectedComplaint.Status === 'Open' && (
                                            <button
                                                onClick={() => setActionMode('Force Close')}
                                                className="w-full py-3 mt-2 bg-rose-50 text-rose-600 font-black rounded-xl border border-rose-200 hover:bg-rose-100 transition-all shadow-sm"
                                            >
                                                Force Close (Admin)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm ${showSuccess ? 'block' : 'hidden'}`}>
                <div className="bg-white p-8 rounded-2xl flex flex-col items-center animate-in zoom-in">
                    <CheckCircle className="text-green-500 mb-4" size={48} />
                    <h3 className="font-bold text-xl mb-4">Updated Successfully!</h3>
                    <button onClick={() => setShowSuccess(false)} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg">Continue</button>
                </div>
            </div>
        </div>
    );
};

export default ComplaintList;
