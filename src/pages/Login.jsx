import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
            setError(err.message || 'Failed to login');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl opacity-30 mix-blend-overlay animate-blob"></div>
                <div className="absolute top-20 -right-20 w-[600px] h-[600px] bg-pink-500 rounded-full blur-3xl opacity-30 mix-blend-overlay animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-40 left-1/2 w-[600px] h-[600px] bg-yellow-500 rounded-full blur-3xl opacity-30 mix-blend-overlay animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg p-6 md:p-10 relative z-10 bg-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="relative w-48 h-auto mb-6 p-4 bg-white/20 rounded-2xl shadow-lg border border-white/30 backdrop-blur-sm">
                        <img src="/src/assets/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <p className="text-white/80 font-bold tracking-widest text-xs uppercase drop-shadow-sm mb-2">SBH Group of Hospitals</p>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-4 text-center drop-shadow-md leading-tight">
                        SBH Complaints System
                    </h2>
                    <p className="text-white/90 font-bold text-[10px] uppercase drop-shadow-sm bg-white/20 px-4 py-2 rounded-xl border border-white/20 backdrop-blur-md">
                        (Please Use Only For the complaint)
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-white p-4 mb-8 rounded-xl flex items-center gap-3 backdrop-blur-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                        <p className="text-sm font-bold">{error}</p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-white/10 rounded-l-2xl border-r border-white/10 group-focus-within:bg-white/20 transition-colors">
                            <User className="text-white/70 group-focus-within:text-white transition-colors" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full pl-20 pr-6 py-5 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 focus:border-white/40 transition-all placeholder:text-white/50 text-white font-bold shadow-lg"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-white/10 rounded-l-2xl border-r border-white/10 group-focus-within:bg-white/20 transition-colors">
                            <Lock className="text-white/70 group-focus-within:text-white transition-colors" size={20} />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-20 pr-6 py-5 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 focus:border-white/40 transition-all placeholder:text-white/50 text-white font-bold shadow-lg"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-white text-indigo-600 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-2xl hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait mt-4"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Sign In to Dashboard</span>
                                <Lock size={16} className="opacity-70" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-white/60 font-medium text-sm">
                        New Staff Member?{' '}
                        <Link to="/signup" className="text-white font-bold hover:underline decoration-2 underline-offset-4 decoration-yellow-400">
                            Request Access
                        </Link>
                    </p>
                </div>
            </motion.div>

            {/* Fixed Footer */}
            <Footer />
        </div>
    );
};

export default Login;
