import { useNavigate } from 'react-router-dom';
import ComplaintForm from '../components/ComplaintForm';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const NewComplaint = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
        >
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 transition-colors font-bold group"
            >
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 group-hover:border-emerald-500/50 transition-colors">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </div>
                Back to Dashboard
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Ticket</h1>
                <p className="text-slate-500 font-bold mt-1">Submit a new complaint to the relevant department</p>
            </div>

            <ComplaintForm />
        </motion.div>
    );
};

export default NewComplaint;
