import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
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
  FileText, 
  Image as ImageIcon, 
  Tag, 
  MessageSquare, 
  Share2, 
  Wand2, 
  Sparkles, 
  Calendar,
  User,
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

const BlogManager = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPost, setNewPost] = useState({ 
    title: '', 
    category: 'Design', 
    status: 'draft' as 'draft' | 'published',
    content: '',
    author: 'Ansh Singhal',
    views: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blog posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!newPost.title || !newPost.content) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'blog_posts'), {
        ...newPost,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewPost({ 
        title: '', category: 'Design', status: 'draft', content: '', author: 'Ansh Singhal', views: 0 
      });
    } catch (error) {
      console.error("Error creating blog post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
    } catch (error) {
      console.error("Error deleting blog post:", error);
    }
  };

  const toggleStatus = async (post: any) => {
    try {
      await updateDoc(doc(db, 'blog_posts', post.id), {
        status: post.status === 'published' ? 'draft' : 'published',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Blog & Articles</h3>
          <p className="text-white/60 text-sm">Manage your content marketing and news updates.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
          {isCreating ? 'Cancel' : 'New Article'}
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] p-8 rounded-3xl border border-brand-orange/30 space-y-6 shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Article Title</label>
                <input 
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" 
                  placeholder="e.g. The Future of Smart Bathrooms" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Category</label>
                <select 
                  value={newPost.category}
                  onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange"
                >
                  <option className="bg-slate-900">Design</option>
                  <option className="bg-slate-900">Technical</option>
                  <option className="bg-slate-900">Maintenance</option>
                  <option className="bg-slate-900">Product Review</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Featured Image URL</label>
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" 
                  placeholder="https://picsum.photos/seed/blog/800/600" 
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Content</label>
            <textarea 
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange min-h-[200px]" 
              placeholder="Start writing your masterpiece..." 
            />
          </div>
          <div className="flex justify-end gap-4">
            <button 
              onClick={handleCreate}
              disabled={submitting || !newPost.title || !newPost.content}
              className="px-6 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm hover:bg-orange-400 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Publish Article
            </button>
          </div>
        </motion.div>
      )}

      {/* Article List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={48} />
            <p className="text-white/40">Loading articles...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0f172a] rounded-3xl border border-white/5">
            <FileText className="mx-auto text-white/10 mb-4" size={64} />
            <p className="text-white/40">No articles found.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <motion.div 
              key={post.id} 
              layout
              className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 hover:border-brand-orange/30 transition-all group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <button 
                  onClick={() => toggleStatus(post)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    post.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  {post.status}
                </button>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors"><Edit3 size={14} /></button>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-brand-orange transition-colors">{post.title}</h4>
              
              <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                <div className="flex items-center gap-1"><User size={12} /> {post.author}</div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} /> 
                  {post.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                </div>
                <div className="flex items-center gap-1"><Eye size={12} /> {post.views}</div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">{post.category}</span>
                <button className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1">
                  Preview <Eye size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogManager;
