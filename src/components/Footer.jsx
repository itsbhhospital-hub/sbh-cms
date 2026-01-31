import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="container mx-auto text-center">
                <p className="text-xs md:text-sm font-black tracking-[0.2em] bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                    DEVELOPED BY NAMAN MISHRA
                </p>
                <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5 tracking-wide">
                    SBH GROUP OF HOSPITALS <span className="text-cyan-500 mx-1 glow">✦</span> <span className="text-slate-200">2025</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
