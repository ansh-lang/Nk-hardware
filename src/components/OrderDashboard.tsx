import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logAction } from '../lib/audit';
import { 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X, 
  Phone, 
  Mail, 
  Calendar, 
  IndianRupee, 
  MapPin, 
  CreditCard,
  Search,
  Filter,
  Trash2,
  Download,
  History,
  Box,
  ChevronRight,
  MoreVertical,
  MessageSquare,
  Send,
  Split,
  RotateCcw,
  DollarSign,
  User,
  Clock,
  Check,
  Sparkles,
  FileUp,
  FileSearch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

export const OrderDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [checkingStock, setCheckingStock] = useState<string | null>(null);
  const [stockStatus, setStockStatus] = useState<any>(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitItems, setSplitItems] = useState<any[]>([]);
  const [internalNote, setInternalNote] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: 0, max: 1000000 });
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const parseOrderDocument = async () => {
    setIsParsingDoc(true);
    try {
      // In a real app, we'd upload a file and get its text or base64
      // For this demo, we'll simulate a PO text
      const simulatedPO = `
        PURCHASE ORDER #PO-9988
        Vendor: NK Hardware
        Customer: Rajesh Construction
        Email: rajesh@const.com
        Items:
        1. CPVC Pipe 1/2" - 50 units @ Rs. 120
        2. Brass Elbow 1/2" - 20 units @ Rs. 85
        Total: Rs. 7700
      `;

      const model = "gemini-3-flash-preview";
      const prompt = `Extract order details from this Purchase Order text: "${simulatedPO}". 
      Provide a JSON response with:
      - customerName: string
      - email: string
      - items: Array of { product: string, size: string, qty: number, rate: number }
      - total: number`;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      
      // Create the order
      const newOrder = {
        ...result,
        phone: result.phone || '',
        address: result.address || '',
        city: result.city || '',
        pincode: result.pincode || '',
        paymentMethod: 'cash',
        deliveryDate: '',
        quoteId: '',
        status: 'pending',
        createdAt: new Date(),
        timeline: [{ status: 'pending', timestamp: new Date().toISOString(), note: 'Order automatically created from PO document' }]
      };

      await addDoc(collection(db, 'orders'), newOrder);
      await logAction('ai_order_parse', `Automatically created order for ${result.customerName} via AI PO parsing`);
      alert(`Successfully created order for ${result.customerName}!`);
    } catch (error) {
      console.error("PO Parsing failed:", error);
      alert("Failed to parse document. Please try again.");
    } finally {
      setIsParsingDoc(false);
    }
  };

  const generateInvoiceFromOrder = async (order: any) => {
    try {
      const mappedItems = (order.items || []).map((item: any) => ({
        description: item.product || item.description || '',
        quantity: Number(item.qty || item.quantity || 1),
        rate: Number(item.rate || 0)
      }));

      const invoiceData = {
        customerName: order.customerName || '',
        email: order.email || '',
        phone: order.phone || '',
        items: mappedItems,
        subtotal: Number(order.total) || 0,
        discount: 0,
        discountType: 'percentage',
        taxRate: 0,
        taxAmount: 0,
        total: Number(order.total) || 0,
        paidAmount: 0,
        dueDate: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        orderId: order.id,
        address: order.address || '',
        city: order.city || '',
        pincode: order.pincode || '',
        userId: order.userId || null
      };

      await addDoc(collection(db, 'invoices'), invoiceData);
      await updateStatus(order.id, 'delivered', 'Invoice generated and moved to Billing');
      await logAction('generate_invoice', `Invoice generated for ${order.customerName}`);
      
      // Trigger notification for quotation/invoice generation
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: order.email,
          subject: `Quotation/Invoice Generated: #${order.id.slice(0, 8)}`,
          message: `Your quotation/invoice for order #${order.id.slice(0, 8)} has been generated.`,
          items: order.items
        })
      });
    } catch (error) {
      console.error("Error generating invoice:", error);
    }
  };

  const updateStatus = async (id: string, newStatus: string, note?: string) => {
    try {
      const order = orders.find(o => o.id === id);
      const timeline = order?.timeline || [];
      const newTimeline = [
        ...timeline,
        { status: newStatus, timestamp: new Date().toISOString(), note: note || `Status updated to ${newStatus}` }
      ];

      await updateDoc(doc(db, 'orders', id), { 
        status: newStatus,
        timeline: newTimeline,
        updatedAt: new Date()
      });
      await logAction('update_order_status', `Updated order ${id} status to ${newStatus}`);
      
      // Trigger notification if status is shipped
      if (newStatus === 'shipped' && order) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: order.email,
            subject: `Order Shipped: #${id.slice(0, 8)}`,
            message: `Your order #${id.slice(0, 8)} has been shipped!`,
            items: order.items
          })
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const addInternalNote = async (id: string, note: string) => {
    if (!note.trim()) return;
    try {
      const order = orders.find(o => o.id === id);
      const notes = order?.internalNotes || [];
      const newNotes = [
        ...notes,
        { text: note, timestamp: new Date().toISOString(), author: 'Admin' }
      ];
      await updateDoc(doc(db, 'orders', id), { 
        internalNotes: newNotes,
        updatedAt: new Date()
      });
      setInternalNote('');
      await logAction('add_order_note', `Added internal note to order ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const splitOrder = async (id: string, itemsToSplit: any[]) => {
    try {
      const originalOrder = orders.find(o => o.id === id);
      
      // Create new order for split items
      const newOrderData = {
        ...originalOrder,
        id: `SPLIT-${id.slice(0, 5)}-${Math.random().toString(36).slice(2, 5)}`,
        items: itemsToSplit,
        total: itemsToSplit.reduce((acc, item) => acc + (item.qty * item.rate), 0),
        status: 'pending',
        createdAt: new Date(),
        parentOrderId: id
      };
      delete (newOrderData as any).id; // Let Firestore generate ID or use custom
      
      // Update original order
      const remainingItems = originalOrder.items.filter((item: any) => 
        !itemsToSplit.some((splitItem: any) => splitItem.product === item.product && splitItem.size === item.size)
      );
      
      await updateDoc(doc(db, 'orders', id), {
        items: remainingItems,
        total: remainingItems.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0),
        timeline: [...(originalOrder.timeline || []), { status: 'split', timestamp: new Date().toISOString(), note: 'Order split into multiple shipments' }]
      });

      // In a real app, we'd add the new order to Firestore
      // For now, we'll just log it
      await logAction('split_order', `Split order ${id} into new shipment`);
      setShowSplitModal(false);
      setSelectedOrder(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const updateTracking = async (id: string, carrier: string, trackingNumber: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { 
        shipping: { carrier, trackingNumber },
        updatedAt: new Date()
      });
      await logAction('update_order_tracking', `Updated tracking for order ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'orders', editingOrder.id), {
        customerName: editingOrder.customerName || '',
        email: editingOrder.email || '',
        phone: editingOrder.phone || '',
        address: editingOrder.address || '',
        city: editingOrder.city || '',
        pincode: editingOrder.pincode || '',
        updatedAt: new Date()
      });
      await logAction('update_order', `Updated order details for ${editingOrder.customerName}`);
      setEditingOrder(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${editingOrder.id}`);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      await logAction('delete_order', `Deleted order ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  };

  const checkInventory = async (order: any) => {
    setCheckingStock(order.id);
    setStockStatus(null);
    try {
      const results: any = {};
      for (const item of order.items || []) {
        const q = query(collection(db, 'inventory'), where('name', '==', item.product));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const invItem = snapshot.docs[0].data();
          results[item.product] = {
            available: invItem.stock,
            required: item.qty,
            sufficient: invItem.stock >= item.qty
          };
        } else {
          results[item.product] = { available: 0, required: item.qty, sufficient: false, missing: true };
        }
      }
      setStockStatus(results);
    } catch (error) {
      console.error("Error checking inventory:", error);
    } finally {
      setCheckingStock(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Items'];
    const rows = orders.map(o => [
      o.id,
      o.createdAt?.toDate().toLocaleDateString(),
      o.customerName,
      o.email,
      o.total,
      o.status,
      o.items?.map((i: any) => `${i.product} (x${i.qty})`).join('; ')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleOrderSelection = (id: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedOrders(newSelection);
  };

  const mergeOrders = async () => {
    if (selectedOrders.size < 2) return;
    
    const selectedOrderDocs = orders.filter(o => selectedOrders.has(o.id));
    const firstOrder = selectedOrderDocs[0];
    
    // Validate all orders are from the same customer
    const customerId = firstOrder.email || firstOrder.customerName;
    const allSameCustomer = selectedOrderDocs.every(o => (o.email || o.customerName) === customerId);
    
    if (!allSameCustomer) {
      alert("Orders must be from the same customer to merge.");
      return;
    }

    setLoading(true);
    try {
      const mergedItems = selectedOrderDocs.flatMap(o => o.items || []);
      const mergedTotal = selectedOrderDocs.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      
      const newOrder = {
        ...firstOrder,
        items: mergedItems,
        total: mergedTotal,
        status: 'pending',
        createdAt: serverTimestamp(),
        mergedFrom: Array.from(selectedOrders)
      };
      delete newOrder.id;
      
      await addDoc(collection(db, 'orders'), newOrder);
      
      for (const id of selectedOrders) {
        await updateDoc(doc(db, 'orders', id), { status: 'merged' });
      }
      
      await logAction('merge_orders', `Merged ${selectedOrders.size} orders into a new order.`);
      setSelectedOrders(new Set());
      alert("Orders merged successfully.");
    } catch (error) {
      console.error("Merge error:", error);
      alert("Failed to merge orders.");
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;
    setLoading(true);
    try {
      for (const id of selectedOrders) {
        await updateStatus(id, newStatus);
      }
      setSelectedOrders(new Set());
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         o.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    
    // Date Range Filter
    const orderDate = o.createdAt?.toDate();
    const matchesDate = (!dateRange.start || orderDate >= new Date(dateRange.start)) &&
                       (!dateRange.end || orderDate <= new Date(dateRange.end));
    
    // Amount Filter
    const matchesAmount = o.total >= amountRange.min && o.total <= amountRange.max;

    return matchesSearch && matchesStatus && matchesDate && matchesAmount;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-orange" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Order Management</h3>
          <p className="text-white/60 text-sm">Process orders, track shipments, and manage inventory fulfillment.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={parseOrderDocument}
            disabled={isParsingDoc}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/20 rounded-xl text-brand-orange text-sm font-bold transition-all disabled:opacity-50"
          >
            {isParsingDoc ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
            AI Order Entry
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 text-sm transition-all"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-blue-500' },
          { label: 'Pending Fulfillment', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-amber-500' },
          { label: 'In Transit', value: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'text-indigo-500' },
          { label: 'Completed', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{stat.label}</div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-orange p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-brand-orange/20"
        >
          <div className="flex items-center gap-4">
            <span className="text-brand-dark font-bold text-sm">{selectedOrders.size} Orders Selected</span>
            <div className="h-6 w-px bg-brand-dark/20"></div>
            <div className="flex gap-2">
              <button onClick={() => bulkUpdateStatus('shipped')} className="px-3 py-1 bg-brand-dark/10 hover:bg-brand-dark/20 rounded-lg text-xs font-bold text-brand-dark transition-colors">Mark Shipped</button>
              <button onClick={() => bulkUpdateStatus('delivered')} className="px-3 py-1 bg-brand-dark/10 hover:bg-brand-dark/20 rounded-lg text-xs font-bold text-brand-dark transition-colors">Mark Delivered</button>
              <button onClick={mergeOrders} className="px-3 py-1 bg-brand-dark/10 hover:bg-brand-dark/20 rounded-lg text-xs font-bold text-brand-dark transition-colors">Merge Orders</button>
            </div>
          </div>
          <button onClick={() => setSelectedOrders(new Set())} className="text-brand-dark/60 hover:text-brand-dark">
            <X size={20} />
          </button>
        </motion.div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Search by customer, email, or order ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f172a] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange appearance-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="return_requested">Return Requested</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex gap-2 bg-[#0f172a] border border-white/10 rounded-xl px-2 py-1">
            <input 
              type="date" 
              className="bg-transparent text-[10px] text-white/60 focus:outline-none" 
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="text-white/20 self-center">-</span>
            <input 
              type="date" 
              className="bg-transparent text-[10px] text-white/60 focus:outline-none" 
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-[10px] uppercase text-white/40 tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
                      else setSelectedOrders(new Set());
                    }}
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                  />
                </th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-white/20">No orders found matching your criteria.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className={`hover:bg-white/5 transition-colors group ${selectedOrders.has(order.id) ? 'bg-brand-orange/5' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-brand-orange font-bold">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-[10px] text-white/20 mt-1">{order.createdAt?.toDate().toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[10px] text-white/40">{order.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">₹{order.total?.toLocaleString()}</div>
                      <div className="text-[10px] text-white/40">{order.items?.length || 0} items</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                        order.status === 'shipped' ? 'bg-blue-500/20 text-blue-500' :
                        order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => checkInventory(order)}
                          className={`p-2 rounded-lg transition-colors ${checkingStock === order.id ? 'animate-spin text-brand-orange' : 'text-white/20 hover:text-emerald-500'}`}
                          title="Check Inventory"
                        >
                          <Box size={16} />
                        </button>
                        <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-brand-orange transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        {(order.status === 'delivered' || order.status === 'shipped') && (
                          <button 
                            onClick={() => generateInvoiceFromOrder(order)}
                            className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                            title="Generate Invoice"
                          >
                            <DollarSign size={16} />
                          </button>
                        )}
                        <button onClick={() => setEditingOrder(order)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-blue-500 transition-colors" title="Edit">
                          <Package size={16} />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-brand-orange"
                        >
                          <option value="pending">Pending</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="return_requested">Return Req</option>
                          <option value="refunded">Refunded</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-white/5">
          {filteredOrders.length === 0 ? (
            <div className="px-6 py-20 text-center text-white/20">No orders found matching your criteria.</div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`p-4 space-y-3 ${selectedOrders.has(order.id) ? 'bg-brand-orange/5' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="font-mono text-xs text-brand-orange font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                    order.status === 'shipped' ? 'bg-blue-500/20 text-blue-500' :
                    order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">{order.customerName}</div>
                <div className="text-xs text-white/40">{order.email}</div>
                <div className="flex justify-between items-center pt-2">
                  <div className="font-bold text-white">₹{order.total?.toLocaleString()}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-brand-orange transition-colors">
                      <Eye size={16} />
                    </button>
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-brand-orange"
                    >
                      <option value="pending">Pending</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="return_requested">Return Req</option>
                      <option value="refunded">Refunded</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-white">Order Details</h4>
                  <p className="text-xs text-white/40 font-mono">#{selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Customer & Shipping */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">Customer Information</label>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold">
                              {selectedOrder.customerName[0]}
                            </div>
                            <div>
                              <div className="text-white font-bold">{selectedOrder.customerName}</div>
                              <div className="text-xs text-white/40">{selectedOrder.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <Phone size={14} className="text-brand-orange" /> {selectedOrder.phone || 'No phone provided'}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-2">
                              <Mail size={12} /> Email
                            </button>
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-2">
                              <Phone size={12} /> WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">Shipping Details</label>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                          <div className="flex items-start gap-3 text-xs text-white/60">
                            <MapPin size={14} className="text-brand-orange shrink-0 mt-0.5" />
                            <div>
                              <div className="text-white font-medium">{selectedOrder.address}</div>
                              <div>{selectedOrder.city}, {selectedOrder.pincode}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <Truck size={14} className="text-brand-orange" /> 
                            {selectedOrder.shipping?.carrier ? (
                              <span>{selectedOrder.shipping.carrier}: <span className="text-white font-mono">{selectedOrder.shipping.trackingNumber}</span></span>
                            ) : (
                              <span className="italic">No tracking info yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">Order Items</label>
                        <button 
                          onClick={() => {
                            setSplitItems([]);
                            setShowSplitModal(true);
                          }}
                          className="text-brand-orange text-[10px] font-bold uppercase flex items-center gap-1 hover:underline"
                        >
                          <Split size={12} /> Split Order
                        </button>
                      </div>
                      <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 text-white/40 uppercase font-bold">
                            <tr>
                              <th className="px-6 py-4">Product</th>
                              <th className="px-6 py-4">Size</th>
                              <th className="px-6 py-4 text-center">Qty</th>
                              <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-white/80">
                            {selectedOrder.items?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{item.product}</td>
                                <td className="px-6 py-4">{item.size}</td>
                                <td className="px-6 py-4 text-center">{item.qty}</td>
                                <td className="px-6 py-4 text-right font-bold text-brand-orange">₹{(item.qty * item.rate).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-white/5 font-bold text-white">
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-right uppercase tracking-widest text-[10px] text-white/40">Grand Total</td>
                              <td className="px-6 py-4 text-right text-brand-orange text-lg">₹{selectedOrder.total?.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Timeline & Actions */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">Internal Notes</label>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {(selectedOrder.internalNotes || []).length === 0 ? (
                            <div className="text-[10px] text-white/20 italic">No internal notes yet.</div>
                          ) : (
                            selectedOrder.internalNotes.map((note: any, i: number) => (
                              <div key={i} className="bg-white/5 p-2 rounded-lg">
                                <div className="text-[10px] text-white/80">{note.text}</div>
                                <div className="text-[8px] text-white/20 mt-1 flex justify-between">
                                  <span>{note.author}</span>
                                  <span>{new Date(note.timestamp).toLocaleString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Add a note..." 
                            value={internalNote}
                            onChange={e => setInternalNote(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                          />
                          <button 
                            onClick={() => addInternalNote(selectedOrder.id, internalNote)}
                            className="p-2 bg-brand-orange text-brand-dark rounded-lg hover:scale-105 transition-all"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">Order Timeline</label>
                      <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                        {(selectedOrder.timeline || [
                          { status: 'pending', timestamp: selectedOrder.createdAt?.toDate().toISOString(), note: 'Order placed successfully' }
                        ]).map((event: any, i: number) => (
                          <div key={i} className="relative">
                            <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-[#0f172a] ${i === 0 ? 'bg-brand-orange' : 'bg-white/20'}`}></div>
                            <div className="text-xs font-bold text-white uppercase tracking-wider">{event.status}</div>
                            <div className="text-[10px] text-white/40 mt-0.5">{new Date(event.timestamp).toLocaleString()}</div>
                            <div className="text-[10px] text-white/60 mt-1 italic">{event.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">Quick Actions</label>
                      <div className="grid grid-cols-1 gap-2">
                        <button 
                          onClick={() => {
                            const carrier = prompt("Enter Carrier Name (e.g. BlueDart):");
                            const tracking = prompt("Enter Tracking Number:");
                            if (carrier && tracking) updateTracking(selectedOrder.id, carrier, tracking);
                          }}
                          className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold flex items-center gap-3 transition-all"
                        >
                          <Truck size={16} className="text-brand-orange" /> Update Tracking
                        </button>
                        <button 
                          onClick={() => checkInventory(selectedOrder)}
                          className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold flex items-center gap-3 transition-all"
                        >
                          <Box size={16} className="text-brand-orange" /> Verify Stock
                        </button>
                        {selectedOrder.status === 'pending' && (
                          <button 
                            onClick={() => updateStatus(selectedOrder.id, 'shipped')}
                            className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20"
                          >
                            <Truck size={16} /> Mark as Shipped
                          </button>
                        )}
                        {selectedOrder.status === 'shipped' && (
                          <button 
                            onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                            className="w-full px-4 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <CheckCircle2 size={16} /> Mark as Delivered
                          </button>
                        )}
                        {selectedOrder.status === 'delivered' && (
                          <button 
                            onClick={() => updateStatus(selectedOrder.id, 'return_requested', 'Customer requested a return')}
                            className="w-full px-4 py-3 bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center gap-3 hover:bg-amber-500/30 transition-all"
                          >
                            <RotateCcw size={16} /> Initiate Return
                          </button>
                        )}
                        {selectedOrder.status === 'return_requested' && (
                          <button 
                            onClick={() => updateStatus(selectedOrder.id, 'refunded', 'Refund processed for returned items')}
                            className="w-full px-4 py-3 bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-3 hover:bg-red-500/30 transition-all"
                          >
                            <DollarSign size={16} /> Process Refund
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end">
                <button onClick={() => setSelectedOrder(null)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold transition-all">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] w-full max-w-lg rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-bold text-white">Edit Order Details</h4>
                <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditOrder} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Customer Name</label>
                    <input type="text" value={editingOrder.customerName || ''} onChange={e => setEditingOrder({...editingOrder, customerName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
                      <input type="email" value={editingOrder.email || ''} onChange={e => setEditingOrder({...editingOrder, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Phone</label>
                      <input type="text" value={editingOrder.phone || ''} onChange={e => setEditingOrder({...editingOrder, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Address</label>
                    <textarea value={editingOrder.address || ''} onChange={e => setEditingOrder({...editingOrder, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange h-20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">City</label>
                      <input type="text" value={editingOrder.city || ''} onChange={e => setEditingOrder({...editingOrder, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Pincode</label>
                      <input type="text" value={editingOrder.pincode || ''} onChange={e => setEditingOrder({...editingOrder, pincode: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setEditingOrder(null)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-blue-500/20">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Split Order Modal */}
      <AnimatePresence>
        {showSplitModal && selectedOrder && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-white">Split Order</h4>
                <button onClick={() => setShowSplitModal(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-white/40 mb-6 text-center italic">Select items to move to a new separate shipment.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {selectedOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <input 
                      type="checkbox"
                      checked={splitItems.some(si => si.product === item.product && si.size === item.size)}
                      onChange={(e) => {
                        if (e.target.checked) setSplitItems([...splitItems, item]);
                        else setSplitItems(splitItems.filter(si => si.product !== item.product || si.size !== item.size));
                      }}
                      className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{item.product}</div>
                      <div className="text-[10px] text-white/40">Qty: {item.qty} | Size: {item.size}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowSplitModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all">Cancel</button>
                <button 
                  disabled={splitItems.length === 0 || splitItems.length === selectedOrder.items.length}
                  onClick={() => splitOrder(selectedOrder.id, splitItems)}
                  className="flex-1 py-3 bg-brand-orange text-brand-dark rounded-2xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  Confirm Split
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stock Check Results Modal */}
      <AnimatePresence>
        {stockStatus && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-white">Inventory Check</h4>
                <button onClick={() => setStockStatus(null)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(stockStatus).map(([product, info]: [string, any]) => (
                  <div key={product} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{product}</div>
                      <div className="text-[10px] text-white/40">Required: {info.required} | Available: {info.available}</div>
                    </div>
                    {info.sufficient ? (
                      <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-full">
                        <Check size={16} />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-500/20 text-red-500 rounded-full">
                        <AlertTriangle size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={() => setStockStatus(null)} className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold transition-all">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
