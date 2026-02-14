import { useLayout } from '../context/LayoutContext';

const Footer = () => {
    const layout = useLayout();
    const { mobileOpen = false, collapsed = false } = layout || {};

    // On Mobile: Always 0px. On Desktop: Depends on Sidebar state.
    // We use a CSS variable or simple conditional rendering.
    // Since we can't easily detect "Mobile View" in JS without a listener, 
    // we will rely on valid CSS: "md:left-[var(--footer-offset)]"

    const desktopOffset = layout ? (collapsed ? '5rem' : '260px') : '0px';

    return (
        <footer className="fixed bottom-0 left-0 z-[100] w-full py-3 bg-[#1f2d2a] border-t border-[#2e7d32]/20 shadow-none backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[9px] font-black uppercase tracking-widest text-[#2e7d32]">
                    <a
                        href="https://sbhhospital.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors flex items-center gap-2 group"
                    >
                        SBH Group of Hospitals
                        <span className="w-1 h-1 bg-[#2e7d32]/30 rounded-full hidden sm:block"></span>
                    </a>
                    <a
                        href="https://www.instagram.com/ignamanmishra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors group"
                    >
                        Infrastructure: <span className="text-slate-500 group-hover:text-white transition-colors">Naman Mishra</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
