import { useState, useEffect, useMemo } from 'react';
import { sheetsService } from '../services/googleSheets';
import { useAuth } from '../context/AuthContext';
import {
    BarChart3, Users, Clock, CheckCircle, AlertCircle,
    ArrowRight, Star, SlidersHorizontal, Search, Download,
    Calendar, Building2, Phone, Shield
} from 'lucide-react';

const WorkReport = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [ratings, setRatings] = useState([]); // NEW
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usersData, complaintsData, ratingsData] = await Promise.all([
                sheetsService.getUsers(),
                sheetsService.getComplaints(true),
                sheetsService.getRatings(true) // Fetch comprehensive ratings logs
            ]);
            setUsers(usersData);
            setComplaints(complaintsData);
            setRatings(ratingsData);
        } catch (err) {
            console.error("Failed to load report data", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Metrics for All Users
    const userMetrics = useMemo(() => {
        return users.map(u => {
            const username = u.Username || '';

            // Tickets Resolved by this user
            const resolvedTickets = complaints.filter(c =>
                (c.ResolvedBy || '').toLowerCase() === username.toLowerCase()
            );

            // Tickets Reported by this user
            const reportedTickets = complaints.filter(c =>
                (c.ReportedBy || '').toLowerCase() === username.toLowerCase()
            );

            // Calculate Rating (Using 'ratings' sheet log for comprehensive history)
            // Fallback to current ticket status if log is empty
            const userRatings = ratings.filter(r => {
                const resolver = (r.ResolvedBy || '').toLowerCase();
                return resolver === username.toLowerCase() && Number(r.Rating) > 0;
            });

            let avgRating = '0.0';
            if (userRatings.length > 0) {
                const total = userRatings.reduce((acc, r) => acc + Number(r.Rating), 0);
                avgRating = (total / userRatings.length).toFixed(1);
            } else {
                // FALLBACK: Use current active complaints if 'ratings' sheet is empty/missing
                const currentRated = resolvedTickets.filter(c => Number(c.Rating) > 0);
                if (currentRated.length > 0) {
                    const total = currentRated.reduce((acc, c) => acc + Number(c.Rating), 0);
                    avgRating = (total / currentRated.length).toFixed(1);
                }
            }

            // Delayed (Simple logic: Resolved Date > Target Date if Target exists)
            const delayedCount = resolvedTickets.filter(c => {
                const target = c.TargetDate;
                const resolved = c.ResolvedDate;
                if (target && resolved) {
                    return new Date(resolved) > new Date(target);
                }
                return false;
            }).length;

            return {
                ...u,
                stats: {
                    resolved: resolvedTickets.length,
                    reported: reportedTickets.length,
                    active: reportedTickets.filter(c => c.Status === 'Open').length,
                    avgRating,
                    ratingCount: userRatings.length > 0 ? userRatings.length : 0, // Track count
                    delayed: delayedCount,
                    history: [...resolvedTickets, ...reportedTickets] // Combined history
                }
            };
        });
    }, [users, complaints, ratings]);

    const filteredUsers = userMetrics.filter(u =>
        (u.Username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.Department || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {selectedUser ? (
                // --- USER DETAIL VIEW ---
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                    {/* Header */}
                    <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
                        <div>
                            <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-6 transition-colors">
                                <ArrowRight className="rotate-180" size={16} /> Back to List
                            </button>
                            <h1 className="text-3xl font-black mb-2">{selectedUser.Username}</h1>
                            <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-2"><Building2 size={14} className="text-blue-400" /> {selectedUser.Department}</span>
                                <span className="flex items-center gap-2"><Shield size={14} className="text-purple-400" /> {selectedUser.Role}</span>
                                <span className="flex items-center gap-2"><Phone size={14} className="text-emerald-400" /> {selectedUser.Mobile}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Performance Score</p>
                                <div className="text-4xl font-black text-amber-400 flex items-center justify-end gap-2">
                                    {selectedUser.stats.avgRating || '-'} <Star fill="currentColor" size={32} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 -mt-8">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase">Closed</p>
                            <p className="text-3xl font-black text-emerald-600 mt-1">{selectedUser.stats.resolved}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase">Reported</p>
                            <p className="text-3xl font-black text-blue-600 mt-1">{selectedUser.stats.reported}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
                            <p className="text-3xl font-black text-amber-500 mt-1">{selectedUser.stats.active}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase">Delayed</p>
                            <p className="text-3xl font-black text-rose-500 mt-1">{selectedUser.stats.delayed}</p>
                        </div>
                    </div>

                    {/* Detailed History Table */}
                    <div className="p-8 pt-0">
                        <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                            <Clock size={24} className="text-slate-400" /> Detailed Activity Log
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Ticket ID</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center">Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedUser.stats.history.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-bold">No activity found.</td></tr>
                                    ) : (
                                        selectedUser.stats.history.map((c, i) => {
                                            const isResolver = (c.ResolvedBy || '').toLowerCase() === (selectedUser.Username || '').toLowerCase();
                                            return (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-600">#{c.ID}</td>
                                                    <td className="p-4 text-slate-500 font-medium">
                                                        {new Date(c.Date).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isResolver ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {isResolver ? 'Resolver' : 'Reporter'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-800 max-w-xs truncate">{c.Description}</td>
                                                    <td className="p-4">
                                                        <span className={`font-bold ${c.Status === 'Closed' || c.Status === 'Solved' ? 'text-emerald-600' :
                                                            c.Status === 'Open' ? 'text-amber-600' : 'text-slate-400'
                                                            }`}>{c.Status}</span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {c.Rating ? (
                                                            <div className="flex items-center justify-center gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={12} className={i < Number(c.Rating) ? "text-amber-500 fill-amber-500" : "text-amber-200"} />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 font-bold">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                // --- MAIN DASHBOARD VIEW ---
                <>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-8 bg-slate-900 rounded-3xl shadow-sm text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10 mb-3 inline-block">Super Admin Console</span>
                            <h1 className="text-3xl font-black mb-2">Work Report & Analytics</h1>
                            <p className="text-slate-400 font-medium max-w-lg">Monitor staff performance, track resolution times, and analyze user efficiency.</p>
                        </div>
                        <div className="relative z-10 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input
                                    className="pl-12 pr-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 font-bold focus:bg-white/20 outline-none w-full md:w-64 backdrop-blur-md transition-all focus:ring-2 focus:ring-white/20"
                                    placeholder="Search User..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {/* Background Decor */}
                        <BarChart3 className="absolute right-0 bottom-0 text-white/5 w-64 h-64 -mr-10 -mb-10 rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((u, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedUser(u)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-xs font-black text-amber-700">{u.stats.avgRating || '0.0'}</span>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors mb-1">{u.Username}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">{u.Role} • {u.Department}</p>

                                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Closed</p>
                                        <p className="font-black text-slate-800">{u.stats.resolved}</p>
                                    </div>
                                    <div className="text-center border-l border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pending</p>
                                        <p className="font-black text-amber-500">{u.stats.active}</p>
                                    </div>
                                    <div className="text-center border-l border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Delayed</p>
                                        <p className="font-black text-rose-500">{u.stats.delayed}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkReport;
