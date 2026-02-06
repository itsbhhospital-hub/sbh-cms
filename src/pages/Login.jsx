import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import logo from '../assets/logo.jpg';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTerminated, setShowTerminated] = useState(false);
    const { login } = useAuth();
    const { showLoader } = useLoading();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setIsLoading(true);
        // showLoader(); // REMOVED: Instant Feedback requested
        try {
            await login(formData.username, formData.password);
            navigate('/');
        } catch (err) {
            if (err.message.includes('TERMINATED:')) {
                setShowTerminated(true);
            } else {
                setError(err.message || 'Failed to login');
            }
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
                    className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 border border-slate-100"
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
                                <p className="text-sm font-bold text-emerald-600 tracking-wide uppercase">Hospital Portal</p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100 mb-6"></div>
                        <p className="text-slate-400 text-xs font-bold tracking-[0.1em] uppercase">Secure System Access</p>
                    </div>

                    <div className="p-10 pt-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-50 border border-red-100 text-red-600 p-4 mb-6 rounded-xl text-xs font-bold flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Staff ID</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-semibold placeholder:text-slate-300"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="Enter your ID"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 font-semibold placeholder:text-slate-300"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        required
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
                                        <span className="font-bold tracking-wide">Login Securely</span>
                                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-slate-400 text-xs font-semibold">
                                Need an account?{' '}
                                <Link to="/signup" className="text-emerald-600 font-bold hover:text-orange-500 transition-colors ml-1">
                                    Register Here
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Terminated Popup */}
                {showTerminated && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-slate-100"
                        >
                            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Lock className="text-rose-500" size={32} />
                            </div>

                            <h3 className="text-page-title text-slate-900 mb-2">Access Denied</h3>
                            <p className="text-rose-600 font-bold text-small-info tracking-widest mb-4">Account Terminated</p>

                            <p className="text-table-data text-slate-500 mb-8 font-medium leading-relaxed">
                                Your network access has been suspended by the Primary Administrator.
                                Please contact IT Support for authorization renewal.
                            </p>

                            <button
                                onClick={() => setShowTerminated(false)}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-[0.98] tracking-widest text-xs"
                            >
                                Acknowledge
                            </button>
                        </motion.div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Login;
