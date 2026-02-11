import React, { useState, useRef, useEffect, memo } from 'react';
import { User, LogOut, Key, Shield, Building2, Phone, X, Check, Eye, EyeOff, Menu, Bell, Edit2, CheckCircle, ArrowRight, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { sheetsService } from '../services/googleSheets';
import { formatIST } from '../utils/dateUtils';
import UserProfilePanel from '../components/UserProfilePanel';

const parseBackendDate = (str) => {
    // Expected: "10-02-2026 11:54:11 AM"
    if (!str) return new Date();
    const clean = String(str).replace(/'/g, '').replace('at', '').trim(); // Remove ' and 'at' just in case
    const parts = clean.split(' ');

    // If standard ISO or just Date
    if (parts.length < 2 && clean.includes('-')) {
        const [d, m, y] = clean.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    if (parts.length >= 2) {
        const [d, m, y] = parts[0].split('-').map(Number);
        const timePart = parts.slice(1).join(' ');
        return new Date(`${m}/${d}/${y} ${timePart}`); // JS prefers MM/DD/YYYY for parsing
    }
    return new Date(clean);
};

// Extracted Notification Bell Component to isolate re-renders
const NotificationBell = memo(() => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    const notifRef = useRef(null);
    useClickOutside(notifRef, () => setShowNotifications(false));

    // Notifications Polling
    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                const [complaintsData, transferData, extendData] = await Promise.all([
                    sheetsService.getComplaints(false, true),
                    sheetsService.getTransferLogs(false, true),
                    sheetsService.getExtensionLogs(false, true)
                ]);

                const role = String(user.Role || '').toUpperCase().trim();
                const username = String(user.Username || '').toLowerCase().trim();
                const userDept = String(user.Department || '').toLowerCase().trim();

                let allEvents = [];
                const getTicket = (id) => complaintsData.find(c => String(c.ID || '').trim() === String(id || '').trim());

                complaintsData.forEach(t => {
                    if (String(t.Status).toLowerCase() === 'open') {
                        allEvents.push({
                            id: t.ID,
                            type: 'new',
                            title: 'Initial Registry',
                            by: t.ReportedBy,
                            dept: t.Department,
                            time: t.Date,
                            icon: AlertTriangle,
                            color: 'text-amber-600 bg-amber-50 border-amber-100',
                            iconBg: 'bg-amber-50 text-amber-600',
                            viewParams: `?ticketId=${t.ID}`
                        });
                    }
                    if (['solved', 'closed', 'resolved', 'force close'].includes(String(t.Status).toLowerCase())) {
                        allEvents.push({
                            id: t.ID,
                            type: 'solved',
                            title: 'Unit Resolution',
                            by: t.ResolvedBy,
                            dept: t.Department,
                            time: t.ResolvedDate || t.LastUpdated || t.Date,
                            icon: CheckCircle,
                            color: 'text-[#2e7d32] bg-[#cfead6] border-[#2e7d32]/10',
                            iconBg: 'bg-[#cfead6] text-[#2e7d32]',
                            viewParams: `?ticketId=${t.ID}`
                        });
                    }
                });

                if (transferData) {
                    transferData.forEach(l => {
                        const ticket = getTicket(l.ID);
                        allEvents.push({
                            id: l.ID,
                            type: 'transfer',
                            title: 'Provision Transfer',
                            by: l.TransferredBy,
                            dept: l.NewDepartment || (ticket ? ticket.Department : 'N/A'),
                            time: l.Date || l.Timestamp,
                            icon: ArrowRight,
                            color: 'text-[#1f2d2a] bg-slate-50 border-[#dcdcdc]',
                            iconBg: 'bg-slate-100 text-[#1f2d2a]',
                            viewParams: `?ticketId=${l.ID}`
                        });
                    });
                }

                if (extendData) {
                    extendData.forEach(l => {
                        const ticket = getTicket(l.ID);
                        allEvents.push({
                            id: l.ID,
                            type: 'extended',
                            title: 'Protocol Extension',
                            by: l.ExtendedBy,
                            dept: ticket ? ticket.Department : 'N/A',
                            time: l.Date || l.Timestamp,
                            icon: Clock,
                            color: 'text-[#2e7d32] bg-slate-50 border-[#dcdcdc]',
                            iconBg: 'bg-slate-100 text-[#2e7d32]',
                            viewParams: `?ticketId=${l.ID}`
                        });
                    });
                }

                let filteredEvents = (role === 'ADMIN' || role === 'SUPER_ADMIN')
                    ? allEvents
                    : allEvents.filter(e => String(e.dept || '').toLowerCase() === userDept || String(e.by || '').toLowerCase() === username);

                filteredEvents.sort((a, b) => parseBackendDate(b.time) - parseBackendDate(a.time));
                setNotifications(filteredEvents);
            } catch (e) { console.error(e); } finally { setIsPolling(false); }
        };

        fetchNotifs();
        const interval = setInterval(() => {
            if (!document.hidden) {
                setIsPolling(true);
                fetchNotifs();
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [user]);

    const renderNotificationItem = (n, i, full = false) => {
        const notifDate = parseBackendDate(n.time);
        const isToday = notifDate.toDateString() === new Date().toDateString();
        const displayTime = isToday
            ? notifDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : n.time.replace(/'/g, '');

        return (
            <div
                key={i}
                onClick={() => {
                    setShowNotifications(false);
                    setShowAllNotifications(false);
                    navigate(`/my-complaints${n.viewParams}`);
                }}
                className={`p-3 bg-[#f8faf9] rounded-xl hover:bg-[#cfead6] transition-all border border-[#dcdcdc] cursor-pointer flex gap-3 ${full ? 'mb-2' : ''}`}
            >
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-black/5 ${n.iconBg}`}>
                    <n.icon size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-[#1f2d2a] leading-tight mb-0.5">{n.title}</p>
                        <span className="text-[10px] font-mono font-bold text-slate-400 whitespace-nowrap ml-2">{displayTime}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 truncate">Ticket #{n.id} • {n.dept}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="relative z-50" ref={notifRef}>
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 bg-white border border-[#dcdcdc] rounded-xl flex items-center justify-center text-[#2e7d32] hover:bg-[#cfead6] transition-all relative"
            >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                )}
            </button>

            {showNotifications && (
                <div className="fixed w-[90vw] right-4 top-16 md:absolute md:w-80 md:right-0 md:top-full md:mt-3 bg-white rounded-xl shadow-lg border border-[#dcdcdc] overflow-hidden z-[200]">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h4 className="font-black text-[#1f2d2a] text-sm">Notifications</h4>
                        <span className="text-xs font-bold bg-white border border-[#dcdcdc] px-2 py-0.5 rounded-full text-slate-500">{notifications.length}</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 opacity-50">
                                <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-xs font-bold text-slate-400">No new notifications</p>
                            </div>
                        ) : (
                            notifications.slice(0, 5).map((n, i) => renderNotificationItem(n, i))
                        )}
                    </div>

                    {notifications.length > 5 && (
                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={() => { setShowNotifications(false); setShowAllNotifications(true); }}
                                className="w-full py-2 text-xs font-black text-[#2e7d32] hover:bg-white rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                                See More <ArrowRight size={12} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});




const Navbar = () => {
    const { user, logout, updateUserSession } = useAuth();
    const { setMobileOpen } = useLayout();
    const navigate = useNavigate();

    // UI States
    const [isOpen, setIsOpen] = useState(false);

    // Profile Panel State (Replaces inline profile)
    const [showProfilePanel, setShowProfilePanel] = useState(false);

    const dropdownRef = useRef(null);

    // Click Outside Handling
    useClickOutside(dropdownRef, () => setIsOpen(false));

    // Profile Update Handler
    const handleUpdateProfile = async (updates) => {
        try {
            await sheetsService.updateUser({
                ...updates,
                OldUsername: user.Username
            });
            updateUserSession(updates);
            setShowProfilePanel(false);
        } catch (error) {
            console.error("Profile update failed", error);
            const msg = error.message || '';

            if (msg.includes('CRITICAL SECURE') && user.Username === 'AM Sir') {
                alert("Note: Profile updated locally. Server sync is restricted for the System Master account.");
                updateUserSession(updates);
                setShowProfilePanel(false);
                return;
            }
            throw error;
        }
    };

    if (!user) return null;

    return (
        <>
            <nav className="sticky top-0 z-[100] w-full bg-white border-b border-[#dcdcdc] shadow-sm transition-all">
                <div className="w-full">
                    <div className="px-3 py-2 md:px-6 md:py-3 max-w-7xl mx-auto flex justify-between items-center gap-2 md:gap-4">

                        {/* LEFT SIDE: Logos & Menu */}
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center">
                                <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                            </div>
                            <div className="md:hidden flex items-center gap-2">
                                <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain mr-1" />
                            </div>
                            <div className="md:hidden">
                                <button
                                    onClick={() => setMobileOpen(true)}
                                    className="p-2 text-[#2e7d32] hover:bg-[#cfead6] rounded-lg transition-all"
                                >
                                    <Menu size={22} />
                                </button>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Icons */}
                        <div className="flex items-center gap-3 md:gap-4">

                            {/* Notification Bell (Extracted) */}
                            <NotificationBell />

                            <div className="relative" ref={dropdownRef}>
                                {/* User Profile Button */}
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="flex items-center gap-3 bg-white border border-[#dcdcdc] px-4 py-1.5 rounded-xl shadow-none hover:border-[#2e7d32] transition-all group"
                                >
                                    <div className="flex flex-col items-end hidden sm:flex text-right">
                                        <span className="text-table-data font-black text-[#1f2d2a] leading-tight">
                                            {String(user.Username)}
                                        </span>
                                        <span className="text-[10px] font-black text-[#2e7d32] tracking-[0.05em] leading-none mt-1 opacity-70">
                                            {user.Role?.toUpperCase() === 'SUPER_ADMIN' ? 'System Master' : user.Role}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 bg-[#f8faf9] rounded-xl flex items-center justify-center text-slate-300 overflow-hidden border border-[#dcdcdc] group-hover:border-[#2e7d32] transition-colors">
                                        {user.ProfilePhoto ? (
                                            <img src={user.ProfilePhoto} alt="Profile" className="w-full h-full object-cover object-center" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#cfead6] font-black text-[#2e7d32] uppercase text-xs">
                                                {user.Username ? user.Username[0].toUpperCase() : <User size={20} strokeWidth={2.5} />}
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-[#dcdcdc] overflow-hidden z-[200]">
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => { setIsOpen(false); setShowProfilePanel(true); }}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-[#2e7d32] transition-all group/item"
                                            >
                                                <div className="bg-slate-100 group-hover/item:bg-white p-2 rounded-lg transition-all">
                                                    <Shield size={18} className="text-slate-500 group-hover/item:text-[#2e7d32]" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-bold text-sm block">My Profile</span>
                                                    <span className="text-[10px] font-bold text-slate-400">View detailed info</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={logout}
                                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all group/item"
                                            >
                                                <div className="bg-rose-50 group-hover/item:bg-white p-2 rounded-lg transition-all">
                                                    <LogOut size={18} className="text-rose-400 group-hover/item:text-rose-600" />
                                                </div>
                                                <span className="font-bold text-sm">Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div >
                </div >
            </nav >

            {/* Profile Side Panel */}
            {showProfilePanel && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/20 z-[140]"
                        onClick={() => setShowProfilePanel(false)}
                    />
                    <UserProfilePanel
                        user={user}
                        onClose={() => setShowProfilePanel(false)}
                        onUpdate={handleUpdateProfile}
                    />
                </>
            )}
        </>
    );
};

export default memo(Navbar);
