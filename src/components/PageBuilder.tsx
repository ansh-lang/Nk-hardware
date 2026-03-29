import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Globe, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Loader2,
  FileText,
  MousePointer2,
  Wand2,
  Save
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

const PageBuilder = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPage, setNewPage] = useState({ 
    title: '', 
    url: '/', 
    status: 'draft' as 'draft' | 'published',
    author: 'Ansh Singhal'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'pages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newPage.title || !newPage.url) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'pages'), {
        ...newPage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewPage({ title: '', url: '/', status: 'draft', author: 'Ansh Singhal' });
    } catch (error) {
      console.error("Error creating page:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pages', id));
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const toggleStatus = async (page: any) => {
    try {
      await updateDoc(doc(db, 'pages', page.id), {
        status: page.status === 'published' ? 'draft' : 'published',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Page Builder</h3>
          <p className="text-white/60 text-sm">Visual drag-and-drop editor for your website pages.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'Create New Page'}
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] p-8 rounded-3xl border border-brand-orange/30 space-y-6 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Page Title</label>
              <input 
                value={newPage.title}
                onChange={(e) => setNewPage({...newPage, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" 
                placeholder="e.g. Summer Sale 2024" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">URL Path</label>
              <input 
                value={newPage.url}
                onChange={(e) => setNewPage({...newPage, url: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" 
                placeholder="e.g. /summer-sale" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newPage.title || !newPage.url}
              className="px-6 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm hover:bg-orange-400 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Create Page
            </button>
          </div>
        </motion.div>
      )}

      {/* Page List */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Page Title</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">URL Path</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Last Modified</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
                    <p className="text-white/40">Loading pages...</p>
                  </td>
                </tr>
              ) : filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <FileText className="mx-auto text-white/10 mb-4" size={64} />
                    <p className="text-white/40">No pages found.</p>
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-orange transition-colors">
                          <FileText size={14} />
                        </div>
                        <div className="text-sm text-white font-medium">{page.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40 font-mono">{page.url}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(page)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          page.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {page.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/40">
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        {page.updatedAt?.toDate().toLocaleDateString() || 'Just now'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors" title="Preview">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-brand-orange transition-colors" title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(page.id)}
                          className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-red-500 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
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

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Visual drag-and-drop editor', icon: MousePointer2 },
          { label: 'Pre-built component library', icon: Layout },
          { label: 'Dynamic content widgets', icon: Wand2 },
          { label: 'A/B testing for landing pages', icon: Globe },
          { label: 'Mobile-first responsive design', icon: CheckCircle2 },
          { label: 'Revision history & rollback', icon: Clock },
        ].map((f, i) => (
          <div key={i} className="bg-[#0f172a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-brand-orange">
              <f.icon size={16} />
            </div>
            <span className="text-sm text-white/80 font-medium">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageBuilder;
