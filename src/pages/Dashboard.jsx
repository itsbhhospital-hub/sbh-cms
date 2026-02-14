import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ComplaintList from '../components/ComplaintList';
import ActiveUsersModal from '../components/ActiveUsersModal';
import DashboardPopup from '../components/DashboardPopup';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock, Plus, History, Shield, Users, Share2, Timer, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import DirectorDashboard from '../components/Analytics/DirectorDashboard';
import { useIntelligence } from '../context/IntelligenceContext';

const normalize = (val) => String(val || '').toLowerCase().trim();

const Dashboard = () => {
    const { user } = useAuth();

    // ------------------------------------------------------------------
    // INTELLIGENCE & DATA LAYER (Global Sync)
    // ------------------------------------------------------------------
    const {
        allTickets,
        stats,
        boosters,
        users: activeUsers,
        loading: intelligenceLoading,
        stressIndex,
        crisisRisk
    } = useIntelligence();

    // ------------------------------------------------------------------
    // LOCAL UI STATE
    // ------------------------------------------------------------------
    const [reopenedTickets, setReopenedTickets] = useState([]);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [showActiveStaffModal, setShowActiveStaffModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    // Popup System
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupCategory, setPopupCategory] = useState('');
    const [popupItems, setPopupItems] = useState([]);
    const [trackTicket, setTrackTicket] = useState(null);

    // Automated Alerts
    const [boosterNotice, setBoosterNotice] = useState(null);
    const [delayAlert, setDelayAlert] = useState(null);

    const isSuperAdmin = user?.Role?.toUpperCase() === 'SUPER_ADMIN';
    const isAdmin = user?.Role?.toLowerCase() === 'admin' || user?.Role?.toUpperCase() === 'ADMIN' || isSuperAdmin;

    // ------------------------------------------------------------------
    // AUTOMATED CHECKS (Run when Data Updates)
    // ------------------------------------------------------------------
    useEffect(() => {
        if (intelligenceLoading || !allTickets.length) return;

        // 1. DELAY POPUP (Daily Logic)
        const checkDelay = () => {
            const todayStr = new Date().toLocaleDateString();
            const lastSeenDate = localStorage.getItem(`delay_alert_date_${user.Username}`);

            if (lastSeenDate === todayStr) return;

            const uDept = normalize(user.Department);
            const uname = normalize(user.Username);
            let delayCount = 0;

            allTickets.forEach(t => {
                if (String(t.Status).toLowerCase() === 'delayed') {
                    if (isAdmin) {
                        delayCount++;
                    } else {
                        const rowDept = normalize(t.Department);
                        const rowBy = normalize(t.ReportedBy);
                        const rowReporter = normalize(t.Reporter || t.Username);

                        // Strict Rule: Target Dept Only, Exclude Reporter
                        if (rowDept === uDept && rowBy !== uname && rowReporter !== uname) {
                            delayCount++;
                        }
                    }
                }
            });

            if (delayCount > 0) {
                setDelayAlert({ count: delayCount, dept: isAdmin ? 'All Departments' : user.Department });
            }
        };

        // 2. BOOSTER POPUP
        const checkBooster = () => {
            if (!boosters || boosters.length === 0) return;
            const uDept = normalize(user.Department);
            const lastSeenBooster = localStorage.getItem(`last_booster_${user.Username}`);

            const relevant = boosters.filter(b => {
                const isTargetDept = isAdmin || normalize(b.Department) === uDept;
                if (!isTargetDept) return false;

                const ticket = allTickets.find(t => String(t.ID) === String(b.TicketID));
                // Only show if ticket is still active
                return ticket ? ['open', 'pending', 'transferred', 're-open'].includes(String(ticket.Status).toLowerCase()) : true;
            }).sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

            if (relevant.length > 0) {
                const latest = relevant[0];
                if (latest.Timestamp !== lastSeenBooster) {
                    setBoosterNotice(latest);
                }
            }
        };

        // 3. REOPEN NOTIFICATION
        const checkReopen = () => {
            if (isAdmin) return;
            const reopened = allTickets.filter(t =>
                String(t.Status).toLowerCase() === 'open' &&
                (normalize(t.Reporter || '') === normalize(user.Username) || normalize(t.ReportedBy || '') === normalize(user.Username))
            ).slice(0, 10);

            if (reopened.length > 0) {
                // Only show if we haven't acknowledged active reopening? 
                // Existing logic didn't assume persistence. We'll show it.
                setReopenedTickets(reopened);
                setShowReopenModal(true);
            }
        };

        checkDelay();
        checkBooster();
        checkReopen();

    }, [allTickets, boosters, intelligenceLoading, isAdmin, user]);


    // ------------------------------------------------------------------
    // UI HANDLERS
    // ------------------------------------------------------------------
    const handleCardClick = (type) => {
        if (type === 'Active Staff') {
            setShowActiveStaffModal(true);
        } else {
            const uRole = String(user.Role || '').toUpperCase().trim();
            const isAdminView = uRole === 'ADMIN' || uRole === 'SUPER_ADMIN';
            const uDept = normalize(user.Department);
            const uname = normalize(user.Username);
            const todayStr = new Date().toLocaleDateString();

            const filtered = allTickets.filter(t => {
                // Visibility Check
                const rowDept = normalize(t.Department);
                const rowBy = normalize(t.ReportedBy);
                const rowReporter = normalize(t.Reporter || t.Username);
                const rowResolver = normalize(t.ResolvedBy); // NEW: Solved by me check
                const isVisible = isAdminView || rowDept === uDept || rowBy === uname || rowReporter === uname || rowResolver === uname;

                if (!isVisible) return false;

                const status = normalize(t.Status);
                const regDate = String(t.Date || '').replace(/'/g, '').trim();
                const targetDateStr = String(t.TargetDate || '').replace(/'/g, '').trim();

                if (type === 'All') return true;

                if (type === 'Delayed') {
                    // Logic: Must be Open/Pending AND Delayed Logic
                    // Or if Status is explicitly 'delayed'
                    if (status === 'delayed') return true; // Explicit status match

                    // Fallback for visual delay calculation if backend hasn't marked it yet (shouldn't happen with new script)
                    if (!['open', 'transferred', 'pending', 're-open'].includes(status)) return false;
                    const effectiveDateStr = targetDateStr || regDate;
                    if (!effectiveDateStr) return false;
                    const isNextDay = effectiveDateStr && effectiveDateStr !== todayStr; // Simplified Next Day

                    // Delay Routing Rule
                    const isMyDept = rowDept === uDept;
                    const isReporter = rowBy === uname || rowReporter === uname;
                    if (!isAdminView && (isReporter || !isMyDept)) return false;

                    return isNextDay;
                }

                if (type === 'Solved') return ['solved', 'closed', 'resolved', 'force close'].includes(status);
                return status === type.toLowerCase();
            });

            setPopupItems(filtered);
            setPopupCategory(type);
            setPopupOpen(true);
        }
    };

    const StatCard = ({ icon: Icon, title, value, colorClass, bgClass, filterType }) => (
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

    // --- YOUR IMPACT DATA SYNC ---
    const myStats = stats?.staffStats?.find(s => normalize(s.Username) === normalize(user.Username)) || {};

    // Fallbacks to 0 to prevent "undefined" or NaN
    const mySolved = myStats.resolved || 0;
    const mySpeed = myStats.avgSpeed ? Number(myStats.avgSpeed).toFixed(1) + ' hrs' : '0 hrs';
    const myRating = myStats.avgRating ? Number(myStats.avgRating).toFixed(1) : '0.0';
    const myRank = myStats.rank ? `#${myStats.rank}` : '-';

    if (intelligenceLoading) return <DashboardSkeleton />;

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

            <AnimatePresence>
                {delayAlert && (
                    <div className="fixed inset-0 z-[310] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            key="delay-alert-popup"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border-2 border-rose-500"
                        >
                            <div className="p-8 text-center bg-gradient-to-b from-rose-50 to-white">
                                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-200 shadow-sm">
                                    <Clock size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-[#1f2d2a] mb-2 uppercase tracking-tight">Delay Warning</h3>
                                <div className="inline-block px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest mb-6">Action Overdue</div>

                                <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">
                                    You have <span className="text-rose-600 font-black">{delayAlert.count} cases</span> that have crossed the resolution timeline for <span className="font-black text-[#1f2d2a]">{delayAlert.dept}</span>.
                                </p>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            const todayStr = new Date().toLocaleDateString();
                                            localStorage.setItem(`delay_alert_date_${user.Username}`, todayStr);
                                            setDelayAlert(null);
                                            setActiveFilter('Delayed');
                                            handleCardClick('Delayed'); // Open popup immediately
                                        }}
                                        className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 text-xs uppercase tracking-widest transform active:scale-95"
                                    >
                                        View Delayed Cases
                                    </button>
                                    <button
                                        onClick={() => {
                                            const todayStr = new Date().toLocaleDateString();
                                            localStorage.setItem(`delay_alert_date_${user.Username}`, todayStr);
                                            setDelayAlert(null);
                                        }}
                                        className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

            <AnimatePresence>
                {boosterNotice && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            key="booster-alert-popup"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-amber-400"
                        >
                            <div className="p-8 text-center relative bg-gradient-to-b from-amber-50 to-white">
                                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-200 animate-pulse">
                                    <AlertCircle size={40} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-2xl font-black text-[#1f2d2a] mb-2 uppercase tracking-tight">Priority Booster Alert</h3>
                                <div className="inline-block px-3 py-1 bg-amber-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest mb-6">Action Required</div>

                                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm mb-6 text-left">
                                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-amber-100">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Ticket ID</span>
                                        <span className="text-sm font-black text-[#1f2d2a]">#{boosterNotice.TicketID || boosterNotice.ComplaintID || 'N/A'}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason for Urgency</p>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{boosterNotice.Reason || 'Urgent attention required.'}"</p>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued By</p>
                                            <p className="text-xs font-black text-amber-700 uppercase">{boosterNotice.Admin || boosterNotice.TransferredBy || 'Management'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            localStorage.setItem(`last_booster_${user.Username}`, boosterNotice.Timestamp);
                                            setBoosterNotice(null);
                                        }}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                                    >
                                        Later
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.setItem(`last_booster_${user.Username}`, boosterNotice.Timestamp);
                                            setBoosterNotice(null);
                                            setTrackTicket(boosterNotice.TicketID);
                                        }}
                                        className="flex-[2] py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 text-xs uppercase tracking-widest transform active:scale-95"
                                    >
                                        Resolve Now
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hospital Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1f2d2a] tracking-tighter flex items-center gap-4 uppercase">
                        Ticket <span className="text-[#2e7d32]">Registry</span>
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
                            <StatCard icon={Users} title="Staff Active" value={activeUsers ? activeUsers.filter(u => String(u.Status).toLowerCase() === 'active').length : 0} bgClass="bg-slate-100" colorClass="text-slate-700" filterType="Active Staff" />
                            {/* Delayed Card now visible for ALL Admins */}
                            <StatCard icon={Clock} title="Delayed" value={stats.delayed} bgClass="bg-rose-50" colorClass="text-rose-600" filterType="Delayed" />
                        </>
                    ) : (
                        <>
                            <StatCard icon={History} title="Extended" value={stats.extended} bgClass="bg-blue-50" colorClass="text-blue-600" filterType="Extended" />
                            <StatCard icon={Clock} title="Delayed" value={stats.delayed} bgClass="bg-rose-50" colorClass="text-rose-600" filterType="Delayed" />
                        </>
                    )}
                </div>
            </div>

            {/* YOUR IMPACT SECTION (New) */}
            <div className="bg-white rounded-3xl p-8 border border-[#dcdcdc] shadow-sm">
                <h3 className="text-xl font-black text-[#1f2d2a] mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Shield size={24} className="text-[#2e7d32]" />
                    Your Impact
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={CheckCircle} title="Solved Cases" value={mySolved} colorClass="text-[#2e7d32]" bgClass="bg-[#cfead6]" filterType="Solved" />
                    <StatCard icon={Timer} title="Avg Speed" value={mySpeed} colorClass="text-blue-600" bgClass="bg-blue-50" filterType="Solved" />
                    <StatCard icon={Activity} title="Quality Score" value={myRating} colorClass="text-amber-500" bgClass="bg-amber-50" filterType="Solved" />
                    <StatCard icon={Shield} title="Efficiency Rank" value={myRank} colorClass="text-purple-600" bgClass="bg-purple-50" filterType="Active Staff" />
                </div>
            </div >

            {/* List Container */}
            < div className="mt-4 md:mt-8" >
                <ComplaintList initialFilter={activeFilter} autoOpenTicket={trackTicket} onAutoOpenComplete={() => setTrackTicket(null)} />
            </div >
        </div >
    );
};

export default Dashboard;
