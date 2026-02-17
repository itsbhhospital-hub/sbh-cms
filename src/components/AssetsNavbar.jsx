import React, { useState, useRef, memo, useEffect } from 'react';
import { User, LogOut, Menu, Shield, QrCode, X } from 'lucide-react';
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
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const dropdownRef = useRef(null);
    const scannerRef = useRef(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    useEffect(() => {
        let html5QrcodeScanner;
        if (isScannerOpen) {
            // Slight delay to ensure DOM is ready
            setTimeout(() => {
                #html5 - qrcode - button - camera - permission { padding: 10px 20px; background: #2e7d32; color: white; border - radius: 8px; font - weight: bold; margin - top: 20px; }
                #reader video { border - radius: 12px; }
                `;
                document.head.appendChild(style);

                html5QrcodeScanner = new window.Html5QrcodeScanner(
                    "reader",
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 }, 
                        aspectRatio: 1.0,
                        videoConstraints: {
                            facingMode: "environment"
                        }
                    },
                    /* verbose= */ false
                );

                html5QrcodeScanner.render((decodedText) => {
                    console.log(`Scan result: ${ decodedText } `);
                    // Handle both full URLs and partial asset paths
                    if (decodedText.includes('/assets/') || decodedText.includes('/asset-view/')) {
                        html5QrcodeScanner.clear().then(() => {
                            setIsScannerOpen(false);
                            // If it's a relative path from the scanner, ensure it works
                            if (decodedText.startsWith('http')) {
                                window.location.href = decodedText;
                            } else {
                                window.location.href = window.location.origin + decodedText;
                            }
                        });
                    } else {
                        // Attempt to extract ID if it's just a number
                        if (/^\d+$/.test(decodedText)) {
                            html5QrcodeScanner.clear().then(() => {
                                setIsScannerOpen(false);
                                window.location.href = `${ window.location.origin } /assets/${ decodedText } `;
                            });
                        } else {
                            alert("Invalid SBH Asset QR Code");
                        }
                    }
                }, (error) => {
                    // console.warn(`Code scan error = ${ error } `);
                });
                scannerRef.current = html5QrcodeScanner;

            }, 100);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                scannerRef.current = null;
            }
            const existingStyle = document.getElementById('qr-scanner-styles');
            if (existingStyle) existingStyle.remove();
        };
    }, [isScannerOpen]);

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

                    {/* Right: Actions & Profile */}
                    <div className="flex items-center gap-3" ref={dropdownRef}>

                        {/* SCAN QR BUTTON */}
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="hidden md:flex items-center gap-2 bg-[#1f2d2a] hover:bg-[#2e7d32] text-white px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-md hover:shadow-lg"
                        >
                            <QrCode size={16} />
                            <span>Scan QR</span>
                        </button>

                        {/* Mobile Scan Icon */}
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="md:hidden p-2 text-[#1f2d2a] bg-slate-100 rounded-lg"
                        >
                            <QrCode size={20} />
                        </button>

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
                                        <div className="md:hidden p-2 border-b border-slate-100 mb-1">
                                            <button
                                                onClick={() => { setIsScannerOpen(true); setIsOpen(false); }}
                                                className="w-full flex items-center gap-3 p-2 bg-[#1f2d2a] text-white rounded-lg justify-center font-bold text-xs uppercase"
                                            >
                                                <QrCode size={16} /> Scan Asset QR
                                            </button>
                                        </div>

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

            {/* QR SCANNER MODAL */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md relative">
                        <div className="p-4 bg-[#1f2d2a] flex justify-between items-center text-white">
                            <h3 className="font-bold flex items-center gap-2"><QrCode size={18} /> Scan Asset QR</h3>
                            <button onClick={() => setIsScannerOpen(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-4 bg-black">
                            <div id="reader" className="w-full overflow-hidden rounded-xl"></div>
                            <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Point camera at Asset QR Code</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};



export default memo(AssetsNavbar);
