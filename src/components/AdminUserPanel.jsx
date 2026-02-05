import { useState, useEffect } from 'react';
import { sheetsService } from '../services/googleSheets';
import { Check, X, Shield, User as UserIcon } from 'lucide-react';

const AdminUserPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // In real app, we would re-fetch. Here we mock local state updates for demo perception
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await sheetsService.getUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (targetUser, newRole, newStatus) => {
        const username = targetUser.Username;
        try {
            const fullPayload = {
                OldUsername: username,
                Username: username,
                Password: targetUser.Password,
                Department: targetUser.Department,
                Mobile: targetUser.Mobile,
                Role: newRole,
                Status: newStatus
            };

            await sheetsService.updateUser(fullPayload);

            setUsers(users.map(u =>
                u.Username === username ? { ...u, Role: newRole, Status: newStatus } : u
            ));
        } catch (error) {
            console.error("Failed to update user", error);
            alert("Failed to update user on server.");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <Shield size={20} />
                </div>
                User Management
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest font-bold">
                            <th className="p-4 rounded-tl-2xl">Username</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Current Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 rounded-tr-2xl">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user, idx) => {
                            const uName = user.Username || '';
                            const uDept = user.Department || '';
                            const uRole = user.Role || '';
                            const uStatus = user.Status || '';

                            return (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 font-bold text-slate-700 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                            {uName[0]?.toUpperCase() || '?'}
                                        </div>
                                        {uName}
                                    </td>
                                    <td className="p-4 text-slate-500 font-medium text-sm">{uDept}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${uRole === 'admin' ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-500/10' :
                                            uRole === 'manager' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/10' :
                                                'bg-slate-100 text-slate-500 ring-1 ring-slate-500/10'
                                            }`}>
                                            {uRole}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${uStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${uStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                            {uStatus === 'Active' ? 'APPROVED' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center gap-3">
                                        {uStatus !== 'Active' && (
                                            <button
                                                onClick={() => updateUserRole(user, uRole, 'Active')}
                                                className="p-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition-all border border-emerald-700"
                                                title="Approve User"
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                        )}
                                        <div className="relative">
                                            <select
                                                className="text-xs font-bold border border-slate-200 rounded-lg py-2 pl-3 pr-8 bg-white text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors"
                                                value={uRole}
                                                onChange={(e) => updateUserRole(user, e.target.value, uStatus)}
                                            >
                                                <option value="user">User</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">▼</div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUserPanel;
