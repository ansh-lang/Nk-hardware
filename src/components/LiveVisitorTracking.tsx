import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Globe, MousePointer, ShoppingCart, MessageSquare, Play, MapPin, Activity, Clock, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { collection, query, onSnapshot, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const LiveVisitorTracking = () => {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Listen to visitors active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const q = query(
      collection(db, 'visitors'),
      where('lastActive', '>=', Timestamp.fromDate(fiveMinutesAgo)),
      orderBy('lastActive', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitorList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          time: data.lastActive?.toDate().toLocaleTimeString() || 'Just now',
        };
      });
      setVisitors(visitorList);
      setActiveUsers(visitorList.length);

      // Update chart data
      setChartData(current => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newData = [...current.slice(-19), { time: now, users: visitorList.length }];
        if (newData.length < 20) {
          // Fill with some initial data if empty
          return Array.from({ length: 20 }, (_, i) => ({
            time: i,
            users: i === 19 ? visitorList.length : 0
          }));
        }
        return newData;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'visitors');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Visitor Tracking</h2>
          <p className="text-white/60 mt-1">Watch real-time interactions across your platform.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-emerald-500 font-bold text-sm">{activeUsers} Active Users</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pageviews / min', value: '124', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Avg. Session', value: '4m 32s', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Cart Additions', value: '12', icon: ShoppingCart, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
          { label: 'Conversion Rate', value: '3.2%', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a] p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Graph */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="text-brand-orange" size={18} /> Traffic Velocity
            </h3>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Last 60 Seconds</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Stream */}
        <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="text-emerald-500" size={18} /> Live Stream
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="popLayout">
              {visitors.map((visitor) => (
                <motion.div
                  key={visitor.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-3 group hover:border-brand-orange/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 group-hover:bg-brand-orange/20 group-hover:text-brand-orange transition-colors">
                    {visitor.device === 'Mobile' ? <Globe size={14} /> : <MousePointer size={14} />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white truncate">{visitor.city}</span>
                      <span className="text-[10px] text-white/40">{visitor.time}</span>
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-[10px] text-brand-orange font-medium">{visitor.page}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${visitor.action === 'Added to Cart' ? 'bg-brand-orange/20 text-brand-orange' : 'bg-white/5 text-white/40'}`}>
                        {visitor.action}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-[#0f172a] rounded-3xl p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-orange rounded-full animate-ping" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-brand-orange rounded-full animate-ping [animation-delay:1s]" />
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-brand-orange rounded-full animate-ping [animation-delay:2s]" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-brand-orange rounded-full animate-ping [animation-delay:0.5s]" />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <MapPin className="mx-auto text-brand-orange" size={48} />
          <h3 className="text-xl font-bold text-white">Geographic Distribution</h3>
          <p className="text-white/60 max-w-md mx-auto text-sm">
            Interactive global map showing real-time user locations. Most active regions currently: North America, Europe, and South Asia.
          </p>
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24%</div>
              <div className="text-[10px] text-white/40 uppercase font-bold">USA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">18%</div>
              <div className="text-[10px] text-white/40 uppercase font-bold">India</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">12%</div>
              <div className="text-[10px] text-white/40 uppercase font-bold">UK</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
