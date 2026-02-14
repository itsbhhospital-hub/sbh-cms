import React, { useState, useEffect, memo } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import {
    LayoutDashboard, Plus, ClipboardList, CheckCircle,
    Clock, LogOut, Menu,
    Building2, Wrench, TrendingUp, Search
} from 'lucide-react';

const SessionTimer = memo(({ collapsed }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            const loginTime = localStorage.getItem('sbh_login_time');
            if (!loginTime) return;
            const elapsed = Date.now() - parseInt(loginTime);
            const remaining = (30 * 60 * 1000) - elapsed;
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

    if (collapsed) {
        return (
            <div className="w-12 h-12 rounded-2xl bg-[#cfead6] flex items-center justify-center text-[#2e7d32] border border-[#dcdcdc] font-mono text-[10px] font-black">
                {timeLeft.split(':')[0]}m
            </div>
        );
    }

    return (
        <div className="bg-white/50 border border-[#2e7d32]/10 p-4 rounded-2xl flex items-center justify-between shadow-none">
            <div className="flex items-center gap-3">
                <Clock size={16} className="text-[#2e7d32]" />
                <div>
                    <p className="text-[9px] font-black text-[#2e7d32] tracking-widest leading-none mb-1 opacity-60 uppercase">Session Secure</p>
                    <p className="text-[11px] font-black text-[#1f2d2a] leading-none tracking-[0.2em] font-mono uppercase">{timeLeft || '30:00'}</p>
                </div>
            </div>
        </div>
    );
});

const AssetsSidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { mobileOpen, setMobileOpen, collapsed } = useLayout();
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [location, setMobileOpen]);

    const NavItem = ({ to, icon: Icon, label }) => (
        <NavLink
            to={to}
            onClick={() => {
                setMobileOpen(false);
            }}
            className={({ isActive }) => `
                relative flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all 
                font-black uppercase tracking-widest mb-1 text-[10px]
                ${isActive
                    ? 'bg-[#2e7d32] text-white shadow-none ring-1 ring-white/10'
                    : 'text-[#1f2d2a] hover:bg-[#b8dfc2] transition-all opacity-80 hover:opacity-100'
                }
            `}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`relative z-10 transition-colors ${isActive ? 'text-[#2e7d32]' : 'text-[#2e7d32] opacity-80'}`}
                    />

                    {(!collapsed || mobileOpen || isHovered) && (
                        <span className="relative z-10">{label}</span>
                    )}

                    {isActive && (
                        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#2e7d32] shadow-none" />
                    )}
                </>
            )}
        </NavLink>
    );

    return (
        <>
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[140] bg-slate-900/40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                onMouseEnter={() => !mobileOpen && setIsHovered(true)}
                onMouseLeave={() => !mobileOpen && setIsHovered(false)}
                className={`fixed md:sticky top-0 left-0 z-[150] h-[100dvh] 
                bg-[#cfead6] border-r border-[#dcdcdc] shadow-sm
                flex flex-col justify-between transition-all duration-150 ease-in-out
                ${mobileOpen ? 'translate-x-0 w-[80%] max-w-[300px]' : collapsed && !isHovered ? 'w-[80px] -translate-x-0' : 'translate-x-0 w-[260px]'}
                ${!mobileOpen && 'hidden md:flex flex-col'}`}
            >
                {/* Header */}
                <div className="h-20 flex items-center justify-start px-6 border-b border-[#2e7d32]/10 mb-4 relative shrink-0 bg-white/30">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-10 bg-white rounded-xl flex items-center justify-center shadow-none p-1.5 border border-[#dcdcdc]">
                            <Building2 className="text-[#2e7d32]" size={24} />
                        </div>
                        {(!collapsed || mobileOpen || isHovered) && (
                            <span className="font-black text-xl text-[#1f2d2a] tracking-tighter uppercase">
                                Assets <span className="text-[#2e7d32]">Panel</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="px-2 py-2 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-4 px-4 text-[9px] font-black text-[#2e7d32] uppercase tracking-[0.2em] leading-none opacity-60">
                        {(!collapsed || mobileOpen || isHovered) && 'Assets Management'}
                    </div>

                    <NavItem to="/director" icon={TrendingUp} label="Director Dashboard" />
                    <NavItem to="/assets" icon={LayoutDashboard} label="Asset List" />
                    <NavItem to="/assets/add" icon={Plus} label="Register Asset" />

                    <div className="mt-6 mb-2 px-4 text-[9px] font-black text-[#2e7d32] uppercase tracking-[0.2em] leading-none opacity-60">
                        {(!collapsed || mobileOpen || isHovered) && 'Operations'}
                    </div>
                    <NavItem to="/service-team" icon={Wrench} label="Services" />
                    <NavItem to="/" icon={LogOut} label="Exit to Main CMS" />
                </nav>

                {/* Footer Section */}
                <div className="p-3 flex flex-col justify-end shrink-0 border-t border-[#2e7d32]/10 bg-white/20">
                    {(!collapsed || mobileOpen || isHovered) ? (
                        <div className="flex flex-col gap-3">
                            <SessionTimer />

                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-white text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all active:scale-95 group"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <SessionTimer collapsed />
                            <button
                                onClick={logout}
                                className="p-4 bg-white text-rose-600 rounded-2xl border border-rose-100 hover:bg-rose-50 transition-all active:scale-90"
                                title="Logout"
                            >
                                <LogOut size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default memo(AssetsSidebar);
