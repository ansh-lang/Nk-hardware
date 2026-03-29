import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logAction } from '../lib/audit';
import { 
  Loader2, 
  Plus, 
  FileText, 
  X, 
  Send, 
  Download, 
  Trash2, 
  Calendar, 
  IndianRupee, 
  Percent, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Filter,
  Search,
  ArrowUpRight,
  Sparkles,
  Lightbulb,
  TrendingDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

export const InvoiceManager = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [aiInsights, setAiInsights] = useState<{recommendations: string[], priceTip: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const [newInvoice, setNewInvoice] = useState({ 
    quoteId: '', 
    customerName: '', 
    email: '', 
    items: [{ description: '', quantity: 1, rate: 0 }],
    subtotal: 0, 
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    taxRate: 18, 
    taxAmount: 0,
    total: 0,
    paidAmount: 0,
    payments: [] as any[],
    dueDate: '',
    status: 'draft',
    notes: '',
    isRecurring: false,
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly'
  });

  const calculateTotals = (items: any[], discount: number, discountType: 'percentage' | 'fixed', taxRate: number) => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity || item.qty || 0) * Number(item.rate || 0)), 0);
    let discountAmount = 0;
    const dVal = Number(discount || 0);
    if (discountType === 'percentage') {
      discountAmount = (subtotal * dVal) / 100;
    } else {
      discountAmount = dVal;
    }
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const tRate = Number(taxRate || 0);
    const taxAmount = (discountedSubtotal * tRate) / 100;
    const total = discountedSubtotal + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { subtotal, discountAmount, taxAmount, total } = calculateTotals(
        editingInvoice.items, 
        Number(editingInvoice.discount || 0), 
        editingInvoice.discountType, 
        Number(editingInvoice.taxRate || 0)
      );
      await updateDoc(doc(db, 'invoices', editingInvoice.id), {
        customerName: editingInvoice.customerName || '',
        email: editingInvoice.email || '',
        phone: editingInvoice.phone || '',
        address: editingInvoice.address || '',
        city: editingInvoice.city || '',
        pincode: editingInvoice.pincode || '',
        items: editingInvoice.items || [],
        subtotal: Number(subtotal) || 0,
        discount: Number(editingInvoice.discount || 0),
        discountAmount: Number(discountAmount) || 0,
        discountType: editingInvoice.discountType || 'percentage',
        taxRate: Number(editingInvoice.taxRate || 0),
        taxAmount: Number(taxAmount) || 0,
        total: Number(total) || 0,
        paidAmount: Number(editingInvoice.paidAmount || 0),
        payments: editingInvoice.payments || [],
        dueDate: editingInvoice.dueDate || '',
        status: editingInvoice.status || 'pending',
        notes: editingInvoice.notes || '',
        isRecurring: editingInvoice.isRecurring || false,
        frequency: editingInvoice.frequency || 'monthly',
        updatedAt: serverTimestamp()
      });
      await logAction('update_invoice', `Updated invoice for ${editingInvoice.customerName}`);
      setEditingInvoice(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${editingInvoice.id}`);
    }
  };

  useEffect(() => {
    const qInvoices = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
      setLoading(false);
    });

    const qQuotes = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribeQuotes = onSnapshot(qQuotes, (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quotes');
    });

    return () => { unsubscribeInvoices(); unsubscribeQuotes(); };
  }, []);

  const downloadInvoicePDF = (invoice: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('NK HARDWARE', 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Hardware & Sanitaryware Solutions', 15, 32);
    
    doc.setTextColor(242, 125, 38); // #f27d26
    doc.setFontSize(18);
    doc.text('INVOICE', 160, 25);
    
    // Invoice Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.customerName, 15, 62);
    doc.text(invoice.email, 15, 68);
    
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS:', 140, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: INV-${invoice.id.slice(0, 8).toUpperCase()}`, 140, 62);
    doc.text(`Date: ${invoice.createdAt?.toDate().toLocaleDateString() || 'N/A'}`, 140, 68);
    doc.text(`Due Date: ${invoice.dueDate || 'N/A'}`, 140, 74);
    
    // Table
    const tableBody = [
      ...(invoice.items || []).map((item: any) => [
        item.description || 'Hardware Supplies',
        `INR ${item.rate?.toLocaleString()} x ${item.quantity}`,
        `INR ${(item.rate * item.quantity)?.toLocaleString()}`
      ]),
      ['Subtotal', '', `INR ${invoice.subtotal?.toLocaleString()}`],
      [`Discount (${invoice.discountType === 'percentage' ? invoice.discount + '%' : 'Fixed'})`, '', `- INR ${invoice.discountAmount?.toLocaleString()}`],
      [`Tax (GST ${invoice.taxRate}%)`, '', `INR ${invoice.taxAmount?.toLocaleString()}`],
    ];

    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Rate/Qty', 'Amount']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 2: { halign: 'right' } }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY;
    
    // Totals
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL:', 130, finalY + 20);
    doc.setTextColor(242, 125, 38);
    doc.text(`INR ${invoice.total?.toLocaleString()}`, 170, finalY + 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Paid Amount:', 130, finalY + 30);
    doc.text(`INR ${invoice.paidAmount?.toLocaleString()}`, 170, finalY + 30);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', 130, finalY + 40);
    if (invoice.total - invoice.paidAmount > 0) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(16, 185, 129);
    }
    doc.text(`INR ${(invoice.total - invoice.paidAmount).toLocaleString()}`, 170, finalY + 40);
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    if (invoice.notes) {
      doc.text('Notes:', 15, finalY + 60);
      doc.text(invoice.notes, 15, finalY + 65, { maxWidth: 180 });
    }
    
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    
    doc.save(`Invoice_${invoice.id.slice(0, 8)}.pdf`);
  };

  const getAIInsights = async (items: any[], total: number) => {
    if (items.length === 0 || items[0].description === '') return;
    setIsAnalyzing(true);
    try {
      const model = "gemini-3-flash-preview";
      const itemNames = items.map(i => i.description).join(", ");
      const prompt = `Based on these hardware/sanitaryware items: [${itemNames}] and total amount ₹${total}, provide a JSON response:
      - recommendations: Array of 3 related products to upsell.
      - priceTip: A short tip on what discount to offer to close the deal (max 15 words).`;

      const response = await genAI.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      setAiInsights(result);
    } catch (error) {
      console.error("AI Insights failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const { subtotal, discountAmount, taxAmount, total } = calculateTotals(
        newInvoice.items, 
        Number(newInvoice.discount), 
        newInvoice.discountType, 
        Number(newInvoice.taxRate)
      );
      await addDoc(collection(db, 'invoices'), {
        ...newInvoice,
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount),
        taxAmount: Number(taxAmount),
        total: Number(total),
        discount: Number(newInvoice.discount),
        taxRate: Number(newInvoice.taxRate),
        paidAmount: Number(newInvoice.paidAmount),
        createdAt: serverTimestamp()
      });
      await logAction('create_invoice', `Created invoice for ${newInvoice.customerName}`);
      setIsCreating(false);
      setNewInvoice({ 
        quoteId: '', 
        customerName: '', 
        email: '', 
        items: [{ description: '', quantity: 1, rate: 0 }],
        subtotal: 0, 
        discount: 0,
        discountType: 'percentage',
        taxRate: 18, 
        taxAmount: 0,
        total: 0,
        paidAmount: 0,
        payments: [],
        dueDate: '',
        status: 'draft',
        notes: '',
        isRecurring: false,
        frequency: 'monthly'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invoices');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'invoices', id), { status: newStatus });
      await logAction('update_invoice_status', `Updated invoice ${id} status to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      await logAction('delete_invoice', `Deleted invoice ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0),
    pending: invoices.filter(inv => inv.status !== 'paid').reduce((acc, inv) => acc + (Number(inv.total || 0) - Number(inv.paidAmount || 0)), 0),
    paid: invoices.filter(inv => inv.status === 'paid').length,
    overdue: invoices.filter(inv => inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date()).length
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-orange" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Invoices & Billing</h3>
          <p className="text-white/60 text-sm">Manage client billing, tax calculations, and payment tracking.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-brand-orange text-brand-dark px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20"
        >
          <Plus size={18} /> Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: `₹${(stats.total / 100000).toFixed(2)}L`, icon: IndianRupee, color: 'text-blue-500' },
          { label: 'Pending Dues', value: `₹${(stats.pending / 100000).toFixed(2)}L`, icon: Clock, color: 'text-amber-500' },
          { label: 'Paid Invoices', value: stats.paid, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-500' },
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

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Search by customer or invoice ID..." 
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
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
          <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-bold text-white">New Invoice</h4>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Select Quote</label>
                    <select 
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange"
                      onChange={(e) => {
                        const quote = quotes.find(q => q.id === e.target.value);
                        if (quote) {
                          const items = quote.formalQuote?.items?.map((i: any) => ({
                            description: i.product + (i.size ? ` (${i.size})` : ''),
                            quantity: i.qty,
                            rate: i.rate
                          })) || [{ description: quote.message || 'Hardware Supplies', quantity: 1, rate: quote.formalQuote?.total || 0 }];
                          
                          setNewInvoice({ 
                            ...newInvoice, 
                            quoteId: quote.id, 
                            customerName: quote.name, 
                            email: quote.email, 
                            items 
                          });
                        }
                      }}
                    >
                      <option value="">Manual Entry</option>
                      {quotes.map(q => <option key={q.id} value={q.id}>{q.name} - ₹{(q.formalQuote?.total || 0).toLocaleString()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Customer Name</label>
                    <input type="text" value={newInvoice.customerName || ''} onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" value={newInvoice.email || ''} onChange={e => setNewInvoice({...newInvoice, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Line Items</label>
                      <button 
                        onClick={() => setNewInvoice({...newInvoice, items: [...newInvoice.items, { description: '', quantity: 1, rate: 0 }]})}
                        className="text-brand-orange text-[10px] font-bold uppercase flex items-center gap-1 hover:underline"
                      >
                        <Plus size={12} /> Add Item
                      </button>
                    </div>
                    {newInvoice.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input 
                          placeholder="Description"
                          className="col-span-6 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          value={item.description || ''}
                          onChange={e => {
                            const newItems = [...newInvoice.items];
                            newItems[idx].description = e.target.value;
                            setNewInvoice({...newInvoice, items: newItems});
                          }}
                        />
                        <input 
                          type="number"
                          placeholder="Qty"
                          className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          value={item.quantity || 0}
                          onChange={e => {
                            const newItems = [...newInvoice.items];
                            newItems[idx].quantity = Number(e.target.value);
                            setNewInvoice({...newInvoice, items: newItems});
                          }}
                        />
                        <input 
                          type="number"
                          placeholder="Rate"
                          className="col-span-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          value={item.rate || 0}
                          onChange={e => {
                            const newItems = [...newInvoice.items];
                            newItems[idx].rate = Number(e.target.value);
                            setNewInvoice({...newInvoice, items: newItems});
                          }}
                        />
                        <button 
                          onClick={() => {
                            const newItems = newInvoice.items.filter((_, i) => i !== idx);
                            setNewInvoice({...newInvoice, items: newItems});
                          }}
                          className="col-span-1 text-white/20 hover:text-red-500 flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Discount</label>
                      <div className="flex">
                        <input type="number" value={newInvoice.discount || 0} onChange={e => setNewInvoice({...newInvoice, discount: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-l-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                        <select 
                          value={newInvoice.discountType || 'percentage'} 
                          onChange={e => setNewInvoice({...newInvoice, discountType: e.target.value as any})}
                          className="bg-white/10 border-y border-r border-white/10 rounded-r-xl px-2 text-xs text-white focus:outline-none"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">GST Rate (%)</label>
                      <input type="number" value={newInvoice.taxRate || 0} onChange={e => setNewInvoice({...newInvoice, taxRate: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Paid Amount (₹)</label>
                      <input type="number" value={newInvoice.paidAmount || 0} onChange={e => setNewInvoice({...newInvoice, paidAmount: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Due Date</label>
                      <input type="date" value={newInvoice.dueDate || ''} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <input 
                      type="checkbox" 
                      id="recurring"
                      checked={newInvoice.isRecurring}
                      onChange={e => setNewInvoice({...newInvoice, isRecurring: e.target.checked})}
                      className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                    />
                    <label htmlFor="recurring" className="text-sm text-white font-medium">Recurring Invoice</label>
                    {newInvoice.isRecurring && (
                      <select 
                        value={newInvoice.frequency}
                        onChange={e => setNewInvoice({...newInvoice, frequency: e.target.value as any})}
                        className="ml-auto bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    {(() => {
                      const { subtotal, discountAmount, taxAmount, total } = calculateTotals(newInvoice.items, newInvoice.discount, newInvoice.discountType, newInvoice.taxRate);
                      return (
                        <>
                          <div className="flex justify-between text-xs text-white/40">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-white/40">
                            <span>Discount:</span>
                            <span className="text-red-400">- ₹{discountAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-white/40">
                            <span>GST ({newInvoice.taxRate}%):</span>
                            <span>₹{taxAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-white border-t border-white/5 pt-2 mt-2">
                            <span>Grand Total:</span>
                            <span className="text-brand-orange">₹{total.toLocaleString()}</span>
                          </div>
                          
                          <button 
                            onClick={() => getAIInsights(newInvoice.items, total)}
                            disabled={isAnalyzing}
                            className="w-full mt-4 py-2 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 transition-all"
                          >
                            {isAnalyzing ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                            Get AI Pricing & Upsell Tips
                          </button>

                          <AnimatePresence>
                            {aiInsights && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 bg-brand-orange/5 rounded-xl border border-brand-orange/20 space-y-3"
                              >
                                <div>
                                  <div className="flex items-center gap-2 text-brand-orange mb-2">
                                    <Lightbulb size={14} />
                                    <span className="text-[10px] font-bold uppercase">AI Upsell Suggestions</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {aiInsights.recommendations.map((rec, i) => (
                                      <span key={i} className="px-2 py-1 bg-white/5 rounded text-[9px] text-white/70 border border-white/5">
                                        + {rec}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-brand-orange/10">
                                  <div className="flex items-center gap-2 text-brand-orange mb-1">
                                    <TrendingDown size={14} />
                                    <span className="text-[10px] font-bold uppercase">AI Price Tip</span>
                                  </div>
                                  <p className="text-[10px] text-white/60 italic">"{aiInsights.priceTip}"</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Notes / Terms</label>
                    <textarea value={newInvoice.notes} onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange h-24 resize-none" placeholder="Bank details, terms, etc." />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button onClick={() => setIsCreating(false)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all">Cancel</button>
                <button onClick={handleCreateInvoice} className="flex-1 px-6 py-4 bg-brand-orange text-brand-dark rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-brand-orange/20">Create Invoice</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-[#0f172a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-[10px] uppercase text-white/40 tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-white/20">No invoices found matching your criteria.</td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-brand-orange font-bold">#INV-{invoice.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-[10px] text-white/20 mt-1">{invoice.createdAt?.toDate().toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{invoice.customerName}</div>
                      <div className="text-[10px] text-white/40">{invoice.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">₹{(Number(invoice.total) || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-white/40">Tax: ₹{(Number(invoice.taxAmount) || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold ${(Number(invoice.total || 0) - Number(invoice.paidAmount || 0)) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        ₹{(Number(invoice.total || 0) - Number(invoice.paidAmount || 0)).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-white/40">Paid: ₹{(Number(invoice.paidAmount) || 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        invoice.status === 'draft' ? 'bg-white/10 text-white/60' :
                        invoice.status === 'sent' ? 'bg-blue-500/20 text-blue-500' :
                        invoice.status === 'partial' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <select 
                          value={invoice.status}
                          onChange={(e) => updateStatus(invoice.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-brand-orange"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                        <button onClick={() => downloadInvoicePDF(invoice)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-brand-orange transition-colors" title="Download PDF">
                          <Download size={16} />
                        </button>
                        <button onClick={() => setEditingInvoice(invoice)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-blue-500 transition-colors" title="Edit">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => handleDelete(invoice.id)} className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingInvoice && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] w-full max-w-2xl rounded-3xl border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-bold text-white">Edit Invoice</h4>
                <button onClick={() => setEditingInvoice(null)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Customer Name</label>
                    <input type="text" value={editingInvoice.customerName || ''} onChange={e => setEditingInvoice({...editingInvoice, customerName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
                      <input type="email" value={editingInvoice.email || ''} onChange={e => setEditingInvoice({...editingInvoice, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Phone</label>
                      <input type="text" value={editingInvoice.phone || ''} onChange={e => setEditingInvoice({...editingInvoice, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Address</label>
                    <textarea value={editingInvoice.address || ''} onChange={e => setEditingInvoice({...editingInvoice, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange h-20 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">City</label>
                      <input type="text" value={editingInvoice.city || ''} onChange={e => setEditingInvoice({...editingInvoice, city: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Pincode</label>
                      <input type="text" value={editingInvoice.pincode || ''} onChange={e => setEditingInvoice({...editingInvoice, pincode: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Due Date</label>
                    <input type="date" value={editingInvoice.dueDate || ''} onChange={e => setEditingInvoice({...editingInvoice, dueDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Line Items</label>
                      <button 
                        type="button"
                        onClick={() => setEditingInvoice({...editingInvoice, items: [...(editingInvoice.items || []), { description: '', quantity: 1, rate: 0 }]})}
                        className="text-brand-orange text-[10px] font-bold uppercase flex items-center gap-1 hover:underline"
                      >
                        <Plus size={12} /> Add Item
                      </button>
                    </div>
                    {(editingInvoice.items || []).map((item: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <input 
                          placeholder="Description"
                          className="col-span-6 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          value={item.description || ''}
                          onChange={e => {
                            const newItems = [...editingInvoice.items];
                            newItems[idx].description = e.target.value;
                            setEditingInvoice({...editingInvoice, items: newItems});
                          }}
                        />
                        <input 
                          type="number"
                          placeholder="Qty"
                          className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          value={item.quantity || 0}
                          onChange={e => {
                            const newItems = [...editingInvoice.items];
                            newItems[idx].quantity = Number(e.target.value);
                            const { subtotal, taxAmount, total } = calculateTotals(newItems, editingInvoice.discount || 0, editingInvoice.discountType || 'percentage', editingInvoice.taxRate || 0);
                            setEditingInvoice({...editingInvoice, items: newItems, subtotal, taxAmount, total});
                          }}
                        />
                        <input 
                          type="number"
                          placeholder="Rate"
                          className="col-span-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                          value={item.rate || 0}
                          onChange={e => {
                            const newItems = [...editingInvoice.items];
                            newItems[idx].rate = Number(e.target.value);
                            const { subtotal, taxAmount, total } = calculateTotals(newItems, editingInvoice.discount || 0, editingInvoice.discountType || 'percentage', editingInvoice.taxRate || 0);
                            setEditingInvoice({...editingInvoice, items: newItems, subtotal, taxAmount, total});
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newItems = editingInvoice.items.filter((_: any, i: number) => i !== idx);
                            const { subtotal, taxAmount, total } = calculateTotals(newItems, editingInvoice.discount || 0, editingInvoice.discountType || 'percentage', editingInvoice.taxRate || 0);
                            setEditingInvoice({...editingInvoice, items: newItems, subtotal, taxAmount, total});
                          }}
                          className="col-span-1 text-white/20 hover:text-red-500 flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Discount</label>
                      <div className="flex">
                        <input type="number" value={editingInvoice.discount || 0} onChange={e => {
                          const val = Number(e.target.value);
                          const { subtotal, taxAmount, total } = calculateTotals(editingInvoice.items, val, editingInvoice.discountType || 'percentage', editingInvoice.taxRate || 0);
                          setEditingInvoice({...editingInvoice, discount: val, subtotal, taxAmount, total});
                        }} className="w-full bg-white/5 border border-white/10 rounded-l-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                        <select 
                          value={editingInvoice.discountType || 'percentage'} 
                          onChange={e => {
                            const val = e.target.value as any;
                            const { subtotal, taxAmount, total } = calculateTotals(editingInvoice.items, editingInvoice.discount || 0, val, editingInvoice.taxRate || 0);
                            setEditingInvoice({...editingInvoice, discountType: val, subtotal, taxAmount, total});
                          }}
                          className="bg-white/10 border-y border-r border-white/10 rounded-r-xl px-2 text-xs text-white focus:outline-none"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">GST Rate (%)</label>
                      <input type="number" value={editingInvoice.taxRate || 0} onChange={e => {
                        const val = Number(e.target.value);
                        const { subtotal, taxAmount, total } = calculateTotals(editingInvoice.items, editingInvoice.discount || 0, editingInvoice.discountType || 'percentage', val);
                        setEditingInvoice({...editingInvoice, taxRate: val, subtotal, taxAmount, total});
                      }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Paid Amount (₹)</label>
                      <input type="number" value={editingInvoice.paidAmount || 0} onChange={e => setEditingInvoice({...editingInvoice, paidAmount: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Status</label>
                      <select value={editingInvoice.status || 'draft'} onChange={e => setEditingInvoice({...editingInvoice, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange">
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <input 
                      type="checkbox" 
                      id="edit-recurring"
                      checked={editingInvoice.isRecurring || false}
                      onChange={e => setEditingInvoice({...editingInvoice, isRecurring: e.target.checked})}
                      className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                    />
                    <label htmlFor="edit-recurring" className="text-sm text-white font-medium">Recurring Invoice</label>
                    {editingInvoice.isRecurring && (
                      <select 
                        value={editingInvoice.frequency || 'monthly'}
                        onChange={e => setEditingInvoice({...editingInvoice, frequency: e.target.value as any})}
                        className="ml-auto bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    )}
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    {(() => {
                      const { subtotal, discountAmount, taxAmount, total } = calculateTotals(
                        editingInvoice.items || [], 
                        Number(editingInvoice.discount || 0), 
                        editingInvoice.discountType || 'percentage', 
                        Number(editingInvoice.taxRate || 0)
                      );
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-white/40">
                            <span>Subtotal:</span>
                            <span>₹{(subtotal || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-white/40">
                            <span>Discount:</span>
                            <span className="text-red-400">- ₹{(discountAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-white/40">
                            <span>GST ({editingInvoice.taxRate}%):</span>
                            <span>₹{(taxAmount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-white border-t border-white/5 pt-2 mt-2">
                            <span>Grand Total:</span>
                            <span className="text-brand-orange">₹{(total || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Notes / Terms</label>
                    <textarea value={editingInvoice.notes} onChange={e => setEditingInvoice({...editingInvoice, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange h-24 resize-none" />
                  </div>
                </div>

                <div className="flex gap-4 mt-6 md:col-span-2">
                  <button type="button" onClick={() => setEditingInvoice(null)} className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all">Cancel</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-blue-500/20">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
