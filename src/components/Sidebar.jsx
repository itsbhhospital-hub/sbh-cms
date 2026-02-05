import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FilePlus,
    FileText,
    Users,
    LogOut,
    Settings,
    Menu,
    X,
    Shield,
    BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const { mobileOpen, setMobileOpen } = useLayout();
    const [timeLeft, setTimeLeft] = useState('');

    // Timer Logic
    useEffect(() => {
        const updateTimer = () => {
            const loginTime = localStorage.getItem('sbh_login_time');
            if (!loginTime) return;

            const elapsed = Date.now() - parseInt(loginTime);
            const remaining = (60 * 60 * 1000) - elapsed; // 1 Hour

            if (remaining <= 0) {
                setTimeLeft('00:00');
            } else {
                const m = Math.floor(remaining / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location]);

    // Simple active check
    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label, onClick }) => (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 mb-1 group
        ${isActive(to)
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
        >
            <Icon size={20} className={`${!collapsed && 'group-hover:translate-x-1'} transition-transform ${isActive(to) ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
            {(!collapsed || mobileOpen) && <span className="font-bold whitespace-nowrap text-sm tracking-wide">{label}</span>}
        </Link>
    );

    return (
        <>

            {/* Backdrop for Mobile */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container - Increased Z-Index to sit above Footer */}
            <div className={`h-screen flex flex-col transition-all duration-300 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 border-r border-indigo-500/10 shadow-2xl z-[120]
                fixed md:sticky top-0 left-0
                ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
                ${collapsed ? 'md:w-24' : 'md:w-72'}
            `}>
                {/* Header */}
                <div className="p-8 flex items-center gap-4 border-b border-white/5 relative overflow-hidden">
                    {/* Glow Effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none"></div>

                    <div className="relative z-10">
                        <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-2xl bg-white/10 object-contain p-0.5 border border-white/20 shadow-lg backdrop-blur-md ring-1 ring-white/10" />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-indigo-900 shadow-md animate-pulse"></div>
                    </div>
                    {(!collapsed || mobileOpen) && (
                        <div className="relative z-10">
                            <h1 className="font-black text-xl leading-none text-white tracking-tight mb-1">SBH Group</h1>
                            <p className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest bg-white/5 px-2 py-0.5 rounded-full w-fit">Enterprise</p>
                        </div>
                    )}

                    {/* Mobile Close Button */}
                    <button onClick={() => setMobileOpen(false)} className="md:hidden ml-auto text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Desktop Toggle (Hidden on Mobile) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3 top-10 bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 transition-all border border-white/20 z-50 hover:scale-110 active:scale-95 items-center justify-center group"
                >
                    {collapsed ? <Menu size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </button>

                {/* Nav */}
                <div className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar">
                    <div className="mb-4 px-4 text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                        {(!collapsed || mobileOpen) && 'Main Menu'}
                    </div>

                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/new-complaint" icon={FilePlus} label="New Ticket" />
                    <NavItem to="/my-complaints" icon={FileText} label="My Complaints" />

                    {user.Role === 'admin' && (
                        <>
                            <div className="mt-10 mb-4 px-4 text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                                {(!collapsed || mobileOpen) && 'Administration'}
                            </div>
                            <NavItem to="/user-management" icon={Users} label="User Management" />
                            <NavItem to="/work-report" icon={BarChart3} label="Work Report" />
                        </>
                    )}
                </div>

                {/* Timer / Footer Area in Sidebar */}
                <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                    {(!collapsed || mobileOpen) ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Session</p>
                                <p className="text-sm font-mono font-bold text-white">{timeLeft || '--:--'}</p>
                            </div>
                            <div className="p-2 bg-white/5 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer" onClick={logout} title="Logout">
                                <LogOut size={18} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button onClick={logout} className="p-2 text-rose-400 hover:text-rose-300 transition-colors"><LogOut size={20} /></button>
                        </div>
                    )}
                </div>

            </div>
        </>
    );
};

export default Sidebar;
