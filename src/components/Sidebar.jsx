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
            className={`flex items-center gap-4 px-4 py-3.5 mx-2 rounded-r-xl transition-all duration-200 mb-1 group
        ${isActive(to)
                    ? 'bg-emerald-800 text-white border-l-4 border-emerald-400 shadow-md'
                    : 'text-emerald-100/70 hover:bg-emerald-900 hover:text-white border-l-4 border-transparent'
                }`}
        >
            <Icon size={20} className={`${!collapsed && 'group-hover:translate-x-1'} transition-transform ${isActive(to) ? 'text-white' : 'text-emerald-300 group-hover:text-white'}`} />
            {(!collapsed || mobileOpen) && <span className="font-bold whitespace-nowrap text-sm tracking-wide">{label}</span>}
        </Link>
    );

    return (
        <>

            {/* Backdrop for Mobile */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/80 animate-in fade-in"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`h-screen flex flex-col transition-all duration-300 bg-emerald-950 border-r border-emerald-900 shadow-2xl z-[120]
                fixed md:sticky top-0 left-0
                ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
                ${collapsed ? 'md:w-24' : 'md:w-72'}
            `}>
                {/* Header */}
                <div className="p-8 flex items-center gap-4 border-b border-emerald-900 relative">
                    <div className="relative z-10">
                        <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-xl bg-white p-0.5 object-contain shadow-lg" />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-950 shadow-md"></div>
                    </div>
                    {(!collapsed || mobileOpen) && (
                        <div className="relative z-10">
                            <h1 className="font-black text-xl leading-none text-white tracking-tight mb-1">SBH Group</h1>
                            <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-widest bg-emerald-900/50 px-2 py-0.5 rounded-full w-fit">Enterprise Portal</p>
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
                    className="hidden md:flex absolute -right-3 top-10 bg-emerald-800 text-white p-2 rounded-full shadow-lg shadow-emerald-950/50 hover:bg-emerald-700 transition-all border border-white/20 z-50 hover:scale-110 active:scale-95 items-center justify-center group"
                >
                    {collapsed ? <Menu size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                </button>

                {/* Nav */}
                <div className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar">
                    <div className="mb-4 px-4 text-[10px] font-black text-emerald-400/60 uppercase tracking-widest leading-none">
                        {(!collapsed || mobileOpen) && 'Main Menu'}
                    </div>

                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/new-complaint" icon={FilePlus} label="New Ticket" />
                    <NavItem to="/my-complaints" icon={FileText} label="My Complaints" />

                    {user.Role === 'admin' && (
                        <>
                            <div className="mt-10 mb-4 px-4 text-[10px] font-black text-emerald-400/60 uppercase tracking-widest leading-none">
                                {(!collapsed || mobileOpen) && 'Administration'}
                            </div>
                            <NavItem to="/user-management" icon={Users} label="User Management" />
                            <NavItem to="/work-report" icon={BarChart3} label="Work Report" />
                        </>
                    )}
                </div>

                {/* Timer / Footer Area in Sidebar */}
                <div className="p-6 border-t border-emerald-900 bg-emerald-900/20">
                    {(!collapsed || mobileOpen) ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Session</p>
                                <p className="text-sm font-mono font-bold text-white">{timeLeft || '--:--'}</p>
                            </div>
                            <div className="p-2 bg-emerald-900/50 rounded-lg text-rose-400 hover:bg-rose-900/30 hover:text-rose-300 transition-colors cursor-pointer" onClick={logout} title="Logout">
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
