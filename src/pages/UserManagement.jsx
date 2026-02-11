import { useState, useEffect } from 'react';
import { sheetsService } from '../services/googleSheets';
import { useAuth } from '../context/AuthContext';
import { DEPARTMENTS } from '../constants/appData';
import { Check, X, Shield, User as UserIcon, Lock, Search, Save, Edit2, Phone, ChevronLeft, ChevronRight, UserPlus, Trash2, Key, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfilePanel from '../components/UserProfilePanel';
import SuccessPopup from '../components/SuccessPopup';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Panel State
    const [selectedUser, setSelectedUser] = useState(null);

    // Add User State
    const [addingUser, setAddingUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ Username: '', Password: '', Department: 'General', Mobile: '', Role: 'user' });

    // Delete & Reject Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (actionSuccess) {
            const timer = setTimeout(() => setActionSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionSuccess]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await sheetsService.getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Open Side Panel
    const handleEditClick = (u) => {
        setSelectedUser(u);
    };

    // Handle Update from Panel
    const handleUpdateUser = async (updatedData) => {
        try {
            await sheetsService.updateUser({
                ...updatedData,
                OldUsername: selectedUser.Username
            });
            setActionSuccess("User details updated successfully! 💾");
            setSelectedUser(null);
            loadUsers();
        } catch (error) {
            console.error(error);
            throw error; // Propagate to UserProfilePanel
        }
    };

    const executeDelete = async () => {
        if (!deleteConfirm) return;
        const targetUsername = deleteConfirm.Username;
        setDeleteConfirm(null);
        try {
            await sheetsService.deleteUser(targetUsername);
            setActionSuccess("User access revoked/deleted. 🗑️");
            loadUsers();
        } catch (error) {
            alert("Failed to delete user.");
            console.error(error);
        }
    };

    const handleAddUser = async () => {
        if (!newUserForm.Username || !newUserForm.Password || !newUserForm.Mobile) {
            alert("Mandatory fields missing.");
            return;
        }
        setLoading(true);
        const tempUser = { ...newUserForm, Status: 'Active' };
        try {
            await sheetsService.registerUser(tempUser);
            setActionSuccess("Member added successfully! 🚀");
            setAddingUser(false);
            setNewUserForm({ Username: '', Password: '', Department: 'General', Mobile: '', Role: 'user' });
            loadUsers();
        } catch (error) {
            alert("Failed to add user.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [isApproving, setIsApproving] = useState(false);

    const handleApprove = async (u) => {
        if (!confirm(`Approve access for ${u.Username}?`)) return;
        setIsApproving(true);
        try {
            await sheetsService.updateUser({ Username: u.Username, Status: 'Active', OldUsername: u.Username });
            setActionSuccess("User Approved! Account is now active. ✅");
            loadUsers();
        } catch (error) {
            alert("Failed to approve user.");
            console.error(error);
        } finally {
            setIsApproving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const term = searchTerm.toLowerCase();
        return (
            String(u.Username || '').toLowerCase().includes(term) ||
            String(u.Department || '').toLowerCase().includes(term) ||
            String(u.Role || '').toLowerCase().includes(term) ||
            String(u.Mobile || '').includes(term)
        );
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const isAuthorized = user.Role?.toUpperCase() === 'ADMIN' || user.Role?.toUpperCase() === 'SUPER_ADMIN';
    if (!isAuthorized) return <div className="p-10 text-center text-red-500">Access Denied</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto pb-10 px-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#1f2d2a] tracking-tight flex items-center gap-3 uppercase">
                        <UsersIcon className="text-[#2e7d32] bg-[#cfead6] p-2 rounded-xl border border-[#2e7d32]/10" size={32} />
                        Registry
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black mt-1 ml-1 uppercase tracking-widest">
                        Database: <span className="text-[#2e7d32]">{users.length} Authorized Units</span>
                    </p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-72 group">
                        <Search className="absolute left-3 top-2.5 text-slate-300 group-focus-within:text-[#2e7d32] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by Name, Dept..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dcdcdc] rounded-xl focus:border-[#2e7d32] outline-none text-[11px] font-black uppercase tracking-tight placeholder:text-slate-300 shadow-none transition-all"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <button onClick={() => setAddingUser(true)} className="bg-[#2e7d32] hover:bg-[#256628] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-none border border-transparent">
                        <UserPlus size={18} /> Add Provision
                    </button>
                </div>
            </div>

            <SuccessPopup message={actionSuccess} onClose={() => setActionSuccess(null)} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-compact min-w-[800px]">
                        <thead>
                            <tr className="text-table-header text-slate-500 tracking-wide font-bold">
                                <th className="px-6 py-4">Identity</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Security</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-20 text-center text-slate-300 font-black uppercase tracking-widest animate-pulse">Loading Registry...</td></tr>
                            ) : paginatedUsers.map((u, idx) => (
                                <tr key={u.Username || idx} className="hover:bg-[#f8faf9] transition-colors group">
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => handleEditClick(u)}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-none overflow-hidden ${u.Role === 'admin' ? 'bg-[#2e7d32]' : 'bg-slate-200 text-slate-400'}`}>
                                                {u.ProfilePhoto ? (
                                                    <img src={u.ProfilePhoto} alt="DP" className="w-full h-full object-cover object-center" loading="lazy" />
                                                ) : (
                                                    u.Username ? u.Username[0].toUpperCase() : '?'
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-[#1f2d2a] group-hover:text-[#2e7d32] transition-colors uppercase tracking-tight">{u.Username}</span>
                                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{u.Role}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#f8faf9] text-slate-400 border border-[#dcdcdc] uppercase tracking-widest">
                                            {u.Department}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${u.Status === 'Active' ? 'bg-[#2e7d32]' : 'bg-amber-400'}`}></div>
                                            <span className="text-[10px] font-black text-[#1f2d2a] uppercase tracking-widest">{u.Status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 cursor-pointer group/pass" onClick={(e) => { e.stopPropagation(); setUsers(users.map(item => item.Username === u.Username ? { ...item, showPass: !item.showPass } : item)) }}>
                                            <span className="text-[10px] font-mono text-slate-300 font-black">{u.showPass ? u.Password : '••••'}</span>
                                            <Key size={12} className="text-slate-200 group-hover/pass:text-[#2e7d32] transition-colors" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            {u.Username === 'AM Sir' ? (
                                                user.Username === 'AM Sir' ? (
                                                    <button onClick={() => handleEditClick(u)} className="p-2 text-slate-300 hover:text-[#2e7d32] transition-all"><Edit2 size={16} /></button>
                                                ) : (
                                                    <span className="p-2 text-slate-200 cursor-not-allowed" title="Super Admin Protected"><Lock size={16} /></span>
                                                )
                                            ) : (
                                                <>
                                                    {u.Status !== 'Active' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(u)}
                                                                disabled={isApproving}
                                                                title="Approve User"
                                                                className="px-3 py-1 bg-[#f0f9f1] text-[#2e7d32] hover:bg-[#cfead6] rounded-lg transition-all border border-[#cfead6] text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                                            >
                                                                <Check size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm(u)}
                                                                title="Reject/Delete"
                                                                className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all border border-rose-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                                            >
                                                                <X size={14} /> Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {u.Status === 'Active' && (
                                                        <button onClick={() => handleEditClick(u)} className="p-2 text-slate-300 hover:text-[#2e7d32] transition-all" title="Edit Profile"><Edit2 size={16} /></button>
                                                    )}

                                                    {u.Username !== user.Username && (
                                                        <button onClick={() => setDeleteConfirm(u)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete User"><Trash2 size={16} /></button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                        <span className="text-small-info text-slate-500">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronLeft size={16} /></button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div >

            {/* Add User Modal */}
            {
                addingUser && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#dcdcdc] relative overflow-hidden"
                        >
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#2e7d32]"></div>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-[#1f2d2a] flex items-center gap-3 uppercase tracking-tight">
                                    <div className="p-2 bg-[#cfead6] rounded-xl text-[#2e7d32] border border-[#2e7d32]/10">
                                        <UserPlus size={20} />
                                    </div>
                                    New Authority
                                </h3>
                                <button onClick={() => !loading && setAddingUser(false)} disabled={loading} className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-50">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                                        Identity Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 bg-slate-50 border border-[#dcdcdc] rounded-xl font-black text-xs uppercase tracking-tight text-[#1f2d2a] focus:bg-white focus:border-[#2e7d32] outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Full Name"
                                        value={newUserForm.Username}
                                        onChange={e => setNewUserForm({ ...newUserForm, Username: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Provision Role</label>
                                        <select
                                            className="w-full p-3.5 bg-slate-50 border border-[#dcdcdc] rounded-xl font-black text-xs uppercase tracking-tight text-[#1f2d2a] outline-none"
                                            value={newUserForm.Role}
                                            onChange={e => setNewUserForm({ ...newUserForm, Role: e.target.value })}
                                        >
                                            <option value="user">User</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Department</label>
                                        <div className="relative">
                                            <select
                                                className="w-full p-3.5 bg-slate-50 border border-[#dcdcdc] rounded-xl font-black text-xs uppercase tracking-tight text-[#1f2d2a] outline-none appearance-none"
                                                value={newUserForm.Department}
                                                onChange={e => setNewUserForm({ ...newUserForm, Department: e.target.value })}
                                            >
                                                <option value="General">General</option>
                                                {DEPARTMENTS.sort().map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-4 pointer-events-none text-slate-300 text-[10px]">▼</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Communication</label>
                                    <input
                                        type="tel"
                                        className="w-full p-3.5 bg-slate-50 border border-[#dcdcdc] rounded-xl font-black text-xs uppercase tracking-tight text-[#1f2d2a] outline-none focus:bg-white focus:border-[#2e7d32]"
                                        placeholder="Mobile (10 Digits)"
                                        value={newUserForm.Mobile}
                                        onChange={e => setNewUserForm({ ...newUserForm, Mobile: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Access Code</label>
                                    <input
                                        type="text"
                                        className="w-full p-3.5 bg-slate-50 border border-[#dcdcdc] rounded-xl font-black text-xs uppercase tracking-tight text-[#1f2d2a] outline-none focus:bg-white focus:border-[#2e7d32]"
                                        placeholder="Password"
                                        value={newUserForm.Password}
                                        onChange={e => setNewUserForm({ ...newUserForm, Password: e.target.value })}
                                    />
                                </div>

                                <button
                                    onClick={handleAddUser}
                                    disabled={loading || !newUserForm.Username || !newUserForm.Password}
                                    className="w-full py-4.5 bg-[#2e7d32] hover:bg-[#256628] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-none transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed border border-transparent"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Confirm Registration
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Side Panel Implementation */}
            <AnimatePresence>
                {selectedUser && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[140]"
                            onClick={() => setSelectedUser(null)}
                        />
                        <UserProfilePanel
                            user={selectedUser}
                            onClose={() => setSelectedUser(null)}
                            onUpdate={handleUpdateUser}
                            onDelete={() => { setDeleteConfirm(selectedUser); setSelectedUser(null); }}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Access?</h3>
                            <p className="text-slate-500 mb-6 font-medium">Are you sure you want to remove <span className="text-slate-900 font-bold">{deleteConfirm.Username}</span>?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Yes, Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )
            }
        </motion.div >
    );
};

const UsersIcon = ({ className, size }) => (
    <div className={className}><Shield size={size} /></div>
);

export default UserManagement;
