import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Settings, 
  FileText, 
  Link as LinkIcon, 
  Sparkles, 
  Activity, 
  Wand2,
  BarChart3,
  Loader2,
  Save,
  Clock
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
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

const SEOManager = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'seo_audits'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAudits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching SEO audits:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const runSEOAudit = async () => {
    setAnalyzing(true);
    // Simulate a scan
    setTimeout(async () => {
      try {
        await addDoc(collection(db, 'seo_audits'), {
          score: Math.floor(Math.random() * 20) + 80, // 80-100
          pagesScanned: 156,
          issuesFound: Math.floor(Math.random() * 5),
          status: 'completed',
          createdAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving audit:", error);
      } finally {
        setAnalyzing(false);
      }
    }, 2000);
  };

  const latestAudit = audits[0] || { score: 88, pagesScanned: 156, issuesFound: 3 };

  const [metaTags, setMetaTags] = useState({
    title: 'NK Hardware - Premium CPVC & UPVC Solutions',
    description: 'Leading supplier of high-quality CPVC and UPVC pipes and fittings for agriculture and water supply systems.',
    keywords: 'CPVC, UPVC, Pipes, Fittings, Agriculture, Water Supply, NK Hardware'
  });
  const [savingMeta, setSavingMeta] = useState(false);

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    // Simulate saving to Firestore
    setTimeout(() => {
      setSavingMeta(false);
      alert('Meta tags updated successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ... existing header ... */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">SEO Manager</h3>
          <p className="text-white/60 text-sm">Rank higher on Google with advanced SEO tools.</p>
        </div>
        <button 
          onClick={runSEOAudit}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
        >
          {analyzing ? <Activity className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {analyzing ? 'Analyzing SEO...' : 'Run SEO Audit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEO Score Card */}
        <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
          {/* ... existing score circle ... */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <circle 
                cx="64" 
                cy="64" 
                r="58" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray="364" 
                strokeDashoffset={364 - (364 * latestAudit.score) / 100} 
                className="text-brand-orange transition-all duration-1000" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{latestAudit.score}</span>
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">SEO Score</span>
            </div>
          </div>
          <p className="text-sm text-white/60">
            {latestAudit.issuesFound > 0 
              ? `Your site is performing well, but there are ${latestAudit.issuesFound} critical issues to fix.`
              : "Excellent! Your site is perfectly optimized for search engines."}
          </p>
        </div>

        {/* Meta Tags Editor */}
        <div className="lg:col-span-2 bg-[#0f172a] p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings size={18} className="text-brand-orange" /> Global Meta Tags
            </h4>
            <button 
              onClick={handleSaveMeta}
              disabled={savingMeta}
              className="flex items-center gap-2 px-4 py-1.5 bg-brand-orange/10 text-brand-orange rounded-lg font-bold text-xs hover:bg-brand-orange/20 transition-all disabled:opacity-50"
            >
              {savingMeta ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              Save Changes
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Meta Title</label>
              <input 
                type="text" 
                value={metaTags.title}
                onChange={(e) => setMetaTags({...metaTags, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Meta Description</label>
              <textarea 
                value={metaTags.description}
                onChange={(e) => setMetaTags({...metaTags, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-all h-20 resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Keywords (Comma separated)</label>
              <input 
                type="text" 
                value={metaTags.keywords}
                onChange={(e) => setMetaTags({...metaTags, keywords: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange transition-all"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Organic Traffic', value: '12.4k', change: '+15.2%', icon: TrendingUp, color: 'text-emerald-500' },
            { label: 'Avg. Position', value: '4.2', change: '-0.5', icon: BarChart3, color: 'text-blue-500' },
            { label: 'Backlinks', value: '842', change: '+24', icon: LinkIcon, color: 'text-brand-orange' },
            { label: 'Indexed Pages', value: latestAudit.pagesScanned, change: '+12', icon: Globe, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${stat.color} mb-1 flex items-center gap-1 justify-end`}>
                  <stat.icon size={12} /> {stat.change}
                </div>
                <div className="text-[10px] text-white/20">vs last month</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Recommendations */}
      <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5">
        <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles size={18} className="text-brand-orange" /> AI SEO Recommendations
        </h4>
        <div className="space-y-4">
          {[
            { type: 'critical', title: 'Missing Meta Descriptions', details: '5 pages are missing meta descriptions, which can impact click-through rates.', icon: AlertTriangle, color: 'text-red-500' },
            { type: 'warning', title: 'Slow Page Load Speed', details: 'Your home page takes 3.2s to load. Aim for under 2s for better ranking.', icon: Activity, color: 'text-amber-500' },
            { type: 'success', title: 'Keyword Optimization', details: 'Your target keyword "NK Hardware" is well-optimized across all main pages.', icon: CheckCircle2, color: 'text-emerald-500' },
          ].map((rec, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-4 hover:border-brand-orange/30 transition-colors group">
              <div className={`p-2 bg-white/5 rounded-lg ${rec.color} group-hover:scale-110 transition-transform`}>
                <rec.icon size={18} />
              </div>
              <div className="flex-grow">
                <h5 className="text-white font-bold text-sm mb-1">{rec.title}</h5>
                <p className="text-xs text-white/60 leading-relaxed">{rec.details}</p>
              </div>
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-colors">
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SEO Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Global meta tag templates', icon: FileText },
          { label: 'XML Sitemap generation', icon: Globe },
          { label: '301 Redirect manager', icon: LinkIcon },
          { label: 'Broken link (404) monitor', icon: AlertTriangle },
          { label: 'Keyword rank tracking', icon: BarChart3 },
          { label: 'Schema markup generator', icon: Wand2 },
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

export default SEOManager;
