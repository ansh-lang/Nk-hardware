import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, 
  CheckCircle2, X, Loader2, TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, Users, ArrowUpRight, ArrowDownRight, Calendar, 
  Download, FileText, PieChart, Activity, Sparkles
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

const ReportManager = () => {
  const [stats, setStats] = useState<any>({
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrderValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    // Fetch recent orders for report
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRecentOrders(orders);
      
      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      setStats({
        revenue: totalRevenue,
        orders: orders.length,
        customers: new Set(orders.map(o => o.userId)).size,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching report data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const exportReport = () => {
    alert("Exporting report as CSV...");
    // In a real app, this would generate and download a file
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Business Reports</h3>
          <p className="text-white/60 text-sm">Analyze your business performance and growth metrics.</p>
        </div>
        <button 
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-all"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', trend: '+12.5%', isUp: true },
          { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-brand-orange', trend: '+5.2%', isUp: true },
          { label: 'Active Customers', value: stats.customers, icon: Users, color: 'text-blue-500', trend: '-2.1%', isUp: false },
          { label: 'Avg. Order Value', value: `₹${stats.avgOrderValue.toFixed(0)}`, icon: Activity, color: 'text-purple-500', trend: '+8.4%', isUp: true },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon size={64} />
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} mb-4`}>
              <stat.icon size={24} />
            </div>
            <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
            <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stat.trend} <span className="text-white/20 font-normal ml-1">vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-white">Recent Sales Activity</h4>
            <button className="text-xs font-bold text-brand-orange hover:underline">View All Orders</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Order ID</th>
                  <th className="pb-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Customer</th>
                  <th className="pb-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Total</th>
                  <th className="pb-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 text-sm font-mono text-white/60">#{order.id.slice(0, 8)}</td>
                    <td className="py-4 text-sm text-white font-medium">{order.customerName || 'Guest'}</td>
                    <td className="py-4 text-sm text-white font-bold">₹{order.total?.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-orange/10 text-brand-orange'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-3xl border border-white/5 p-6">
          <h4 className="text-lg font-bold text-white mb-6">Sales by Category</h4>
          <div className="space-y-6">
            {[
              { label: 'Pipes & Fittings', value: 65, color: 'bg-brand-orange' },
              { label: 'Sanitaryware', value: 20, color: 'bg-blue-500' },
              { label: 'Hardware', value: 10, color: 'bg-emerald-500' },
              { label: 'Tools', value: 5, color: 'bg-purple-500' },
            ].map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-white/60 uppercase tracking-widest">{cat.label}</span>
                  <span className="text-white">{cat.value}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.value}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full ${cat.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 p-4 bg-brand-orange/5 rounded-2xl border border-brand-orange/10">
              <Sparkles className="text-brand-orange shrink-0" size={24} />
              <p className="text-xs text-white/80 leading-relaxed">
                <span className="font-bold text-brand-orange">AI Insight:</span> Your sales are up 15% this week. Consider restocking CPVC pipes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportManager;
