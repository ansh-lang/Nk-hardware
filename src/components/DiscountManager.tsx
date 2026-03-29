import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, Percent, Calendar, Clock, 
  Ticket, Zap, Sparkles, ArrowRight, Gift, Copy
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

const DiscountManager = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDiscount, setNewDiscount] = useState({ 
    code: '', 
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0, 
    minPurchase: 0,
    expiryDate: '',
    status: 'active' as 'active' | 'inactive',
    usageLimit: 100
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'discounts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDiscounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching discounts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newDiscount.code || !newDiscount.value) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'discounts'), {
        ...newDiscount,
        code: newDiscount.code.toUpperCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewDiscount({ 
        code: '', type: 'percentage', value: 0, minPurchase: 0, 
        expiryDate: '', status: 'active', usageLimit: 100 
      });
    } catch (error) {
      console.error("Error creating discount:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'discounts', id));
    } catch (error) {
      console.error("Error deleting discount:", error);
    }
  };

  const toggleStatus = async (discount: any) => {
    try {
      await updateDoc(doc(db, 'discounts', discount.id), {
        status: discount.status === 'active' ? 'inactive' : 'active',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredDiscounts = discounts.filter(d => 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Coupons & Discounts</h3>
          <p className="text-white/60 text-sm">Create and manage promotional offers for your customers.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] p-6 rounded-2xl border border-white/10 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Coupon Code</label>
              <input 
                type="text" 
                value={newDiscount.code}
                onChange={(e) => setNewDiscount({...newDiscount, code: e.target.value})}
                placeholder="e.g. SUMMER20"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Discount Type</label>
              <select 
                value={newDiscount.type}
                onChange={(e) => setNewDiscount({...newDiscount, type: e.target.value as any})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              >
                <option value="percentage" className="bg-slate-900">Percentage (%)</option>
                <option value="fixed" className="bg-slate-900">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Value</label>
              <input 
                type="number" 
                value={newDiscount.value}
                onChange={(e) => setNewDiscount({...newDiscount, value: Number(e.target.value)})}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Min Purchase (₹)</label>
              <input 
                type="number" 
                value={newDiscount.minPurchase}
                onChange={(e) => setNewDiscount({...newDiscount, minPurchase: Number(e.target.value)})}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Expiry Date</label>
              <input 
                type="date" 
                value={newDiscount.expiryDate}
                onChange={(e) => setNewDiscount({...newDiscount, expiryDate: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newDiscount.code || !newDiscount.value}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-brand-dark rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Save Coupon
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
            <p className="text-white/40">Loading discounts...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0f172a] rounded-3xl border border-white/5">
            <Ticket className="mx-auto text-white/10 mb-4" size={64} />
            <p className="text-white/40">No coupons found.</p>
          </div>
        ) : (
          filteredDiscounts.map((d) => (
            <motion.div 
              key={d.id}
              layout
              className="bg-[#0f172a] rounded-3xl border border-white/5 p-6 hover:border-brand-orange/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(d.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                  <Ticket size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tighter">{d.code}</h4>
                  <p className="text-brand-orange text-xs font-bold uppercase tracking-wider mt-1">
                    {d.type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-white/60 text-sm">
                  <span className="flex items-center gap-2"><Calendar size={14} /> Expiry</span>
                  <span className="text-white font-medium">{d.expiryDate || 'Never'}</span>
                </div>
                <div className="flex items-center justify-between text-white/60 text-sm">
                  <span className="flex items-center gap-2"><Percent size={14} /> Min Purchase</span>
                  <span className="text-white font-medium">₹{d.minPurchase || 0}</span>
                </div>
                <div className="flex items-center justify-between text-white/60 text-sm">
                  <span className="flex items-center gap-2"><Gift size={14} /> Status</span>
                  <button 
                    onClick={() => toggleStatus(d)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {d.status}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-white/40 uppercase tracking-widest">
                  Used 0 / {d.usageLimit} times
                </div>
                <button className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-brand-orange transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscountManager;
