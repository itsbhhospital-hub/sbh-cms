import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', password: '', department: '', mobile: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { signup } = useAuth();

    const DEPARTMENTS = [
        'TPA', 'TPA ACCOUNTANT', 'HR', 'OPERATION', 'PHARMACY',
        'HOUSE KEEPING', 'MAINTENANCE', 'IT', 'MARKETING', 'DOCTOR', 'ADMIN'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900/85 via-purple-900/85 to-pink-900/85 relative overflow-hidden">
            {/* Ambient Light Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-40 right-0 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-3xl opacity-20 mix-blend-overlay animate-blob"></div>
                <div className="absolute bottom-0 -left-20 w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl opacity-20 mix-blend-overlay animate-blob animation-delay-4000"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-6 md:p-10 relative z-10 bg-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Create Account</h2>
                    <p className="text-white/80 font-medium mt-1">Join the SBH Team</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center bg-white/10 rounded-l-2xl border-r border-white/10 group-focus-within:bg-white/20 transition-colors">
                            <User className="text-white/70 group-focus-within:text-white transition-colors" size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Username"
                            className="w-full pl-16 pr-5 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 focus:border-white/40 transition-all font-bold text-white placeholder:text-white/50 shadow-lg"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center bg-white/10 rounded-l-2xl border-r border-white/10 group-focus-within:bg-white/20 transition-colors">
                            <Lock className="text-white/70 group-focus-within:text-white transition-colors" size={20} />
                        </div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full pl-16 pr-5 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 focus:border-white/40 transition-all font-bold text-white placeholder:text-white/50 shadow-lg"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center bg-white/10 rounded-l-2xl border-r border-white/10 group-focus-within:bg-white/20 transition-colors">
                            <Building className="text-white/70 group-focus-within:text-white transition-colors" size={20} />
                        </div>
                        <select
                            className="w-full pl-16 pr-10 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 focus:border-white/40 transition-all font-bold text-white shadow-lg appearance-none cursor-pointer [&>option]:bg-slate-800"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            required
                        >
                            <option value="" disabled className="text-slate-400">Select Department</option>
                            {DEPARTMENTS.sort().map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none text-white/70 text-xs">▼</div>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center bg-white/10 rounded-l-2xl border-r border-white/10 group-focus-within:bg-white/20 transition-colors">
                            <span className="text-white/70 group-focus-within:text-white transition-colors font-bold text-lg">📞</span>
                        </div>
                        <input
                            type="tel"
                            placeholder="Mobile Number (10 Digits)"
                            className="w-full pl-16 pr-5 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-white/20 focus:border-white/40 transition-all font-bold text-white placeholder:text-white/50 shadow-lg"
                            value={formData.mobile}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 10) setFormData({ ...formData, mobile: val });
                            }}
                            required
                            pattern="\d{10}"
                            title="Please enter a valid 10-digit mobile number"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-white hover:bg-slate-50 text-indigo-900 font-black uppercase tracking-widest text-sm rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin"></div>
                                <span>Creating...</span>
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-white/60 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white font-bold hover:underline decoration-2 underline-offset-4 decoration-yellow-400">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>

            {/* Success Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-300 border-4 border-emerald-100">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Thank You!</h3>
                        <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                            Your registration was successful. <br /><br />
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">Status: Pending Approval</span>
                            <br /><br />
                            Please wait for Admin approval. You will receive a <span className="text-green-600 font-bold">WhatsApp notification</span> once active.
                        </p>
                        <Link
                            to="/login"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 inline-block w-full"
                        >
                            Return to Login
                        </Link>
                    </div>
                </div>
            )}

            {/* Fixed Footer */}
            <Footer />
        </div>
    );
};

export default Signup;
