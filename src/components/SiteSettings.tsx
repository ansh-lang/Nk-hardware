import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Lock, 
  Database, 
  Cloud, 
  Palette, 
  Type, 
  Languages, 
  Clock, 
  CheckCircle2, 
  Save, 
  Loader2,
  X,
  Bell,
  CreditCard,
  User
} from 'lucide-react';

const SiteSettings = () => {
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('general');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1500);
  };

  const subTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'localization', label: 'Localization', icon: Languages },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Site Settings</h3>
          <p className="text-white/60 text-sm">Configure global parameters for your application.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-1">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeSubTab === tab.id 
                  ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow bg-[#0f172a] p-8 rounded-3xl border border-white/5 space-y-8">
          {activeSubTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Site Name</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" defaultValue="NK Hardware" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Site URL</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" defaultValue="https://nkhardware.in" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Admin Email</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" defaultValue="anshsinghal1500@gmail.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Support Phone</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" defaultValue="+91 9720356263" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Site Description</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange min-h-[100px]" defaultValue="Premium Sanitaryware & Hardware Solutions in India." />
              </div>
            </div>
          )}

          {activeSubTab === 'appearance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-orange border border-white/10"></div>
                    <input className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" defaultValue="#f97316" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Dark Mode</label>
                  <div className="flex items-center gap-4 py-3">
                    <div className="w-12 h-6 bg-brand-orange rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm text-white font-medium">Enabled by default</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'security' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                <Shield className="text-emerald-500" size={24} />
                <div>
                  <h5 className="text-white font-bold text-sm">SSL Certificate Active</h5>
                  <p className="text-xs text-white/40">Your connection is secure and encrypted.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h5 className="text-white font-bold text-sm">Two-Factor Authentication</h5>
                    <p className="text-xs text-white/40">Add an extra layer of security to your account.</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:bg-white/10">Configure</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <h5 className="text-white font-bold text-sm">API Access Tokens</h5>
                    <p className="text-xs text-white/40">Manage tokens for external integrations.</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:bg-white/10">Manage</button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <Clock size={14} /> Last backup: 2 hours ago
            </div>
            <button className="text-brand-orange text-xs font-bold hover:underline">Download full site backup</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
