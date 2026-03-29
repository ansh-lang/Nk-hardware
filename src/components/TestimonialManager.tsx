import React, { useState, useEffect } from 'react';
import { 
  Star, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, User, MessageSquare, Quote, 
  ThumbsUp, ThumbsDown, AlertCircle, ShieldCheck, ShieldAlert
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

const TestimonialManager = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTestimonial, setNewTestimonial] = useState({ 
    name: '', 
    role: '',
    content: '', 
    rating: 5,
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    featured: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching testimonials:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newTestimonial.name || !newTestimonial.content) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        ...newTestimonial,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewTestimonial({ 
        name: '', role: '', content: '', rating: 5, status: 'pending', featured: false 
      });
    } catch (error) {
      console.error("Error creating testimonial:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'testimonials', id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const toggleFeatured = async (testimonial: any) => {
    try {
      await updateDoc(doc(db, 'testimonials', testimonial.id), {
        featured: !testimonial.featured,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const filteredTestimonials = testimonials.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Testimonials & Reviews</h3>
          <p className="text-white/60 text-sm">Build trust with verified customer feedback.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'Add Testimonial'}
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
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Customer Name</label>
              <input 
                type="text" 
                value={newTestimonial.name}
                onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
                placeholder="e.g. John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Role / Company</label>
              <input 
                type="text" 
                value={newTestimonial.role}
                onChange={(e) => setNewTestimonial({...newTestimonial, role: e.target.value})}
                placeholder="e.g. Architect, BuildDesign"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Testimonial Content</label>
            <textarea 
              value={newTestimonial.content}
              onChange={(e) => setNewTestimonial({...newTestimonial, content: e.target.value})}
              placeholder="What did the customer say?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all h-24 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newTestimonial.name || !newTestimonial.content}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-brand-dark rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Save Testimonial
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
            <p className="text-white/40">Loading testimonials...</p>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0f172a] rounded-3xl border border-white/5">
            <Quote className="mx-auto text-white/10 mb-4" size={64} />
            <p className="text-white/40">No testimonials found.</p>
          </div>
        ) : (
          filteredTestimonials.map((t) => (
            <motion.div 
              key={t.id}
              layout
              className="bg-[#0f172a] rounded-3xl border border-white/5 p-6 hover:border-brand-orange/30 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{t.name}</h4>
                    <p className="text-white/40 text-xs mt-0.5">{t.role || 'Customer'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < (t.rating || 5) ? 'text-brand-orange fill-brand-orange' : 'text-white/10'} 
                    />
                  ))}
                </div>
              </div>

              <div className="relative mb-8">
                <Quote className="absolute -top-2 -left-2 text-brand-orange/10" size={48} />
                <p className="text-white/80 text-[15px] leading-relaxed relative z-10 italic">
                  "{t.content}"
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateStatus(t.id, 'approved')}
                    className={`p-2 rounded-lg transition-all ${
                      t.status === 'approved' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white/5 text-white/40 hover:bg-emerald-500/20 hover:text-emerald-500'
                    }`}
                    title="Approve"
                  >
                    <ShieldCheck size={18} />
                  </button>
                  <button 
                    onClick={() => updateStatus(t.id, 'rejected')}
                    className={`p-2 rounded-lg transition-all ${
                      t.status === 'rejected' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500'
                    }`}
                    title="Reject"
                  >
                    <ShieldAlert size={18} />
                  </button>
                  <button 
                    onClick={() => toggleFeatured(t)}
                    className={`p-2 rounded-lg transition-all ${
                      t.featured 
                        ? 'bg-brand-orange text-brand-dark' 
                        : 'bg-white/5 text-white/40 hover:bg-brand-orange/20 hover:text-brand-orange'
                    }`}
                    title="Feature on Homepage"
                  >
                    <Star size={18} />
                  </button>
                </div>
                <button 
                  onClick={() => handleDelete(t.id)}
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

export default TestimonialManager;
