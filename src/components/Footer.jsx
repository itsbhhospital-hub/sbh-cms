import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="w-full py-6 mt-auto relative z-50">
            <div className="flex flex-col items-center justify-center gap-2">

                {/* Glass Container */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg px-6 py-3 rounded-full flex items-center gap-3 hover:bg-white/20 transition-all duration-300 group cursor-default">
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                        © 2026 SBH Health Group
                    </span>

                    <div className="w-px h-3 bg-slate-300/50"></div>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                            Made with
                        </span>
                        <Heart size={10} className="text-rose-400 fill-rose-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                            by Naman Mishra
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
