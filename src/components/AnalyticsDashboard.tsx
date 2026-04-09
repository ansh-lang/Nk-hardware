import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Calendar, Download, Filter,
  PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export const AnalyticsDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    const unsubscribeQuotes = onSnapshot(collection(db, 'quotes'), (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'quotes'));

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubscribeOrders();
      unsubscribeQuotes();
      unsubscribeUsers();
    };
  }, []);

  // Calculate Stats
  const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = users.filter(u => u.role !== 'admin').length;

  // Calculate Real Monthly Data from Orders
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    const data = months.map((month, index) => {
      const monthlyOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate();
        return orderDate && orderDate.getMonth() === index && orderDate.getFullYear() === currentYear;
      });

      return {
        name: month,
        revenue: monthlyOrders.reduce((acc, order) => acc + (order.total || 0), 0),
        orders: monthlyOrders.length
      };
    });

    // Return last 7 months including current
    const currentMonth = new Date().getMonth();
    return data.slice(Math.max(0, currentMonth - 6), currentMonth + 1);
  };

  const monthlyData = getMonthlyData();

  // Calculate Real Category Data
  const getCategoryData = () => {
    const categories: { [key: string]: number } = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const cat = item.category || 'Uncategorized';
          categories[cat] = (categories[cat] || 0) + 1;
        });
      }
    });

    const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#eab308'];
    return Object.entries(categories).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  };

  const categoryData = getCategoryData().length > 0 ? getCategoryData() : [
    { name: 'No Data', value: 1, color: '#334155' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Analytics & Reports</h2>
          <p className="text-white/60 mt-1">Deep dive into your business performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 transition-all text-sm">
            <Calendar size={16} /> Last 30 Days
          </button>
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + "ID,Customer,Email,Status,Total,Date\n"
                + orders.map(o => `${o.id},${o.customerName},${o.email},${o.status},${o.total},${o.createdAt?.toDate().toLocaleDateString()}`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "analytics_report.csv");
              document.body.appendChild(link);
              link.click();
            }}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-bold"
          >
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, change: '+12.5%', icon: DollarSign, color: 'text-emerald-400', up: true },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), change: '+8.2%', icon: ShoppingBag, color: 'text-blue-400', up: true },
          { label: 'Avg. Order Value', value: `₹${avgOrderValue.toFixed(2)}`, change: '-2.4%', icon: TrendingUp, color: 'text-brand-orange', up: false },
          { label: 'Total Customers', value: totalCustomers.toLocaleString(), change: '+15.3%', icon: Users, color: 'text-purple-400', up: true },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 group hover:border-brand-orange/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LineChartIcon className="text-brand-orange" size={20} /> Revenue Overview
            </h3>
            <div className="flex gap-2">
              {['Revenue', 'Orders'].map(tab => (
                <button key={tab} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'Revenue' ? 'bg-brand-orange text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-[#0f172a] rounded-3xl p-8 border border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-8">
            <PieChartIcon className="text-brand-orange" size={20} /> Sales by Category
          </h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">{totalOrders}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Total Sales</span>
            </div>
          </div>
          <div className="space-y-3 mt-8">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-white/60">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-[#0f172a] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-brand-orange" size={20} /> Recent Orders
          </h3>
          <button className="text-brand-orange text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.slice(0, 5).map((order, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="font-bold text-white group-hover:text-brand-orange transition-colors">{order.customerName}</div>
                    <div className="text-[10px] text-white/40">{order.email}</div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                      order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-white/60">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-8 py-4 text-sm font-bold text-white">₹{order.total?.toLocaleString() || '0'}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-white/40">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

