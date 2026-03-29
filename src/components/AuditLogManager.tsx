import React, { useState, useEffect } from 'react';
import { 
  Activity, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, Clock, User, Shield, AlertCircle, 
  Database, Server, Layout, Palette, Mail, Phone, MapPin, 
  Facebook, Instagram, Twitter, Linkedin, Save, Zap, Info, 
  Lock, Key, LogIn, LogOut, Settings, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';

const AuditLogManager = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return <Plus size={14} className="text-emerald-500" />;
      case 'update': return <Edit3 size={14} className="text-blue-500" />;
      case 'delete': return <Trash size={14} className="text-red-500" />;
      case 'login': return <LogIn size={14} className="text-emerald-500" />;
      case 'logout': return <LogOut size={14} className="text-white/40" />;
      default: return <Activity size={14} className="text-brand-orange" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Audit Logs</h3>
          <p className="text-white/60 text-sm">Track all administrative actions and system changes.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={32} />
                    <p className="text-white/40 text-sm">Loading logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Activity className="mx-auto text-white/10 mb-4" size={48} />
                    <p className="text-white/40 text-sm">No logs found.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Clock size={12} />
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-medium text-white">{log.userName || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                          {getActionIcon(log.action || '')}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-white/80">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white/60 line-clamp-1">{log.details || 'No details'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono text-white/20">{log.ipAddress || '127.0.0.1'}</span>
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

export default AuditLogManager;
