import React, { useState, useEffect } from 'react';
import { 
  Mail, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, Send, Users, BarChart3, Clock, 
  Calendar, Zap, Sparkles, MessageSquare, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCampaign, setNewCampaign] = useState({ 
    name: '', 
    subject: '',
    content: '', 
    targetAudience: 'All Customers',
    status: 'draft' as 'draft' | 'scheduled' | 'sent',
    scheduledAt: null as string | null
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newCampaign.name || !newCampaign.subject) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'campaigns'), {
        ...newCampaign,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewCampaign({ 
        name: '', subject: '', content: '', targetAudience: 'All Customers', 
        status: 'draft', scheduledAt: null 
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const sendCampaign = async (id: string) => {
    try {
      await updateDoc(doc(db, 'campaigns', id), {
        status: 'sent',
        sentAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending campaign:", error);
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Email Campaigns</h3>
          <p className="text-white/60 text-sm">Manage your content marketing and news updates.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] p-6 rounded-2xl border border-white/10 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Campaign Name</label>
              <input 
                type="text" 
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="e.g. Summer Sale 2024"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email Subject</label>
              <input 
                type="text" 
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                placeholder="e.g. Get 20% off on all CPVC fittings!"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email Content (HTML or Text)</label>
            <textarea 
              value={newCampaign.content}
              onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
              placeholder="Write your email content here..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all h-48 resize-none font-mono text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newCampaign.name || !newCampaign.subject}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-brand-dark rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Save Campaign
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
            <p className="text-white/40">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0f172a] rounded-3xl border border-white/5">
            <Mail className="mx-auto text-white/10 mb-4" size={64} />
            <p className="text-white/40">No campaigns found.</p>
          </div>
        ) : (
          filteredCampaigns.map((c) => (
            <motion.div 
              key={c.id}
              layout
              className="bg-[#0f172a] rounded-3xl border border-white/5 p-6 hover:border-brand-orange/30 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    c.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-orange/10 text-brand-orange'
                  }`}>
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{c.name}</h4>
                    <p className="text-white/40 text-xs mt-0.5">{c.subject}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  c.status === 'sent' 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                }`}>
                  {c.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 p-3 rounded-2xl text-center">
                  <div className="text-white font-bold text-lg">{c.status === 'sent' ? '1.2k' : '0'}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Sent</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl text-center">
                  <div className="text-white font-bold text-lg">{c.status === 'sent' ? '45%' : '0%'}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Open Rate</div>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl text-center">
                  <div className="text-white font-bold text-lg">{c.status === 'sent' ? '12%' : '0%'}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">CTR</div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {c.status !== 'sent' && (
                    <button 
                      onClick={() => sendCampaign(c.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-xs hover:scale-105 transition-all"
                    >
                      <Send size={14} /> Send Now
                    </button>
                  )}
                  <button className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-white transition-colors">
                    <Edit3 size={18} />
                  </button>
                </div>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignManager;
