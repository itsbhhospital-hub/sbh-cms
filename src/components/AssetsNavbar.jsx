import React, { useState, useRef, memo } from 'react';
import { User, LogOut, Menu, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { useClickOutside } from '../hooks/useClickOutside';
import UserProfilePanel from '../components/UserProfilePanel';
import { sheetsService } from '../services/googleSheets';

const AssetsNavbar = () => {
    const { user, logout, updateUserSession } = useAuth();
    const { setMobileOpen } = useLayout();
    const [isOpen, setIsOpen] = useState(false);
    const [showProfilePanel, setShowProfilePanel] = useState(false);
    const dropdownRef = useRef(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    const handleUpdateProfile = async (updates) => {
        try {
            await sheetsService.updateUser({ ...updates, OldUsername: user.Username });
            updateUserSession(updates);
            setShowProfilePanel(false);
        } catch (error) {
            console.error("Profile update failed", error);
        }
    };

    if (!user) return null;

    return (
        <>
            <nav className="sticky top-0 z-[100] w-full bg-white border-b border-[#dcdcdc] shadow-sm transition-all h-16">
                <div className="w-full h-full px-6 flex justify-between items-center">

                    {/* Left: Mobile Toggle & Branding */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden p-2 text-[#2e7d32] hover:bg-[#cfead6] rounded-lg transition-all"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="md:hidden font-black text-lg text-[#1f2d2a] tracking-tight uppercase">
                            Assets <span className="text-[#2e7d32]">Panel</span>
                        </div>
                    </div>

                    {/* Right: User Profile */}
                    <div className="flex items-center gap-4" ref={dropdownRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex items-center gap-3 bg-white border border-[#dcdcdc] px-4 py-1.5 rounded-xl shadow-none hover:border-[#2e7d32] transition-all group"
                            >
                                <div className="flex flex-col items-end hidden sm:flex text-right">
                                    <span className="text-xs font-black text-[#1f2d2a] leading-tight">
                                        {String(user.Username)}
                                    </span>
                                    <span className="text-[10px] font-black text-[#2e7d32] tracking-[0.05em] leading-none mt-1 opacity-70">
                                        {user.Role?.toUpperCase() === 'SUPER_ADMIN' ? 'System Master' : user.Role}
                                    </span>
                                </div>
                                <div className="w-9 h-9 bg-[#f8faf9] rounded-xl flex items-center justify-center text-slate-300 overflow-hidden border border-[#dcdcdc] group-hover:border-[#2e7d32] transition-colors">
                                    {user.ProfilePhoto ? (
                                        <img src={user.ProfilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#cfead6] font-black text-[#2e7d32] uppercase text-xs">
                                            {user.Username ? user.Username[0].toUpperCase() : <User size={18} />}
                                        </div>
                                    )}
                                </div>
                            </button>

                            {isOpen && (
                                <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-lg border border-[#dcdcdc] overflow-hidden z-[200]">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => { setIsOpen(false); setShowProfilePanel(true); }}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-[#2e7d32] transition-all group/item"
                                        >
                                            <Shield size={18} />
                                            <span className="font-bold text-sm">My Profile</span>
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all group/item"
                                        >
                                            <LogOut size={18} />
                                            <span className="font-bold text-sm">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {showProfilePanel && (
                <>
                    <div className="fixed inset-0 bg-slate-900/20 z-[140]" onClick={() => setShowProfilePanel(false)} />
                    <UserProfilePanel user={user} onClose={() => setShowProfilePanel(false)} onUpdate={handleUpdateProfile} />
                </>
            )}
        </>
    );
};

export default memo(AssetsNavbar);
