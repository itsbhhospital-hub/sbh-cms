import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 w-full z-[100] bg-slate-900 text-white py-3 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center">

                <a
                    href="https://sbhhospital.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                    SBH Group Of Hospitals
                </a>

                <div className="hidden sm:block w-px h-3 bg-slate-700"></div>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-400">
                    <span>Developed By</span>
                    <a
                        href="https://www.instagram.com/ignamanmishra"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-emerald-400 transition-colors"
                    >
                        Naman Mishra
                    </a>
                    <Heart size={12} className="text-rose-500 fill-rose-500 animate-pulse ml-0.5" />
                </div>

            </div>
        </footer>
    );
};

export default Footer;
