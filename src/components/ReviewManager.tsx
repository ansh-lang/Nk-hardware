import React, { useState, useEffect } from 'react';
import { 
  Star, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, User, MessageSquare, Quote, 
  ThumbsUp, ThumbsDown, AlertCircle, ShieldCheck, ShieldAlert,
  Package, ShoppingBag
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

const ReviewManager = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'reviews', id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Product Reviews</h3>
          <p className="text-white/60 text-sm">Moderate and manage customer feedback on products.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f ? 'bg-brand-orange text-brand-dark' : 'text-white/40 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
            <p className="text-white/40">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center bg-[#0f172a] rounded-3xl border border-white/5">
            <MessageSquare className="mx-auto text-white/10 mb-4" size={64} />
            <p className="text-white/40">No reviews found.</p>
          </div>
        ) : (
          filteredReviews.map((r) => (
            <motion.div 
              key={r.id}
              layout
              className="bg-[#0f172a] rounded-3xl border border-white/5 p-6 hover:border-brand-orange/30 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4 shrink-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{r.userName || 'Anonymous'}</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Customer</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < (r.rating || 5) ? 'text-brand-orange fill-brand-orange' : 'text-white/10'} 
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs bg-white/5 p-2 rounded-lg">
                    <Package size={14} className="text-brand-orange" />
                    <span className="truncate">{r.productName || 'Unknown Product'}</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="relative mb-6">
                    <Quote className="absolute -top-2 -left-2 text-brand-orange/10" size={48} />
                    <p className="text-white/80 text-[15px] leading-relaxed relative z-10 italic">
                      "{r.comment || 'No comment provided.'}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateStatus(r.id, 'approved')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                          r.status === 'approved' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white/5 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-500'
                        }`}
                      >
                        <ShieldCheck size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(r.id, 'rejected')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                          r.status === 'rejected' 
                            ? 'bg-red-500 text-white' 
                            : 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500'
                        }`}
                      >
                        <ShieldAlert size={14} /> Reject
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewManager;
