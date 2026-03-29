import React, { useState, useEffect } from 'react';
import { 
  Webhook, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, Link as LinkIcon, Globe, Shield, 
  Zap, Database, Server, Code, Key, Settings, Activity, 
  ArrowRight, ExternalLink, Copy, RefreshCw, DollarSign
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

const IntegrationManager = () => {
  const [integrations, setIntegrations] = useState<any[]>([
    { id: '1', name: 'Google Analytics', description: 'Track website traffic and user behavior.', status: 'connected', icon: Globe },
    { id: '2', name: 'Meta Pixel', description: 'Measure ad performance and build audiences.', status: 'disconnected', icon: LinkIcon },
    { id: '3', name: 'Zapier', description: 'Automate workflows between your apps.', status: 'connected', icon: Zap },
    { id: '4', name: 'QuickBooks', description: 'Sync your sales data with accounting.', status: 'disconnected', icon: DollarSign },
  ]);
  const [apiKey, setApiKey] = useState('nk_live_51P2k3L4m5n6o7p8q9r0s1t2u3v4w5x6y7z');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNewKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newKey = 'nk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(newKey);
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">API & Integrations</h3>
          <p className="text-white/60 text-sm">Connect your app with the tools you already use.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] rounded-3xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="text-brand-orange" size={20} /> API Access
            </h4>
            <button 
              onClick={generateNewKey}
              disabled={isGenerating}
              className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={12} /> : <RefreshCw size={12} />}
              Regenerate Key
            </button>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 relative group">
            <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Your API Key</div>
            <div className="font-mono text-sm text-white/80 break-all pr-10">{apiKey}</div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(apiKey);
                alert("API Key copied to clipboard!");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 text-white/40 rounded-lg hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="mt-4 text-xs text-white/40 leading-relaxed">
            Use this key to authenticate your requests to our REST API. Keep it secret and never share it in client-side code.
          </p>
        </div>

        <div className="bg-[#0f172a] rounded-3xl border border-white/5 p-6">
          <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Webhook className="text-brand-orange" size={20} /> Webhooks
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <div>
                <div className="text-sm font-bold text-white">Order Created</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mt-1">POST https://api.example.com/webhook</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
            <button className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-xs font-bold text-white/40 hover:border-brand-orange/50 hover:text-brand-orange transition-all flex items-center justify-center gap-2">
              <Plus size={14} /> Add New Webhook
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {integrations.map((int) => (
          <div key={int.id} className="bg-[#0f172a] rounded-3xl border border-white/5 p-6 hover:border-brand-orange/30 transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-orange transition-colors">
                <int.icon size={24} />
              </div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                int.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'
              }`}>
                {int.status}
              </div>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{int.name}</h4>
            <p className="text-xs text-white/40 leading-relaxed mb-6">{int.description}</p>
            <button className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
              int.status === 'connected' 
                ? 'bg-white/5 text-white/60 hover:bg-red-500/10 hover:text-red-500' 
                : 'bg-brand-orange text-brand-dark hover:scale-105'
            }`}>
              {int.status === 'connected' ? 'Disconnect' : 'Connect Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationManager;
