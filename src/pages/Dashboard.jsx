import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sheetsService } from '../services/googleSheets';
import ComplaintList from '../components/ComplaintList';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock, Plus, History, Shield, Users, Database, LayoutDashboard, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ open: 0, resolved: 0, delayed: 0, total: 0, staffCount: 0 });
    const [reopenedTickets, setReopenedTickets] = useState([]);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const isAdmin = user?.Role?.toLowerCase() === 'admin';

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        const [complaintsData, usersData, ratingsData] = await Promise.all([
            sheetsService.getComplaints(),
            isAdmin ? sheetsService.getUsers() : Promise.resolve([]),
            sheetsService.getRatings(true) // Fetch comprehensive ratings
        ]);

        const role = (user.Role || '').toLowerCase().trim();
        const userDept = (user.Department || '').toLowerCase().trim();
        const username = (user.Username || '').toLowerCase().trim();

        const relevant = complaintsData.filter(c => {
            const cDept = (c.Department || '').toLowerCase().trim();
            const cReportedBy = (c.ReportedBy || '').toLowerCase().trim();

            if (role === 'admin') return true;
            if (userDept && cDept === userDept) return true;
            if (cReportedBy === username) return true;
            return false;
        });

        const open = relevant.filter(c => (c.Status || '').trim().toLowerCase() === 'open').length;
        const resolved = relevant.filter(c => {
            const s = (c.Status || '').trim().toLowerCase();
            return s === 'solved' || s === 'closed';
        }).length;
        const total = relevant.length;

        const delayed = relevant.filter(c => {
            if ((c.Status || '').trim().toLowerCase() !== 'open') return false;
            const d = c.Date;
            if (!d) return false;
            const diff = Date.now() - new Date(d).getTime();
            return diff > 86400000;
        }).length;

        // Calculate Staff Count (Active Users)
        const staffCount = isAdmin ? usersData.filter(u => u.Status === 'Active').length : 0;

        // New Efficiency Logic (Based on Immutable Ratings Sheet)
        let efficiencyScore = '0.0';
        if (isAdmin) {
            // System-wide Average
            const validRatings = ratingsData.filter(r => Number(r.Rating) > 0);
            if (validRatings.length > 0) {
                const sum = validRatings.reduce((acc, r) => acc + Number(r.Rating), 0);
                efficiencyScore = (sum / validRatings.length).toFixed(1);
            }
        } else {
            // Personal Efficiency (If I am a Staff member)
            const myRatings = ratingsData.filter(r => (r.ResolvedBy || '').toLowerCase() === username && Number(r.Rating) > 0);
            if (myRatings.length > 0) {
                const sum = myRatings.reduce((acc, r) => acc + Number(r.Rating), 0);
                efficiencyScore = (sum / myRatings.length).toFixed(1);
            }
        }

        setStats({ open, resolved, delayed, total, staffCount, efficiencyScore });

        // Check for Re-opened tickets assigned to ME
        if (role !== 'user') {
            const reopens = complaintsData.filter(c =>
                (c.Status || '').trim().toLowerCase() === 'open' &&
                (c.ResolvedBy || '').toLowerCase() === username &&
                username !== ''
            );
            if (reopens.length > 0) {
                setReopenedTickets(reopens);
                setShowReopenModal(true);
            }
        }
    };

    // Enterprise "StatCard" - High Performance, Minimalist
    const StatCard = ({ icon: Icon, title, value, colorClass, bgClass, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3, ease: "easeOut" }}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-default group"
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${bgClass} ${colorClass} bg-opacity-50 group-hover:scale-105 transition-transform`}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
                {/* Optional: Add trend indicator here if available in future */}
            </div>
            <div>
                <h4 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</h4>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{title}</p>
            </div>

            {/* Re-open Alert Warning (Logic Preserved) */}
            {showReopenModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Ticket Re-opened</h3>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                A ticket you resolved has been re-opened by the reporter. Please review immediately.
                            </p>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6 flex flex-wrap justify-center gap-2">
                                {reopenedTickets.map(t => (
                                    <span key={t.ID} className="px-2 py-1 bg-white border border-rose-100 text-rose-600 rounded text-xs font-bold shadow-sm">
                                        #{t.ID}
                                    </span>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowReopenModal(false)}
                                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                            >
                                Acknowledge & View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-32">

            {/* Enterprise Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Dashboard
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {isAdmin ? 'Admin' : 'Staff'}
                        </span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Overview of system performance</p>
                </div>

                <div className="flex gap-3">
                    {isAdmin && (
                        <Link to="/user-management" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2">
                            <Users size={16} /> Users
                        </Link>
                    )}
                    <Link to="/new-complaint" className="px-5 py-2.5 bg-slate-900 text-white hover:bg-black rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95">
                        <Plus size={16} /> New Ticket
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Tighter, Cleaner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={AlertCircle} title="OPEN" value={stats.open} bgClass="bg-amber-50" colorClass="text-amber-600" delay={0} />
                <StatCard icon={CheckCircle} title="SOLVED" value={stats.resolved} bgClass="bg-emerald-50" colorClass="text-emerald-600" delay={0.05} />
                <StatCard icon={Star} title="PERFORMANCE" value={stats.efficiencyScore || 'N/A'} bgClass="bg-indigo-50" colorClass="text-indigo-600" delay={0.1} />

                {!isAdmin ? (
                    <StatCard icon={Clock} title="DELAYED" value={stats.delayed} bgClass="bg-rose-50" colorClass="text-rose-600" delay={0.15} />
                ) : (
                    <StatCard icon={Users} title="ACTIVE STAFF" value={stats.staffCount} bgClass="bg-blue-50" colorClass="text-blue-600" delay={0.15} />
                )}
            </div>

            {/* List Container */}
            <div className="mt-8">
                <ComplaintList />
            </div>
        </div>
    );
};

export default Dashboard;

