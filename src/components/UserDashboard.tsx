import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, addDoc, serverTimestamp, deleteDoc, runTransaction, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Loader2, Package, Clock, CheckCircle2, Sparkles, Zap, ShieldCheck, MessageSquare, Star, ArrowRight, Gift, Percent, Truck, FileText, Settings, Trophy, BarChart3, LayoutGrid, Plus, Download, Bot, MessageCircle, ShoppingBag, Edit3, X, MapPin, CreditCard, User, Phone, Mail, Send, Trash2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { anjulProducts, Product } from '../constants';

export const UserDashboard = ({ onOpenQuote }: { onOpenQuote: () => void }) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES' | 'SETTINGS'>('OVERVIEW');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);

  // Edit Quote State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);

  // Order Form State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedQuoteForOrder, setSelectedQuoteForOrder] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'cod',
    customerName: '',
    phone: '',
    email: '',
    notes: '',
    deliveryDate: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'favorites'), where('userId', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favIds = snapshot.docs.map(doc => doc.data().productId);
      const favProducts = anjulProducts.filter(p => favIds.includes(p.id || p.title));
      setFavoriteProducts(favProducts);
    }, (error) => {
      console.error("Favorites snapshot error:", error);
    });

    return () => unsubscribe();
  }, []);

  const removeFavorite = async (product: Product) => {
    if (!auth.currentUser) return;
    const productId = product.id || product.title;
    const favRef = doc(db, 'favorites', `${auth.currentUser.uid}_${productId}`);
    await deleteDoc(favRef);
  };

  const handleOrder = (quote: any) => {
    setSelectedQuoteForOrder(quote);
    setOrderForm({
      address: '',
      city: '',
      pincode: '',
      paymentMethod: 'cod',
      customerName: quote.name || '',
      phone: quote.phone || '',
      email: quote.email || '',
      notes: '',
      deliveryDate: ''
    });
    setIsOrderModalOpen(true);
  };

  const confirmOrder = async () => {
    if (!selectedQuoteForOrder) return;
    if (!orderForm.address || !orderForm.city || !orderForm.pincode || !orderForm.phone || !orderForm.deliveryDate) {
      alert("Please fill in all required fields (Address, City, Pincode, Phone, Delivery Date).");
      return;
    }
    
    if (!/^\d{10}$/.test(orderForm.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    
    if (!/^\d{6}$/.test(orderForm.pincode)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    setProcessingId(selectedQuoteForOrder.id);
    try {
      // Inventory Reservation
      const items = selectedQuoteForOrder.formalQuote?.items || [];
      const inventorySnapshot = await getDocs(collection(db, 'inventory'));
      const inventoryMap = new Map(inventorySnapshot.docs.map(d => [d.data().name, { id: d.id, ...d.data() as any }]));

      // Update stock in transaction
      await runTransaction(db, async (transaction) => {
        for (const item of items) {
          const invItem = inventoryMap.get(item.product) as any;
          if (invItem) {
            const invDocRef = doc(db, 'inventory', invItem.id);
            const invDoc = await transaction.get(invDocRef);
            if (!invDoc.exists()) throw new Error(`Inventory item ${item.product} not found`);
            const currentStock = invDoc.data().stock;
            if (currentStock < item.qty) throw new Error(`Insufficient stock for ${item.product}`);
            
            transaction.update(invDocRef, {
              stock: currentStock - item.qty
            });
          }
        }
      });

      // Update quote status
      await updateDoc(doc(db, 'quotes', selectedQuoteForOrder.id), {
        status: 'ordered',
        orderedAt: new Date(),
        lastUpdated: new Date()
      });

      // Create a new order entry
      await addDoc(collection(db, 'orders'), {
        customerName: orderForm.customerName,
        email: orderForm.email,
        phone: orderForm.phone,
        address: orderForm.address,
        city: orderForm.city,
        pincode: orderForm.pincode,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes,
        deliveryDate: orderForm.deliveryDate,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || null,
        quoteId: selectedQuoteForOrder.id,
        items: selectedQuoteForOrder.formalQuote?.items || [],
        total: selectedQuoteForOrder.formalQuote?.total || 0,
        subtotal: selectedQuoteForOrder.formalQuote?.subtotal || 0,
        gst: selectedQuoteForOrder.formalQuote?.gst || 0
      });

      setIsOrderModalOpen(false);
      alert("Order placed successfully! Our team will contact you for delivery details.");
    } catch (error) {
      console.error("Order Error:", error);
      alert(error instanceof Error ? error.message : "Failed to place order. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditRequest = (quote: any) => {
    setSelectedQuoteForEdit(quote);
    setEditItems(quote.formalQuote?.items || []);
    setIsEditModalOpen(true);
  };

  const addEditItem = () => {
    setEditItems([...editItems, { product: '', size: '', qty: 1, rate: 0 }]);
  };

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const updateEditItem = (index: number, field: string, value: any) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditItems(newItems);
  };

  const saveEditRequest = async () => {
    if (!selectedQuoteForEdit) return;
    
    setProcessingId(selectedQuoteForEdit.id);
    try {
      // Calculate new subtotal/total based on existing rates (new items have 0 rate)
      const subtotal = editItems.reduce((acc, item) => acc + (item.qty * (item.rate || 0)), 0);
      const gst = subtotal * 0.18;
      const total = subtotal + gst;

      await updateDoc(doc(db, 'quotes', selectedQuoteForEdit.id), {
        status: 'revision_requested',
        lastUpdated: new Date(),
        'formalQuote.items': editItems,
        'formalQuote.subtotal': subtotal,
        'formalQuote.gst': gst,
        'formalQuote.total': total
      });
      
      setIsEditModalOpen(false);
      alert("Revision request sent to admin. They will update the rates for new items and get back to you.");
    } catch (error) {
      console.error("Revision Error:", error);
      alert("Failed to send revision request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleExpertChat = async () => {
    if (!chatQuery.trim()) return;
    setLoadingChat(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a technical expert for NK Hardware. Answer this customer query about sanitaryware, hardware, or plumbing: ${chatQuery}. Keep it professional and helpful.`,
      });
      setChatResponse(response.text || "I'm sorry, I couldn't process that. Please try again.");
    } catch (error) {
      console.error("Chat Error:", error);
      setChatResponse("Failed to connect to AI Expert. Please use WhatsApp for direct support.");
    } finally {
      setLoadingChat(false);
    }
  };

  const forwardToWhatsApp = () => {
    const waMessage = encodeURIComponent(`*Expert Query from NK Hardware Dashboard*\n\n*Customer:* ${auth.currentUser?.email}\n*Query:* ${chatQuery}\n\n*AI Response:* ${chatResponse}`);
    window.open(`https://wa.me/919720356263?text=${waMessage}`, '_blank');
  };

  const downloadQuotePDF = (quote: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22); // brand-orange
    doc.text('NK Hardware', 10, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Premium CPVC & UPVC Solutions', 10, 26);
    
    // Quote Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Quote ID: ${quote.id.slice(0, 8)}`, 10, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 46);
    
    // Customer Info
    doc.setFontSize(14);
    doc.text('Bill To:', 10, 60);
    doc.setFontSize(12);
    doc.text(`Customer: ${quote.name}`, 10, 68);
    doc.text(`Email: ${quote.email}`, 10, 74);
    if (quote.phone) doc.text(`Phone: ${quote.phone}`, 10, 80);

    if (quote.formalQuote) {
      const tableData = quote.formalQuote.items.map((item: any, idx: number) => [
        idx + 1,
        item.product,
        item.size,
        item.qty,
        `Rs. ${item.rate}`,
        `Rs. ${item.qty * item.rate}`
      ]);

      autoTable(doc, {
        startY: 90,
        head: [['S.No', 'Product', 'Size', 'Qty', 'Rate', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 10 }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 150;
      
      doc.text(`Subtotal: Rs. ${quote.formalQuote.subtotal.toLocaleString()}`, 140, finalY + 10);
      doc.text(`GST (18%): Rs. ${quote.formalQuote.gst.toLocaleString()}`, 140, finalY + 16);
      doc.setFontSize(14);
      doc.text(`Grand Total: Rs. ${quote.formalQuote.total.toLocaleString()}`, 140, finalY + 26);
    } else {
      doc.text(`Message: ${quote.message}`, 10, 90);
    }
    
    doc.save(`Quote_${quote.id.slice(0, 8)}.pdf`);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'quotes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(docs);
      setLoading(false);
      
      if (docs.length > 0 && !recommendations) {
        generateAIRecommendations(docs);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const generateAIRecommendations = async (userQuotes: any[]) => {
    setLoadingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Based on these product inquiries: ${userQuotes.map(q => q.message).join(', ')}, suggest 3 related premium plumbing or sanitaryware products from 'Quality Fittings' that this customer might need. Keep it concise and professional.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setRecommendations(response.text);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const requestCatalog = () => {
    const waMessage = encodeURIComponent(`Hello NK Hardware! I am interested in your latest product catalogs. Please share the PDF catalogs for CPVC, UPVC, and Sanitaryware.`);
    window.open(`https://wa.me/919720356263?text=${waMessage}`, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-brand-orange" size={48} />
      <p className="text-white/40 font-medium">Loading your premium dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            Welcome, {auth.currentUser?.displayName?.split(' ')[0] || 'Premium Member'}
            <ShieldCheck className="text-brand-orange" size={24} />
          </h2>
          <p className="text-white/50 mt-1">Manage your inquiries and explore exclusive benefits.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-brand-orange/10 border border-brand-orange/20 px-4 py-2 rounded-xl flex items-center gap-2">
            <Star className="text-brand-orange" size={16} fill="currentColor" />
            <span className="text-brand-orange font-bold text-sm">Gold Member</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quotes & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'OVERVIEW' && (
            <>
              <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="text-brand-orange" size={20} /> Recent Inquiries
                    {quotes.filter(q => q.formalQuote).length > 0 && (
                      <span className="bg-brand-orange text-brand-dark text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        {quotes.filter(q => q.formalQuote).length}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{quotes.length} Total</span>
                </div>
                
                {quotes.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Package className="mx-auto text-white/20 mb-4" size={48} />
                    <p className="text-white/40">No inquiries found yet.</p>
                    <button onClick={onOpenQuote} className="mt-4 text-brand-orange font-bold text-sm hover:underline">Request a Quote</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.map(quote => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={quote.id} 
                        className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:border-brand-orange/30 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white group-hover:text-brand-orange transition-colors">{quote.name}</h4>
                              {quote.formalQuote && (
                                <span className="bg-brand-orange text-brand-dark text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">New Quote</span>
                              )}
                            </div>
                            <p className="text-white/40 text-xs mt-0.5">{quote.createdAt?.toDate().toLocaleDateString()}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            quote.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            quote.status === 'contacted' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {quote.status === 'pending' ? <Clock size={10} /> : quote.status === 'contacted' ? <Zap size={10} /> : <CheckCircle2 size={10} />}
                            {quote.status}
                          </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-xl text-white/70 text-sm italic border border-white/5">
                          "{quote.message}"
                        </div>

                        {quote.formalQuote && (
                          <div className="mt-4 bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-xs font-bold text-brand-orange uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} /> Formal Quote Details
                              </h5>
                              <button 
                                onClick={() => downloadQuotePDF(quote)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-brand-orange px-3 py-1.5 rounded-lg hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/20"
                              >
                                <Download size={12} /> Download PDF
                              </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[10px] text-white/60">
                                <thead className="border-b border-white/10">
                                  <tr>
                                    <th className="pb-2">Product</th>
                                    <th className="pb-2">Qty</th>
                                    <th className="pb-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {quote.formalQuote.items.slice(0, 3).map((item: any, idx: number) => (
                                    <tr key={idx}>
                                      <td className="py-2 text-white/80">{item.product} ({item.size})</td>
                                      <td className="py-2">{item.qty}</td>
                                      <td className="py-2 text-right text-brand-orange font-bold">₹{(item.qty * item.rate).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {quote.formalQuote.items.length > 3 && (
                              <p className="text-[10px] text-white/30 mt-2 italic">+ {quote.formalQuote.items.length - 3} more items in PDF</p>
                            )}

                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Grand Total (Inc. GST)</span>
                              <span className="text-lg font-black text-brand-orange">₹{quote.formalQuote.total.toLocaleString()}</span>
                            </div>

                            {quote.status !== 'ordered' && (
                              <div className="mt-6 grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => handleEditRequest(quote)}
                                  disabled={processingId === quote.id}
                                  className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                                >
                                  {processingId === quote.id ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
                                  Edit Request
                                </button>
                                <button 
                                  onClick={() => handleOrder(quote)}
                                  disabled={processingId === quote.id}
                                  className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-orange text-brand-dark rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/20 disabled:opacity-50"
                                >
                                  {processingId === quote.id ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                                  Order Now
                                </button>
                              </div>
                            )}

                            {quote.status === 'ordered' && (
                              <div className="mt-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold">
                                <CheckCircle2 size={14} /> Order Placed Successfully
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Recommendations Section */}
              <div className="bg-gradient-to-br from-[#112240] to-[#0f172a] rounded-3xl p-6 border border-brand-orange/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-orange/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-brand-orange" size={20} /> AI Smart Suggestions
                  </h3>
                  {loadingAI && <Loader2 className="animate-spin text-brand-orange" size={16} />}
                </div>
                
                <div className="relative z-10">
                  {loadingAI ? (
                    <div className="py-8 text-center text-white/40 text-sm">Analyzing your preferences...</div>
                  ) : recommendations ? (
                    <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed">
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        {recommendations.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">{line}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40 text-sm">
                      Start an inquiry to get personalized product recommendations.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'INVOICES' && (
            <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-brand-orange" size={20} /> Generated Invoices
                </h3>
                <button onClick={() => setActiveTab('OVERVIEW')} className="text-xs font-bold text-brand-orange hover:underline">Back to Overview</button>
              </div>
              
              <div className="space-y-4">
                {quotes.filter(q => q.formalQuote).length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <FileText className="mx-auto text-white/20 mb-4" size={48} />
                    <p className="text-white/40">No invoices generated yet.</p>
                  </div>
                ) : (
                  quotes.filter(q => q.formalQuote).map(quote => (
                    <div key={quote.id} className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange">
                          <FileText size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Invoice #{quote.id.slice(0, 8).toUpperCase()}</h4>
                          <p className="text-white/40 text-xs">{quote.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-brand-orange font-black text-lg">₹{quote.formalQuote.total.toLocaleString()}</div>
                        <button 
                          onClick={() => downloadQuotePDF(quote)}
                          className="text-[10px] font-bold text-white/60 hover:text-brand-orange transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Download size={12} /> Download
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="text-brand-orange" size={20} /> Account Settings
                </h3>
                <button onClick={() => setActiveTab('OVERVIEW')} className="text-xs font-bold text-brand-orange hover:underline">Back to Overview</button>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-white font-bold mb-4">Profile Information</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase">Display Name</label>
                        <div className="text-white text-sm">{auth.currentUser?.displayName || 'Not Set'}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase">Email Address</label>
                        <div className="text-white text-sm">{auth.currentUser?.email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-white font-bold mb-4">Catalog Preferences</h4>
                  <p className="text-white/40 text-sm mb-4">Request physical or digital catalogs to be sent to your registered address.</p>
                  <button 
                    onClick={requestCatalog}
                    className="flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-4 py-2 rounded-xl font-bold text-sm hover:bg-brand-orange/20 transition-all"
                  >
                    <MessageCircle size={18} /> Request Catalog via WhatsApp
                  </button>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-white font-bold mb-4">Notification Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Email Notifications for Quotes</span>
                      <div className="w-10 h-5 bg-brand-orange rounded-full relative">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">WhatsApp Updates</span>
                      <div className="w-10 h-5 bg-brand-orange rounded-full relative">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Premium Features */}
        <div className="space-y-6">
          {/* Favorite Products Section */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="text-red-500" size={18} fill="currentColor" /> Favorite Products
            </h3>
            
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Heart className="mx-auto text-white/20 mb-2" size={32} />
                <p className="text-white/40 text-xs">No favorites yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteProducts.map(product => (
                  <div key={product.id || product.title} className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center gap-3">
                    <img src={product.image} alt={product.title} className="w-12 h-12 object-contain rounded-lg bg-white" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-white text-xs truncate max-w-[120px]">{product.title}</h4>
                    </div>
                    <button 
                      onClick={() => removeFavorite(product)}
                      className="p-1.5 text-white/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Expert Chat */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-brand-orange/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bot className="text-brand-orange" size={18} /> AI Expert Support
            </h3>
            <p className="text-white/50 text-xs mb-4">Ask anything about products, installation, or technical specs.</p>
            
            <div className="space-y-3">
              <div className="relative">
                <textarea 
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  placeholder="Type your technical query..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-brand-orange min-h-[80px] transition-all"
                />
              </div>
              
              <button 
                onClick={handleExpertChat}
                disabled={loadingChat || !chatQuery.trim()}
                className="w-full bg-brand-orange text-brand-dark font-bold py-3 rounded-2xl hover:bg-orange-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20 disabled:opacity-50"
              >
                {loadingChat ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                {loadingChat ? 'Expert is thinking...' : 'Ask AI Expert'}
              </button>

              <AnimatePresence>
                {chatResponse && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3"
                  >
                    <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-4 text-xs text-white/80 leading-relaxed italic">
                      {chatResponse}
                    </div>
                    <button 
                      onClick={forwardToWhatsApp}
                      className="w-full py-2 border border-brand-orange/30 rounded-xl text-[10px] font-bold text-brand-orange hover:bg-brand-orange/10 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} /> Still have questions? WhatsApp Me
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-br from-brand-orange/10 to-transparent rounded-3xl p-6 border border-brand-orange/20 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="text-brand-orange" size={18} /> Premium Benefits
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Direct Factory Pricing</div>
                    <div className="text-white/40 text-[10px]">Special B2B rates for members</div>
                  </div>
                </div>
                <CheckCircle2 className="text-brand-orange/40" size={16} />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <Truck size={18} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Priority Delivery</div>
                    <div className="text-white/40 text-[10px]">Guaranteed 24-hour dispatch</div>
                  </div>
                </div>
                <CheckCircle2 className="text-brand-orange/40" size={16} />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <Star size={18} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Exclusive Catalog</div>
                    <div className="text-white/40 text-[10px]">Access to unreleased designs</div>
                  </div>
                </div>
                <CheckCircle2 className="text-brand-orange/40" size={16} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onOpenQuote}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
              >
                <Plus className="text-brand-orange" size={20} />
                <span className="text-[10px] font-bold text-white/60 uppercase">Get Quote</span>
              </button>
              <button 
                onClick={() => setActiveTab('INVOICES')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
              >
                <FileText className="text-brand-orange" size={20} />
                <span className="text-[10px] font-bold text-white/60 uppercase">Invoices</span>
              </button>
              <button 
                onClick={requestCatalog}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
              >
                <LayoutGrid className="text-brand-orange" size={20} />
                <span className="text-[10px] font-bold text-white/60 uppercase">Catalogs</span>
              </button>
              <button 
                onClick={() => setActiveTab('SETTINGS')}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
              >
                <Settings className="text-brand-orange" size={20} />
                <span className="text-[10px] font-bold text-white/60 uppercase">Settings</span>
              </button>
            </div>
          </div>

          {/* Project Status Tracker */}
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-brand-orange" size={18} /> Active Projects
              </h3>
              <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full uppercase tracking-wider">2 In Progress</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/80 font-medium truncate max-w-[180px]">Hotel Grand Residency</span>
                  <span className="text-brand-orange font-bold">75%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-brand-orange rounded-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/80 font-medium truncate max-w-[180px]">Skyline Apartments</span>
                  <span className="text-brand-orange font-bold">30%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '30%' }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-brand-orange rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Quote Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedQuoteForEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-brand-orange/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Edit Quote Request</h3>
                    <p className="text-xs text-white/40">Add or modify items. Admin will update rates for new items.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-brand-orange uppercase tracking-widest flex items-center gap-2">
                      <Package size={14} /> Quote Items
                    </h4>
                    <button 
                      onClick={addEditItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange/10 text-brand-orange rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-brand-orange/20 transition-all"
                    >
                      <Plus size={12} /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editItems.map((item, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 relative group">
                        <button 
                          onClick={() => removeEditItem(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X size={12} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Product Name</label>
                            <input 
                              type="text"
                              value={item.product}
                              onChange={(e) => updateEditItem(idx, 'product', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                              placeholder="e.g., CPVC Pipe"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Size / Spec</label>
                            <input 
                              type="text"
                              value={item.size}
                              onChange={(e) => updateEditItem(idx, 'size', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                              placeholder="e.g., 1 inch"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Quantity</label>
                              <input 
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateEditItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all text-center"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Rate (Admin Only)</label>
                              <div className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white/40 flex items-center justify-center font-bold italic">
                                {item.rate > 0 ? `₹${item.rate}` : 'TBD'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between gap-4">
                <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest max-w-[200px]">
                  * Rates for new items will be updated by admin after submission.
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveEditRequest}
                    disabled={processingId === selectedQuoteForEdit.id}
                    className="flex items-center justify-center gap-3 py-3 px-8 bg-brand-orange text-brand-dark rounded-xl text-sm font-black uppercase tracking-wider hover:bg-orange-400 transition-all shadow-xl shadow-brand-orange/20 disabled:opacity-50"
                  >
                    {processingId === selectedQuoteForEdit.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={18} />
                        Send for Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Confirmation Modal */}
      <AnimatePresence>
        {isOrderModalOpen && selectedQuoteForOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-brand-orange/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Complete Your Order</h3>
                    <p className="text-xs text-white/40">Review details and provide delivery address</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Customer Information */}
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          type="text"
                          value={orderForm.customerName}
                          onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          type="tel"
                          value={orderForm.phone}
                          onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input 
                          type="email"
                          value={orderForm.email}
                          onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Delivery Address */}
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} /> Delivery Address
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Street Address</label>
                      <textarea 
                        value={orderForm.address}
                        onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all resize-none"
                        placeholder="Enter full delivery address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/40 uppercase font-bold ml-1">City</label>
                        <input 
                          type="text"
                          value={orderForm.city}
                          onChange={(e) => setOrderForm({...orderForm, city: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Pincode</label>
                        <input 
                          type="text"
                          value={orderForm.pincode}
                          onChange={(e) => setOrderForm({...orderForm, pincode: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                          placeholder="Pincode"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Preferred Delivery Date</label>
                        <input 
                          type="date"
                          value={orderForm.deliveryDate}
                          onChange={(e) => setOrderForm({...orderForm, deliveryDate: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-brand-orange/50 outline-none transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] text-white/40 uppercase font-bold ml-1">Special Instructions</label>
                        <textarea 
                          value={orderForm.notes}
                          onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all resize-none"
                          placeholder="Any special delivery instructions?"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Order Summary */}
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} /> Order Summary
                  </h4>
                  <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left p-3 text-white/40 font-bold uppercase tracking-wider">Product</th>
                          <th className="text-center p-3 text-white/40 font-bold uppercase tracking-wider">Qty</th>
                          <th className="text-right p-3 text-white/40 font-bold uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {selectedQuoteForOrder.formalQuote.items.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-3 text-white font-medium">{item.product} <span className="text-white/40">({item.size})</span></td>
                            <td className="p-3 text-center text-white/60">{item.qty}</td>
                            <td className="p-3 text-right text-brand-orange font-bold">₹{(item.qty * item.rate).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-white/5">
                        <tr>
                          <td colSpan={2} className="p-3 text-right text-white/40 font-bold uppercase">Grand Total</td>
                          <td className="p-3 text-right text-brand-orange font-black text-base">₹{selectedQuoteForOrder.formalQuote.total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>

                {/* Payment Method */}
                <section className="space-y-4">
                  <h4 className="text-xs font-black text-brand-orange uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={14} /> Payment Method
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${orderForm.paymentMethod === 'cod' ? 'bg-brand-orange/10 border-brand-orange' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${orderForm.paymentMethod === 'cod' ? 'bg-brand-orange text-brand-dark' : 'bg-white/10 text-white/40'}`}>
                          <Truck size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Cash on Delivery (COD)</div>
                          <div className="text-[10px] text-white/40">Pay when you receive your hardware</div>
                        </div>
                      </div>
                      <input 
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={orderForm.paymentMethod === 'cod'}
                        onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                        className="accent-brand-orange w-4 h-4"
                      />
                    </label>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Total Payable</div>
                  <div className="text-2xl font-black text-brand-orange">₹{selectedQuoteForOrder.formalQuote.total.toLocaleString()}</div>
                </div>
                <button 
                  onClick={confirmOrder}
                  disabled={processingId === selectedQuoteForOrder.id}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 py-4 px-10 bg-brand-orange text-brand-dark rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-orange-400 transition-all shadow-xl shadow-brand-orange/20 disabled:opacity-50"
                >
                  {processingId === selectedQuoteForOrder.id ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirm Order
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
