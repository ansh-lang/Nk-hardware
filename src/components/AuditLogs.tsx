import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ShieldAlert, 
  History, 
  FileCheck,
  Smartphone,
  Globe,
  Clock,
  User,
  CheckCircle2
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  device: string;
  ip?: string;
  createdAt: any;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      setLogs(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: 'Detailed user activity timeline', icon: Clock, color: 'text-amber-500' },
    { label: 'IP address & device tracking', icon: Globe, color: 'text-amber-500' },
    { label: 'Data export & deletion logs', icon: Download, color: 'text-amber-500' },
    { label: 'Failed login attempt alerts', icon: ShieldAlert, color: 'text-amber-500' },
    { label: 'Configuration change history', icon: History, color: 'text-amber-500' },
    { label: 'Compliance reporting (GDPR/CCPA)', icon: FileCheck, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Audit Logs</h3>
          <p className="text-white/60 text-sm">Track every action taken within the admin panel.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 text-sm transition-all">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Feature Grid from Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0f172a] p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-brand-orange/30 transition-colors group">
            <div className={`p-2 bg-white/5 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
              <CheckCircle2 size={18} />
            </div>
            <span className="text-sm text-white/80 font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="Search by email, action, or details..." 
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-orange/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-white/40" size={18} />
          <select 
            className="bg-[#0f172a] border border-white/10 rounded-xl text-white px-4 py-2.5 focus:outline-none focus:border-brand-orange/50 transition-all text-sm"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="create_product">Create Product</option>
            <option value="delete_product">Delete Product</option>
            <option value="update_quote">Update Quote</option>
            <option value="delete_quote">Delete Quote</option>
            <option value="login">Login</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">User</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Action</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Device</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    <Activity className="animate-spin mx-auto mb-2" size={24} />
                    Loading logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                          <User size={14} />
                        </div>
                        <div className="text-sm text-white font-medium">{log.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        log.action.includes('delete') ? 'bg-red-500/10 text-red-500' :
                        log.action.includes('create') ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/40 text-xs">
                        <Smartphone size={12} />
                        <span className="truncate max-w-[100px]">{log.device}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40">
                      {log.createdAt?.toDate().toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
