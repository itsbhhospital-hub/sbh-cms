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
            <div className={`h-screen flex flex-col transition-all duration-300 bg-slate-900 border-r border-slate-800 shadow-2xl z-[120]
                fixed md:sticky top-0 left-0
                ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
                ${collapsed ? 'md:w-24' : 'md:w-72'}
            `}>
                {/* Header */}
                <div className="p-8 flex items-center gap-4 border-b border-white/10">
                    <div className="relative">
                        <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-xl bg-white/10 object-contain p-0.5 border border-white/20 shadow-md backdrop-blur-sm" />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-900"></div>
                    </div>
                    {(!collapsed || mobileOpen) && (
                        <div>
                            <h1 className="font-bold text-xl leading-tight text-white">SBH Group</h1>
                            <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wide">Portal</p>
                        </div>
                    )}

                    {/* Mobile Close Button */}
                    <button onClick={() => setMobileOpen(false)} className="md:hidden ml-auto text-white/50 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Desktop Toggle (Hidden on Mobile) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute -right-3 top-10 bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:bg-emerald-500 transition-colors border border-white/20 z-50 hover:scale-110 active:scale-95 items-center justify-center"
                >
                    {collapsed ? <Menu size={14} /> : <X size={14} />}
                </button>

                {/* Nav */}
                <div className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar">
                    <div className="mb-4 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wide">
                        {(!collapsed || mobileOpen) && 'Main Menu'}
                    </div>

                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/new-complaint" icon={FilePlus} label="New Ticket" />
                    <NavItem to="/my-complaints" icon={FileText} label="My Complaints" /> {/* Added My Complaints NavItem */}

                    {user.Role === 'admin' && (
                        <>
                            <div className="mt-10 mb-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                {(!collapsed || mobileOpen) && 'Administration'}
                            </div>
                            <NavItem to="/user-management" icon={Users} label="User Management" />
                            <NavItem to="/work-report" icon={BarChart3} label="Work Report" />
                        </>
                    )}
                </div>

            </div>
        </>
    );
};

export default Sidebar;
