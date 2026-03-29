import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, Phone, Mail, MapPin, Globe, 
  Package, DollarSign, Clock, Star, AlertCircle, ExternalLink, ArrowRight
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
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logAction } from '../lib/audit';

const SupplierManager = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', 
    contactPerson: '',
    email: '', 
    phone: '',
    address: '',
    website: '',
    category: 'Pipes',
    rating: 5,
    status: 'active' as 'active' | 'inactive'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newSupplier.name) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'suppliers'), {
        ...newSupplier,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await logAction('add_supplier', `Added new supplier: ${newSupplier.name}`);
      setIsCreating(false);
      setNewSupplier({ 
        name: '', contactPerson: '', email: '', phone: '', 
        address: '', website: '', category: 'Pipes', rating: 5, status: 'active' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'suppliers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suppliers', id));
      await logAction('delete_supplier', `Deleted supplier ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
    }
  };

  const filteredSuppliers = suppliers.filter(sup => 
    sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Supplier Management</h3>
          <p className="text-white/60 text-sm">Manage your supply chain and purchase orders efficiently.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'Add New Supplier'}
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
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Company Name</label>
              <input 
                type="text" 
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                placeholder="e.g. Astral Pipes Ltd."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Contact Person</label>
              <input 
                type="text" 
                value={newSupplier.contactPerson}
                onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
                placeholder="e.g. Rajesh Kumar"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Category</label>
              <select 
                value={newSupplier.category}
                onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              >
                <option value="Pipes" className="bg-slate-900">Pipes</option>
                <option value="Fittings" className="bg-slate-900">Fittings</option>
                <option value="Sanitaryware" className="bg-slate-900">Sanitaryware</option>
                <option value="Hardware" className="bg-slate-900">Hardware</option>
                <option value="Tools" className="bg-slate-900">Tools</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                placeholder="supplier@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                placeholder="+91 98765 43210"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newSupplier.name}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-brand-dark rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Save Supplier
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
            <p className="text-white/40">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0f172a] rounded-3xl border border-white/5">
            <Truck className="mx-auto text-white/10 mb-4" size={64} />
            <p className="text-white/40">No suppliers found.</p>
          </div>
        ) : (
          filteredSuppliers.map((sup) => (
            <motion.div 
              key={sup.id}
              layout
              className="bg-[#0f172a] rounded-3xl border border-white/5 p-6 hover:border-brand-orange/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(sup.id)}
                  className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                  <Truck size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white leading-tight">{sup.name}</h4>
                  <p className="text-brand-orange text-xs font-bold uppercase tracking-wider mt-1">{sup.category}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Phone size={14} className="text-brand-orange" />
                  {sup.phone || 'No phone provided'}
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Mail size={14} className="text-brand-orange" />
                  {sup.email || 'No email provided'}
                </div>
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <MapPin size={14} className="text-brand-orange" />
                  <span className="truncate">{sup.address || 'No address provided'}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className={i < (sup.rating || 5) ? 'text-brand-orange fill-brand-orange' : 'text-white/10'} 
                    />
                  ))}
                </div>
                <button className="text-xs font-bold text-white/40 hover:text-brand-orange transition-colors flex items-center gap-1">
                  View Details <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierManager;
