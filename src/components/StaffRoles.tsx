import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  X, 
  Loader2, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Key, 
  UserCheck, 
  UserPlus
} from 'lucide-react';

const StaffRoles = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(docs.filter((u: any) => u.role === 'admin' || u.role === 'staff'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateRole = async (id: string, newRole: string) => {
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
    } catch (error) {
      console.error("Update role error:", error);
    }
  };

  const filtered = staff.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Staff & Roles</h3>
          <p className="text-white/60 text-sm">Manage administrative access and permission levels.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105">
          <UserPlus size={18} /> Invite Staff
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input 
          type="text" 
          placeholder="Search staff members..." 
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-orange/50 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-white/40">
            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
            Loading staff...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-white/40 bg-[#0f172a] rounded-2xl border border-white/5">
            <Shield size={48} className="mx-auto mb-4 opacity-20" />
            <p>No staff members found.</p>
          </div>
        ) : (
          filtered.map((member) => (
            <div key={member.id} className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 hover:border-brand-orange/30 transition-all group relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    {member.photoURL ? <img src={member.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" /> : <User size={24} />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{member.name || 'Unknown Staff'}</h4>
                    <div className="text-xs text-white/40">{member.email}</div>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${member.role === 'admin' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {member.role === 'admin' ? <ShieldCheck size={20} /> : <Shield size={20} />}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 uppercase font-bold tracking-widest">Role</span>
                  <select 
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-brand-orange text-[10px] font-bold uppercase"
                    value={member.role}
                    onChange={(e) => updateRole(member.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 uppercase font-bold tracking-widest">Status</span>
                  <span className="flex items-center gap-1 text-emerald-500 font-bold">
                    <CheckCircle2 size={12} /> Active
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <button className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-1">
                  <Key size={12} /> Reset Password
                </button>
                <button className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest flex items-center gap-1">
                  <Lock size={12} /> Revoke Access
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Permissions Guide */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5">
        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ShieldAlert size={18} className="text-brand-orange" /> Permission Levels
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <h5 className="text-emerald-500 font-bold text-sm mb-2 flex items-center gap-2">
              <ShieldCheck size={14} /> Administrator
            </h5>
            <p className="text-xs text-white/60 leading-relaxed">
              Full access to all system features, including staff management, financial data, and site settings.
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <h5 className="text-blue-500 font-bold text-sm mb-2 flex items-center gap-2">
              <Shield size={14} /> Staff Member
            </h5>
            <p className="text-xs text-white/60 leading-relaxed">
              Access to catalog, orders, and CRM. Cannot modify system settings or manage other staff members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRoles;
