import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Key, Shield, Building2, Phone, X, Check, Eye, EyeOff, Menu, Bell, Edit2, CheckCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { sheetsService } from '../services/googleSheets';
import { formatIST } from '../utils/dateUtils';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { setMobileOpen } = useLayout();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({ Username: '' });
    const [profileSuccess, setProfileSuccess] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const dropdownRef = useRef(null);

    // Robust Getter Helper
    // safeGet is no longer needed due to data normalization


    // Timer State Removed as per request

    // Password Change State
    const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState(false);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const notifRef = useRef(null);

    // Notifications Polling
    useEffect(() => {
        if (!user) return;
        const fetchNotifs = async () => {
            try {
                // Fetch all data sources
                const [complaintsData, transferData, extendData] = await Promise.all([
                    sheetsService.getComplaints(true, true), // Force refresh, silent
                    sheetsService.getTransferLogs(true, true),
                    sheetsService.getExtensionLogs(true, true)
                ]);

                const role = String(user.Role || '').toUpperCase().trim();
                const username = String(user.Username || '').toLowerCase().trim();
                const userDept = String(user.Department || '').toLowerCase().trim();

                let allEvents = [];

                // Helper to look up ticket details for Logs
                const getTicket = (id) => complaintsData.find(c => String(c.ID || '').trim() === String(id || '').trim());

                // 1. Complaint Events (New, Solved)
                complaintsData.forEach(t => {
                    // New Complaint
                    if (String(t.Status).toLowerCase() === 'open') {
                        allEvents.push({
                            id: t.ID,
                            type: 'new',
                            title: 'New Complaint Registered',
                            by: t.ReportedBy,
                            dept: t.Department,
                            time: t.Date,
                            icon: AlertTriangle,
                            color: 'text-amber-600 bg-amber-50 border-amber-100',
                            iconBg: 'bg-amber-100 text-amber-600',
                            viewParams: `?ticketId=${t.ID}`
                        });
                    }
                    // Solved Complaint
                    if (['solved', 'closed'].includes(String(t.Status).toLowerCase())) {
                        allEvents.push({
                            id: t.ID,
                            type: 'solved',
                            title: 'Complaint Solved',
                            by: t.ResolvedBy,
                            dept: t.Department,
                            time: t.ResolvedDate || t.LastUpdated || t.Date,
                            icon: CheckCircle,
                            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                            iconBg: 'bg-emerald-100 text-emerald-600',
                            viewParams: `?ticketId=${t.ID}`
                        });
                    }
                });

                // 2. Transfer Events
                if (Array.isArray(transferData)) {
                    transferData.forEach(l => {
                        // Inherit Dept if missing (sometimes log only has NewDept)
                        const ticket = getTicket(l.ID);
                        const displayDept = l.NewDepartment || (ticket ? ticket.Department : 'N/A');

                        allEvents.push({
                            id: l.ID,
                            type: 'transfer',
                            title: 'Complaint Transferred',
                            by: l.TransferredBy,
                            dept: displayDept, // Showing Target Dept
                            msg: `To: ${l.NewDepartment} | From: ${ticket ? ticket.Department : '?'}`, // Extra context
                            time: l.Date || l.Timestamp,
                            icon: ArrowRight,
                            color: 'text-blue-600 bg-blue-50 border-blue-100',
                            iconBg: 'bg-blue-100 text-blue-600',
                            viewParams: `?ticketId=${l.ID}`
                        });
                    });
                }

                // 3. Extension Events
                if (Array.isArray(extendData)) {
                    extendData.forEach(l => {
                        const ticket = getTicket(l.ID);
                        allEvents.push({
                            id: l.ID,
                            type: 'extended',
                            title: 'Deadline Extended',
                            by: l.ExtendedBy,
                            dept: ticket ? ticket.Department : 'N/A',
                            time: l.Date || l.Timestamp,
                            icon: Clock,
                            color: 'text-purple-600 bg-purple-50 border-purple-100',
                            iconBg: 'bg-purple-100 text-purple-600',
                            viewParams: `?ticketId=${l.ID}`
                        });
                    });
                }

                // Filter based on Role & Permissions
                let filteredEvents = [];

                if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                    // Admin sees EVERYTHING
                    filteredEvents = allEvents;
                } else {
                    // Standard / Dept Users
                    filteredEvents = allEvents.filter(e => {
                        // 1. My Department Actions
                        const isMyDept = userDept && String(e.dept || '').toLowerCase() === userDept;

                        // 2. Actions I performed or related to me
                        const isMe = String(e.by || '').toLowerCase() === username;

                        return isMyDept || isMe;
                    });
                }

                // Sort by Time Descending (Latest First)
                filteredEvents.sort((a, b) => new Date(b.time) - new Date(a.time));

                // Take top 20 to avoid overwhelm
                setNotifications(filteredEvents.slice(0, 20));

            } catch (e) {
                console.error("Notif Fetch Error", e);
            } finally {
                setIsPolling(false);
            }
        };

        // Initial Fetch
        fetchNotifs();

        // Poll every 60s
        const interval = setInterval(() => {
            if (!document.hidden) {
                setIsPolling(true);
                fetchNotifs().catch(err => console.warn("Polling skipped:", err.message));
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [user]);

    // Click Outside Handling
    useClickOutside(dropdownRef, () => setIsOpen(false));
    useClickOutside(notifRef, () => setShowNotifications(false));

    // Timer Logic Removed

    const handleChangePassword = async (e) => {
        // ...
        e.preventDefault();
        setPassError('');
        // ... rest of logic
        if (passForm.new.length < 4) {
            setPassError('New password must be at least 4 characters');
            return;
        }
        if (passForm.new !== passForm.confirm) {
            setPassError('New passwords do not match');
            return;
        }
        setIsChanging(true);
        try {
            await sheetsService.changePassword(user.Username, passForm.current, passForm.new);
            setPassSuccess(true);
            setTimeout(() => {
                setShowPasswordModal(false);
                setPassSuccess(false);
                setPassForm({ current: '', new: '', confirm: '' });
                logout();
            }, 2000);
        } catch (err) {
            setPassError(err.message || 'Failed to update password. Try again.');
        } finally {
            setIsChanging(false);
        }
    };

    // Re-render logic to fix notification rendering
    const renderNotificationItem = (n, i) => (
        <div
            key={i}
            onClick={() => {
                setShowNotifications(false);
                navigate(`/my-complaints${n.viewParams}`);
            }}
            className="p-3 bg-slate-50 rounded-xl hover:bg-orange-50 transition-colors border border-slate-100 cursor-pointer group relative flex gap-3"
        >
            {/* Icon Box */}
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm border border-black/5 ${n.iconBg}`}>
                <n.icon size={16} strokeWidth={2.5} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-slate-800 leading-tight mb-0.5">{n.title}</p>
                    <span className="text-[10px] font-mono font-bold text-slate-400 whitespace-nowrap ml-2 opacity-80">{formatIST(n.time).split(',')[1]}</span>
                </div>

                {/* Meta Details */}
                <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-500 truncate">
                        Ticket: <span className="font-mono text-slate-700">{n.id}</span>
                        {n.dept && <span className="mx-1 opacity-50">•</span>}
                        {n.dept}
                    </p>

                    {n.by && (
                        <p className="text-[10px] font-bold text-slate-400 truncate">
                            By: <span className="text-slate-600">{n.by}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );


    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!editProfileForm.Username) return;
        setIsChanging(true);
        try {
            await sheetsService.updateUser({
                Username: editProfileForm.Username,
                OldUsername: user.Username, // Critical for backend to find row
                Password: user.Password, // Preserve
                Role: user.Role,
                Status: user.Status,
                Department: user.Department,
                Mobile: user.Mobile
            });
            // Update Context & Local Storage
            const updatedUser = { ...user, Username: editProfileForm.Username };
            localStorage.setItem('sbh_user', JSON.stringify(updatedUser)); // Hacky update, ideally context re-login
            alert("Username updated! Please re-login for full effect.");
            logout();
        } catch (error) {
            console.error(error);
            alert("Failed to update username.");
        } finally {
            setIsChanging(false);
        }
    };

    if (!user) return null;

    return (
        <nav className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300">
            <div className="w-full">
                <div className="px-3 py-2 md:px-6 md:py-3 max-w-7xl mx-auto flex justify-between items-center gap-2 md:gap-4">

                    {/* Brand Logo - Left Aligned */}
                    <div className="flex-1 items-center hidden md:flex">
                        <img src="/sbh_wide.jpg" alt="SBH Logo" className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex items-center gap-4">

                        <div className="flex items-center gap-3">
                            {/* Brand Logo - Mobile */}
                            <div className="md:hidden flex items-center">
                                <img src="/sbh_wide.jpg" alt="Logo" className="h-6 w-auto object-contain mr-1" />
                            </div>

                            <button
                                onClick={() => setMobileOpen(true)}
                                className="md:hidden p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-all"
                            >
                                <Menu size={22} />
                            </button>
                        </div>

                        {/* Session Timer Removed */}

                        {/* Notification Bell */}
                        <div className="relative z-50" ref={notifRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-orange-700 hover:bg-orange-50 shadow-sm transition-all relative"
                            >
                                <Bell size={20} className={isPolling ? "animate-wiggle" : ""} />
                                {isPolling && (
                                    <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping"></span>
                                )}
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-slate-200 p-4 overflow-hidden z-[200]"
                                    >
                                        <h4 className="font-black text-slate-800 mb-3 px-2 flex justify-between items-center">
                                            Notifications <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-500">{notifications.length}</span>
                                        </h4>
                                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar px-1">
                                            {notifications.length === 0 ? (
                                                <div className="text-center py-6 opacity-50">
                                                    <Bell size={32} className="mx-auto mb-2 text-slate-300" />
                                                    <p className="text-xs font-bold text-slate-400">No new notifications</p>
                                                </div>
                                            ) : (
                                                notifications.map((n, i) => renderNotificationItem(n, i))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            {/* User Profile Button */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                            >
                                <div className="flex flex-col items-end hidden sm:flex text-right">
                                    <span className="text-table-data font-black text-slate-800 leading-tight">
                                        {String(user.Username)}
                                    </span>
                                    <span className="text-[10px] font-black text-orange-600 tracking-[0.05em] leading-none mt-1 opacity-70">
                                        {user.Role === 'SUPER_ADMIN' ? 'System Master' : user.Role}
                                    </span>
                                </div>
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
                                    <User size={20} strokeWidth={2.5} />
                                </div>
                            </button>

                            {/* Dropdown Menu & Profile View */}
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden z-[200]"
                                    >
                                        {!showProfile ? (
                                            /* STANDARD MENU ACTIONS */
                                            <div className="p-2 space-y-1">
                                                <button
                                                    onClick={() => setShowProfile(true)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all group/item"
                                                >
                                                    <div className="bg-slate-100 group-hover/item:bg-white group-hover/item:shadow-sm p-2 rounded-lg transition-all">
                                                        <Shield size={18} className="text-slate-500 group-hover/item:text-emerald-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-bold text-sm block">My Profile</span>
                                                        <span className="text-[10px] font-bold text-slate-400">View account details</span>
                                                    </div>
                                                </button>



                                                <button
                                                    onClick={logout}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all group/item"
                                                >
                                                    <div className="bg-rose-50 group-hover/item:bg-white group-hover/item:shadow-sm p-2 rounded-lg transition-all">
                                                        <LogOut size={18} className="text-rose-400 group-hover/item:text-rose-600" />
                                                    </div>
                                                    <span className="font-bold text-sm">Sign Out</span>
                                                </button>
                                            </div>
                                        ) : (
                                            /* COMPACT PROFILE VIEW */
                                            <div className="bg-slate-50/50">
                                                {/* Header with Back Button */}
                                                <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white">
                                                    <button
                                                        onClick={() => setShowProfile(false)}
                                                        className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                                    >
                                                        <div className="p-1 rounded-md hover:bg-slate-100"><Menu size={14} className="rotate-180" /></div> Back
                                                    </button>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Profile</span>
                                                </div>

                                                <div className="p-4 flex flex-col items-center">
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-700 shadow-sm border border-slate-200 mb-3 relative group">
                                                        <User size={28} strokeWidth={2} />
                                                        {user.Role === 'SUPER_ADMIN' && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white"><Check size={8} /></div>}
                                                    </div>

                                                    {/* Editable Username */}
                                                    <div className="text-center w-full mb-1">
                                                        {isEditingProfile ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <input
                                                                    className="text-sm font-black text-slate-800 bg-white border-b-2 border-orange-500 text-center outline-none w-24 p-0.5"
                                                                    value={editProfileForm.Username}
                                                                    onChange={e => setEditProfileForm({ ...editProfileForm, Username: e.target.value })}
                                                                    autoFocus
                                                                />
                                                                <button onClick={handleSaveProfile} className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"><Check size={12} /></button>
                                                                <button onClick={() => setIsEditingProfile(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={12} /></button>
                                                            </div>
                                                        ) : (
                                                            <h3 className="text-base font-black text-slate-800 flex items-center justify-center gap-1.5">
                                                                {user.Username}
                                                                {user.Username === 'AM Sir' && (
                                                                    <button onClick={() => { setIsEditingProfile(true); setEditProfileForm({ Username: user.Username }); }} className="text-slate-300 hover:text-orange-500 transition-colors" title="Edit Username">
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                )}
                                                            </h3>
                                                        )}
                                                    </div>

                                                    <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-4 border border-emerald-100">
                                                        {user.Role === 'SUPER_ADMIN' ? 'System Master' : user.Role}
                                                    </p>

                                                    <div className="w-full space-y-2">
                                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                                                            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                                                <Building2 size={14} />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Department</p>
                                                                <p className="text-xs font-bold text-slate-700 truncate">{user.Department || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                                                            <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                                                                <Phone size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Mobile</p>
                                                                <p className="text-xs font-bold text-slate-700">{user.Mobile || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Change Password Modal */}
                    <AnimatePresence>
                        {showPasswordModal && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full relative overflow-hidden shadow-2xl"
                                >
                                    {!passSuccess ? (
                                        <>
                                            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                                <Key size={28} />
                                            </div>

                                            <h3 className="text-2xl font-black text-slate-800 text-center mb-1 leading-tight">Pass Management</h3>
                                            <p className="text-orange-600 font-black text-label text-center tracking-wide mb-8">Security Update</p>

                                            <form onSubmit={handleChangePassword} className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-label font-black text-slate-400 ml-1">Current Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPass ? "text" : "password"}
                                                            required
                                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold transition-all"
                                                            value={passForm.current}
                                                            onChange={e => setPassForm({ ...passForm, current: e.target.value })}
                                                        />
                                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-4 text-slate-400">
                                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-label font-black text-slate-400 ml-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                                        value={passForm.new}
                                                        onChange={e => setPassForm({ ...passForm, new: e.target.value })}
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-label font-black text-slate-400 ml-1">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold"
                                                        value={passForm.confirm}
                                                        onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                                                    />
                                                </div>

                                                {passError && <p className="text-rose-500 text-xs font-bold text-center">{passError}</p>}

                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowPasswordModal(false); setPassError(''); }}
                                                        className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={isChanging}
                                                        className="flex-2 px-8 py-4 bg-orange-700 text-white font-black rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-800 transition-all active:scale-95 disabled:opacity-50 tracking-widest text-xs"
                                                    >
                                                        {isChanging ? 'Updating...' : 'Update'}
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="py-10 text-center animate-in zoom-in duration-300">
                                            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Check size={40} strokeWidth={3} />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-800 mb-2">Password Updated!</h3>
                                            <p className="text-slate-500 font-medium">System security reinforced.<br />Logging out for safety...</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div >
            </div >
        </nav >
    );
};

export default Navbar;
