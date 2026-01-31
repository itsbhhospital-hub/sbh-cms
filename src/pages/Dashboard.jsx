import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sheetsService } from '../services/googleSheets';
import ComplaintList from '../components/ComplaintList';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock, Plus, History, Shield, Users, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ open: 0, resolved: 0, delayed: 0, total: 0, staffCount: 0 });
    const isAdmin = user?.Role?.toLowerCase() === 'admin';

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        const [complaintsData, usersData] = await Promise.all([
            sheetsService.getComplaints(),
            isAdmin ? sheetsService.getUsers() : Promise.resolve([])
        ]);

        const role = user?.Role?.toLowerCase();
        const dept = user?.Department;

        const relevant = complaintsData.filter(c => {
            if (role === 'admin') return true;
            if (c.Department === dept) return true;
            if (c.ReportedBy === user.Username) return true;
            return false;
        });

        const open = relevant.filter(c => c.Status === 'Open').length;
        const resolved = relevant.filter(c => c.Status === 'Solved' || c.Status === 'Closed').length;
        const total = relevant.length;

        const delayed = relevant.filter(c => {
            if (c.Status !== 'Open') return false;
            const diff = Date.now() - new Date(c.Date).getTime();
            return diff > 86400000;
        }).length;

        // Calculate Staff Count (Active Users)
        const staffCount = isAdmin ? usersData.filter(u => u.Status === 'Active').length : 0;

        setStats({ open, resolved, delayed, total, staffCount });
    };

    const StatCard = ({ icon: Icon, title, value, gradient, delay, textColor }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`p-6 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] relative overflow-hidden group bg-white border border-slate-100 hover:border-pink-500/10 transition-all duration-500`}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 ${textColor}`}>
                <Icon size={120} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${gradient} shadow-lg text-white`}>
                    <Icon size={26} />
                </div>
                <div>
                    <h4 className="text-4xl font-black text-slate-800 mb-1">{value}</h4>
                    <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">{title}</p>
                </div>
            </div>
        </motion.div>
    );

    // --- UNIFIED VIBRANT THEME FOR ALL USERS (Admin + Staff) ---
    // User requested "same colourful" look for both.

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header: Vibrant Gradient for Everyone */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>

                <div className="relative z-10">
                    {isAdmin && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/20 border border-white/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-2">
                                <Shield size={12} /> Admin Console
                            </span>
                        </div>
                    )}
                    <h1 className="text-5xl font-black tracking-tight mb-2 drop-shadow-md">Dashboard</h1>
                    <p className="text-indigo-100 font-medium text-lg">
                        Overview for <span className="text-white font-black bg-white/20 px-3 py-1 rounded-xl border border-white/20 backdrop-blur-md">{user.Department || 'General'}</span> Department
                    </p>
                </div>

                <div className="flex gap-3 relative z-10">
                    {isAdmin && (
                        <Link to="/admin-users" className="bg-white/20 hover:bg-white/30 text-white px-6 py-4 rounded-2xl font-bold backdrop-blur-md border border-white/30 transition-all flex items-center gap-2">
                            <Users size={20} /> <span className="hidden md:inline">Users</span>
                        </Link>
                    )}
                    <Link to="/new-complaint" className="group flex items-center gap-3 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 hover:bg-indigo-50">
                        <div className="bg-indigo-100 p-1.5 rounded-full"><Plus size={18} className="text-indigo-600 group-hover:rotate-90 transition-transform" /></div>
                        <span>New Ticket</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid - MULTI COLOR for Everyone */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={AlertCircle} title="Open Cases" value={stats.open}
                    gradient="bg-gradient-to-br from-orange-400 to-red-500" textColor="text-orange-500" delay={0.1}
                />
                <StatCard
                    icon={CheckCircle} title="Resolved" value={stats.resolved}
                    gradient="bg-gradient-to-br from-emerald-400 to-teal-500" textColor="text-emerald-500" delay={0.2}
                />
                {!isAdmin ? (
                    <StatCard
                        icon={Clock} title="Delayed (>24h)" value={stats.delayed}
                        gradient="bg-gradient-to-br from-pink-500 to-rose-600" textColor="text-pink-500" delay={0.3}
                    />
                ) : (
                    <StatCard
                        icon={Users} title="Staff Members" value={stats.staffCount}
                        gradient="bg-gradient-to-br from-blue-500 to-indigo-600" textColor="text-blue-500" delay={0.3}
                    />
                )}

                <StatCard
                    icon={isAdmin ? Database : History} title={isAdmin ? "Total Records" : "Total History"} value={stats.total}
                    gradient="bg-gradient-to-br from-violet-500 to-purple-600" textColor="text-purple-500" delay={0.4}
                />
            </div>

            {/* Complaint Feed */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-2 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg text-white">
                        <Activity size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-wide">Live Activity Feed</h3>
                </div>
                {/* Wrap ComplaintList in a clean container but let the cards inside pop */}
                <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-xl">
                    <ComplaintList />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
