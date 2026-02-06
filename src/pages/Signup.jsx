import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Building, Phone, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import { sheetsService } from '../services/googleSheets';
import logo from '../assets/logo.jpg';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', password: '', department: '', mobile: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDuplicate, setShowDuplicate] = useState(null); // { type: 'username' | 'mobile' }
    const { signup } = useAuth();
    const navigate = useNavigate();

    const DEPARTMENTS = [
        'TPA', 'TPA ACCOUNTANT', 'HR', 'OPERATION', 'PHARMACY',
        'HOUSE KEEPING', 'MAINTENANCE', 'IT', 'MARKETING', 'DOCTOR', 'ADMIN'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const users = await sheetsService.getUsers();

            const newUsername = formData.username.trim().toLowerCase();
            const newMobile = formData.mobile.trim();

            const duplicateUser = users.find(u => (u.Username || '').toLowerCase() === newUsername);
            const duplicateMobile = users.find(u => {
                const m = u.Mobile;
                return m && String(m) === newMobile;
            });

            if (duplicateUser) {
                setShowDuplicate('username');
                setIsLoading(false);
                return;
            }

            if (duplicateMobile) {
                setShowDuplicate('mobile');
                setIsLoading(false);
                return;
            }

            await signup(formData);
            setShowModal(true);
            setFormData({ username: '', password: '', department: '', mobile: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="h-screen w-full flex flex-col bg-[#f1f5f9]">
            {/* Main Content Area - Absolute Centering and Vertical Balance */}
            <main className="flex-1 flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.05),transparent_70%)]"></div>
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-[640px] bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 border border-slate-100"
                >
                    {/* Header Decoration */}
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-orange-400"></div>

                    {/* Premium Header Layout */}
                    <div className="p-10 pb-2 flex flex-col items-center">
                        <div className="flex items-center gap-5 mb-8 w-full justify-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-2 border-emerald-50 shadow-sm shrink-0">
                                <img src={logo} alt="Logo" className="w-[80%] h-[80%] object-contain" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">SBH CMS</h2>
                                <p className="text-sm font-bold text-emerald-600 tracking-wide uppercase">New User Registration</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100 mb-6"></div>
                        <p className="text-slate-400 text-xs font-bold tracking-[0.1em] uppercase">Staff Enrollment Form</p>
                    </div>

                    <div className="p-10 pt-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Staff ID / Username</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-semibold placeholder:text-slate-300"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="Choose a username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Secure Password</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-semibold placeholder:text-slate-300"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Create password"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Department Unit</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors z-10">
                                        <Building size={18} />
                                    </div>
                                    <select
                                        className="w-full pl-12 pr-10 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-semibold appearance-none cursor-pointer relative z-0"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {DEPARTMENTS.sort().map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
                                        <ChevronRight size={18} className="rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Emergency Mobile</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <input
                                        type="tel"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-semibold placeholder:text-slate-300"
                                        value={formData.mobile}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setFormData({ ...formData, mobile: val });
                                        }}
                                        placeholder="10-Digit Mobile Number"
                                        required
                                        pattern="\d{10}"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-emerald-600 hover:bg-orange-500 text-white rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-orange-500/20 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 mt-6 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="font-bold tracking-wide">Submit Enrollment</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-slate-400 text-xs font-semibold">
                                Already have an account?{' '}
                                <Link to="/login" className="text-emerald-600 font-bold hover:text-orange-500 transition-colors ml-1">
                                    Login Here
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Duplicate User Modal */}
                {showDuplicate && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100"
                        >
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="text-rose-500" size={28} />
                            </div>
                            <h3 className="text-card-title text-slate-900 mb-1">Provisioning Conflict</h3>
                            <p className="text-small-info text-slate-500 font-medium mb-6">
                                {showDuplicate === 'username'
                                    ? "This identity is already allocated."
                                    : "Mobile number exists in database."}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => setShowDuplicate(null)}
                                    className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 transition-all border border-orange-500 shadow-lg shadow-orange-500/20"
                                >
                                    Retry Parameters
                                </button>
                                <Link to="/login" className="text-small-info font-bold text-slate-400 hover:text-slate-600 tracking-widest">
                                    Return to Auth
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Success Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
                        >
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                            <h3 className="text-page-title text-slate-900 mb-2">Request Logged</h3>
                            <p className="text-table-data text-slate-500 mb-8 font-medium leading-relaxed">
                                Your enrollment request has been queued for Primary Admin validation.
                                Please monitor your status.
                            </p>
                            <Link to="/login" className="block w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-black transition-all active:scale-[0.98] tracking-widest text-xs">
                                Back to Gateway
                            </Link>
                        </motion.div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Signup;
