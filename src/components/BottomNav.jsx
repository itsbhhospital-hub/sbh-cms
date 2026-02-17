import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Box, User, Settings } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/dashboard' }, // Links to dashboard as list is integrated
        { id: 'assets', label: 'Assets', icon: Box, path: '/assets' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[100] md:hidden px-2 pb-safe">
            <div className="flex justify-between items-center py-2 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.path);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-col items-center flex-1 py-1 transition-all
                                ${active ? 'text-[#2e7d32]' : 'text-slate-400'}`}
                        >
                            <div className={`p-1 rounded-xl transition-all ${active ? 'bg-[#cfead6] scale-110' : ''}`}>
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${active ? 'opacity-100' : 'opacity-60'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
