import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MessageSquare, 
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  User,
  Trash2,
  Sparkles,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  Mic,
  FileText,
  Send
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Interaction {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'contacted' | 'resolved';
  channel?: 'whatsapp' | 'email' | 'voice' | 'web';
  createdAt: any;
  aiScore?: number;
  aiSentiment?: 'happy' | 'neutral' | 'frustrated';
  aiIntent?: string;
  aiSegment?: string;
  aiFollowUp?: string;
}

const CRM = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newInteraction, setNewInteraction] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    status: 'pending' as const,
    channel: 'web' as 'whatsapp' | 'email' | 'voice' | 'web'
  });
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [followUpDraft, setFollowUpDraft] = useState<{id: string, text: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isParsingMessage, setIsParsingMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'segments' | 'live'>('all');
  const [segments, setSegments] = useState<any[]>([]);

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  useEffect(() => {
    const q = query(collection(db, 'crm_interactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction));
      setInteractions(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const parseRawMessage = async (text: string) => {
    setIsParsingMessage(true);
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Extract customer details from this message: "${text}". 
      Return JSON with:
      - name: string
      - email: string
      - phone: string
      - message: string (the actual requirement)`;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      setNewInteraction({
        name: result.name || '',
        email: result.email || '',
        phone: result.phone || '',
        message: result.message || text,
        status: 'pending',
        channel: 'voice'
      });
    } catch (error) {
      console.error("Parsing failed:", error);
    } finally {
      setIsParsingMessage(false);
    }
  };

  const runSegmentation = async () => {
    if (interactions.length === 0) return;
    try {
      const model = "gemini-3-flash-preview";
      const dataSummary = interactions.map(i => ({ id: i.id, name: i.name, msg: i.message, score: i.aiScore }));
      const prompt = `Segment these customers based on their interactions and scores: ${JSON.stringify(dataSummary)}.
      Return JSON array of objects: { segmentName: string, customerIds: string[], description: string }`;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "[]");
      setSegments(result);
      setActiveTab('segments');
    } catch (error) {
      console.error("Segmentation failed:", error);
    }
  };

  const toggleVoiceRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate recording for 3 seconds
      setTimeout(async () => {
        setIsRecording(false);
        const simulatedVoiceText = "Hi, I am Amit from Delhi. My number is 9876543210. I want to buy 500 pieces of brass valves.";
        await parseRawMessage(simulatedVoiceText);
        setIsAdding(true);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const analyzeInteraction = async (item: Interaction) => {
    setAnalyzingId(item.id);
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Analyze this customer interaction and provide a JSON response:
      Customer Message: "${item.message}"
      
      Return JSON with:
      - score: 0-100 (Lead intent/likelihood to buy)
      - sentiment: "happy", "neutral", or "frustrated"
      - intent: Short description of what they want.
      - followUp: A short, professional follow-up message draft.`;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      
      // Update Firestore with AI insights
      await updateDoc(doc(db, 'crm_interactions', item.id), {
        aiScore: result.score,
        aiSentiment: result.sentiment,
        aiIntent: result.intent,
        aiFollowUp: result.followUp
      });
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setAnalyzingId(null);
    }
  };

  const generateFollowUp = (item: Interaction) => {
    if (item.aiFollowUp) {
      setFollowUpDraft({ id: item.id, text: item.aiFollowUp });
    } else {
      analyzeInteraction(item);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteraction.name || !newInteraction.message) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'crm_interactions'), {
        ...newInteraction,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewInteraction({ name: '', email: '', phone: '', message: '', status: 'pending', channel: 'web' });
    } catch (error) {
      console.error("Error adding interaction:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'crm_interactions', id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const filtered = interactions.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            Multi-Channel CRM <Sparkles className="text-brand-orange animate-pulse" size={20} />
          </h3>
          <p className="text-white/60 text-sm">Unified customer interactions with AI-powered insights.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={runSegmentation}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl font-bold text-sm transition-all hover:bg-blue-500/20"
          >
            <TrendingUp size={18} />
            AI Segments
          </button>
          <button 
            onClick={toggleVoiceRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Mic size={18} />
            {isRecording ? 'Recording...' : 'Voice Entry'}
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'Cancel' : 'New Interaction'}
          </button>
        </div>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] p-6 rounded-2xl border border-brand-orange/30 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-bold text-sm">New Interaction</h4>
            <button 
              onClick={() => {
                const text = prompt("Paste raw message (e.g. WhatsApp/Email) to auto-fill:");
                if (text) parseRawMessage(text);
              }}
              disabled={isParsingMessage}
              className="text-[10px] bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full font-bold uppercase flex items-center gap-1 hover:bg-brand-orange/20 transition-all"
            >
              {isParsingMessage ? <Loader2 className="animate-spin" size={10} /> : <Sparkles size={10} />}
              AI Auto-Fill
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                placeholder="Customer Name"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                value={newInteraction.name || ''}
                onChange={e => setNewInteraction({...newInteraction, name: e.target.value})}
                required
              />
              <input 
                placeholder="Email"
                type="email"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                value={newInteraction.email || ''}
                onChange={e => setNewInteraction({...newInteraction, email: e.target.value})}
              />
              <input 
                placeholder="Phone"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                value={newInteraction.phone || ''}
                onChange={e => setNewInteraction({...newInteraction, phone: e.target.value})}
              />
              <select
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                value={newInteraction.channel || 'web'}
                onChange={e => setNewInteraction({...newInteraction, channel: e.target.value as any})}
              >
                <option value="web">Web</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="voice">Voice</option>
              </select>
            </div>
            <textarea 
              placeholder="Interaction details or message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-orange min-h-[100px]"
              value={newInteraction.message || ''}
              onChange={e => setNewInteraction({...newInteraction, message: e.target.value})}
              required
            />
            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-orange text-brand-dark rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              Save Interaction
            </button>
          </form>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="Search interactions..." 
            className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-orange/50 transition-all"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-[#0f172a] border border-white/10 rounded-xl text-white px-4 py-2.5 focus:outline-none focus:border-brand-orange/50 transition-all text-sm"
          value={filterStatus || 'all'}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-2 text-sm font-bold transition-all ${activeTab === 'all' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-white/40'}`}
        >
          All Interactions
        </button>
        <button 
          onClick={() => setActiveTab('live')}
          className={`pb-2 px-2 text-sm font-bold transition-all ${activeTab === 'live' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-white/40'}`}
        >
          Multi-Channel Live
        </button>
        <button 
          onClick={() => setActiveTab('segments')}
          className={`pb-2 px-2 text-sm font-bold transition-all ${activeTab === 'segments' ? 'text-brand-orange border-b-2 border-brand-orange' : 'text-white/40'}`}
        >
          AI Segments
        </button>
      </div>

      {activeTab === 'live' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Channel Feed
              </h4>
              <span className="text-[10px] text-white/20 italic">Updating in real-time...</span>
            </div>
            {interactions.map((interaction, i) => (
              <motion.div 
                key={interaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-[#0f172a] rounded-2xl border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all"
              >
                <div className={`p-3 rounded-xl ${
                  interaction.channel === 'whatsapp' ? 'bg-green-500/10 text-green-500' :
                  interaction.channel === 'email' ? 'bg-blue-500/10 text-blue-500' :
                  interaction.channel === 'voice' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-brand-orange/10 text-brand-orange'
                }`}>
                  {interaction.channel === 'whatsapp' ? <MessageSquare size={18} /> : 
                   interaction.channel === 'email' ? <Mail size={18} /> : 
                   interaction.channel === 'voice' ? <Phone size={18} /> : 
                   <MessageSquare size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{interaction.name}</span>
                    <span className="text-[10px] text-white/20">{interaction.createdAt?.toDate().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-white/40 line-clamp-1 mt-1">{interaction.message}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-brand-orange/10 text-brand-orange rounded-lg">
                    <Send size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-brand-orange/5 rounded-3xl border border-brand-orange/20">
              <h4 className="text-xs font-bold text-brand-orange uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp size={14} />
                Channel Performance
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'WhatsApp', value: 65, color: 'bg-green-500' },
                  { label: 'Email', value: 25, color: 'bg-blue-500' },
                  { label: 'Voice/Call', value: 10, color: 'bg-purple-500' }
                ].map((channel, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] text-white/60 mb-1">
                      <span>{channel.label}</span>
                      <span>{channel.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${channel.value}%` }}
                        className={`h-full ${channel.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'segments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.length === 0 ? (
            <div className="col-span-full py-10 text-center text-white/40">
              Run AI Segmentation to see results.
            </div>
          ) : (
            segments.map((seg, idx) => (
              <div key={idx} className="bg-[#0f172a] p-5 rounded-2xl border border-blue-500/20">
                <h4 className="text-blue-400 font-bold mb-1">{seg.segmentName}</h4>
                <p className="text-[10px] text-white/40 mb-4">{seg.description}</p>
                <div className="space-y-2">
                  {seg.customerIds.map((cid: string) => {
                    const cust = interactions.find(i => i.id === cid);
                    return cust ? (
                      <div key={cid} className="text-xs text-white/80 flex items-center justify-between bg-white/5 p-2 rounded-lg">
                        <span>{cust.name}</span>
                        <span className="text-brand-orange font-bold">{cust.aiScore}%</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
          <div className="col-span-full py-20 text-center text-white/40">
            <Loader2 className="animate-spin mx-auto mb-2" size={32} />
            Loading interactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-white/40 bg-[#0f172a] rounded-2xl border border-white/5">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>No interactions found.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 hover:border-brand-orange/30 transition-all group relative flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{item.name}</h4>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">
                      {item.createdAt?.toDate().toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                    item.status === 'contacted' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {item.status}
                  </span>
                  {item.aiSentiment && (
                    <div className="flex items-center gap-1">
                      {item.aiSentiment === 'happy' && <Smile size={14} className="text-emerald-500" />}
                      {item.aiSentiment === 'neutral' && <Meh size={14} className="text-blue-400" />}
                      {item.aiSentiment === 'frustrated' && <Frown size={14} className="text-red-500" />}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-4 line-clamp-3 italic">"{item.message}"</p>
                
                {item.aiScore !== undefined && (
                  <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold">AI Lead Score</span>
                      <span className={`text-[10px] font-bold ${item.aiScore > 70 ? 'text-emerald-500' : item.aiScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {item.aiScore}% Intent
                      </span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.aiScore}%` }}
                        className={`h-full ${item.aiScore > 70 ? 'bg-emerald-500' : item.aiScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      />
                    </div>
                    {item.aiIntent && <p className="text-[10px] text-white/60 mt-2">Target: {item.aiIntent}</p>}
                  </div>
                )}
              </div>
              
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => analyzeInteraction(item)}
                    disabled={analyzingId === item.id}
                    className="flex-1 py-2 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all"
                  >
                    {analyzingId === item.id ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                    AI Analyze
                  </button>
                  <button 
                    onClick={() => generateFollowUp(item)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all"
                  >
                    <Send size={12} />
                    Smart Follow-up
                  </button>
                </div>

                <AnimatePresence>
                  {followUpDraft?.id === item.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-white/5 rounded-xl border border-brand-orange/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-brand-orange font-bold uppercase">AI Draft</span>
                        <button onClick={() => setFollowUpDraft(null)}><X size={12} className="text-white/40" /></button>
                      </div>
                      <p className="text-[11px] text-white/80 leading-relaxed italic mb-3">"{followUpDraft.text}"</p>
                      <button className="w-full py-1.5 bg-brand-orange text-brand-dark rounded-lg text-[10px] font-bold uppercase">
                        Copy & Send
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  {item.email && (
                    <a href={`mailto:${item.email}`} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                      <Mail size={14} />
                    </a>
                  )}
                  {item.phone && (
                    <a href={`tel:${item.phone}`} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                      <Phone size={14} />
                    </a>
                  )}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-red-500 transition-colors ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  );
};

export default CRM;
