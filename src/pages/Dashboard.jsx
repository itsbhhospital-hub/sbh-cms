import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sheetsService } from '../services/googleSheets';
import ComplaintList from '../components/ComplaintList';
import ActiveUsersModal from '../components/ActiveUsersModal';
import DashboardPopup from '../components/DashboardPopup';
import DashboardSkeleton from '../components/DashboardSkeleton'; // Imported
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock, Plus, History, Shield, Users, Share2, Timer, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import DirectorDashboard from '../components/Analytics/DirectorDashboard';
import { useIntelligence } from '../context/IntelligenceContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        open: 0,
        pending: 0,
        solved: 0,
        transferred: 0,
        extended: 0,
        delayed: 0,
        activeStaff: 0
    });
    const [loading, setLoading] = useState(true); // Added loading state
    const [reopenedTickets, setReopenedTickets] = useState([]);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [showActiveStaffModal, setShowActiveStaffModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All'); // For click-to-filter
    const { stressIndex, crisisRisk } = useIntelligence();

    // Popup State
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupCategory, setPopupCategory] = useState('');
    const [popupItems, setPopupItems] = useState([]);
    const [trackTicket, setTrackTicket] = useState(null);


    const isSuperAdmin = user?.Role?.toUpperCase() === 'SUPER_ADMIN';
    const isAdmin = user?.Role?.toLowerCase() === 'admin' || user?.Role?.toUpperCase() === 'ADMIN' || isSuperAdmin;

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        setLoading(true);
        try {
            const [statsData, usersData] = await Promise.all([
                sheetsService.getDashboardStats(user.Username, user.Department, user.Role),
                isAdmin ? sheetsService.getUsers() : Promise.resolve([])
            ]);

            // ADMIN VISIBILITY FIX: Pass correct dept
            const deptFilter = isAdmin ? '' : user.Department;

            setStats({
                ...statsData,
                activeStaff: isAdmin ? usersData.filter(u => String(u.Status).toLowerCase() === 'active').length : 0
            });

            // Check for Re-opened tickets (For User/Staff) - Fetch first page of open tickets assigned to me
            if (!isAdmin) {
                const openRes = await sheetsService.getComplaintsPaginated(1, 10, '', 'Open', '', '', user.Username, user.Username, user.Role, user.Department, true);
                if (openRes && openRes.items && openRes.items.length > 0) {
                    setReopenedTickets(openRes.items);
                    setShowReopenModal(true);
                }
            }
        } catch (err) {
            console.error("Dashboard Stats Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = async (type) => {
        if (type === 'Active Staff') {
            setShowActiveStaffModal(true);
        } else {
            // Load Category Data on Click
            try {
                const res = await sheetsService.getComplaintsPaginated(
                    1, 100, // Show up to 100 in quick popup
                    '', // Filter by dept if not admin (REMOVED - rely on backend security)
                    type,
                    '',
                    '',
                    '',
                    user.Username, user.Role, user.Department
                );
                setPopupItems(res.items || []);
                setPopupCategory(type);
                setPopupOpen(true);
            } catch (err) {
                console.error("Popup data fetch error", err);
            }
        }
    };

    const StatCard = ({ icon: Icon, title, value, colorClass, bgClass, borderClass, delay, filterType }) => (
        <div
            onClick={() => handleCardClick(filterType)}
            className={`flex flex-col justify-between p-6 rounded-3xl bg-white border cursor-pointer relative overflow-hidden transition-all
                ${activeFilter === filterType && filterType !== 'Active Staff' ? 'border-[#2e7d32] border-2 shadow-none' : 'border-[#dcdcdc] shadow-none'} 
                hover:border-[#2e7d32] active:scale-[0.98] group`}
        >
            <div className={`absolute top-0 right-0 p-3 opacity-5 ${colorClass}`}>
                <Icon size={48} className="md:w-16 md:h-16" />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className={`p-3 rounded-xl ${bgClass} ${colorClass} border border-black/5`}>
                    <Icon size={20} />
                </div>
                {activeFilter === filterType && filterType !== 'Active Staff' && (
                    <div className="bg-[#2e7d32] text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">Selected</div>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-4xl font-black text-[#1f2d2a] leading-none mb-2 tracking-tighter">{value}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase opacity-80">{title}</p>
            </div>
        </div>
    );

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="w-full max-w-full overflow-x-hidden md:px-0 space-y-6 md:space-y-8 pb-10">
            <ActiveUsersModal
                isOpen={showActiveStaffModal}
                onClose={() => setShowActiveStaffModal(false)}
            />

            <DashboardPopup
                isOpen={popupOpen}
                onClose={() => setPopupOpen(false)}
                title={popupCategory}
                complaints={popupItems}
                onTrack={(ticket) => {
                    setPopupOpen(false);
                    setTrackTicket(ticket);
                }}
            />

            {user?.Username === 'AM Sir' && <DirectorDashboard />}

            {showReopenModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden border border-rose-100">
                        <div className="p-8 text-center relative">
                            <div className="absolute top-0 inset-x-0 h-1 bg-rose-500"></div>
                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-5 border border-rose-100">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-black text-[#1f2d2a] mb-2">Attention Required</h3>
                            <p className="text-xs font-bold text-rose-600 tracking-wide mb-4">Ticket Re-opened</p>
                            <p className="text-sm text-slate-500 mb-6 font-medium">
                                A ticket you previously resolved has been flagged for review.
                            </p>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex flex-wrap justify-center gap-2">
                                {reopenedTickets.map(t => (
                                    <span key={t.ID} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold shadow-none">
                                        #{t.ID}
                                    </span>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowReopenModal(false)}
                                className="w-full py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors active:scale-[0.98]"
                            >
                                Acknowledge Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hospital Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1f2d2a] tracking-tighter flex items-center gap-4 uppercase">
                        Registry <span className="text-[#2e7d32]">Unit</span>
                        <span className="px-3 py-1 rounded-xl bg-[#cfead6] border border-[#2e7d32]/10 text-[10px] font-black text-[#2e7d32] tracking-[0.2em] whitespace-nowrap uppercase">
                            Live Sync
                        </span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.3em] opacity-60">Medical Service Operational Monitoring</p>
                </div>
                <div className="w-full md:w-auto">
                    <Link to="/new-complaint" className="w-full md:w-auto px-8 py-4 bg-[#2e7d32] text-white hover:bg-[#256628] rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase">
                        <Plus size={18} strokeWidth={3} /> Register New Ticket
                    </Link>
                </div>
            </div>

            {/* Hospital Stress Index - Flattened */}
            <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 bg-white shadow-none transition-all
                ${stressIndex > 70 ? 'border-rose-200' : stressIndex > 40 ? 'border-amber-200' : 'border-[#9fd3ae]'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${stressIndex > 70 ? 'bg-rose-50 text-rose-500' : stressIndex > 40 ? 'bg-amber-50 text-amber-500' : 'bg-[#cfead6] text-[#2e7d32]'}`}>
                        <Activity size={32} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Stress Monitoring</h2>
                        <p className="text-2xl font-black text-[#1f2d2a] tracking-tight">Load Level: {stressIndex}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 w-full md:w-2/3">
                    <div className="flex-grow h-4 bg-slate-100 rounded-full overflow-hidden border border-[#dcdcdc] p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-700
                                ${stressIndex > 70 ? 'bg-rose-500' : stressIndex > 40 ? 'bg-amber-500' : 'bg-[#2e7d32]'}`}
                            style={{ width: `${stressIndex}%` }}
                        />
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 whitespace-nowrap
                        ${stressIndex > 70 ? 'bg-rose-50 text-rose-600 border-rose-100' : stressIndex > 40 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#cfead6] text-[#2e7d32] border-[#cfead6]'}`}>
                        STATUS: {crisisRisk}
                    </div>
                </div>
            </div>

            {/* Active Filter & Stats Grid */}
            <div className="space-y-4">
                {activeFilter !== 'All' && (
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Filter size={16} className="text-[#2e7d32]" />
                        Active Filter: <span className="text-[#2e7d32] bg-[#cfead6] px-2 py-0.5 rounded border border-[#2e7d32]/20">{activeFilter}</span>
                        <button onClick={() => setActiveFilter('All')} className="ml-2 text-xs text-slate-400 hover:text-[#2e7d32] underline">Clear</button>
                    </div>
                )}

                {/* Stats Grid - Standardized Green Palette */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                    <StatCard icon={AlertCircle} title="Open" value={stats.open} bgClass="bg-[#ffd59e]/30" colorClass="text-[#c2410c]" filterType="Open" />

                    <StatCard icon={Timer} title="Pending" value={stats.pending} bgClass="bg-[#cfe8ff]/40" colorClass="text-[#0369a1]" filterType="Pending" />

                    <StatCard icon={CheckCircle} title="Solved" value={stats.solved} bgClass="bg-[#d6f5e3]" colorClass="text-[#2e7d32]" filterType="Solved" />

                    <StatCard icon={Share2} title="Transferred" value={stats.transferred} bgClass="bg-[#eadcff]/40" colorClass="text-[#6d28d9]" filterType="Transferred" />

                    {isAdmin ? (
                        <>
                            <StatCard icon={Users} title="Staff Active" value={stats.activeStaff} bgClass="bg-slate-100" colorClass="text-slate-700" filterType="Active Staff" />
                            {isSuperAdmin && (
                                <StatCard icon={Clock} title="Delayed" value={stats.delayed} bgClass="bg-rose-50" colorClass="text-rose-600" filterType="Delayed" />
                            )}
                        </>
                    ) : (
                        <>
                            <StatCard icon={History} title="Extended" value={stats.extended} bgClass="bg-blue-50" colorClass="text-blue-600" filterType="Extended" />
                            <StatCard icon={Clock} title="Delayed" value={stats.delayed} bgClass="bg-rose-50" colorClass="text-rose-600" filterType="Delayed" />
                        </>
                    )}
                </div>
            </div>

            {/* List Container */}
            <div className="mt-4 md:mt-8">
                <ComplaintList initialFilter={activeFilter} autoOpenTicket={trackTicket} onAutoOpenComplete={() => setTrackTicket(null)} />
            </div>
        </div>
    );
};

export default Dashboard;
