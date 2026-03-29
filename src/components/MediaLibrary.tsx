import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Image as ImageIcon, 
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
  Upload, 
  Download, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Grid, 
  List, 
  File, 
  Video, 
  Music
} from 'lucide-react';

const MediaLibrary = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFiles(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'media'), {
        name: file.name,
        url,
        type: file.type,
        size: file.size,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await deleteDoc(doc(db, 'media', id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} />;
    if (type.startsWith('video/')) return <Video size={20} />;
    if (type.startsWith('audio/')) return <Music size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Media Library</h3>
          <p className="text-white/60 text-sm">Manage all your assets, images, and documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-orange text-brand-dark' : 'text-white/40 hover:text-white'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-orange text-brand-dark' : 'text-white/40 hover:text-white'}`}
            >
              <List size={18} />
            </button>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105 cursor-pointer">
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {isUploading ? 'Uploading...' : 'Upload Media'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
        <input 
          type="text" 
          placeholder="Search media files..." 
          className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-orange/50 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-white/40">
          <Loader2 className="animate-spin mx-auto mb-2" size={32} />
          Loading media...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-white/40 bg-[#0f172a] rounded-2xl border border-white/5">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
          <p>No media files found.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((file) => (
            <div key={file.id} className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden group relative hover:border-brand-orange/30 transition-all">
              <div className="aspect-square bg-white/5 flex items-center justify-center relative overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="text-white/20 group-hover:text-brand-orange transition-colors">
                    {getIcon(file.type)}
                  </div>
                )}
                <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => copyToClipboard(file.url, file.id)} className="p-2 bg-white/10 hover:bg-brand-orange hover:text-brand-dark rounded-lg text-white transition-all">
                    {copiedId === file.id ? <Check size={16} /> : <LinkIcon size={16} />}
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="p-2 bg-white/10 hover:bg-red-500 rounded-lg text-white transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <div className="text-xs font-bold text-white truncate mb-1">{file.name}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">{formatSize(file.size)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">File Name</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Type</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Size</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Date</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((file) => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-orange transition-colors">
                        {getIcon(file.type)}
                      </div>
                      <div className="text-sm text-white font-medium truncate max-w-[200px]">{file.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40 uppercase">{file.type.split('/')[1]}</td>
                  <td className="px-6 py-4 text-sm text-white/40">{formatSize(file.size)}</td>
                  <td className="px-6 py-4 text-sm text-white/40">{file.createdAt?.toDate().toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => copyToClipboard(file.url, file.id)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-brand-orange transition-colors">
                        {copiedId === file.id ? <Check size={16} /> : <LinkIcon size={16} />}
                      </button>
                      <button onClick={() => handleDelete(file.id)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
