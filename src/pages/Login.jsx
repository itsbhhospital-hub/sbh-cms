import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

import sbhBg from '../assets/sbh.png';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTerminated, setShowTerminated] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f172a]">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/30 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse-slow delay-700"></div>
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 border border-white/20"
            >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-10 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl p-4 shadow-inner border border-white/20 mb-6 flex items-center justify-center transform hover:rotate-6 transition-transform duration-500">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter">Welcome Back</h2>
                        <p className="text-slate-400 text-xs mt-2 font-bold tracking-widest uppercase">SBH Enterprise Portal</p>
                    </div>
                </div>

                <div className="p-8 pt-8">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 mb-6 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm"
                        >
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter your system ID"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-bold text-sm shadow-sm focus:shadow-md focus:bg-white"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-violet-600 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-700 font-bold text-sm shadow-sm focus:shadow-md focus:bg-white"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:grayscale"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Secure Login</span>
                                    <ChevronRight size={18} strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">
                        Platform Access?{' '}
                        <Link to="/signup" className="text-indigo-600 font-black hover:text-indigo-700 transition-colors underline decoration-2 decoration-indigo-200 underline-offset-2">
                            Request Account
                        </Link>
                    </p>
                </div>

            </motion.div>

            {/* Terminated Popup */}
            {showTerminated && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-50 to-transparent -z-10"></div>

                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
                            <Lock className="text-red-600" size={48} />
                        </div>

                        <h3 className="text-3xl font-black text-slate-800 mb-2">ACCESS DENIED</h3>
                        <p className="text-red-600 font-black text-xs uppercase tracking-[0.2em] mb-4">Account Terminated</p>

                        <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                            Your account has been rejected or terminated by the administrator. Please contact the IT department for further assistance.
                        </p>

                        <button
                            onClick={() => setShowTerminated(false)}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-[0.98]"
                        >
                            Understood
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Simple Footer Link/Copyright */}
            <Footer />
        </div>
    );
};

export default Login;

