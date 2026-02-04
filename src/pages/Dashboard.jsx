import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sheetsService } from '../services/googleSheets';
import ComplaintList from '../components/ComplaintList';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock, Plus, History, Shield, Users, Database, LayoutDashboard } from 'lucide-react';
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
        const [complaintsData, usersData] = await Promise.all([
            sheetsService.getComplaints(),
            isAdmin ? sheetsService.getUsers() : Promise.resolve([])
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

        setStats({ open, resolved, delayed, total, staffCount });

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

    const StatCard = ({ icon: Icon, title, value, colorClass, bgClass, delay }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        >
            {/* Re-open Alert Modal */}
            {showReopenModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-md w-full overflow-hidden"
                    >
                        <div className="p-1 bg-rose-500"></div>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Attention Required!</h3>
                            <p className="text-slate-600 font-bold leading-relaxed">
                                "Aapke dwara solve kiye gaye complaint ko fir se reopen kiya gaya hai. Krapaya is par jaldi karyawahi kare."
                            </p>

                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Re-opened Tickets</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {reopenedTickets.map(t => (
                                        <span key={t.ID} className="px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded-lg text-sm font-black shadow-sm">
                                            #{t.ID}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setShowReopenModal(false)}
                                className="mt-8 w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                Noted, Show Complaints
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-500`}>
                <Icon size={100} className="text-slate-900" />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bgClass} ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className="text-2xl font-bold text-slate-800 mb-1">{value}</h4>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{title}</p>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600">
                        <LayoutDashboard size={20} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900/60">
                            {isAdmin ? 'Admin Console' : 'Staff Dashboard'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Overview</h1>
                    <p className="text-slate-500 font-medium">
                        Welcome back, <span className="text-slate-900 font-bold">{user.Username}</span>
                        {user.Department && <span className="bg-slate-100 px-2 py-0.5 rounded-md text-sm ml-2 border border-slate-200">{user.Department}</span>}
                    </p>
                </div>

                <div className="flex gap-3 relative z-10">
                    {isAdmin && (
                        <Link to="/user-management" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow">
                            <Users size={18} /> <span className="hidden md:inline">Manage Users</span>
                        </Link>
                    )}
                    <Link to="/new-complaint" className="group flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all active:scale-[0.98] hover:bg-emerald-700">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        <span>New Ticket</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={AlertCircle} title="Open Cases" value={stats.open}
                    bgClass="bg-orange-50" colorClass="text-orange-600" delay={0.1}
                />
                <StatCard
                    icon={CheckCircle} title="Resolved" value={stats.resolved}
                    bgClass="bg-emerald-50" colorClass="text-emerald-600" delay={0.2}
                />
                {!isAdmin ? (
                    <StatCard
                        icon={Clock} title="Delayed Cases" value={stats.delayed}
                        bgClass="bg-red-50" colorClass="text-red-600" delay={0.3}
                    />
                ) : (
                    <StatCard
                        icon={Users} title="Active Staff" value={stats.staffCount}
                        bgClass="bg-blue-50" colorClass="text-blue-600" delay={0.3}
                    />
                )}

                <StatCard
                    icon={isAdmin ? Database : History} title={isAdmin ? "Total Records" : "My History"} value={stats.total}
                    bgClass="bg-purple-50" colorClass="text-purple-600" delay={0.4}
                />
            </div>

            {/* Complaint Feed */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Activity size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity Feed</h3>
                </div>
                {/* Clean container for list */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative min-h-[400px]">
                    <ComplaintList />
                </div>
            </div>

        </div>
    );
};

export default Dashboard;

