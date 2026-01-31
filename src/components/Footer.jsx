import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full z-50 bg-gradient-to-r from-slate-900 to-indigo-900 border-t border-white/10 py-2 shadow-2xl">
            <div className="container mx-auto text-center relative px-4 flex flex-col items-center justify-center py-1">
                <p className="text-[11px] text-slate-300 font-bold tracking-wider mb-0.5">
                    Developed By <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent font-black">Naman Mishra</span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                    SBH Group Of Hospitals 2026
                </p>
                <p className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-mono font-bold hidden md:block">Version 2.0</p>
            </div>
        </footer>
    );
};

export default Footer;
