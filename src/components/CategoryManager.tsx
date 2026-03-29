import React, { useState, useEffect } from 'react';
import { 
  ListTree, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, FolderTree, Layers, Tag, ChevronRight,
  GripVertical, LayoutGrid, List
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

const CategoryManager = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    description: '', 
    slug: '', 
    parentId: null as string | null,
    status: 'active' as 'active' | 'inactive'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.name) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'categories'), {
        ...newCategory,
        slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewCategory({ name: '', description: '', slug: '', parentId: null, status: 'active' });
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const toggleStatus = async (category: any) => {
    try {
      await updateDoc(doc(db, 'categories', category.id), {
        status: category.status === 'active' ? 'inactive' : 'active',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Category Management</h3>
          <p className="text-white/60 text-sm">Organize your catalog for maximum discoverability.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'Create New Category'}
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
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Category Name</label>
              <input 
                type="text" 
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="e.g. CPVC Fittings"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Parent Category (Optional)</label>
              <select 
                value={newCategory.parentId || ''}
                onChange={(e) => setNewCategory({...newCategory, parentId: e.target.value || null})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              >
                <option value="" className="bg-slate-900">None (Top Level)</option>
                {categories.filter(c => !c.parentId).map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Description</label>
            <textarea 
              value={newCategory.description}
              onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              placeholder="Brief description of this category..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all h-24 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newCategory.name}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-brand-dark rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Save Category
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input 
              type="text" 
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
              <Filter size={18} />
            </button>
            <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
              <LayoutGrid size={18} />
            </button>
            <button className="p-2 bg-brand-orange/10 border border-brand-orange/20 rounded-lg text-brand-orange transition-colors">
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">Slug</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={32} />
                    <p className="text-white/40">Loading categories...</p>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <FolderTree className="mx-auto text-white/10 mb-4" size={48} />
                    <p className="text-white/40">No categories found.</p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                          <Tag size={20} />
                        </div>
                        <div>
                          <div className="text-white font-bold">{cat.name}</div>
                          {cat.parentId && (
                            <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                              <Layers size={10} />
                              Sub-category of {categories.find(c => c.id === cat.parentId)?.name || 'Unknown'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">/{cat.slug}</code>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(cat)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                          cat.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        {cat.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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

export default CategoryManager;
