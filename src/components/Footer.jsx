import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full z-[100] bg-indigo-950 border-t border-indigo-900/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                <span className="hover:text-slate-300 transition-colors cursor-default">
                    © 2026 SBH Group
                </span>

                <div className="flex items-center gap-4">
                    <a
                        href="https://sbhhospital.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-400 transition-colors"
                    >
                        Enterprise Portal
                    </a>
                    <span className="w-px h-3 bg-slate-800"></span>
                    <a
                        href="https://www.instagram.com/ignamanmishra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-white transition-colors group"
                    >
                        <span>System Architect</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all"></div>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
