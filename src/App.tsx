import React, { useState, useEffect, Component } from 'react';
import Markdown from 'react-markdown';
import { LoginPage } from './components/LoginPage';
import { Download, Search, ShoppingCart, Moon, ShieldCheck, ChevronDown, ArrowRight, MessageCircle, AlertTriangle, Bot, Menu, X, LogOut, User as UserIcon, CheckCircle2, Loader2, Star, Send, Trash2, RefreshCw, Sparkles, Truck, Clock, PhoneCall, MapPin, Shield, Award, Headphones, ArrowLeft, Mail, Phone, Instagram, Facebook, Twitter, Cpu, Zap, BarChart3, Eye, Settings, Users, Pipette, Droplets, Waves, Bath, LayoutDashboard, MessageSquare, Package, Wand2, Plus, FileText, ListTree, Boxes, Layout, PenTool, Image as ImageIcon, Tag, Webhook, Activity, List, Store, Check, Upload, Link as LinkIcon, Bell, Database } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import FeatureMarketplace from './components/FeatureMarketplace';
import AnjulSanitarywarePage from './components/AnjulSanitarywarePage';
import AstralProductsPage from './components/AstralProductsPage';
import WhyUsPage from './components/WhyUsPage';
import ContactUsPage from './components/ContactUsPage';
import { OrderDashboard } from './components/OrderDashboard';
import { UserDashboard } from './components/UserDashboard';
import { InvoiceManager } from './components/InvoiceManager';
import { LiveVisitorTracking } from './components/LiveVisitorTracking';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import AuditLogs from './components/AuditLogs';
import CRM from './components/CRM';
import SalesPredictor from './components/SalesPredictor';
import PageBuilder from './components/PageBuilder';
import SEOManager from './components/SEOManager';
import SiteSettings from './components/SiteSettings';
import BlogManager from './components/BlogManager';
import InventoryManager from './components/InventoryManager';
import CategoryManager from './components/CategoryManager';
import SupplierManager from './components/SupplierManager';
import TestimonialManager from './components/TestimonialManager';
import CampaignManager from './components/CampaignManager';
import DiscountManager from './components/DiscountManager';
import ReviewManager from './components/ReviewManager';
import ReportManager from './components/ReportManager';
import SettingsManager from './components/SettingsManager';
import IntegrationManager from './components/IntegrationManager';
import MediaLibrary from './components/MediaLibrary';
import StaffRoles from './components/StaffRoles';
import { logAction } from './lib/audit';
import { GoogleGenAI } from "@google/genai";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { auth, signInWithGoogle, logout, db, storage, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, setDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, doc, getDoc, deleteDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Insights State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Listen for new quotes to trigger notifications
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Only notify for new quotes (not initial load)
          const now = new Date().getTime();
          const createdAt = data.createdAt?.toDate().getTime();
          if (createdAt && (now - createdAt) < 10000) { // If created in last 10 seconds
            const newNotif = {
              id: Math.random().toString(36).substr(2, 9),
              title: 'New Quote Request',
              message: `New request from ${data.name}`,
              time: new Date(),
              type: 'quote',
              read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
          }
        }
      });
    });

    // Listen for low stock (mocking logic for now based on products)
    const pQ = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(pQ, (snapshot) => {
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.stock !== undefined && product.stock < 10) {
          const newNotif = {
            id: `stock-${doc.id}`,
            title: 'Low Stock Alert',
            message: `${product.name} is low on stock (${product.stock} left)`,
            time: new Date(),
            type: 'stock',
            read: false
          };
          setNotifications(prev => {
            if (prev.find(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      });
    });

    return () => {
      unsubscribe();
      unsubscribeProducts();
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // AI Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState<string>('');
  const [generatingReply, setGeneratingReply] = useState(false);
  const [generatingQuoteFor, setGeneratingQuoteFor] = useState<string | null>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([{ product: '', size: '', qty: 1, rate: 0 }]);
  const [sendingQuote, setSendingQuote] = useState(false);

  // Bulk Actions State
  const [selectedQuotes, setSelectedQuotes] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Advanced Filtering State
  const [quoteFilter, setQuoteFilter] = useState({
    status: 'all',
    dateRange: 'all',
    searchTerm: ''
  });
  const [productFilter, setProductFilter] = useState({
    category: 'all',
    searchTerm: ''
  });

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) return;
    
    try {
      const promises = Array.from(selectedProducts).map(id => deleteDoc(doc(db, 'products', id)));
      await Promise.all(promises);
      setSelectedProducts(new Set());
      alert('Products deleted successfully.');
    } catch (error) {
      console.error("Error deleting products:", error);
      alert('Failed to delete products.');
    }
  };

  useEffect(() => {
    const qQuotes = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribeQuotes = onSnapshot(qQuotes, (snapshot) => {
      setQuotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'quotes');
      setLoading(false);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });

    return () => {
      unsubscribeQuotes();
      unsubscribeOrders();
    };
  }, []);

  const sendQuote = async (quote: any, formalQuote: any) => {
    setSendingQuote(true);
    try {
      const itemsList = formalQuote.items.map((item: any) => 
        `- ${item.product} (${item.size}): ${item.qty} x ₹${item.rate} = ₹${item.qty * item.rate}`
      ).join('\n');

      const message = `
Hello ${quote.name},

Here is your formal quote from NK Hardware:

${itemsList}

Subtotal: ₹${formalQuote.subtotal.toLocaleString()}
GST (18%): ₹${formalQuote.gst.toLocaleString()}
Grand Total: ₹${formalQuote.total.toLocaleString()}

Thank you for your business!
      `;

      // Send Email
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: quote.email,
          subject: `Formal Quote from NK Hardware - ${quote.id.slice(0, 8)}`,
          body: message
        })
      });

      if (emailResponse.ok) {
        alert('Quote sent via email successfully!');
      }

      // WhatsApp Share
      const waMessage = encodeURIComponent(`*FORMAL QUOTE - NK HARDWARE*\n\nDear ${quote.name},\n\nWe have generated a formal quote for your inquiry. You can download the full PDF from your dashboard.\n\n*Summary of Items:*\n${itemsList}\n\n*Grand Total (Inc. GST): ₹${formalQuote.total.toLocaleString()}*\n\nThank you for choosing NK Hardware!`);
      const waNumber = quote.phone ? quote.phone.replace(/\D/g, '') : '9720356263';
      const waUrl = `https://wa.me/${waNumber.length === 10 ? '91' + waNumber : waNumber}?text=${waMessage}`;
      window.open(waUrl, '_blank');

    } catch (error) {
      console.error("Send Quote Error:", error);
      alert('Failed to send quote.');
    } finally {
      setSendingQuote(false);
    }
  };

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', description: '', imageUrl: '' });
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // CRM State
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ name: '', email: '', phone: '', message: '', status: 'pending' });
  const [addingInteraction, setAddingInteraction] = useState(false);

  // Media Library State
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuotes(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quotes');
      setLoading(false);
    });

    const ordersQ = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const mediaQ = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    const unsubscribeMedia = onSnapshot(mediaQ, (snapshot) => {
      setMediaFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'media');
    });

    const usersQ = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      console.log("Users snapshot:", snapshot.docs.length);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingUsers(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoadingUsers(false);
    });

    return () => {
      unsubscribe();
      unsubscribeOrders();
      unsubscribeMedia();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      setLoadingProducts(true);
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingProducts(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
        setLoadingProducts(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'customers') {
      setLoadingUsers(true);
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoadingUsers(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setLoadingUsers(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const generateInsights = async () => {
    setGeneratingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze these recent quote requests and provide a brief, actionable 2-paragraph summary for the business owner. Focus on trends, urgency, and what to prioritize:\n\n${JSON.stringify(quotes.slice(0, 10))}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || 'No insights generated.');
    } catch (error) {
      console.error("AI Insight Error:", error);
      setAiInsight("Failed to generate insights. Please try again.");
    } finally {
      setGeneratingInsight(false);
    }
  };

  const generateReply = async (quote: any) => {
    setReplyingTo(quote.id);
    setGeneratingReply(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Write a professional, polite, and concise email reply to the following customer inquiry. The customer's name is ${quote.name}. Their message was: "${quote.message}". We are a CPVC pipes manufacturing company. Thank them for reaching out and let them know we will get back to them with a detailed quote shortly.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiReply(response.text || '');
    } catch (error) {
      console.error("AI Reply Error:", error);
      setAiReply("Failed to generate reply.");
    } finally {
      setGeneratingReply(false);
    }
  };

  const generateProductDescription = async () => {
    if (!newProduct.name || !newProduct.category) return;
    setGeneratingDesc(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Write a compelling, 2-sentence product description for a ${newProduct.category} named "${newProduct.name}". Highlight its durability and industrial quality.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setNewProduct(prev => ({ ...prev, description: response.text || '' }));
    } catch (error) {
      console.error("AI Description Error:", error);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: Number(newProduct.price)
      });
      await logAction('create_product', `Created product: ${newProduct.name}`);
      setIsAddingProduct(false);
      setNewProduct({ name: '', category: '', price: '', description: '', imageUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await logAction('delete_product', `Deleted product ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'quotes', id), { status: newStatus });
      await logAction('update_quote', `Updated quote ${id} status to ${newStatus}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${id}`);
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'quotes', id));
      await logAction('delete_quote', `Deleted quote ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `quotes/${id}`);
    }
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

  const convertToOrder = async (quote: any) => {
    try {
      await addDoc(collection(db, 'orders'), {
        customerName: quote.name,
        email: quote.email,
        phone: quote.phone || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: quote.userId || null,
        quoteId: quote.id,
        items: quote.formalQuote?.items || [],
        total: quote.formalQuote?.total || 0,
        address: quote.address || '',
        city: quote.city || '',
        pincode: quote.pincode || ''
      });
      await logAction('convert_to_order', `Converted quote ${quote.id} to order with items`);
      alert("Quote converted to Order successfully!");
    } catch (error) {
      console.error("Error converting to order:", error);
      alert("Failed to convert to order.");
    }
  };

  const pendingQuotes = quotes.filter(q => q.status === 'pending' || q.status === 'revision_requested').length;
  const pendingOrders = orders.length;
  const contactedQuotes = quotes.filter(q => q.status === 'contacted').length;
  const completedQuotes = quotes.filter(q => q.status === 'completed').length;

  const sidebarSections = [
    {
      title: "Overview",
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'advanced_analytics', icon: BarChart3, label: 'Advanced Analytics', badge: 'PRO' },
        { id: 'live_view', icon: Eye, label: 'Live Visitor Tracking' },
      ]
    },
    {
      title: "Sales & CRM",
      items: [
        { id: 'quotes', icon: MessageSquare, label: 'Quote Requests', badge: pendingQuotes },
        { id: 'orders', icon: ShoppingCart, label: 'Order Management', badge: pendingOrders },
        { id: 'sales_predictor', icon: Zap, label: 'AI Sales Predictor', badge: 'AI' },
        { id: 'crm', icon: Users, label: 'Multi-Channel CRM', badge: 'NEW' },
        { id: 'invoices', icon: FileText, label: 'Invoices & Billing' },
        { id: 'customers', icon: Users, label: 'Customer Directory' },
      ]
    },
    {
      title: "Catalog & Inventory",
      items: [
        { id: 'products', icon: Package, label: 'Products' },
        { id: 'categories', icon: ListTree, label: 'Categories' },
        { id: 'inventory', icon: Boxes, label: 'Stock & Inventory' },
        { id: 'suppliers', icon: Truck, label: 'Suppliers' },
      ]
    },
    {
      title: "Content (CMS)",
      items: [
        { id: 'pages', icon: Layout, label: 'Page Builder' },
        { id: 'blog', icon: PenTool, label: 'Blog & Articles' },
        { id: 'testimonials', icon: Star, label: 'Testimonials' },
        { id: 'media', icon: ImageIcon, label: 'Media Library' },
      ]
    },
    {
      title: "Marketing",
      items: [
        { id: 'campaigns', icon: Mail, label: 'Email Campaigns' },
        { id: 'seo', icon: Search, label: 'SEO Manager' },
        { id: 'discounts', icon: Tag, label: 'Coupons & Discounts' },
      ]
    },
    {
      title: "System",
      items: [
        { id: 'users', icon: Shield, label: 'Staff & Roles' },
        { id: 'settings', icon: Settings, label: 'Site Settings' },
        { id: 'integrations', icon: Webhook, label: 'API & Integrations' },
        { id: 'logs', icon: Activity, label: 'Audit Logs' },
      ]
    },
    {
      title: "Marketplace",
      items: [
        { id: 'feature_store', icon: Store, label: 'Feature Store' },
      ]
    }
  ];

  const [requestedModules, setRequestedModules] = useState<Set<string>>(new Set());
  const [activatingModule, setActivatingModule] = useState<string | null>(null);

  const handleRequestModule = (id: string) => {
    if (requestedModules.has(id)) return;
    setActivatingModule(id);
    setTimeout(() => {
      setRequestedModules(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
      setActivatingModule(null);
    }, 1500);
  };

  const renderGenericTab = (title: string, description: string, features: string[]) => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/60 mb-6">{description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-[#0f172a] p-4 rounded-xl border border-white/5 flex items-start gap-3 hover:border-brand-orange/30 transition-colors">
              <CheckCircle2 className="text-brand-orange shrink-0 mt-0.5" size={16} />
              <span className="text-sm text-white/80">{f}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-8 bg-gradient-to-br from-[#0f172a] to-brand-dark border border-brand-orange/20 rounded-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <Wand2 className="mx-auto text-brand-orange mb-4" size={40} />
          <h4 className="text-xl font-bold text-white mb-2">Advanced {title} Module</h4>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            This module is currently being developed. Stay tuned for updates!
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-brand-dark flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-72 bg-[#0f172a] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 ${isSidebarOpen ? 'h-full' : 'h-[70px] md:h-full'}`}>
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-brand-orange" size={24} />
            <h2 className="text-lg md:text-xl font-bold text-white">Admin Pro</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="md:hidden p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white">
              <LogOut size={20} className="md:hidden" />
              <X size={24} className="hidden md:block" />
            </button>
          </div>
        </div>
        
        <div className={`flex-grow overflow-y-auto custom-scrollbar ${!isSidebarOpen && 'hidden md:block'}`}>
          <div className="p-4 space-y-6">
            {sidebarSections.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2 px-4">{section.title}</h4>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                          isActive 
                            ? 'bg-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20' 
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-brand-dark' : 'text-white/40'} /> 
                        {item.label}
                        {item.badge ? (
                          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-brand-dark/20 text-brand-dark' : 'bg-brand-orange text-brand-dark'
                          }`}>
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 shrink-0 hidden md:block">
          <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all font-medium text-sm">
            <ArrowLeft size={16} /> Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-auto bg-[#020617] p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Notifications */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <LayoutDashboard size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                <p className="text-white/40 text-xs">Welcome back, Super Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 bg-[#0f172a] border border-white/5 rounded-xl text-white/60 hover:text-brand-orange transition-all relative group"
                >
                  <Bell size={20} className="group-hover:scale-110 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-brand-dark text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#020617] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-[#0f172a] rounded-2xl shadow-2xl border border-white/10 z-[120] overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                        <div className="flex gap-3">
                          <button onClick={markAllAsRead} className="text-[10px] font-bold text-brand-orange hover:underline uppercase tracking-wider">Mark all read</button>
                          <button onClick={clearNotifications} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider">Clear</button>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center text-white/20">
                            <Bell size={40} className="mx-auto mb-3 opacity-10" />
                            <p className="text-sm">No new notifications</p>
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id} 
                              className={`p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer relative group ${!notif.read ? 'bg-brand-orange/[0.03]' : ''}`}
                            >
                              {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange"></div>}
                              <div className="flex gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'quote' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {notif.type === 'quote' ? <MessageSquare size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-white truncate">{notif.title}</p>
                                  <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{notif.message}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock size={10} className="text-white/30" />
                                    <p className="text-[10px] text-white/30">{notif.time.toLocaleTimeString()}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-white">Ansh Singhal</p>
                  <p className="text-[10px] font-bold text-brand-orange uppercase tracking-widest">Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-orange text-brand-dark font-bold flex items-center justify-center shadow-lg shadow-brand-orange/20">
                  AS
                </div>
              </div>
            </div>
          </div>
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Overview</h3>
                <button 
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "ID,Name,Email,Status,Date\n"
                      + quotes.map(q => `${q.id},${q.name},${q.email},${q.status},${q.createdAt?.toDate().toLocaleDateString()}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "business_report.csv");
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10 transition-all"
                >
                  <Download size={16} /> Export Report
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                  <div className="text-white/60 text-sm font-medium mb-2">Total Requests</div>
                  <div className="text-4xl font-bold text-white">{quotes.length}</div>
                </div>
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                  <div className="text-white/60 text-sm font-medium mb-2">Pending</div>
                  <div className="text-4xl font-bold text-amber-500">{pendingQuotes}</div>
                </div>
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                  <div className="text-white/60 text-sm font-medium mb-2">Completed</div>
                  <div className="text-4xl font-bold text-emerald-500">{completedQuotes}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <button 
                  onClick={() => {
                    setActiveTab('products');
                    setIsAddingProduct(true);
                  }}
                  className="p-4 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl text-left hover:bg-brand-orange/20 transition-all group"
                >
                  <div className="p-2 bg-brand-orange/20 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Plus className="text-brand-orange" size={20} />
                  </div>
                  <div className="text-white font-bold text-sm">Add Product</div>
                  <div className="text-white/40 text-[10px]">New catalog item</div>
                </button>
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-left hover:bg-blue-500/20 transition-all group"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="text-blue-500" size={20} />
                  </div>
                  <div className="text-white font-bold text-sm">Create Invoice</div>
                  <div className="text-white/40 text-[10px]">Manual billing</div>
                </button>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-left hover:bg-purple-500/20 transition-all group"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Mail className="text-purple-500" size={20} />
                  </div>
                  <div className="text-white font-bold text-sm">Send Campaign</div>
                  <div className="text-white/40 text-[10px]">Email marketing</div>
                </button>
                <button 
                  onClick={() => setActiveTab('customers')}
                  className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left hover:bg-emerald-500/20 transition-all group"
                >
                  <div className="p-2 bg-emerald-500/20 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                    <Users className="text-emerald-500" size={20} />
                  </div>
                  <div className="text-white font-bold text-sm">New Customer</div>
                  <div className="text-white/40 text-[10px]">Manual entry</div>
                </button>
              </div>

              <div className="mt-8 bg-[#0f172a] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-brand-orange" size={20} /> AI Business Insights
                  </h4>
                  <button 
                    onClick={generateInsights}
                    disabled={generatingInsight || quotes.length === 0}
                    className="flex items-center gap-2 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {generatingInsight ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    {aiInsight ? 'Regenerate' : 'Generate Insights'}
                  </button>
                </div>
                
                <div className="relative z-10">
                  {generatingInsight ? (
                    <div className="py-8 flex flex-col items-center justify-center text-brand-orange/60">
                      <Loader2 className="animate-spin mb-2" size={32} />
                      <p className="text-sm">Analyzing recent quote requests...</p>
                    </div>
                  ) : aiInsight ? (
                    <div className="bg-black/20 p-4 rounded-xl border border-brand-orange/10 text-white/80 text-sm leading-relaxed">
                      <Markdown>{aiInsight}</Markdown>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40 text-sm">
                      Click generate to get an AI-powered summary of your recent business activity.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                <h4 className="text-lg font-bold text-white mb-4">Recent Activity</h4>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-orange" /></div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-8 text-white/40">No activity yet.</div>
                ) : (
                  <div className="space-y-4">
                    {quotes.slice(0, 5).map(quote => (
                      <div key={quote.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                          <div className="font-medium text-white">{quote.name}</div>
                          <div className="text-xs text-white/50">{quote.email}</div>
                        </div>
                        <div className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${
                          quote.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                          quote.status === 'contacted' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {quote.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-white">Quote Requests</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                    <input 
                      type="text"
                      placeholder="Search quotes..."
                      value={quoteFilter.searchTerm}
                      onChange={(e) => setQuoteFilter({...quoteFilter, searchTerm: e.target.value})}
                      className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange w-64"
                    />
                  </div>
                  <select 
                    value={quoteFilter.status}
                    onChange={(e) => setQuoteFilter({...quoteFilter, status: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select 
                    value={quoteFilter.dateRange}
                    onChange={(e) => setQuoteFilter({...quoteFilter, dateRange: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              {selectedQuotes.size > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-brand-orange">{selectedQuotes.size} items selected</span>
                    <button 
                      onClick={() => setSelectedQuotes(new Set())}
                      className="text-xs text-white/40 hover:text-white underline"
                    >
                      Deselect all
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (!newStatus) return;
                        const promises = Array.from(selectedQuotes).map(id => 
                          updateDoc(doc(db, 'quotes', id), { status: newStatus })
                        );
                        await Promise.all(promises);
                        setSelectedQuotes(new Set());
                        alert(`Updated ${selectedQuotes.size} quotes to ${newStatus}`);
                      }}
                      className="bg-brand-orange text-brand-dark text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none"
                    >
                      <option value="">Bulk Status Update</option>
                      <option value="contacted">Mark Contacted</option>
                      <option value="completed">Mark Completed</option>
                    </select>
                    <button 
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${selectedQuotes.size} quotes?`)) {
                          const promises = Array.from(selectedQuotes).map(id => deleteDoc(doc(db, 'quotes', id)));
                          await Promise.all(promises);
                          setSelectedQuotes(new Set());
                        }
                      }}
                      className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      Delete Selected
                    </button>
                  </div>
                </motion.div>
              )}
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-brand-orange" size={48} />
                </div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-20 text-white/40">
                  <MessageCircle size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xl">No quote requests found yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {quotes
                    .filter(q => {
                      const matchesSearch = q.name.toLowerCase().includes(quoteFilter.searchTerm.toLowerCase()) || 
                                          q.email.toLowerCase().includes(quoteFilter.searchTerm.toLowerCase());
                      const matchesStatus = quoteFilter.status === 'all' || q.status === quoteFilter.status;
                      
                      let matchesDate = true;
                      if (quoteFilter.dateRange !== 'all') {
                        const now = new Date();
                        const qDate = q.createdAt?.toDate();
                        if (!qDate) matchesDate = false;
                        else {
                          if (quoteFilter.dateRange === 'today') {
                            matchesDate = qDate.toDateString() === now.toDateString();
                          } else if (quoteFilter.dateRange === 'week') {
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            matchesDate = qDate >= weekAgo;
                          } else if (quoteFilter.dateRange === 'month') {
                            matchesDate = qDate.getMonth() === now.getMonth() && qDate.getFullYear() === now.getFullYear();
                          }
                        }
                      }
                      
                      return matchesSearch && matchesStatus && matchesDate;
                    })
                    .sort((a, b) => {
                      if (a.status === 'pending' && b.status !== 'pending') return -1;
                      if (a.status !== 'pending' && b.status === 'pending') return 1;
                      return 0;
                    })
                    .map((quote) => (
                    <div key={quote.id} className={`bg-[#0f172a] rounded-2xl p-6 border transition-all ${selectedQuotes.has(quote.id) ? 'border-brand-orange shadow-lg shadow-brand-orange/10' : 'border-white/5 shadow-xl'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <input 
                            type="checkbox"
                            checked={selectedQuotes.has(quote.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedQuotes);
                              if (e.target.checked) newSet.add(quote.id);
                              else newSet.delete(quote.id);
                              setSelectedQuotes(newSet);
                            }}
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-white">{quote.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              quote.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                              quote.status === 'contacted' ? 'bg-blue-500/20 text-blue-500' :
                              quote.status === 'revision_requested' ? 'bg-red-500/20 text-red-500' :
                              quote.status === 'ordered' ? 'bg-purple-500/20 text-purple-500' :
                              'bg-emerald-500/20 text-emerald-500'
                            }`}>
                              {quote.status?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-white/60 text-sm">{quote.email} • {quote.phone || 'No Phone'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setGeneratingQuoteFor(quote.id);
                            if (quote.formalQuote) {
                              setQuoteItems(quote.formalQuote.items);
                            } else {
                              setQuoteItems([{ product: '', size: '', qty: 1, rate: 0 }]);
                            }
                          }} className="text-white/60 hover:text-brand-orange" title={quote.formalQuote ? "Edit Formal Quote" : "Generate Formal Quote"}>
                            <FileText size={16} />
                          </button>
                          <button onClick={() => convertToOrder(quote)} className="text-white/60 hover:text-brand-orange" title="Convert to Order">
                            <Package size={16} />
                          </button>
                          <button onClick={() => downloadQuotePDF(quote)} className="text-white/60 hover:text-brand-orange" title="Download PDF">
                            <Download size={16} />
                          </button>
                          <button onClick={() => deleteQuote(quote.id)} className="text-white/60 hover:text-red-500" title="Delete Quote">
                            <Trash2 size={16} />
                          </button>
                          <select 
                            value={quote.status}
                            onChange={(e) => updateStatus(quote.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="revision_requested">Revision Requested</option>
                            <option value="ordered">Ordered</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-black/20 rounded-xl text-white/80 text-sm italic">
                        "{quote.message}"
                      </div>

                      {generatingQuoteFor === quote.id && (
                        <div className="mt-6 bg-[#020617] p-6 rounded-2xl border border-brand-orange/30 shadow-2xl">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                              <FileText className="text-brand-orange" size={20} /> {quote.formalQuote ? 'Edit' : 'Generate'} Formal Quote
                            </h4>
                            <button onClick={() => setGeneratingQuoteFor(null)} className="text-white/40 hover:text-white">
                              <X size={20} />
                            </button>
                          </div>

                          {/* Customer Info Editor */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Customer Name</label>
                              <input 
                                value={quote.name}
                                onChange={(e) => updateDoc(doc(db, 'quotes', quote.id), { name: e.target.value })}
                                className="w-full bg-transparent border-b border-white/10 text-sm text-white focus:outline-none focus:border-brand-orange py-1"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email</label>
                              <input 
                                value={quote.email}
                                onChange={(e) => updateDoc(doc(db, 'quotes', quote.id), { email: e.target.value })}
                                className="w-full bg-transparent border-b border-white/10 text-sm text-white focus:outline-none focus:border-brand-orange py-1"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Phone</label>
                              <input 
                                value={quote.phone || ''}
                                onChange={(e) => updateDoc(doc(db, 'quotes', quote.id), { phone: e.target.value })}
                                className="w-full bg-transparent border-b border-white/10 text-sm text-white focus:outline-none focus:border-brand-orange py-1"
                              />
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                          <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-left text-sm text-white/80">
                                <thead className="text-[10px] uppercase text-white/40 border-b border-white/5">
                                  <tr>
                                    <th className="px-4 py-3 font-bold">S.No</th>
                                    <th className="px-4 py-3 font-bold">Product</th>
                                    <th className="px-4 py-3 font-bold">Size</th>
                                    <th className="px-4 py-3 font-bold">Qty</th>
                                    <th className="px-4 py-3 font-bold">Rate</th>
                                    <th className="px-4 py-3 font-bold">Amount</th>
                                    <th className="px-4 py-3 font-bold"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {quoteItems.map((item, idx) => (
                                    <tr key={idx} className="group">
                                      <td className="px-4 py-3 text-white/40">{idx + 1}</td>
                                      <td className="px-4 py-3">
                                        <input 
                                          value={item.product}
                                          onChange={(e) => {
                                            const newItems = [...quoteItems];
                                            newItems[idx].product = e.target.value;
                                            setQuoteItems(newItems);
                                          }}
                                          placeholder="Product Name"
                                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-orange w-full"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input 
                                          value={item.size}
                                          onChange={(e) => {
                                            const newItems = [...quoteItems];
                                            newItems[idx].size = e.target.value;
                                            setQuoteItems(newItems);
                                          }}
                                          placeholder="Size"
                                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-orange w-24"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input 
                                          type="number"
                                          value={item.qty}
                                          onChange={(e) => {
                                            const newItems = [...quoteItems];
                                            newItems[idx].qty = Number(e.target.value);
                                            setQuoteItems(newItems);
                                          }}
                                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-orange w-16"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input 
                                          type="number"
                                          value={item.rate}
                                          onChange={(e) => {
                                            const newItems = [...quoteItems];
                                            newItems[idx].rate = Number(e.target.value);
                                            setQuoteItems(newItems);
                                          }}
                                          className={`bg-white/5 border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-orange w-20 ${item.rate === 0 ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                                        />
                                      </td>
                                      <td className="px-4 py-3 font-bold text-brand-orange">
                                        ₹{(item.qty * item.rate).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button 
                                          onClick={() => {
                                            const newItems = quoteItems.filter((_, i) => i !== idx);
                                            setQuoteItems(newItems);
                                          }}
                                          className="text-white/20 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card Layout */}
                            <div className="md:hidden divide-y divide-white/5">
                              {quoteItems.map((item, idx) => (
                                <div key={idx} className="p-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Item #{idx + 1}</span>
                                    <button 
                                      onClick={() => {
                                        const newItems = quoteItems.filter((_, i) => i !== idx);
                                        setQuoteItems(newItems);
                                      }}
                                      className="text-white/20 hover:text-red-500"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    <input 
                                      value={item.product}
                                      onChange={(e) => {
                                        const newItems = [...quoteItems];
                                        newItems[idx].product = e.target.value;
                                        setQuoteItems(newItems);
                                      }}
                                      placeholder="Product Name"
                                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input 
                                        value={item.size}
                                        onChange={(e) => {
                                          const newItems = [...quoteItems];
                                          newItems[idx].size = e.target.value;
                                          setQuoteItems(newItems);
                                        }}
                                        placeholder="Size"
                                        className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-orange"
                                      />
                                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded px-3 py-2">
                                        <span className="text-[10px] text-white/40 uppercase font-bold">Qty:</span>
                                        <input 
                                          type="number"
                                          value={item.qty}
                                          onChange={(e) => {
                                            const newItems = [...quoteItems];
                                            newItems[idx].qty = Number(e.target.value);
                                            setQuoteItems(newItems);
                                          }}
                                          className="bg-transparent text-sm text-white focus:outline-none w-full"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className={`flex items-center gap-2 bg-white/5 border rounded px-3 py-2 ${item.rate === 0 ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}>
                                        <span className="text-[10px] text-white/40 uppercase font-bold">Rate:</span>
                                        <input 
                                          type="number"
                                          value={item.rate}
                                          onChange={(e) => {
                                            const newItems = [...quoteItems];
                                            newItems[idx].rate = Number(e.target.value);
                                            setQuoteItems(newItems);
                                          }}
                                          className="bg-transparent text-sm text-white focus:outline-none w-full"
                                        />
                                      </div>
                                      <div className="flex items-center justify-between bg-brand-orange/10 border border-brand-orange/20 rounded px-3 py-2">
                                        <span className="text-[10px] text-brand-orange/60 uppercase font-bold">Total:</span>
                                        <span className="text-sm font-bold text-brand-orange">₹{(item.qty * item.rate).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          </div>

                          <button 
                            onClick={() => setQuoteItems([...quoteItems, { product: '', size: '', qty: 1, rate: 0 }])}
                            className="mt-4 flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                          >
                            <Plus size={14} /> Add Line Item
                          </button>

                          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-end gap-2">
                            <div className="flex justify-between w-48 text-sm">
                              <span className="text-white/40">Subtotal</span>
                              <span className="text-white font-bold">₹{quoteItems.reduce((acc, item) => acc + (item.qty * item.rate), 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-48 text-sm">
                              <span className="text-white/40">GST (18%)</span>
                              <span className="text-white font-bold">₹{(quoteItems.reduce((acc, item) => acc + (item.qty * item.rate), 0) * 0.18).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between w-48 text-lg mt-2 pt-2 border-t border-white/10">
                              <span className="text-white font-bold">Total</span>
                              <span className="text-brand-orange font-black">₹{(quoteItems.reduce((acc, item) => acc + (item.qty * item.rate), 0) * 1.18).toLocaleString()}</span>
                            </div>

                            <div className="mt-6 flex gap-3">
                              <button 
                                onClick={() => setGeneratingQuoteFor(null)}
                                className="px-6 py-2 rounded-xl text-sm font-bold text-white/40 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={async () => {
                                  const subtotal = quoteItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
                                  const gst = subtotal * 0.18;
                                  const total = subtotal + gst;
                                  
                                  const formalQuote = {
                                    items: quoteItems,
                                    subtotal,
                                    gst,
                                    total,
                                    generatedAt: new Date()
                                  };
                                  
                                  await updateDoc(doc(db, 'quotes', quote.id), { 
                                    formalQuote,
                                    status: 'completed'
                                  });
                                  
                                  downloadQuotePDF({ ...quote, formalQuote });
                                  await sendQuote(quote, formalQuote);
                                  setGeneratingQuoteFor(null);
                                }}
                                disabled={sendingQuote}
                                className="bg-brand-orange text-brand-dark px-8 py-2 rounded-xl text-sm font-bold hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/20 flex items-center gap-2 disabled:opacity-50"
                              >
                                {sendingQuote ? <Loader2 className="animate-spin" size={16} /> : (quote.formalQuote ? 'Update' : 'Generate')} {' & '} Send
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {replyingTo === quote.id ? (
                        <div className="mt-4 bg-[#020617] p-4 rounded-xl border border-brand-orange/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-brand-orange flex items-center gap-1"><Sparkles size={12}/> AI Drafted Reply</span>
                            <div className="flex gap-2">
                              <button onClick={() => setReplyingTo(null)} className="text-xs text-white/40 hover:text-white">Cancel</button>
                              <button onClick={async () => {
                                try {
                                  const response = await fetch('/api/send-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      to: quote.email,
                                      subject: 'Regarding your quote request',
                                      body: aiReply
                                    })
                                  });
                                  if (response.ok) {
                                    setReplyingTo(null);
                                    alert('Email sent successfully!');
                                  } else {
                                    alert('Failed to send email.');
                                  }
                                } catch (error) {
                                  console.error('Email Error:', error);
                                  alert('Failed to send email.');
                                }
                              }} className="text-xs bg-brand-orange text-brand-dark px-3 py-1 rounded font-bold flex items-center gap-1">
                                <Send size={12} /> Send Email
                              </button>
                            </div>
                          </div>
                          <textarea 
                            value={aiReply}
                            onChange={(e) => setAiReply(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-orange min-h-[100px]"
                          />
                        </div>
                      ) : (
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => generateReply(quote)}
                            disabled={generatingReply}
                            className="flex items-center gap-2 text-xs font-bold text-brand-orange hover:text-orange-400 transition-colors bg-brand-orange/10 px-3 py-1.5 rounded-lg"
                          >
                            {generatingReply && replyingTo === quote.id ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                            Draft AI Reply
                          </button>
                        </div>
                      )}

                      <div className="mt-4 text-[10px] text-white/30 uppercase tracking-widest">
                        Received: {quote.createdAt?.toDate().toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Products Management</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsAddingProduct(!isAddingProduct)}
                    className="bg-brand-orange text-brand-dark px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-400 transition-colors flex items-center gap-2"
                  >
                    {isAddingProduct ? <X size={16} /> : <Plus size={16} />}
                    {isAddingProduct ? 'Cancel' : 'Add Product'}
                  </button>
                </div>
              </div>

              {isAddingProduct && (
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-brand-orange/30 mb-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  <h4 className="text-lg font-bold text-white mb-4">Add New Product</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative z-10">
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1 block">Product Name</label>
                      <input 
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                        placeholder="e.g. CPVC Pipe 1 inch"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1 block">Category</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-orange appearance-none"
                      >
                        <option value="">Select Category</option>
                        <optgroup label="CPVC Pipes & Fittings">
                          <option value="CPVC FITTING">CPVC FITTING</option>
                          <option value="VALVE">VALVE</option>
                          <option value="BRASS FITTING">BRASS FITTING</option>
                          <option value="FLANGE">FLANGE</option>
                          <option value="ACCESSORY">ACCESSORY</option>
                        </optgroup>
                        <optgroup label="Anjul Sanitaryware">
                          <option value="Apex Collection">Apex Collection</option>
                          <option value="Superb Plus Collection">Superb Plus Collection</option>
                          <option value="Superb Collection">Superb Collection</option>
                          <option value="Prince Collection">Prince Collection</option>
                          <option value="Prince Plus Collection">Prince Plus Collection</option>
                          <option value="Prince Nexa Collection">Prince Nexa Collection</option>
                          <option value="Useful & Beautiful Collection">Useful & Beautiful Collection</option>
                          <option value="Seat Cover Collection">Seat Cover Collection</option>
                          <option value="Mirror Cabinet">Mirror Cabinet</option>
                          <option value="Soap Dispenser">Soap Dispenser</option>
                          <option value="Connection Pipe">Connection Pipe</option>
                          <option value="Jet Spray">Jet Spray</option>
                          <option value="Kitchen Sinks & Waste Coupling">Kitchen Sinks & Waste Coupling</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1 block">Price ($)</label>
                      <input 
                        type="number" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/60 mb-1 block">Image URL (Optional)</label>
                      <input 
                        type="text" 
                        value={newProduct.imageUrl}
                        onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-white/60 block">Description</label>
                        <button 
                          type="button"
                          onClick={generateProductDescription}
                          disabled={generatingDesc || !newProduct.name || !newProduct.category}
                          className="text-[10px] font-bold text-brand-orange flex items-center gap-1 hover:text-orange-400 disabled:opacity-50"
                        >
                          {generatingDesc ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                          Auto-Generate with AI
                        </button>
                      </div>
                      <textarea 
                        value={newProduct.description}
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-orange min-h-[80px]"
                        placeholder="Product description..."
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleAddProduct}
                    disabled={!newProduct.name || !newProduct.category || !newProduct.price}
                    className="w-full bg-brand-orange text-brand-dark font-bold py-2 rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-colors relative z-10"
                  >
                    Save Product
                  </button>
                </div>
              )}

              {loadingProducts ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-brand-orange" size={48} />
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-grow flex items-center gap-4 bg-[#0f172a] p-2 rounded-xl border border-white/5">
                      <Search className="text-white/40 ml-2" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={productFilter.searchTerm}
                        onChange={(e) => setProductFilter({...productFilter, searchTerm: e.target.value})}
                        className="bg-transparent border-none text-white focus:outline-none w-full"
                      />
                    </div>
                    <select 
                      value={productFilter.category}
                      onChange={(e) => setProductFilter({...productFilter, category: e.target.value})}
                      className="bg-[#0f172a] border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-orange"
                    >
                      <option value="all">All Categories</option>
                      <option value="CPVC FITTING">CPVC FITTING</option>
                      <option value="VALVE">VALVE</option>
                      <option value="BRASS FITTING">BRASS FITTING</option>
                      <option value="FLANGE">FLANGE</option>
                      <option value="ACCESSORY">ACCESSORY</option>
                    </select>
                    {selectedProducts.size > 0 && (
                      <button 
                        onClick={handleBulkDeleteProducts}
                        className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={18} /> Delete Selected ({selectedProducts.size})
                      </button>
                    )}
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-20 text-white/40 bg-[#0f172a] rounded-2xl border border-white/5">
                      <Package size={64} className="mx-auto mb-4 opacity-20" />
                      <p className="text-xl">No products found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products
                        .filter(p => 
                          (productFilter.category === 'all' || p.category === productFilter.category) &&
                          (p.name.toLowerCase().includes(productFilter.searchTerm.toLowerCase()) || 
                           p.description?.toLowerCase().includes(productFilter.searchTerm.toLowerCase()))
                        )
                        .map(product => (
                        <div key={product.id} className={`bg-[#0f172a] p-4 rounded-xl border flex items-start gap-4 transition-all ${selectedProducts.has(product.id) ? 'border-brand-orange shadow-lg shadow-brand-orange/10' : 'border-white/5'}`}>
                          <input 
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedProducts);
                              if (e.target.checked) newSet.add(product.id);
                              else newSet.delete(product.id);
                              setSelectedProducts(newSet);
                            }}
                            className="mt-2 w-5 h-5 rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                          />
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-lg bg-white/5" />
                          ) : (
                            <div className="w-20 h-20 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                              <Package className="text-white/20" size={24} />
                            </div>
                          )}
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-white">{product.name}</h4>
                            <span className="text-[10px] uppercase tracking-wider text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full">
                              {product.category}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-white/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="text-white/60 text-xs mt-2 line-clamp-2">{product.description}</div>
                        <div className="text-white font-bold mt-2">{product.price > 0 ? `₹${product.price}` : 'Price on Request'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'users' && <StaffRoles />}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6">Customer Directory</h3>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-brand-orange" size={48} />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 text-white/40 bg-[#0f172a] rounded-2xl border border-white/5">
                  <Users size={64} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xl">No customers found.</p>
                </div>
              ) : (
                <div className="bg-[#0f172a] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="text-white">Users count: {users.length}</div>
                  <table className="w-full text-left text-sm text-white/80">
                    <thead className="bg-white/5 text-xs uppercase text-white/40">
                      <tr>
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium">Email</th>
                        <th className="px-6 py-4 font-medium">Total Orders</th>
                        <th className="px-6 py-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map(user => {
                        console.log("User:", user);
                        const userOrders = orders.filter(o => o.userId === user.id);
                        return (
                          <tr key={user.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold text-white">{user.name || 'Unknown'}</td>
                            <td className="px-6 py-4">{user.email || 'No Email'}</td>
                            <td className="px-6 py-4">{userOrders.length}</td>
                            <td className="px-6 py-4 text-white/40">
                              {user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Generic Tabs for 100+ Features Expansion */}
          {/* Advanced Analytics Tab */}
          {activeTab === 'advanced_analytics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Advanced Analytics</h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-white/60 hover:bg-white/10">Last 7 Days</button>
                  <button className="px-4 py-2 bg-brand-orange text-brand-dark rounded-lg text-xs font-bold">Last 30 Days</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                  <h4 className="text-lg font-bold text-white mb-6">Revenue Growth</h4>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Week 1', revenue: 45000 },
                        { name: 'Week 2', revenue: 52000 },
                        { name: 'Week 3', revenue: 48000 },
                        { name: 'Week 4', revenue: 61000 },
                        { name: 'Week 5', revenue: 55000 },
                        { name: 'Week 6', revenue: 67000 },
                      ]}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#f97316' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Traffic Sources */}
                <div className="bg-[#0f172a] p-6 rounded-2xl border border-white/5">
                  <h4 className="text-lg font-bold text-white mb-6">Traffic Sources</h4>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Direct', value: 400 },
                            { name: 'Social', value: 300 },
                            { name: 'Organic', value: 300 },
                            { name: 'Referral', value: 200 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[ '#f97316', '#fb923c', '#fdba74', '#fed7aa' ].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {[
                        { label: 'Direct', color: '#f97316', percent: '40%' },
                        { label: 'Social', color: '#fb923c', percent: '25%' },
                        { label: 'Organic', color: '#fdba74', percent: '25%' },
                        { label: 'Referral', color: '#fed7aa', percent: '10%' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs text-white/60">{item.label}</span>
                          <span className="text-xs font-bold text-white ml-auto">{item.percent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales_predictor' && <SalesPredictor />}

          {/* Multi-Channel CRM Tab */}
          {activeTab === 'crm' && <CRM />}

          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'live_view' && <LiveVisitorTracking />}

          {activeTab === 'orders' && <OrderDashboard />}

          {activeTab === 'invoices' && <InvoiceManager />}

          {activeTab === 'categories' && <CategoryManager />}

          {activeTab === 'inventory' && <InventoryManager onManageSuppliers={() => setActiveTab('suppliers')} />}

          {activeTab === 'suppliers' && <SupplierManager />}

          {activeTab === 'pages' && <PageBuilder />}

          {activeTab === 'blog' && <BlogManager />}

          {activeTab === 'testimonials' && <TestimonialManager />}

          {activeTab === 'media' && <MediaLibrary />}

          {activeTab === 'campaigns' && <CampaignManager />}

          {activeTab === 'seo' && <SEOManager />}

          {activeTab === 'discounts' && <DiscountManager />}

          {activeTab === 'reviews' && <ReviewManager />}

          {activeTab === 'reports' && <ReportManager />}

          {activeTab === 'settings' && <SettingsManager />}

          {activeTab === 'integrations' && <IntegrationManager />}

          {activeTab === 'audit_logs' && <AuditLogs />}

          {activeTab === 'logs' && <AuditLogs />}

          {activeTab === 'feature_store' && <FeatureMarketplace />}

        </div>
      </div>
    </div>
  );
};

const Navbar = ({ onOpenQuote, onOpenAdmin, onViewChange, quoteItemCount = 0 }: { onOpenQuote: () => void; onOpenAdmin: () => void; onViewChange: (view: any, collection?: string) => void; quoteItemCount?: number }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.email === "anshsinghal1500@gmail.com";

  const handleLogout = async () => {
    await logout();
    onViewChange('HOME');
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const productCategories = [
    { name: "CPVC Pipes & Fittings", icon: <Pipette size={18} />, desc: "Hot & cold water plumbing systems" },
    { name: "UPVC Pipes & Fittings", icon: <Droplets size={18} />, desc: "Lead-free cold water systems" },
    { name: "SWR Pipes & Fittings", icon: <Waves size={18} />, desc: "Soil, waste & rain water drainage" },
    { name: "Sanitaryware", icon: <Bath size={18} />, desc: "Premium bathroom fittings & fixtures" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top Strip (Micro-Header) */}
      <div className="bg-brand-orange text-brand-dark px-4 py-1.5 text-[11px] md:text-xs font-bold w-full hidden sm:block">
        <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-2 md:gap-4 tracking-wide">
          <span className="flex items-center gap-1.5"><Truck size={14} /> Free Delivery on Orders above ₹50,000</span>
          <span className="text-brand-dark/50">|</span>
          <span className="flex items-center gap-1.5"><PhoneCall size={14} /> Wholesale Inquiry: +91-9720356263</span>
        </div>
      </div>
      
      {/* Main Navbar */}
      <div className="bg-[#0f172a]/95 backdrop-blur-md text-white border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-1 text-xl md:text-2xl font-bold shrink-0 cursor-pointer"
            onClick={() => onViewChange('HOME')}
          >
            <span className="text-white">Quality</span>
            <span className="text-brand-orange">Fittings</span>
          </div>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-white/90">
          <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('HOME'); }} className="hover:text-brand-orange transition-colors">Home</a>
          {user && <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('USER_DASHBOARD'); }} className="hover:text-brand-orange transition-colors">Dashboard</a>}
          
          {/* Products Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${isProductsOpen ? 'text-brand-orange' : 'hover:text-brand-orange'}`}
            >
              Products <ChevronDown size={16} className={`transition-transform duration-300 ${isProductsOpen ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence>
              {isProductsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[-1]" 
                    onClick={() => setIsProductsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-4 w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-4 grid grid-cols-2 gap-2"
                  >
                    {productCategories.map((category, idx) => (
                      <a 
                        key={idx}
                        href="#" 
                        className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsProductsOpen(false);
                          if (category.name === "CPVC Pipes & Fittings") {
                            onViewChange('CPVC_PIPES');
                          } else if (category.name === "Sanitaryware") {
                            onViewChange('ANJUL_SANITARYWARE');
                          } else if (category.name === "SWR Pipes & Fittings") {
                            onViewChange('ASTRAL_PRODUCTS', 'SWR Pipe Fittings');
                          } else if (category.name === "UPVC Pipes & Fittings") {
                            onViewChange('ASTRAL_PRODUCTS', 'UPVC Pipes & Fittings');
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-colors shrink-0">
                          {category.icon}
                        </div>
                        <div>
                          <div className="text-slate-900 font-bold text-[14px] mb-0.5">{category.name}</div>
                          <div className="text-slate-400 text-[12px] leading-tight">{category.desc}</div>
                        </div>
                      </a>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Brands Dropdown */}
          <div className="relative group">
            <div 
              className={`flex items-center gap-1 cursor-pointer transition-colors hover:text-brand-orange`}
            >
              Brands <ChevronDown size={14} className={`transition-transform duration-300 group-hover:rotate-180`} />
            </div>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden py-2">
                {['Supreme', 'Astral', 'Finolex', 'Tirupati'].map((brand, idx) => (
                  <a 
                    key={idx}
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      onViewChange('CPVC_PIPES');
                      setTimeout(() => {
                        // Assuming global search/filter handles brand selection
                        window.dispatchEvent(new CustomEvent('nav-brand-select', { detail: brand }));
                      }, 100);
                    }}
                    className="block px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-orange/10 hover:text-brand-orange transition-colors"
                  >
                    {brand}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('WHY_US'); }} className="hover:text-brand-orange transition-colors">Why Us</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('CONTACT_US'); }} className="hover:text-brand-orange transition-colors">Contact</a>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <button 
            onClick={onOpenQuote}
            className="relative bg-brand-orange text-brand-dark px-6 py-2.5 rounded-lg font-bold text-[15px] hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
          >
            Get Quote
            {quoteItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-pulse">
                {quoteItemCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-5 text-white/80">
            <Moon size={20} className="cursor-pointer hover:text-white transition-colors" />
            <div className="relative cursor-pointer hover:text-white transition-colors" onClick={onOpenQuote}>
              <ShoppingCart size={20} />
              {quoteItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md">
                  {quoteItemCount}
                </span>
              )}
            </div>
            
            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <div 
                    onClick={onOpenAdmin}
                    className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors text-brand-orange"
                  >
                    <ShieldCheck size={20} />
                    <span className="text-[15px] font-medium">Admin</span>
                  </div>
                )}
                <div className="relative group">
                  <div className="w-9 h-9 bg-brand-orange rounded-full flex items-center justify-center text-brand-dark font-bold text-sm border-2 border-brand-orange/30 ring-2 ring-brand-orange/10 overflow-hidden cursor-pointer">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                    ) : (
                      user.displayName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1e293b] rounded-xl shadow-2xl border border-white/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => onViewChange('LOGIN')}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                <UserIcon size={18} /> Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="lg:hidden flex items-center gap-3">
          <Moon size={20} className="text-white/70" />
          <div className="relative text-white/70" onClick={onOpenQuote}>
            <ShoppingCart size={20} />
            {quoteItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-md">
                {quoteItemCount}
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-white/80 hover:text-white"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-[#0f172a] border-t border-white/5 shadow-2xl"
          >
            <div className="px-4 py-3 flex flex-col gap-2">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); onViewChange('HOME'); }} className="text-xs font-semibold text-white/90 py-1 border-b border-white/5">Home</a>
              {user && (
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); onViewChange('USER_DASHBOARD'); }} 
                  className="text-xs font-semibold text-brand-orange py-1 border-b border-white/5 flex items-center gap-2"
                >
                  <LayoutDashboard size={14} /> Dashboard
                </a>
              )}
              
              <div className="border-b border-white/5">
                <div 
                  onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  className="flex items-center justify-between text-xs font-semibold text-white/90 py-2 cursor-pointer"
                >
                  Products <ChevronDown size={12} className={`transition-transform ${isMobileProductsOpen ? 'rotate-180' : ''}`} />
                </div>
                <AnimatePresence>
                  {isMobileProductsOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden flex flex-col gap-2 pb-3 pl-4"
                    >
                      {productCategories.map((category, idx) => (
                        <a 
                          key={idx} 
                          href="#" 
                          className="flex items-center gap-3 text-[11px] text-white/60 hover:text-brand-orange transition-colors py-2"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsMenuOpen(false);
                            if (category.name === "CPVC Pipes & Fittings") {
                              onViewChange('CPVC_PIPES');
                            } else if (category.name === "Sanitaryware") {
                              onViewChange('ANJUL_SANITARYWARE');
                            } else if (category.name === "SWR Pipes & Fittings") {
                              onViewChange('ASTRAL_PRODUCTS', 'SWR Pipe Fittings');
                            } else if (category.name === "UPVC Pipes & Fittings") {
                              onViewChange('ASTRAL_PRODUCTS', 'UPVC Pipes & Fittings');
                            }
                          }}
                        >
                          <span className="text-white/30">{category.icon}</span>
                          {category.name}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); onViewChange('WHY_US'); }} className="text-xs font-semibold text-white/90 py-1 border-b border-white/5">Why Us</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); onViewChange('CONTACT_US'); }} className="text-xs font-semibold text-white/90 py-1 border-b border-white/5">Contact</a>
              
              <div className="flex flex-col gap-2 mt-1">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenQuote();
                  }}
                  className="w-full bg-brand-orange text-brand-dark py-2 rounded-lg font-bold text-xs shadow-lg shadow-orange-500/20"
                >
                  Get Quote
                </button>
                
                <div className="grid grid-cols-3 gap-0.5 p-2 bg-[#1e293b]/50 rounded-lg border border-white/5">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="p-0.5">
                      <Moon size={16} className="text-white/80" />
                    </div>
                    <span className="text-[9px] font-medium text-white/50 leading-none">Dark</span>
                  </div>
                  <div 
                    onClick={() => {
                      if (isAdmin) {
                        setIsMenuOpen(false);
                        onOpenAdmin();
                      }
                    }}
                    className={`flex flex-col items-center gap-0.5 ${isAdmin ? 'text-brand-orange' : 'opacity-50'}`}
                  >
                    <div className="p-0.5">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-[9px] font-medium leading-none">Admin</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    {user ? (
                      <div className="flex flex-col items-center gap-0.5 cursor-pointer" onClick={handleLogout}>
                        <div className="w-6 h-6 bg-brand-orange rounded-full flex items-center justify-center text-brand-dark font-bold text-[10px] overflow-hidden">
                          {user.photoURL ? <img src={user.photoURL} alt="" /> : user.displayName?.charAt(0)}
                        </div>
                        <span className="text-[9px] font-medium text-white/50 leading-none">Logout</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 cursor-pointer" onClick={handleLogin}>
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/70 font-bold text-[10px]">
                          <UserIcon size={12} />
                        </div>
                        <span className="text-[9px] font-medium text-white/50 leading-none">Login</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </nav>
  );
};

const SizeSelectionModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: CPVCProduct | null; 
  onConfirm: (size: string) => void 
}) => {
  if (!isOpen || !product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#1e293b] rounded-3xl p-6 shadow-2xl overflow-hidden border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Select Size</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {product.tableData ? (
              product.tableData.map((row, idx) => (
                <button
                  key={idx}
                  onClick={() => onConfirm(`${row.sizeInch} (${row.sizeCm}cm)`)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-white/10 hover:border-brand-orange hover:bg-brand-orange/10 transition-colors flex items-center justify-between group"
                >
                  <span className="font-bold text-white group-hover:text-brand-orange">{row.sizeInch}</span>
                  <span className="text-sm text-white/60">{row.sizeCm} cm</span>
                </button>
              ))
            ) : (
              <button
                onClick={() => onConfirm('Standard Size')}
                className="w-full text-left px-4 py-3 rounded-xl border border-white/10 hover:border-brand-orange hover:bg-brand-orange/10 transition-colors flex items-center justify-between group"
              >
                <span className="font-bold text-white group-hover:text-brand-orange">Standard Size</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const QuoteModal = ({ isOpen, onClose, initialMessage = '', onSuccess }: { isOpen: boolean; onClose: () => void; initialMessage?: string; onSuccess?: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: initialMessage,
    category: 'CPVC Pipes & Fittings',
    urgency: 'Normal',
    quantity: 'Medium',
    preferredContact: 'Email'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, message: initialMessage }));
    }
  }, [isOpen, initialMessage]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'quotes'), {
        ...formData,
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: user?.uid || null
      });
      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setFormData({ 
          name: '', 
          email: '', 
          phone: '', 
          message: '',
          category: 'CPVC Pipes & Fittings',
          urgency: 'Normal',
          quantity: 'Medium',
          preferredContact: 'Email'
        });
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quotes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#1e293b] rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden"
          >
            {isSuccess ? (
              <div className="py-12 flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl font-bold text-white">Quote Requested!</h2>
                <p className="text-white/60">We'll get back to you shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Request a Quote</h2>
                    <p className="text-white/40 text-xs mt-1 uppercase tracking-widest font-bold">Premium Inquiry Service</p>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Full Name</label>
                      <input 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Email Address</label>
                      <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Phone Number</label>
                      <input 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Product Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors appearance-none"
                      >
                        <option value="CPVC Pipes & Fittings" className="bg-[#1e293b]">CPVC Pipes & Fittings</option>
                        <option value="UPVC Pipes & Fittings" className="bg-[#1e293b]">UPVC Pipes & Fittings</option>
                        <option value="SWR Pipes & Fittings" className="bg-[#1e293b]">SWR Pipes & Fittings</option>
                        <option value="Sanitaryware" className="bg-[#1e293b]">Sanitaryware</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Urgency</label>
                      <select 
                        value={formData.urgency}
                        onChange={e => setFormData({...formData, urgency: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors appearance-none"
                      >
                        <option value="Normal" className="bg-[#1e293b]">Normal</option>
                        <option value="Urgent" className="bg-[#1e293b]">Urgent</option>
                        <option value="Emergency" className="bg-[#1e293b]">Emergency</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Quantity</label>
                      <select 
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors appearance-none"
                      >
                        <option value="Small" className="bg-[#1e293b]">Small (Retail)</option>
                        <option value="Medium" className="bg-[#1e293b]">Medium (Project)</option>
                        <option value="Bulk" className="bg-[#1e293b]">Bulk (Wholesale)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Contact Via</label>
                      <select 
                        value={formData.preferredContact}
                        onChange={e => setFormData({...formData, preferredContact: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors appearance-none"
                      >
                        <option value="Email" className="bg-[#1e293b]">Email</option>
                        <option value="Phone" className="bg-[#1e293b]">Phone</option>
                        <option value="WhatsApp" className="bg-[#1e293b]">WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Message / Requirements</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-orange transition-colors resize-none"
                      placeholder="Tell us about your project requirements..."
                    />
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-brand-orange text-brand-dark py-3.5 rounded-xl font-bold text-base hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Submit Request
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Hero = ({ onOpenQuote, onSearch, onExplore }: { onOpenQuote: () => void, onSearch: (query: string) => void, onExplore: () => void }) => {
  const [localSearch, setLocalSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const POPULAR_SEARCHES = [
    "CPVC Pipe SDR-11",
    "CPVC Pipe SDR-13.5",
    "Coupler",
    "Elbow 90°",
    "Elbow 45°",
    "Tee",
    "Brass Tee",
    "Brass Elbow",
    "Concealed Valve",
    "Ball Valve",
    "Reducer",
    "Reducing Tee",
    "End Cap",
    "Union",
    "Cross Tee",
    "Step Over Bend",
    "Tank Nipple",
    "Flange",
    "Solvent Cement",
    "Supreme CPVC",
    "Astral PRO",
    "Tirupati SDR 11"
  ];

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      setShowDropdown(false);
      onSearch(localSearch.trim());
    }
  };

  const filteredSuggestions = POPULAR_SEARCHES.filter(s => s.toLowerCase().includes(localSearch.toLowerCase()));

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-40 pb-12 overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop" 
          alt="Bathroom Fittings"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-dark/85 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-brand-orange text-xs md:text-sm font-medium mb-6 md:mb-8"
        >
          Trusted by 500+ Projects
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-7xl font-bold text-white leading-tight mb-4 md:mb-6"
        >
          Quality Fittings & <br />
          <span className="text-brand-orange">Sanitaryware</span> for Your <br />
          Dream Project
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-xl text-white/70 max-w-2xl mx-auto mb-8 md:mb-12 px-2"
        >
          From foundation to finish, we provide the finest CPVC, UPVC, and sanitaryware to bring your vision to life.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-xl mx-auto mb-6 md:mb-8"
        >
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onKeyDown={handleSearchKeyPress}
              className="w-full bg-white text-slate-900 px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm md:text-base pr-12"
            />
            <button 
              onClick={() => {
                if(localSearch.trim()) {
                  setShowDropdown(false);
                  onSearch(localSearch.trim());
                }
              }}
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-orange text-brand-dark rounded-lg hover:bg-orange-400 transition-colors"
            >
              <Search size={18} />
            </button>
            
            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showDropdown && localSearch.trim().length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 text-left border border-slate-100 max-h-60 overflow-y-auto"
                >
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setLocalSearch(suggestion);
                          setShowDropdown(false);
                          setTimeout(() => onSearch(suggestion), 50);
                        }}
                        className="w-full text-left px-6 py-3 text-slate-700 hover:bg-slate-50 hover:text-brand-orange transition-colors border-b border-slate-100 last:border-0 flex items-center gap-3"
                      >
                        <Search size={14} className="text-slate-400" />
                        {suggestion}
                      </button>
                    ))
                  ) : (
                    <button 
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowDropdown(false);
                        onSearch(localSearch.trim());
                      }}
                      className="w-full text-left px-6 py-3 text-slate-700 hover:bg-slate-50 hover:text-brand-orange transition-colors flex items-center gap-3"
                    >
                      <Search size={14} className="text-slate-400" />
                      Search for "{localSearch}"
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4"
        >
          <button 
            onClick={onExplore}
            className="w-full sm:w-auto bg-brand-orange text-brand-dark px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-400 transition-all group text-sm md:text-base"
          >
            Explore Products <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={onOpenQuote}
            className="w-full sm:w-auto border-2 border-white/30 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold hover:bg-white/10 transition-all text-sm md:text-base"
          >
            Get Quote
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const PriceBanner = () => {
  const message = "Note: Product prices change according to the market. Please contact us for the latest price.";
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-orange text-brand-dark py-2 overflow-hidden whitespace-nowrap border-t border-orange-600">
      <div className="flex animate-scroll">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-8 font-bold text-sm uppercase tracking-wider">
            <AlertTriangle size={16} />
            {message}
          </div>
        ))}
      </div>
    </div>
  );
};

const FloatingButtons = ({ onOpenChat }: { onOpenChat: () => void }) => {
  return (
    <>
      <div className="fixed bottom-12 left-6 z-50">
        <div 
          onClick={onOpenChat}
          className="bg-brand-orange w-10 h-10 flex items-center justify-center rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform group relative"
        >
          <Bot size={20} className="text-brand-dark" />
          <span className="absolute left-full ml-3 px-2 py-1 bg-brand-dark text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Assistant
          </span>
        </div>
      </div>
      <div className="fixed bottom-12 right-6 z-50">
        <a 
          href="https://wa.me/919876543210" 
          target="_blank" 
          rel="noreferrer"
          className="bg-[#22c55e] w-12 h-12 flex items-center justify-center rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform block"
        >
          <MessageCircle size={24} className="text-white fill-white" />
        </a>
      </div>
    </>
  );
};

const ChatAssistant = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>(() => {
    const saved = localStorage.getItem('nk_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'ai', text: "Hello! I'm your **NK Hardware AI assistant**. How can I help you with your plumbing or sanitaryware needs today?" }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const suggestions = [
    "Astral pipe price?",
    "Best CPVC for home?",
    "Contact NK Hardware",
    "Sanitaryware brands",
    "Plumbing advice"
  ];

  useEffect(() => {
    localStorage.setItem('nk_chat_history', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const clearChat = () => {
    const initialMessage: { role: 'user' | 'ai', text: string }[] = [{ role: 'ai', text: "Hello! I'm your **NK Hardware AI assistant**. How can I help you with your plumbing or sanitaryware needs today?" }];
    setMessages(initialMessage);
    localStorage.setItem('nk_chat_history', JSON.stringify(initialMessage));
  };

  const handleSend = async (text?: string) => {
    const userMessage = text || input.trim();
    if (!userMessage) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "You are a helpful AI assistant for NK Hardware, a leading supplier of CPVC, UPVC, SWR pipes, and sanitaryware. You help customers with product inquiries, pricing (remind them prices change), and technical advice on plumbing. Be professional, polite, and concise. Use markdown for formatting (bold, lists, etc.). If asked about specific prices, mention they should contact NK Hardware for the latest market rates. Our brands include Astral, Birla NU, Finolex, Supreme, Hindware, Parryware, Cera, and Jaquar.",
        },
      });

      let fullText = '';
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      for await (const chunk of stream) {
        fullText += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
          className="fixed bottom-24 left-6 z-[100] w-[320px] sm:w-[350px] md:w-[400px] h-[450px] md:h-[550px] bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 bg-brand-orange flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-dark rounded-full flex items-center justify-center relative">
                <Bot size={16} className="text-brand-orange" />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-brand-orange rounded-full" />
              </div>
              <div>
                <h3 className="text-brand-dark font-bold text-xs">NK AI Assistant</h3>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-brand-dark/70 font-bold uppercase tracking-wider leading-none">Powered by Gemini</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={clearChat}
                title="Clear Chat"
                className="p-1.5 hover:bg-black/10 rounded-full text-brand-dark transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-black/10 rounded-full text-brand-dark transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-grow overflow-y-auto p-3 space-y-3 scrollbar-hide bg-gradient-to-b from-transparent to-white/5">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-2.5 rounded-xl text-[13px] shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-orange text-brand-dark rounded-tr-none font-medium' 
                    : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
                }`}>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none leading-tight text-[13px]">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-2 rounded rounded-tl-none border border-white/10 flex gap-2 items-center">
                  <RefreshCw size={12} className="animate-spin text-brand-orange" />
                  <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length < 3 && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-white/5 bg-black/10">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(s)}
                  className="whitespace-nowrap px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] text-white/70 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles size={10} className="text-brand-orange" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-white/5 bg-black/30">
            <div className="relative">
              <input 
                type="file"
                id="chat-attachment"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    alert("File size must be less than 10MB");
                    return;
                  }
                  setIsTyping(true);
                  try {
                    const storageRef = ref(storage, `chat/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    setMessages(prev => [...prev, { role: 'user', text: `![Attachment](${downloadURL})` }]);
                    handleSend(`![Attachment](${downloadURL})`);
                  } catch (error) {
                    console.error("Error uploading chat attachment:", error);
                    alert("Failed to upload attachment");
                  } finally {
                    setIsTyping(false);
                  }
                }}
              />
              <label htmlFor="chat-attachment" className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-brand-orange cursor-pointer transition-colors">
                <ImageIcon size={18} />
              </label>
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about pipes..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange transition-colors placeholder:text-white/20"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-brand-orange hover:text-orange-400 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[8px] text-center text-white/20 mt-2 uppercase tracking-widest">
              NK Hardware AI can make mistakes.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProductCard = ({ 
  title, 
  description, 
  image, 
  bgColor, 
  showArrow = false,
  category,
  isOldMRP = true,
  onClick,
  onAddToQuote
}: { 
  title: string, 
  description: string, 
  image: string, 
  bgColor: string, 
  showArrow?: boolean,
  category?: string,
  isOldMRP?: boolean,
  onClick?: () => void,
  onAddToQuote?: (e: React.MouseEvent) => void
}) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-xl transition-all group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`h-32 sm:h-48 md:h-64 flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden`}>
        <img src={image} alt={title} className="max-h-full max-w-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
      </div>
      
      <div className="p-4 md:p-6 flex flex-col flex-grow">
        {category && (
          <div className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-amber-50 text-amber-600 text-[8px] md:text-[10px] font-bold uppercase tracking-wider mb-2 md:mb-4 border border-amber-100 w-fit">
            {category}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-1 md:mb-2 mt-auto pt-3 md:pt-6 border-t border-slate-50">
          <div className="flex flex-col">
            <h3 className="text-sm md:text-xl font-black text-slate-900 tracking-tight line-clamp-2">{title}</h3>
          </div>
          {showArrow && <ArrowRight size={14} className="text-brand-orange -rotate-45 md:w-[18px] md:h-[18px]" />}
        </div>
        {onAddToQuote && (
          <button 
            onClick={onAddToQuote}
            className="mt-4 w-full bg-brand-orange text-brand-dark py-2.5 rounded-xl font-bold hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ShoppingCart size={16} />
            Add to Quote
          </button>
        )}
      </div>
    </motion.div>
  );
};

const ProductRange = ({ onViewChange }: { onViewChange: (view: any, collection?: string) => void }) => {
  const products = [
    {
      title: "CPVC Pipes & Fittings",
      description: "Hot & cold water systems — Astral, Birla NU, Finolex & Supreme. Complete range.",
      // Replace this URL with the path to your uploaded image (e.g., "/cpvc-showroom.jpg" if placed in the public folder)
      image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=2069&auto=format&fit=crop", 
      bgColor: "bg-[#0056b3]",
      showArrow: true,
      onClick: () => onViewChange('CPVC_PIPES')
    },
    {
      title: "Astral CPVC Pro",
      description: "Complete range of Astral CPVC Pro fittings and accessories. The most trusted plumbing solutions.",
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop",
      bgColor: "bg-blue-50",
      showArrow: true,
      onClick: () => onViewChange('ASTRAL_PRODUCTS')
    },
    {
      title: "UPVC Pipes & Fittings",
      description: "Premium drainage and plumbing solutions. Lightweight, chemical-resistant, and easy to install.",
      image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=2070&auto=format&fit=crop", // Placeholder for UPVC Valve
      bgColor: "bg-white"
    },
    {
      title: "SWR Pipes & Fittings",
      description: "Superior Selfit & Ring Fit drainage system by Astral Drainmaster. Soil, waste & rainwater.",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop", // Placeholder for SWR
      bgColor: "bg-[#0056b3]",
      showArrow: true,
      onClick: () => onViewChange('ASTRAL_PRODUCTS', 'SWR Pipe Fittings')
    },
    {
      title: "AquaSafe Fittings",
      description: "Moulded fittings in 4 KGF, 6 KGF & 10 KGF pressure ratings. Agriculture & plumbing solutions.",
      image: "https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=1974&auto=format&fit=crop", // Placeholder for AquaSafe
      bgColor: "bg-slate-100"
    },
    {
      title: "Sanitaryware (Anjul P.T.M.T)",
      description: "Elegant wash basins, faucets, and bathroom fixtures from Anjul. Featuring Apex & Superb Plus Collections.",
      image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", // Placeholder for Sanitaryware
      bgColor: "bg-[#d1dbd6]",
      showArrow: true,
      onClick: () => onViewChange('ANJUL_SANITARYWARE')
    },
    {
      title: "Bath Fittings",
      description: "Premium faucets, showers, and bathroom accessories for a luxurious experience.",
      image: "https://images.unsplash.com/photo-1620627812655-4d7776511905?q=80&w=2070&auto=format&fit=crop",
      bgColor: "bg-slate-50"
    },
    {
      title: "Water Tanks",
      description: "Durable, multi-layer water storage solutions for residential and commercial use.",
      image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=1974&auto=format&fit=crop",
      bgColor: "bg-[#0056b3]"
    }
  ];

  return (
    <section className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-brand-orange font-bold text-xs uppercase tracking-widest mb-2 block">Our Range</span>
          <h2 className="text-4xl font-bold text-slate-900">Products Built to Perform</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ProductCard 
              key={index} 
              title={product.title}
              description={product.description}
              image={product.image}
              bgColor={product.bgColor}
              showArrow={product.showArrow}
              onClick={product.onClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const PopularFittings = () => {
  const fittings = [
    {
      title: "SWR Bend 87.5°",
      brand: "Astral • SWR",
      price: "Latest Rates",
      badge: "BEST SELLER",
      badgeColor: "bg-amber-100 text-amber-600"
    },
    {
      title: "SWR Selfit Pipe Type B",
      brand: "Astral • SWR",
      price: "Latest Rates",
      badge: "TOP RATED",
      badgeColor: "bg-orange-100 text-orange-600"
    },
    {
      title: "SWR Single Tee",
      brand: "Astral • SWR",
      price: "Latest Rates",
      badge: "POPULAR",
      badgeColor: "bg-blue-100 text-blue-600"
    },
    {
      title: "SWR Coupler",
      brand: "Astral • SWR",
      price: "Latest Rates",
      badge: "NEW",
      badgeColor: "bg-emerald-100 text-emerald-600"
    },
    {
      title: "SWR Repair Coupler",
      brand: "Astral • SWR",
      price: "Latest Rates",
      badge: "ESSENTIAL",
      badgeColor: "bg-purple-100 text-purple-600"
    },
    {
      title: "SWR Door Bend 87.5°",
      brand: "Astral • SWR",
      price: "Latest Rates",
      badge: "PREMIUM",
      badgeColor: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <section className="py-24 bg-[#fdfbf7] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fef3c7] border border-amber-200 text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-6">
            <Star size={14} fill="currentColor" />
            FEATURED PRODUCTS
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Most Popular Fittings</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-base">Best selling products across all brands — trusted by plumbers & contractors</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {fittings.map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col group cursor-pointer"
            >
              <div className={`inline-block self-start px-2 py-1 rounded-lg ${item.badgeColor} text-[9px] font-bold mb-4 tracking-wider`}>
                {item.badge}
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{item.title}</h3>
              <p className="text-slate-400 text-[10px] mb-4">{item.brand}</p>
              
              <div className="mt-auto flex items-center justify-between">
                <span className="text-brand-orange font-bold text-lg">{item.price}</span>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-orange transition-colors" />
              </div>
              <p className="text-[9px] text-slate-400 mt-2">Contact for latest rates</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TopBrands = () => {
  const brands = [
    { name: "Astral", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { name: "Supreme", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
    { name: "Finolex", color: "text-blue-800", bg: "bg-indigo-50", border: "border-indigo-100" },
    { name: "Birla NU", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" }
  ];

  return (
    <section className="py-24 bg-[#f8fafc] border-t border-slate-200 px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-brand-orange font-bold text-xs uppercase tracking-[0.2em] mb-3 block"
          >
            Our Partners
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
          >
            Top Brands We Offer
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto"
          >
            Leading retailer for India's most trusted plumbing and sanitaryware brands. 
            Quality products, directly available at our store.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {brands.map((brand, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className={`group bg-white p-8 rounded-3xl border ${brand.border} shadow-sm transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden`}
            >
              <div className={`absolute inset-0 ${brand.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`text-3xl md:text-4xl font-black italic tracking-tighter mb-4 ${brand.color} drop-shadow-sm`}>
                  {brand.name}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-px w-8 bg-slate-200 group-hover:w-12 group-hover:bg-brand-orange transition-all duration-300"></div>
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-[0.15em] transition-colors">
                    Retail Partner
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 text-sm italic">
            *All brand names and logos are property of their respective owners.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const ServiceArea = () => {
  const areas = [
    "Delhi", "Noida", "Greater Noida", "Ghaziabad", "Faridabad", 
    "Gurugram", "Sonipat", "Bahadurgarh", "Loni", "Indirapuram"
  ];

  const features = [
    {
      title: "Fast Delivery",
      desc: "Same day dispatch for Delhi NCR orders. Quick and reliable service.",
      icon: <Truck className="text-brand-orange" size={32} />
    },
    {
      title: "Timely Supply",
      desc: "On-time delivery guaranteed. Project deadlines pe bilkul bharosa karein.",
      icon: <Clock className="text-brand-orange" size={32} />
    },
    {
      title: "Bulk Order Support",
      desc: "Contractors aur dealers ke liye special pricing. WhatsApp pe contact karein.",
      icon: <PhoneCall className="text-brand-orange" size={32} />
    }
  ];

  return (
    <section className="py-24 bg-[#0f172a] text-white px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Our <span className="text-brand-orange">Service Area</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg"
          >
            Hum poore Delhi NCR mein fast delivery karte hain. Bulk orders ke liye special rates available hain.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 p-10 rounded-3xl text-center hover:bg-white/10 transition-colors group"
            >
              <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-brand-orange mb-8 font-bold uppercase tracking-widest text-sm">
            <MapPin size={18} />
            Delhi NCR Areas We Serve
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl mx-auto">
            {areas.map((area, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-brand-orange hover:text-brand-dark hover:border-brand-orange transition-all cursor-default"
              >
                {area}
              </motion.span>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-brand-orange text-brand-dark px-10 py-4 rounded-xl font-bold flex items-center gap-3 mx-auto hover:bg-orange-400 transition-colors shadow-lg shadow-brand-orange/20"
          >
            <PhoneCall size={20} />
            Check Delivery in Your Area
          </motion.button>
        </div>
      </div>
    </section>
  );
};

const WhyUs = ({ onViewChange }: { onViewChange: (view: any) => void }) => {
  const features = [
    {
      title: "Certified Quality",
      desc: "All products meet ISI and international quality standards.",
      icon: <Shield className="text-brand-orange" size={24} />
    },
    {
      title: "Fast Delivery",
      desc: "Reliable supply chain ensuring on-time project delivery.",
      icon: <Truck className="text-brand-orange" size={24} />
    },
    {
      title: "10+ Years Experience",
      desc: "Trusted by builders, contractors, and architects nationwide.",
      icon: <Award className="text-brand-orange" size={24} />
    },
    {
      title: "Expert Support",
      desc: "Dedicated team to help you choose the right products.",
      icon: <Headphones className="text-brand-orange" size={24} />
    }
  ];

  return (
    <section className="py-24 bg-[#0f172a] text-white px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-brand-orange font-bold text-xs uppercase tracking-[0.2em] mb-3 block"
          >
            Why Us
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Built on <span className="text-brand-orange">Trust & Quality</span>
          </motion.h2>
          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            onClick={() => onViewChange('WHY_US')}
            className="mt-6 text-brand-orange font-bold text-sm hover:underline flex items-center gap-2 mx-auto"
          >
            Learn more about our commitment <ArrowRight size={16} />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-orange/10 transition-colors duration-300 border border-white/10">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ onViewChange }: { onViewChange: (view: any) => void }) => {
  return (
    <footer className="bg-[#020617] text-white pt-20 pb-10 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">
              Quality <span className="text-brand-orange">Fittings</span>
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Your trusted partner for premium CPVC, UPVC pipes, fittings, and sanitaryware solutions.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-brand-dark transition-all">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-brand-dark transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-orange hover:text-brand-dark transition-all">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-8 uppercase tracking-widest text-brand-orange">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('HOME'); }} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Home
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('WHY_US'); }} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Why Choose Us
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); onViewChange('CONTACT_US'); }} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-8 uppercase tracking-widest text-brand-orange">Get In Touch</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-orange/10 transition-colors">
                  <Phone size={18} className="text-brand-orange" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Call Us</p>
                  <a href="tel:+919720356263" className="text-slate-300 hover:text-white transition-colors">+91 97203 56263</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-orange/10 transition-colors">
                  <Mail size={18} className="text-brand-orange" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Email Us</p>
                  <a href="mailto:anshsinghal1500@gmail.com" className="text-slate-300 hover:text-white transition-colors">anshsinghal1500@gmail.com</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-orange/10 transition-colors">
                  <MapPin size={18} className="text-brand-orange" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Visit Us</p>
                  <p className="text-slate-300">Dankaur Jhajjhar Road, Gautam Buddh Nagar, UP</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © 2026 Quality Fittings. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-slate-600 font-medium">
            <a href="#" className="hover:text-slate-400 transition-colors uppercase tracking-widest">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors uppercase tracking-widest">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const HowWeWork = () => {
  const steps = [
    {
      title: "Send Your Requirements",
      desc: "Share your material list via WhatsApp, Email, or our Form.",
      icon: <FileText className="text-brand-orange" size={24} />,
      step: "01"
    },
    {
      title: "Get Best Wholesale Quote",
      desc: "We analyze your list and provide the most competitive B2B pricing instantly.",
      icon: <BarChart3 className="text-brand-orange" size={24} />,
      step: "02"
    },
    {
      title: "Confirm & Fast Delivery",
      desc: "Approve the quote and get fast, reliable delivery directly to your project site.",
      icon: <Truck className="text-brand-orange" size={24} />,
      step: "03"
    }
  ];

  return (
    <section className="py-24 bg-[#0f172a] text-white px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-brand-orange font-bold text-sm uppercase tracking-widest mb-4 block"
        >
          Order Process
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold"
        >
          How To Order Bulk Material?
        </motion.h2>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connecting lines for desktop */}
        <div className="hidden md:block absolute top-[60px] left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-brand-orange/0 via-brand-orange/30 to-brand-orange/0"></div>

        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col items-center text-center relative z-10"
          >
            <div className="w-20 h-20 bg-[#1e293b] border-2 border-brand-orange/50 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.15)] relative">
              {step.icon}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-brand-orange text-brand-dark font-black rounded-full flex items-center justify-center text-sm">
                {step.step}
              </div>
            </div>
            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-16 text-center"
      >
        <button className="bg-brand-orange text-brand-dark px-10 py-4 rounded-xl font-bold hover:bg-orange-400 transition-colors shadow-lg shadow-brand-orange/20 flex items-center gap-2 mx-auto">
          <MessageCircle size={20} />
          WhatsApp Your List Now
        </button>
      </motion.div>
    </section>
  );
};

const TrustTestimonials = () => {
  const testimonials = [
    {
      name: "Ramesh Singh",
      role: "Project Contractor",
      content: "Anjul Sanitaryware is our go-to supplier for all major plumbing projects in Noida. Their rates are unbeatable and delivery is always on time.",
      rating: 5
    },
    {
      name: "Amit Gupta",
      role: "Plumbing Agency Owner",
      content: "Great support for wholesale orders! The team gives us the best discounts on Astral and Supreme materials. Very trustworthy.",
      rating: 5
    },
    {
      name: "Rahul Verma",
      role: "Independent Builder",
      content: "I shifted all my procurement to them. Their clear quotations and zero-hassle delivery directly to my construction sites save me a lot of time.",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-[#f8fafc] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-brand-orange font-bold text-sm uppercase tracking-widest mb-4 block"
          >
            Client Success
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-slate-900"
          >
            Trusted By The Trade
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative"
            >
              <div className="absolute top-6 right-8 text-brand-orange/20">
                <MessageSquare size={48} />
              </div>
              <div className="flex gap-1 text-brand-orange mb-6">
                {[...Array(testi.rating)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-slate-600 mb-8 italic relative z-10 leading-relaxed">
                "{testi.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold uppercase">
                  {testi.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{testi.name}</h4>
                  <p className="text-sm text-brand-orange font-medium">{testi.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

interface ProductTableRow {
  sizeCm: string;
  sizeInch: string;
  code: string;
  pkg: string;
  price?: string;
}

interface CPVCProduct {
  title: string;
  description: string;
  image: string;
  bgColor: string;
  brand: string;
  category: string;
  hsn?: string;
  features?: string[];
  specifications?: { label: string; value: string }[];
  tableData?: ProductTableRow[];
  size?: string;
  pressureRating?: string;
}

const ProductDetailPage = ({ product, onBack, onOpenSizeSelection }: { product: CPVCProduct | null; onBack: () => void; onOpenSizeSelection: (product: CPVCProduct) => void }) => {
  if (!product) return null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white pt-32 pb-20 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-orange font-bold mb-12 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Product Image */}
          <div className={`w-full lg:w-1/2 ${product.bgColor} rounded-[2rem] md:rounded-[3rem] p-6 md:p-16 flex items-center justify-center relative overflow-hidden h-64 md:h-96 lg:h-auto lg:aspect-square lg:sticky lg:top-32`}>
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              src={product.image} 
              alt={product.title}
              className="max-w-full max-h-full object-contain drop-shadow-2xl relative z-10"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6">
              {product.brand} — {product.category}
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
              {product.title}
            </h1>
            
            <p className="text-slate-500 text-base md:text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            {product.hsn && (
              <div className="mb-8 p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">HSN Code</span>
                <span className="text-slate-900 font-mono font-bold text-sm sm:text-base">{product.hsn}</span>
              </div>
            )}

            {product.features && (
              <div className="mb-10">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Key Features</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 text-sm">
                      <CheckCircle2 size={16} className="text-brand-orange shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.tableData && (
              <div className="mb-10">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Size Details</h4>
                <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-y border-slate-100">
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Size (cm)</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {product.category === 'SWR Pipe Fittings' ? 'Length & Socket Type' : 'Size (inch)'}
                        </th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Code</th>
                        <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pkg. (Nos.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.tableData.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                          <td className="py-3 px-4 text-sm text-slate-600">{row.sizeCm}</td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-900">{row.sizeInch}</td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-500">{row.code}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{row.pkg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button 
                onClick={() => onOpenSizeSelection(product)}
                className="flex-grow bg-brand-orange text-brand-dark px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl font-bold hover:bg-orange-400 transition-all shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <ShoppingCart size={18} />
                Add to Quote
              </button>
              <button className="px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm sm:text-base">
                <Headphones size={18} />
                Expert Advice
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CPVCPipesPage = ({ onOpenQuote, onProductSelect, onBack, onOpenSizeSelection, initialSearchQuery = '' }: { onOpenQuote: () => void; onProductSelect: (product: CPVCProduct) => void; onBack: () => void; onOpenSizeSelection: (product: CPVCProduct) => void; initialSearchQuery?: string }) => {
  const [selectedBrand, setSelectedBrand] = useState('Astral');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedSize, setSelectedSize] = useState('All');
  const [selectedPressure, setSelectedPressure] = useState('All');
  const [dbProducts, setDbProducts] = useState<CPVCProduct[]>([]);

  const categories = ['All', 'CPVC PIPE', 'CPVC FITTING', 'VALVE', 'BRASS FITTING', 'FLANGE', 'ACCESSORY'];

  const brands = [
    { name: 'Astral', sub: 'CPVC PRO' },
    { name: 'Birla', sub: 'NU Leakproof' },
    { name: 'Tirupati', sub: 'SDR 11' },
    { name: 'Finolex', sub: 'Coming Soon' },
    { name: 'Supreme', sub: 'LifeLine' },
  ];

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => {
        const data = doc.data();
        
        let productBrand = "Astral";
        const nameLower = (data.name || "").toLowerCase();
        if (nameLower.includes("supreme")) productBrand = "Supreme";
        else if (nameLower.includes("birla")) productBrand = "Birla";
        else if (nameLower.includes("finolex")) productBrand = "Finolex";
        else if (nameLower.includes("tirupati")) productBrand = "Tirupati";

        return {
          title: data.name || "Unknown Product",
          description: data.description || "",
          image: data.imageUrl || "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop",
          bgColor: "bg-blue-50",
          brand: productBrand,
          category: data.category || "",
          price: data.price
        } as CPVCProduct;
      });
      // Filter out products that belong to Anjul Sanitaryware
      const cpvcDbProducts = fetchedProducts.filter(p => categories.includes(p.category));
      setDbProducts(cpvcDbProducts);
    }, (error) => {
      console.error("Error fetching products:", error);
    });
    return () => unsubscribe();
  }, []);

  // Real Astral CPVC Products from PDF
  const cpvcProducts: CPVCProduct[] = [
    { 
      title: "PIPE SDR-11 (3 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. SDR-11 pipe, 3 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-blue-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      pressureRating: "SDR 11",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M511110301", pkg: "100", price: "312.00" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M511110302", pkg: "50", price: "417.00" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M511110303", pkg: "30", price: "645.00" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M511110304", pkg: "20", price: "1,104.00" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M511110305", pkg: "15", price: "1,515.00" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M511110306", pkg: "08", price: "2,628.00" },
      ]
    },
    { 
      title: "PIPE SDR-11 (5 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. SDR-11 pipe, 5 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-orange-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      pressureRating: "SDR 11",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M511110501", pkg: "60", price: "520.00" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M511110502", pkg: "40", price: "695.00" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M511110503", pkg: "25", price: "1,075.00" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M511110504", pkg: "15", price: "1,840.00" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M511110505", pkg: "10", price: "2,525.00" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M511110506", pkg: "06", price: "4,380.00" },
      ]
    },
    { 
      title: "PIPE SCHEDULE 80 (3 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. Schedule 80 pipe, 3 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-slate-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      pressureRating: "SCH 80",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "6.5", sizeInch: "2 1/2\"", code: "M511800307", pkg: "05", price: "6,171.00" },
        { sizeCm: "8.0", sizeInch: "3\"", code: "M511800308", pkg: "03", price: "8,295.00" },
        { sizeCm: "10.0", sizeInch: "4\"", code: "M511800309", pkg: "02", price: "12,327.00" },
        { sizeCm: "15.0", sizeInch: "6\"", code: "M511800310", pkg: "01", price: "25,794.00" },
        { sizeCm: "20.0", sizeInch: "8\"", code: "M511800311", pkg: "01", price: "40,887.00" },
      ]
    },
    { 
      title: "PIPE SDR-13.5 (3 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. SDR-13.5 pipe, 3 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-indigo-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      pressureRating: "SDR 13.5",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M511130301", pkg: "100", price: "273.00" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M511130302", pkg: "50", price: "393.00" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M511130303", pkg: "30", price: "573.00" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M511130304", pkg: "20", price: "942.00" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M511130305", pkg: "15", price: "1,302.00" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M511130306", pkg: "08", price: "2,211.00" },
      ]
    },
    { 
      title: "PIPE SDR-13.5 (5 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. SDR-13.5 pipe, 5 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-red-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M511130501", pkg: "60", price: "455.00" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M511130502", pkg: "40", price: "655.00" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M511130503", pkg: "25", price: "955.00" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M511130504", pkg: "15", price: "1,570.00" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M511130505", pkg: "10", price: "2,170.00" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M511130506", pkg: "06", price: "3,685.00" },
      ]
    },
    { 
      title: "PIPE SCHEDULE 80 (5 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. Schedule 80 pipe, 5 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-teal-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "6.5", sizeInch: "2 1/2\"", code: "M511800507", pkg: "05", price: "10,285.00" },
        { sizeCm: "8.0", sizeInch: "3\"", code: "M511800508", pkg: "03", price: "13,825.00" },
        { sizeCm: "10.0", sizeInch: "4\"", code: "M511800509", pkg: "02", price: "20,545.00" },
        { sizeCm: "15.0", sizeInch: "6\"", code: "M511800510", pkg: "01", price: "42,990.00" },
        { sizeCm: "20.0", sizeInch: "8\"", code: "M511800511", pkg: "01", price: "68,145.00" },
      ]
    },
    { 
      title: "PIPE SCHEDULE 40 (3 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. Schedule 40 pipe, 3 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-yellow-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "6.5", sizeInch: "2 1/2\"", code: "M511400307", pkg: "05", price: "4,515.00" },
        { sizeCm: "8.0", sizeInch: "3\"", code: "M511400308", pkg: "03", price: "6,105.00" },
        { sizeCm: "10.0", sizeInch: "4\"", code: "M511400309", pkg: "02", price: "8,859.00" },
        { sizeCm: "15.0", sizeInch: "6\"", code: "M511400310", pkg: "01", price: "16,749.00" },
      ]
    },
    { 
      title: "PIPE SCHEDULE 40 (5 METRE LENGTH)", 
      description: "Astral CPVC PRO Advanced Hot and Cold Water Plumbing System. Schedule 40 pipe, 5 metre length.", 
      image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-cyan-50",
      brand: "Astral",
      category: "CPVC PIPE",
      hsn: "39172390",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "High Pressure Bearing Capacity"],
      tableData: [
        { sizeCm: "6.5", sizeInch: "2 1/2\"", code: "M511400507", pkg: "05", price: "7,525.00" },
        { sizeCm: "8.0", sizeInch: "3\"", code: "M511400508", pkg: "03", price: "10,175.00" },
        { sizeCm: "10.0", sizeInch: "4\"", code: "M511400509", pkg: "02", price: "14,765.00" },
        { sizeCm: "15.0", sizeInch: "6\"", code: "M511400510", pkg: "01", price: "27,915.00" },
      ]
    },
    { 
      title: "COUPLER-SOC", 
      description: "Astral CPVC PRO Fittings. Coupler-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-blue-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512111001", pkg: "100 1500" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512111002", pkg: "100 600" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512111003", pkg: "50 600" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512111004", pkg: "10 300" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512111005", pkg: "10 200" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512111006", pkg: "10 50" },
      ]
    },
    { 
      title: "ELBOW 90°-SOC", 
      description: "Astral CPVC PRO Fittings. Elbow 90°-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-orange-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110501", pkg: "100 1000" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110502", pkg: "50 800" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512110503", pkg: "50 400" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512110504", pkg: "10 200" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512110505", pkg: "10 120" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512110506", pkg: "05 50" },
      ]
    },
    { 
      title: "TEE-SOC", 
      description: "Astral CPVC PRO Fittings. Tee-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-emerald-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110101", pkg: "100 800" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110102", pkg: "50 500" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512110103", pkg: "25 300" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512110104", pkg: "10 150" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512110105", pkg: "10 90" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512110106", pkg: "05 40" },
      ]
    },
    { 
      title: "CROSS-SOC", 
      description: "Astral CPVC PRO Fittings. Cross-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-slate-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512112401", pkg: "100 200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512112402", pkg: "25 100" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512112403", pkg: "25 100" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512112404", pkg: "10 60" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512112405", pkg: "05 40" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512112406", pkg: "15 15" },
      ]
    },
    { 
      title: "UNION-SOC", 
      description: "Astral CPVC PRO Fittings. Union-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-indigo-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512112601", pkg: "30 210" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512112602", pkg: "20 180" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512112603", pkg: "15 120" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512112604", pkg: "10 90" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512112605", pkg: "10 60" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512112606", pkg: "05 30" },
      ]
    },
    { 
      title: "MALE ADAPTOR (CPVC THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Male Adaptor (CPVC THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-red-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512111301", pkg: "100 600" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512111302", pkg: "100 600" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512111303", pkg: "50 300" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512111304", pkg: "10 200" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512111305", pkg: "10 100" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512111306", pkg: "10 50" },
      ]
    },
    { 
      title: "FEMALE ADAPTOR (CPVC THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Female Adaptor (CPVC THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-teal-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512111601", pkg: "100 800" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512111602", pkg: "50 500" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512111603", pkg: "50 250" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512111604", pkg: "10 150" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512111605", pkg: "10 100" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512111606", pkg: "05 50" },
      ]
    },
    { 
      title: "BRASS FPT x SOC ELBOW 90°", 
      description: "Astral CPVC PRO Fittings. Brass FPT x SOC Elbow 90°.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-yellow-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "1.5 x 1.5", sizeInch: "1/2\" x 1/2\"", code: "M512110701", pkg: "50 200" },
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "M512110714", pkg: "50 150" },
        { sizeCm: "2.0 x 2.0", sizeInch: "3/4\" x 3/4\"", code: "M512110702", pkg: "25 100" },
        { sizeCm: "2.5 x 1.5", sizeInch: "1\" x 1/2\"", code: "M512110715", pkg: "25 100" },
        { sizeCm: "2.5 x 2.0", sizeInch: "1\" x 3/4\"", code: "M512110716", pkg: "25 100" },
        { sizeCm: "2.5 x 2.5", sizeInch: "1\" x 1\"", code: "M512110703", pkg: "25 50" },
      ]
    },
    { 
      title: "MALE BRASS-THDxSOC ELBOW 90°", 
      description: "Astral CPVC PRO Fittings. Male Brass-THDxSOC Elbow 90°.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-cyan-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "M512114823", pkg: "10 100" },
      ]
    },
    { 
      title: "END CAP-SOC", 
      description: "Astral CPVC PRO Fittings. End Cap-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-pink-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512114101", pkg: "100 1000" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512114102", pkg: "100 500" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512114103", pkg: "100 200" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512114104", pkg: "10 120" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512114105", pkg: "10 100" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512114106", pkg: "10 40" },
      ]
    },
    { 
      title: "ELBOW 45°-SOC", 
      description: "Astral CPVC PRO Fittings. Elbow 45°-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-rose-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512112301", pkg: "100 500" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512112302", pkg: "100 200" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512112303", pkg: "50 250" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512112304", pkg: "10 60" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512112305", pkg: "10 40" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512112306", pkg: "05 15" },
      ]
    },
    { 
      title: "TANK ADAPTOR (THDxTHD)", 
      description: "Astral CPVC PRO Fittings. Tank Adaptor (THDxTHD).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-fuchsia-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512112501", pkg: "10 80" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512112502", pkg: "10 60" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512112503", pkg: "10 40" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512112504", pkg: "10 30" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512112505", pkg: "10 20" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512112506", pkg: "05 15" },
      ]
    },
    { 
      title: "REDUCER BUSHING (SPG X SOC)", 
      description: "Astral CPVC PRO Fittings. Reducer Bushing (SPG X SOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-violet-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "M512111914", pkg: "100 1000" },
        { sizeCm: "2.5 x 1.5", sizeInch: "1\" x 1/2\"", code: "M512111915", pkg: "100 600" },
        { sizeCm: "2.5 x 2.0", sizeInch: "1\" x 3/4\"", code: "M512111916", pkg: "100 800" },
        { sizeCm: "3.2 x 1.5", sizeInch: "1 1/4\" x 1/2\"", code: "M512111917", pkg: "10 300" },
        { sizeCm: "3.2 x 2.0", sizeInch: "1 1/4\" x 3/4\"", code: "M512111918", pkg: "10 300" },
        { sizeCm: "3.2 x 2.5", sizeInch: "1 1/4\" x 1\"", code: "M512111919", pkg: "10 300" },
      ]
    },
    { 
      title: "REDUCER COUPLER-SOC", 
      description: "Astral CPVC PRO Fittings. Reducer Coupler-SOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-sky-50",
      brand: "Astral",
      category: "CPVC FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic"],
      tableData: [
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "M512111114", pkg: "100 1000" },
        { sizeCm: "2.5 x 1.5", sizeInch: "1\" x 1/2\"", code: "M512111115", pkg: "100 500" },
        { sizeCm: "2.5 x 2.0", sizeInch: "1\" x 3/4\"", code: "M512111116", pkg: "50 450" },
        { sizeCm: "3.2 x 1.5", sizeInch: "1 1/4\" x 1/2\"", code: "M512111117", pkg: "50 300" },
        { sizeCm: "3.2 x 2.0", sizeInch: "1 1/4\" x 3/4\"", code: "M512111118", pkg: "50 300" },
        { sizeCm: "3.2 x 2.5", sizeInch: "1 1/4\" x 1\"", code: "M512111119", pkg: "50 200" },
      ]
    },
    { 
      title: "MALE BRASS TEE-THDxSOC", 
      description: "Astral CPVC PRO Fittings. Male Brass Tee-THDxSOC.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-amber-50",
      brand: "Astral",
      category: "BRASS FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "2.0 x 2.0 x 1.5", sizeInch: "3/4\" x 3/4\" x 1/2\"", code: "M512114923", pkg: "10 100" },
        { sizeCm: "2.5 x 2.5 x 1.5", sizeInch: "1\" x 1\" x 1/2\"", code: "M512115024", pkg: "- 75" },
      ]
    },
    { 
      title: "REDUCER COUPLER (BRASS THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Reducer Coupler (Brass THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-orange-50",
      brand: "Astral",
      category: "BRASS FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "2.0 x 1.5", sizeInch: "3/4\" x 1/2\"", code: "M512111214", pkg: "50 200" },
        { sizeCm: "2.5 x 1.5", sizeInch: "1\" x 1/2\"", code: "M512111215", pkg: "25 100" },
        { sizeCm: "2.5 x 2.0", sizeInch: "1\" x 3/4\"", code: "M512111216", pkg: "25 125" },
      ]
    },
    { 
      title: "MALE UNION (BRASS THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Male Union (Brass THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-yellow-50",
      brand: "Astral",
      category: "BRASS FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512119801", pkg: "25 200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512119802", pkg: "10 100" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512119803", pkg: "10 60" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512119804", pkg: "5 35" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512119805", pkg: "5 25" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512119806", pkg: "5 15" },
      ]
    },
    { 
      title: "FEMALE UNION (BRASS THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Female Union (Brass THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-lime-50",
      brand: "Astral",
      category: "BRASS FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512119901", pkg: "25 200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512119902", pkg: "10 110" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512119903", pkg: "10 70" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512119904", pkg: "5 35" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512119905", pkg: "5 25" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512119906", pkg: "5 15" },
      ]
    },
    { 
      title: "CONCEALED VALVE (CHROME PLATED) (TRIANGLE)", 
      description: "Astral CPVC PRO Fittings. Concealed Valve (Chrome Plated) (Triangle).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-emerald-50",
      brand: "Astral",
      category: "VALVE",
      hsn: "84818090",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Chrome Plated"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512118501", pkg: "01 20" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512118502", pkg: "02 16" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512118503", pkg: "02 14" },
      ]
    },
    { 
      title: "BALL VALVE (CTS SOCKET)", 
      description: "Astral CPVC PRO Fittings. Ball Valve (CTS Socket).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-cyan-50",
      brand: "Astral",
      category: "VALVE",
      hsn: "84818090",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "CTS Socket"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512112701N", pkg: "- 80" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512112702N", pkg: "- 100" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512112703N", pkg: "- 60" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512112704N", pkg: "- 40" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512112705N", pkg: "- 25" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512112706N", pkg: "- 14" },
      ]
    },
    { 
      title: "EXTENSION PIECES (CHROME PLATED) (MEDIUM DUTY)", 
      description: "Astral CPVC PRO Fittings. Extension Pieces (Chrome Plated) (Medium Duty).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-slate-100",
      brand: "Astral",
      category: "ACCESSORY",
      hsn: "74122019",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Chrome Plated"],
      tableData: [
        { sizeCm: "2.5", sizeInch: "1\"", code: "T143-010M", pkg: "- 96" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "T143-015M", pkg: "- 64" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "T143-020M", pkg: "- 48" },
        { sizeCm: "6.5", sizeInch: "2 1/2\"", code: "T143-025M", pkg: "- 40" },
        { sizeCm: "8.0", sizeInch: "3\"", code: "T143-030M", pkg: "- 32" },
        { sizeCm: "10.0", sizeInch: "4\"", code: "T143-040M", pkg: "- 24" },
        { sizeCm: "12.5", sizeInch: "5\"", code: "T143-050M", pkg: "- 20" },
        { sizeCm: "15.0", sizeInch: "6\"", code: "T143-060M", pkg: "- 16" },
      ]
    },
    { 
      title: "MALE ADAPTOR (BRASS THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Male Adaptor (Brass THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-orange-50",
      brand: "Astral",
      category: "BRASS FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512111401", pkg: "50 200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512111402", pkg: "25 100" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512111403", pkg: "10 50" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512111404", pkg: "5 25" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512111405", pkg: "5 25" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512111406", pkg: "5 15" },
      ]
    },
    { 
      title: "FEMALE ADAPTOR (BRASS THDxSOC)", 
      description: "Astral CPVC PRO Fittings. Female Adaptor (Brass THDxSOC).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-yellow-50",
      brand: "Astral",
      category: "BRASS FITTING",
      hsn: "39174000",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Brass Threaded"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512111701", pkg: "50 200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512111702", pkg: "25 100" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512111703", pkg: "10 50" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "M512111704", pkg: "5 25" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "M512111705", pkg: "5 25" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "M512111706", pkg: "5 15" },
      ]
    },
    { 
      title: "CONCEALED VALVE (WHEEL TYPE)", 
      description: "Astral CPVC PRO Fittings. Concealed Valve (Wheel Type).", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-red-50",
      brand: "Astral",
      category: "VALVE",
      hsn: "84818090",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Wheel Type"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512118601", pkg: "01 20" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512118602", pkg: "02 16" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512118603", pkg: "02 14" },
      ]
    },
    { 
      title: "S.S. FLANGE WITH RUBBER GROMET", 
      description: "Astral CPVC PRO Fittings. S.S. Flange With Rubber Gromet.", 
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-stone-100",
      brand: "Astral",
      category: "FLANGE",
      hsn: "84818090",
      features: ["Advanced Hot & Cold Water System", "NSF Certified", "Lead-Free & Non-Toxic", "Stainless Steel"],
      tableData: [
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "RM04159004", pkg: "- 01" },
      ]
    },
    { 
      title: "Long Radius Bend", 
      description: "Astral CPVC Pro Long Radius Bend for smooth flow and durability.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "CPVC FITTING", 
      features: ["High Pressure Resistance", "Smooth Internal Surface", "Lead-Free Material"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110101", pkg: "100" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110102", pkg: "50" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512110103", pkg: "25" }
      ]
    },
    { 
      title: "Hot Side - Cold Down Adaptor", 
      description: "3 in 1 Wall Mixer Adaptor for versatile plumbing configurations.", 
      image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "ACCESSORY", 
      features: ["3-in-1 Functionality", "Precision Threading", "Leak-Proof Design"],
      tableData: [
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512118701", pkg: "20" }
      ]
    },
    { 
      title: "Sweep Bend", 
      description: "Sweep Bend with both side socket for efficient directional changes.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "CPVC FITTING", 
      features: ["Dual Socket Design", "Corrosion Resistant", "Easy Installation"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110201", pkg: "100" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110202", pkg: "50" }
      ]
    },
    { 
      title: "Step Over Bend", 
      description: "Astral Step Over Bend for crossing pipes with ease.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "CPVC FITTING", 
      features: ["Space Saving", "Durable CPVC", "High Flow Rate"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110301", pkg: "50" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110302", pkg: "25" }
      ]
    },
    { 
      title: "End Plug Threaded", 
      description: "Threaded End Plug for secure pipe termination.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "CPVC FITTING", 
      features: ["Secure Threading", "Chemical Resistant", "Long Life"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110401", pkg: "200" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110402", pkg: "100" }
      ]
    },
    { 
      title: "Tank Adaptor (Socket Type)", 
      description: "Socket Type Tank Adaptor (THDxSOC) for reliable tank connections.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "CPVC FITTING", 
      features: ["Threaded x Socket", "Heavy Duty", "UV Stabilized"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "M512110501", pkg: "50" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "M512110502", pkg: "25" }
      ]
    },
    { 
      title: "Wye-Strainer", 
      description: "Astral Wye-Strainer for filtering debris from the water line.", 
      image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=2000&auto=format&fit=crop", 
      bgColor: "bg-blue-50", 
      brand: "Astral", 
      category: "CPVC FITTING", 
      features: ["Inline Filtration", "Easy to Clean", "Robust Mesh"],
      tableData: [
        { sizeCm: "2.5", sizeInch: "1\"", code: "M512110601", pkg: "10" }
      ]
    },
    { 
      title: "Ratchet Cutter", 
      description: "Heavy duty Ratchet Cutter for precise CPVC pipe cutting.", 
      image: "https://images.unsplash.com/photo-1530124560676-105518553fe9?q=80&w=2070&auto=format&fit=crop", 
      bgColor: "bg-slate-50", 
      brand: "Astral", 
      category: "ACCESSORY", 
      features: ["Clean Cuts", "Ratchet Mechanism", "Ergonomic Grip"],
      tableData: [
        { sizeCm: "Up to 5.0", sizeInch: "Up to 2\"", code: "M512110701", pkg: "1" }
      ]
    },
    {
      title: "Birla CPVC Elbow 90°",
      description: "Birla CPVC Elbow 90° for directional changes in CPVC piping systems. High durability and leak-proof design.",
      image: "https://picsum.photos/seed/elbow90/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["High Durability", "Leak-Proof", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000036", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000037", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000038", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000039", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000040", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000041", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Elbow 45°",
      description: "Birla CPVC Elbow 45° for gradual directional changes in CPVC piping systems.",
      image: "https://picsum.photos/seed/elbow45/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Smooth Flow", "Robust Construction", "Easy Installation"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000994", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000341", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000342", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000995", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000996", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000997", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Tee",
      description: "Birla CPVC Tee for 90-degree branching in CPVC piping systems.",
      image: "https://picsum.photos/seed/tee/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Strong Branching", "Leak-Proof", "High Pressure Rating"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000042", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000043", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000044", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000045", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000046", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000047", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Coupler",
      description: "Birla CPVC Coupler for joining two CPVC pipes of the same diameter.",
      image: "https://picsum.photos/seed/coupler/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Secure Joint", "Durable Material", "Chemical Resistant"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000048", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000049", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000050", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000051", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000052", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000053", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Reducing Elbow",
      description: "Birla CPVC Reducing Elbow for directional changes with diameter reduction.",
      image: "https://picsum.photos/seed/redelbow/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Efficient Reduction", "Smooth Transition", "Robust Design"],
      tableData: [
        { sizeCm: "2.0x1.5", sizeInch: "3/4\"x1/2\"", code: "96000324", pkg: "-" },
        { sizeCm: "2.5x1.5", sizeInch: "1\"x1/2\"", code: "96000325", pkg: "-" },
        { sizeCm: "2.5x2.0", sizeInch: "1\"x3/4\"", code: "96000244", pkg: "-" },
        { sizeCm: "3.2x1.5", sizeInch: "1 1/4\"x1/2\"", code: "96000476", pkg: "-" },
        { sizeCm: "3.2x2.0", sizeInch: "1 1/4\"x3/4\"", code: "96000477", pkg: "-" },
        { sizeCm: "3.2x2.5", sizeInch: "1 1/4\"x1\"", code: "96000478", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Reducing Tee",
      description: "Birla CPVC Reducing Tee for branching into a smaller diameter pipe.",
      image: "https://picsum.photos/seed/redtee/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Versatile Branching", "Strong Construction", "Leak-Proof"],
      tableData: [
        { sizeCm: "2.0x2.0x1.5", sizeInch: "3/4\"x3/4\"x1/2\"", code: "96000329", pkg: "-" },
        { sizeCm: "2.5x2.5x1.5", sizeInch: "1\"x1\"x1/2\"", code: "96000316", pkg: "-" },
        { sizeCm: "2.5x2.5x20", sizeInch: "1\"x1\"x3/4\"", code: "96000243", pkg: "-" },
        { sizeCm: "3.2x32x1.5", sizeInch: "1 1/4\"x1 1/4\"x1/2\"", code: "96000318", pkg: "-" },
        { sizeCm: "3.2x32x2.0", sizeInch: "1 1/4\"x1 1/4\"x3/4\"", code: "96000252", pkg: "-" },
        { sizeCm: "3.2x32x2.5", sizeInch: "1 1/4\"x1 1/4\"x1\"", code: "96000317", pkg: "-" },
        { sizeCm: "4.0x40x1.5", sizeInch: "1 1/2\"x1 1/2\"x1/2\"", code: "96000493", pkg: "-" },
        { sizeCm: "4.0x40x2.0", sizeInch: "1 1/2\"x1 1/2\"x3/4\"", code: "96000494", pkg: "-" },
        { sizeCm: "4.0x40x2.5", sizeInch: "1 1/2\"x1 1/2\"x1\"", code: "96000495", pkg: "-" },
        { sizeCm: "4.0x40x3.2", sizeInch: "1 1/2\"x1 1/2\"x1 1/4\"", code: "96000496", pkg: "-" },
        { sizeCm: "5.0x50x1.5", sizeInch: "2\"x2\"x1/2\"", code: "96000512", pkg: "-" },
        { sizeCm: "5.0x50x2.0", sizeInch: "2\"x2\"x3/4\"", code: "96000513", pkg: "-" },
        { sizeCm: "5.0x50x2.5", sizeInch: "2\"x2\"x1\"", code: "96000514", pkg: "-" },
        { sizeCm: "5.0x50x3.2", sizeInch: "2\"x2\"x1 1/4\"", code: "96000515", pkg: "-" },
        { sizeCm: "5.0x50x4.0", sizeInch: "2\"x2\"x1 1/2\"", code: "96000516", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Reducing Coupler",
      description: "Birla CPVC Reducing Coupler for joining two pipes of different diameters.",
      image: "https://picsum.photos/seed/redcoupler/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Precision Fit", "Durable PVC", "Easy Installation"],
      tableData: [
        { sizeCm: "2.0x1.5", sizeInch: "3/4\"x1/2\"", code: "96000390", pkg: "-" },
        { sizeCm: "2.5x1.5", sizeInch: "1\"x1/2\"", code: "96000242", pkg: "-" },
        { sizeCm: "2.5x2.0", sizeInch: "1\"x3/4\"", code: "96000241", pkg: "-" },
        { sizeCm: "3.2x1.5", sizeInch: "1 1/4\"x1/2\"", code: "96000421", pkg: "-" },
        { sizeCm: "3.2x2.0", sizeInch: "1 1/4\"x3/4\"", code: "96000311", pkg: "-" },
        { sizeCm: "3.2x2.5", sizeInch: "1 1/4\"x1\"", code: "96000310", pkg: "-" },
        { sizeCm: "4.0x1.5", sizeInch: "1 1/2\"x1/2\"", code: "96000497", pkg: "-" },
        { sizeCm: "4.0x2.0", sizeInch: "1 1/2\"x3/4\"", code: "96000498", pkg: "-" },
        { sizeCm: "4.0x2.5", sizeInch: "1 1/2\"x1\"", code: "96000499", pkg: "-" },
        { sizeCm: "4.0x3.2", sizeInch: "1 1/2\"x1 1/4\"", code: "96000323", pkg: "-" },
        { sizeCm: "5.0x1.5", sizeInch: "2\"x1/2\"", code: "96000507", pkg: "-" },
        { sizeCm: "5.0x2.0", sizeInch: "2\"x3/4\"", code: "96000508", pkg: "-" },
        { sizeCm: "5.0x2.5", sizeInch: "2\"x1\"", code: "96000509", pkg: "-" },
        { sizeCm: "5.0x3.2", sizeInch: "2\"x1 1/4\"", code: "96000510", pkg: "-" },
        { sizeCm: "5.0x4.0", sizeInch: "2\"x1 1/2\"", code: "96000511", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Cross Tee",
      description: "Birla CPVC Cross Tee for four-way branching in CPVC piping systems.",
      image: "https://picsum.photos/seed/crosstee/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Four-Way Branching", "Robust Design", "High Quality"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96001012", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000343", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000344", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC End Cap",
      description: "Birla CPVC End Cap for sealing the end of a CPVC pipe.",
      image: "https://picsum.photos/seed/endcap/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Secure Seal", "Durable", "Easy to Fit"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000054", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000055", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000056", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000057", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000300", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000301", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Union",
      description: "Birla CPVC Union for easy disconnection and maintenance of CPVC pipelines.",
      image: "https://picsum.photos/seed/union/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Easy Maintenance", "Leak-Proof Joint", "Robust Construction"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96001075", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000305", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000306", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000307", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000308", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000309", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Plastic FTA",
      description: "Birla CPVC Plastic Female Threaded Adapter for connecting CPVC pipes to threaded fittings.",
      image: "https://picsum.photos/seed/fta/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Female Threaded", "Secure Connection", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000482", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000064", pkg: "-" },
        { sizeCm: "2.0x1.5", sizeInch: "3/4\"x1/2\"", code: "96000065", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000063", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000062", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000314", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000315", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Plastic MTA",
      description: "Birla CPVC Plastic Male Threaded Adapter for connecting CPVC pipes to threaded fittings.",
      image: "https://picsum.photos/seed/mta/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Male Threaded", "Secure Connection", "Durable Material"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000481", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000058", pkg: "-" },
        { sizeCm: "2.0x1.5", sizeInch: "3/4\"x1/2\"", code: "96000059", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000061", pkg: "-" },
        { sizeCm: "2.5x2.0", sizeInch: "1\"x3/4\"", code: "96001021", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000060", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000312", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000313", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Pipe SDR 11",
      description: "Birla CPVC Pipe SDR 11 for hot and cold water distribution systems. High pressure and temperature resistance.",
      image: "https://picsum.photos/seed/birla-pipe11/400/400",
      bgColor: "bg-orange-50",
      brand: "Birla",
      category: "CPVC PIPE",
      pressureRating: "SDR 11",
      features: ["SDR 11 Standard", "Hot & Cold Water", "High Pressure Resistance"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000001", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000002", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000003", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000004", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000005", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000006", pkg: "-" }
      ]
    },
    {
      title: "Birla CPVC Pipe SDR 13.5",
      description: "Birla CPVC Pipe SDR 13.5 for efficient hot and cold water systems.",
      image: "https://picsum.photos/seed/birla-pipe135/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC PIPE",
      pressureRating: "SDR 13.5",
      features: ["SDR 13.5 Standard", "Smooth Internal Surface", "Lead-Free"],
      tableData: [
        { sizeCm: "1.5", sizeInch: "1/2\"", code: "96000011", pkg: "-" },
        { sizeCm: "2.0", sizeInch: "3/4\"", code: "96000012", pkg: "-" },
        { sizeCm: "2.5", sizeInch: "1\"", code: "96000013", pkg: "-" },
        { sizeCm: "3.2", sizeInch: "1 1/4\"", code: "96000014", pkg: "-" },
        { sizeCm: "4.0", sizeInch: "1 1/2\"", code: "96000015", pkg: "-" },
        { sizeCm: "5.0", sizeInch: "2\"", code: "96000016", pkg: "-" }
      ]
    },
    {
      title: "Birla Reducing Bush",
      description: "Birla CPVC Reducing Bush for connecting pipes of different diameters.",
      image: "https://picsum.photos/seed/birla-bush/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["High Quality CPVC", "Leak-Proof Joint", "Corrosion Resistant"],
      tableData: [
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000066", pkg: "50/500" },
        { sizeCm: "25x15", sizeInch: "1\"x1/2\"", code: "96000068", pkg: "50/400" },
        { sizeCm: "25x20", sizeInch: "1\"x3/4\"", code: "96000067", pkg: "50/400" },
        { sizeCm: "32x15", sizeInch: "1 1/4\"x1/2\"", code: "96000071", pkg: "40/200" },
        { sizeCm: "32x20", sizeInch: "1 1/4\"x3/4\"", code: "96000070", pkg: "40/200" },
        { sizeCm: "32x25", sizeInch: "1 1/4\"x1\"", code: "96000069", pkg: "40/200" },
        { sizeCm: "40x15", sizeInch: "1 1/2\"x1/2\"", code: "96000073", pkg: "10/80" },
        { sizeCm: "40x20", sizeInch: "1 1/2\"x3/4\"", code: "96000075", pkg: "10/80" },
        { sizeCm: "40x25", sizeInch: "1 1/2\"x1\"", code: "96000074", pkg: "10/80" },
        { sizeCm: "40x32", sizeInch: "1 1/2\"x1 1/4\"", code: "96000072", pkg: "10/80" },
        { sizeCm: "50x15", sizeInch: "2\"x1/2\"", code: "96000079", pkg: "10/50" },
        { sizeCm: "50x20", sizeInch: "2\"x3/4\"", code: "96000080", pkg: "10/50" },
        { sizeCm: "50x25", sizeInch: "2\"x1\"", code: "96000077", pkg: "10/50" },
        { sizeCm: "50x32", sizeInch: "2\"x1 1/4\"", code: "96000078", pkg: "10/50" },
        { sizeCm: "50x40", sizeInch: "2\"x1 1/2\"", code: "96000076", pkg: "10/50" }
      ]
    },
    {
      title: "Birla Transition Bush",
      description: "Birla CPVC Transition Bush for transitioning between different pipe materials or sizes.",
      image: "https://picsum.photos/seed/birla-trans/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Smooth Transition", "Durable Construction", "Easy Installation"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000479", pkg: "75/600" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000480", pkg: "50/300" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000489", pkg: "30/210" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000490", pkg: "10/120" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96000491", pkg: "10/80" },
        { sizeCm: "50", sizeInch: "2\"", code: "96000492", pkg: "10/50" }
      ]
    },
    {
      title: "Birla Tank Nipple",
      description: "Birla CPVC Tank Nipple for secure connections to water tanks.",
      image: "https://picsum.photos/seed/birla-tank/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Leak-Proof Seal", "Heavy Duty", "UV Resistant"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000097", pkg: "25/200" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000098", pkg: "20/160" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000099", pkg: "10/100" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000100", pkg: "6/60" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96000234", pkg: "5/70" },
        { sizeCm: "50", sizeInch: "2\"", code: "96000235", pkg: "4/32" }
      ]
    },
    {
      title: "Birla NRV (Non-Return Valve)",
      description: "Birla CPVC Non-Return Valve to prevent backflow in plumbing systems.",
      image: "https://picsum.photos/seed/birla-nrv/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "VALVE",
      features: ["Backflow Prevention", "Smooth Operation", "Durable Valve"],
      tableData: [
        { sizeCm: "20", sizeInch: "3/4\"", code: "98000550", pkg: "5/35" },
        { sizeCm: "25", sizeInch: "1\"", code: "98000551", pkg: "2/20" }
      ]
    },
    {
      title: "Birla Brass Elbow",
      description: "Birla CPVC Brass Elbow for strong and reliable 90-degree turns with brass threading.",
      image: "https://picsum.photos/seed/birla-brass-elbow/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "BRASS FITTING",
      features: ["Premium Brass Threading", "High Strength", "Leak-Proof"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000095", pkg: "15/150" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000334", pkg: "25/125" },
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000094", pkg: "25/125" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000333", pkg: "20/80" },
        { sizeCm: "25x15", sizeInch: "1\"x1/2\"", code: "96000096", pkg: "15/75" },
        { sizeCm: "25x20", sizeInch: "1\"x3/4\"", code: "96001097", pkg: "25/125" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000332", pkg: "5/80" },
        { sizeCm: "32x15", sizeInch: "1 1/4\"x1/2\"", code: "96001109", pkg: "15/75" },
        { sizeCm: "32x20", sizeInch: "1 1/4\"x3/4\"", code: "96001110", pkg: "15/75" }
      ]
    },
    {
      title: "Birla Ball Valve (Two Piece)",
      description: "Birla CPVC Two Piece Ball Valve for reliable flow control.",
      image: "https://picsum.photos/seed/birla-ball-valve/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "VALVE",
      features: ["Quarter Turn Operation", "Smooth Handle", "Full Flow"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "98001267", pkg: "-" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "98001268", pkg: "75" },
        { sizeCm: "25", sizeInch: "1\"", code: "98001269", pkg: "12" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "98001270", pkg: "1/25" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "98001271", pkg: "1/16" },
        { sizeCm: "50", sizeInch: "2\"", code: "98001272", pkg: "1/72" }
      ]
    },
    {
      title: "Birla Tank Nipple (SOC)",
      description: "Birla CPVC Tank Nipple with Socket connection.",
      image: "https://picsum.photos/seed/birla-tank-soc/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Socket Connection", "Secure Tank Fit", "High Durability"],
      tableData: [
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000517", pkg: "20/160" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000518", pkg: "10/100" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96001103", pkg: "6/60" }
      ]
    },
    {
      title: "Birla End Plug",
      description: "Birla CPVC End Plug for sealing pipe ends.",
      image: "https://picsum.photos/seed/birla-end-plug/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Tight Seal", "Easy to Install", "Corrosion Proof"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96001388", pkg: "25/300" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96001389", pkg: "25/200" }
      ]
    },
    {
      title: "Birla Step Over Bend",
      description: "Birla CPVC Step Over Bend for crossing over other pipes.",
      image: "https://picsum.photos/seed/birla-stepover/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Compact Design", "Smooth Flow", "Strong Build"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000197", pkg: "15/120" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000114", pkg: "10/70" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000115", pkg: "5/35" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96001127", pkg: "5/30" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96001128", pkg: "2/20" },
        { sizeCm: "50", sizeInch: "2\"", code: "96001129", pkg: "2/10" }
      ]
    },
    {
      title: "Birla Brass Tee",
      description: "Birla CPVC Brass Tee for three-way connections with brass threading.",
      image: "https://picsum.photos/seed/birla-brass-tee/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "BRASS FITTING",
      features: ["Brass Threaded Branch", "High Pressure Rating", "Leak-Proof"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000086", pkg: "10/150" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000330", pkg: "20/120" },
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000088", pkg: "15/75" },
        { sizeCm: "25x15", sizeInch: "1\"x1/2\"", code: "96000087", pkg: "10/60" },
        { sizeCm: "25x20", sizeInch: "1\"x3/4\"", code: "96000331", pkg: "15/75" },
        { sizeCm: "32x32x15", sizeInch: "1 1/4\"x1 1/4\"x1/2\"", code: "96001098", pkg: "15/75" }
      ]
    },
    {
      title: "Birla Brass FTA",
      description: "Birla CPVC Brass Female Threaded Adapter.",
      image: "https://picsum.photos/seed/birla-brass-fta/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "BRASS FITTING",
      features: ["Female Brass Threads", "Secure Connection", "Durable"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000081", pkg: "25/200" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000082", pkg: "10/150" },
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000083", pkg: "25/150" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000085", pkg: "10/100" },
        { sizeCm: "25x15", sizeInch: "1\"x1/2\"", code: "96000084", pkg: "15/150" },
        { sizeCm: "25x20", sizeInch: "1\"x3/4\"", code: "96000347", pkg: "15/150" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000238", pkg: "5/50" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96000239", pkg: "4/32" },
        { sizeCm: "50", sizeInch: "2\"", code: "96000240", pkg: "3/24" }
      ]
    },
    {
      title: "Birla Brass MTA",
      description: "Birla CPVC Brass Male Threaded Adapter.",
      image: "https://picsum.photos/seed/birla-brass-mta/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "BRASS FITTING",
      features: ["Male Brass Threads", "High Strength", "Reliable Seal"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000089", pkg: "10/150" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000090", pkg: "10/150" },
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000091", pkg: "15/150" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000092", pkg: "10/100" },
        { sizeCm: "25x15", sizeInch: "1\"x1/2\"", code: "96000345", pkg: "10/150" },
        { sizeCm: "25x20", sizeInch: "1\"x3/4\"", code: "96000346", pkg: "10/100" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000093", pkg: "5/50" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96000230", pkg: "4/32" },
        { sizeCm: "50", sizeInch: "2\"", code: "96000231", pkg: "3/24" }
      ]
    },
    {
      title: "Birla Ball Valve (Long Handle)",
      description: "Birla CPVC Ball Valve with Long Handle for easy operation.",
      image: "https://picsum.photos/seed/birla-ball-long/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "VALVE",
      features: ["Long Handle", "Easy Grip", "Smooth Flow Control"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000989", pkg: "1/100" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000991", pkg: "1/75" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000993", pkg: "1/45" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "98000574", pkg: "1/25" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "98000575", pkg: "1/16" },
        { sizeCm: "50", sizeInch: "2\"", code: "98000576", pkg: "1/12" }
      ]
    },
    {
      title: "Birla Concealed Valve",
      description: "Birla CPVC Concealed Valve for aesthetic plumbing installations.",
      image: "https://picsum.photos/seed/birla-concealed/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "VALVE",
      features: ["Concealed Design", "Premium Finish", "Smooth Operation"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "98000310", pkg: "1/20" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "98001274", pkg: "1/20" },
        { sizeCm: "25", sizeInch: "1\"", code: "98001275", pkg: "1/12" }
      ]
    },
    {
      title: "Birla Long Bend",
      description: "Birla CPVC Long Bend for smooth direction changes.",
      image: "https://picsum.photos/seed/birla-longbend/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Smooth Radius", "Reduced Friction", "High Quality"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000441", pkg: "20/160" }
      ]
    },
    {
      title: "Birla Long Bend Socket",
      description: "Birla CPVC Long Bend with Socket connection.",
      image: "https://picsum.photos/seed/birla-longbend-soc/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Socket Connection", "Smooth Flow", "Durable"],
      tableData: [
        { sizeCm: "20", sizeInch: "3/4\"", code: "96001562", pkg: "25/100" },
        { sizeCm: "25", sizeInch: "1\"", code: "96001563", pkg: "10/80" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96001719", pkg: "7/42" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96001720", pkg: "4/24" },
        { sizeCm: "50", sizeInch: "2\"", code: "96001721", pkg: "3/12" }
      ]
    },
    {
      title: "Birla Thermal Expansion Loop",
      description: "Birla CPVC Thermal Expansion Loop to accommodate thermal expansion and contraction.",
      image: "https://picsum.photos/seed/birla-loop/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "CPVC FITTING",
      features: ["Thermal Stress Relief", "Pre-Fabricated", "Reliable"],
      tableData: [
        { sizeCm: "15", sizeInch: "1/2\"", code: "96000483", pkg: "5/5" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000484", pkg: "6/6" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000485", pkg: "3/3" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000486", pkg: "3/3" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96000487", pkg: "2/2" },
        { sizeCm: "50", sizeInch: "2\"", code: "96000488", pkg: "2/2" }
      ]
    },
    {
      title: "Birla Hexagonal Brass MTA",
      description: "Birla CPVC Hexagonal Brass Male Threaded Adapter for easy wrenching.",
      image: "https://picsum.photos/seed/birla-hex-mta/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "BRASS FITTING",
      features: ["Hexagonal Design", "Brass Threads", "Easy Installation"],
      tableData: [
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000293", pkg: "20/160" },
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000291", pkg: "15/150" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000287", pkg: "10/80" },
        { sizeCm: "25x15", sizeInch: "1\"x1/2\"", code: "96001890", pkg: "25/100" },
        { sizeCm: "25x20", sizeInch: "1\"x3/4\"", code: "96001891", pkg: "25/100" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000289", pkg: "5/40" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96001099", pkg: "8/32" },
        { sizeCm: "50", sizeInch: "2\"", code: "96001101", pkg: "8/24" }
      ]
    },
    {
      title: "Birla Hexagonal Brass FTA",
      description: "Birla CPVC Hexagonal Brass Female Threaded Adapter.",
      image: "https://picsum.photos/seed/birla-hex-fta/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "BRASS FITTING",
      features: ["Hexagonal Grip", "Brass Threads", "Secure Fit"],
      tableData: [
        { sizeCm: "20", sizeInch: "3/4\"", code: "96000292", pkg: "10/100" },
        { sizeCm: "20x15", sizeInch: "3/4\"x1/2\"", code: "96000294", pkg: "20/160" },
        { sizeCm: "25", sizeInch: "1\"", code: "96000288", pkg: "10/60" },
        { sizeCm: "32", sizeInch: "1 1/4\"", code: "96000290", pkg: "5/35" },
        { sizeCm: "40", sizeInch: "1 1/2\"", code: "96001100", pkg: "8/32" },
        { sizeCm: "50", sizeInch: "2\"", code: "96001102", pkg: "8/24" }
      ]
    },
    {
      title: "Birla Union Ball Valve (SS)",
      description: "Birla CPVC Union Ball Valve with Stainless Steel components.",
      image: "https://picsum.photos/seed/birla-union-valve/400/400",
      bgColor: "bg-slate-50",
      brand: "Birla",
      category: "VALVE",
      features: ["Union Connection", "SS Components", "High Performance"],
      tableData: [
        { sizeCm: "20", sizeInch: "3/4\"", code: "98000611", pkg: "1" }
      ]
    },
    {
      title: "Birla Concealed Valve (Round/Square)",
      description: "Birla CPVC Concealed Valve available in Round and Square types.",
      image: "https://picsum.photos/seed/birla-concealed-types/400/400",
      bgColor: "bg-blue-50",
      brand: "Birla",
      category: "VALVE",
      features: ["Round & Square Options", "Modern Aesthetics", "Reliable Control"],
      tableData: [
        { sizeCm: "15 (Round)", sizeInch: "1/2\"", code: "96001362", pkg: "1/20" },
        { sizeCm: "20 (Round)", sizeInch: "3/4\"", code: "96001363", pkg: "1/20" },
        { sizeCm: "25 (Round)", sizeInch: "1\"", code: "96001364", pkg: "1/20" },
        { sizeCm: "15 (Square)", sizeInch: "1/2\"", code: "96001071", pkg: "1/20" },
        { sizeCm: "20 (Square)", sizeInch: "3/4\"", code: "96001072", pkg: "1/20" },
        { sizeCm: "25 (Square)", sizeInch: "1\"", code: "96001073", pkg: "1/20" }
      ]
    }
  ];

  const supremeCpvcProducts: CPVCProduct[] = [
    { name: 'Supreme Concealed Valve FULL TURN Round +PLUG 3/4"', sku: 'SUP-CV-FTR-34' },
    { name: 'Supreme Concealed Valve FULL TURN Round +PLUG 1"', sku: 'SUP-CV-FTR-1' },
    { name: 'Supreme Conce valve QTR TURN Round (DNM)+PLUG 1"', sku: 'SUP-CV-QTR-DNM-1' },
    { name: 'Supreme Concealed Valve FULL TURN Round 3/4"', sku: 'SUP-CV-FTR-34-NP' },
    { name: 'Supreme Concealed Valve FULL TURN Round 1"', sku: 'SUP-CV-FTR-1-NP' },
    { name: 'Supreme Conce valve QTR TURN Round (DNM)+PLUG 3/4"', sku: 'SUP-CV-QTR-DNM-34' },
    { name: 'Supreme Conce valve QTR TURN Round (AH)+ PLUG 3/4"', sku: 'SUP-CV-QTR-AH-34' },
    { name: 'Supreme Conce valve QTR TURN Round (AB)+PLUG 3/4"', sku: 'SUP-CV-QTR-AB-34' },
    { name: 'Supreme Conce valve Long QTR TURN Round (DNM) 1/2"', sku: 'SUP-CV-LQTR-DNM-12' },
    { name: 'Supreme Concealed Valve Long QTR TURN Round 3/4"', sku: 'SUP-CV-LQTR-34' },
    { name: 'Supreme Concealed Valve Short QTR TURN Round 3/4"', sku: 'SUP-CV-SQTR-34' },
    { name: 'Supreme Concealed Valve Long QTR TURN Square 3/4"', sku: 'SUP-CV-LQTS-34' },
    { name: 'Supreme Concealed Valve Short QTR TURN Square 3/4"', sku: 'SUP-CV-SQTS-34' },
    { name: 'Supreme Concealed Valve Long QTR TURN Triangle 3/4"', sku: 'SUP-CV-LQTT-34' },
    { name: 'Supreme Concealed Valve Short QTR TURN Triangle 3/4"', sku: 'SUP-CV-SQTT-34' },
    { name: 'Supreme Screw Tap-Hand Wheel Cpvc 3/4"', sku: 'SUP-ST-HW-34' },
    { name: 'Supreme Swing Check Valve Sch 80 3/4"', sku: 'SUP-SCV-80-34' },
    { name: 'Supreme Hex Nipple 1/2"', sku: 'SUP-HN-12' },
    { name: 'Supreme Hex Nipple 3/4"', sku: 'SUP-HN-34' },
    { name: 'Supreme Hex Nipple 1"', sku: 'SUP-HN-1' },
    { name: 'Supreme Hex Nipple 1 1/4"', sku: 'SUP-HN-114' },
    { name: 'Supreme Hex Nipple 1 1/2"', sku: 'SUP-HN-112' },
    { name: 'Supreme Y Strainer (Brass) 1"', sku: 'SUP-YS-B-1' },
    { name: 'Supreme Y Strainer (Brass) 1 1/4"', sku: 'SUP-YS-B-114' },
    { name: 'Supreme Y Strainer (Brass) 1 1/2"', sku: 'SUP-YS-B-112' },
    { name: 'Supreme Y Strainer WITH PLAIN CAP 1"', sku: 'SUP-YS-PC-1' },
    { name: 'Supreme Y Strainer WITH PLAIN CAP 1 1/4"', sku: 'SUP-YS-PC-114' },
    { name: 'Supreme Y Strainer WITH PLAIN CAP 1 1/2"', sku: 'SUP-YS-PC-112' },
    { name: 'Supreme Reducer 3/4"x1/2"', sku: 'SUP-RED-34x12' },
    { name: 'Supreme Reducer 1"x1/2"', sku: 'SUP-RED-1x12' },
    { name: 'Supreme Reducer 1"x3/4"', sku: 'SUP-RED-1x34' },
    { name: 'Supreme Reducer 1 1/4"x1/2"', sku: 'SUP-RED-114x12' },
    { name: 'Supreme Reducer 1 1/4"x3/4"', sku: 'SUP-RED-114x34' },
    { name: 'Supreme Reducer 1 1/2"x1"', sku: 'SUP-RED-112x1' },
    { name: 'Supreme Reducer 1 1/2"x1 1/4"', sku: 'SUP-RED-112x114' },
    { name: 'Supreme Reducer 2"x3/4"', sku: 'SUP-RED-2x34' },
    { name: 'Supreme Reducer 2"x1"', sku: 'SUP-RED-2x1' },
    { name: 'Supreme Reducing Elbow (Plastic) 3/4"x1/2"', sku: 'SUP-RE-P-34x12' },
    { name: 'Supreme Reducing Elbow (Plastic) 1"x1/2"', sku: 'SUP-RE-P-1x12' },
    { name: 'Supreme Reducing Elbow (Plastic) 1"x3/4"', sku: 'SUP-RE-P-1x34' },
    { name: 'Supreme Reducing Elbow (Plastic) 1 1/4"x3/4"', sku: 'SUP-RE-P-114x34' },
    { name: 'Supreme Reducing Elbow (Plastic) 1 1/2"x1"', sku: 'SUP-RE-P-112x1' },
    { name: 'Supreme Reducing Elbow (Plastic) 1 1/2"x1 1/4"', sku: 'SUP-RE-P-112x114' },
    { name: 'Supreme Reducing Elbow (Plastic) 2"x1"', sku: 'SUP-RE-P-2x1' },
    { name: 'Supreme Red. Bush 3/4"x1/2"', sku: 'SUP-RB-34x12' },
    { name: 'Supreme Red. Bush 1"x1/2"', sku: 'SUP-RB-1x12' },
    { name: 'Supreme Red. Bush 1"x3/4"', sku: 'SUP-RB-1x34' },
    { name: 'Supreme Red. Bush 1 1/4"x1/2"', sku: 'SUP-RB-114x12' },
    { name: 'Supreme Red. Bush 1 1/4"x3/4"', sku: 'SUP-RB-114x34' },
    { name: 'Supreme Red. Bush 1 1/2"x1"', sku: 'SUP-RB-112x1' },
    { name: 'Supreme Red. Bush 1 1/2"x1 1/4"', sku: 'SUP-RB-112x114' },
    { name: 'Supreme Red. Bush 2"x1/2"', sku: 'SUP-RB-2x12' },
    { name: 'Supreme Red. Bush 2"x3/4"', sku: 'SUP-RB-2x34' },
    { name: 'Supreme Red. Bush 2"x1"', sku: 'SUP-RB-2x1' },
    { name: 'Supreme Red. Tee 3/4"x1/2"', sku: 'SUP-RT-34x12' },
    { name: 'Supreme Red. Tee 1"x1/2"', sku: 'SUP-RT-1x12' },
    { name: 'Supreme Red. Tee 1"x3/4"', sku: 'SUP-RT-1x34' },
    { name: 'Supreme Red. Tee 1 1/4"x1/2"', sku: 'SUP-RT-114x12' },
    { name: 'Supreme Red. Tee 1 1/4"x3/4"', sku: 'SUP-RT-114x34' },
    { name: 'Supreme Red. Tee 1 1/2"x1"', sku: 'SUP-RT-112x1' },
    { name: 'Supreme Red. Tee 1 1/2"x1 1/4"', sku: 'SUP-RT-112x114' },
    { name: 'Supreme Red. Tee 2"x1/2"', sku: 'SUP-RT-2x12' },
    { name: 'Supreme Red. Tee 2"x3/4"', sku: 'SUP-RT-2x34' },
    { name: 'Supreme Red. Tee 2"x1"', sku: 'SUP-RT-2x1' },
    { name: 'Supreme Red. Tee w/o Rib 1"x3/4"', sku: 'SUP-RT-NR-1x34' },
    { name: 'Supreme Red. F.Th. Elbow (Metal) 3/4"x1/2"', sku: 'SUP-RFTE-M-34x12' },
    { name: 'Supreme Red. F.Th. Elbow (Metal) 1"x1/2"', sku: 'SUP-RFTE-M-1x12' },
    { name: 'Supreme Red. F.Th. Elbow (Metal) 1"x3/4"', sku: 'SUP-RFTE-M-1x34' },
    { name: 'Supreme Red. F.Th. Elbow (Metal) 1 1/4"x1/2"', sku: 'SUP-RFTE-M-114x12' },
    { name: 'Supreme Red. F.Th. Elbow (Brass w/o Rib) 3/4"x1/2"', sku: 'SUP-RFTE-B-34x12' },
    { name: 'Supreme Red. F.Th. Elbow (Brass w/o Rib) 1"x1/2"', sku: 'SUP-RFTE-B-1x12' },
    { name: 'Supreme Red. M.Th. Elbow (Metal) 3/4"x1/2"', sku: 'SUP-RMTE-M-34x12' },
    { name: 'Supreme Red. F.Th. Tee (Metal) 3/4"x1/2"', sku: 'SUP-RFTT-M-34x12' },
    { name: 'Supreme Red. F.Th. Tee (Metal) 1"x1/2"', sku: 'SUP-RFTT-M-1x12' },
    { name: 'Supreme Red. F.Th. Tee (Metal) 1"x3/4"', sku: 'SUP-RFTT-M-1x34' },
    { name: 'Supreme Red. F.Th. Tee (Metal) 1 1/4"x1/2"', sku: 'SUP-RFTT-M-114x12' },
    { name: 'Supreme Red. F.Th. Tee (Metal) W/o Rib 3/4"x1/2"', sku: 'SUP-RFTT-M-NR-34x12' },
    { name: 'Supreme Red. M.Th. Tee (Metal) 3/4"x1/2"', sku: 'SUP-RMTT-M-34x12' },
    { name: 'Supreme Red. F. T. A. (Metal) 3/4"x1/2"', sku: 'SUP-RFTA-M-34x12' },
    { name: 'Supreme Red. F. T. A. (Metal) 1"x1/2"', sku: 'SUP-RFTA-M-1x12' },
    { name: 'Supreme Red. F. T. A. (Metal) 1"x3/4"', sku: 'SUP-RFTA-M-1x34' },
    { name: 'Supreme Red. F.T. A. (Plastic) 3/4"x1/2"', sku: 'SUP-RFTA-P-34x12' },
    { name: 'Supreme Red. M. T. A. (Metal) 3/4"x1/2"', sku: 'SUP-RMTA-M-34x12' },
    { name: 'Supreme Red. M. T. A. (Metal) 1"x1/2"', sku: 'SUP-RMTA-M-1x12' },
    { name: 'Supreme Red. M. T. A. (Metal) 1"x3/4"', sku: 'SUP-RMTA-M-1x34' },
    { name: 'Supreme Red. M. T. A. (Plastic) 3/4"x1/2"', sku: 'SUP-RMTA-P-34x12' },
    { name: 'Supreme ELBOW HOLDER (Plastic) 3/4"x1/2"', sku: 'SUP-EH-P-34x12' },
    { name: 'Supreme Wall Mixer Fixture 3/4"x1/2"', sku: 'SUP-WMF-34x12' },
    { name: 'Supreme Wall Mixer Fixture SET (TOP & BOTTOM) 3/4"x1/2"', sku: 'SUP-WMFS-TB-34x12' },
    { name: 'Supreme Wall Mixer Fixture SET (TOP & BOTTOM) 1"x1/2"', sku: 'SUP-WMFS-TB-1x12' },
    { name: 'Supreme Wall Mixer Fixture SET (TOP & SIDE) 3/4"x1/2"', sku: 'SUP-WMFS-TS-34x12' },
    { name: 'Supreme Wall Mixer Fixture SET (TOP & SIDE) 1"x1/2"', sku: 'SUP-WMFS-TS-1x12' },
    { name: 'Supreme Wall Mixer Fixture SET (ALL TOP) 3/4"x1/2"', sku: 'SUP-WMFS-AT-34x12' },
    { name: 'Supreme Wall Mixer Fixture SET (ALL TOP) 1"x1/2"', sku: 'SUP-WMFS-AT-1x12' },
    { name: 'Supreme Reducer SDR 9 1"x3/4"', sku: 'SUP-RED-SDR9-1x34' },
    { name: 'Supreme Red. F. T. A. (Metal) SDR 9 3/4"x1/2"', sku: 'SUP-RFTA-M-SDR9-34x12' },
    { name: 'Supreme Red. F. T. A. (Metal) SDR 9 1"x1/2"', sku: 'SUP-RFTA-M-SDR9-1x12' },
    { name: 'Supreme Red. M. T. A. (Metal) SDR 9 3/4"x1/2"', sku: 'SUP-RMTA-M-SDR9-34x12' },
    { name: 'Supreme Red. F.Th. Elbow (Metal) SDR 9 3/4"x1/2"', sku: 'SUP-RFTE-M-SDR9-34x12' },
    { name: 'Supreme Red. F.Th. Elbow (Metal) SDR 9 1"x1/2"', sku: 'SUP-RFTE-M-SDR9-1x12' }
  ].map(prod => ({
    title: prod.name,
    description: "Supreme CPVC Fitting. High quality and durable.",
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=2070&auto=format&fit=crop",
    bgColor: "bg-blue-50",
    brand: "Supreme",
    category: "CPVC FITTING",
    features: ["Supreme Quality", "Durable", "Easy Installation"],
    tableData: [
      { sizeCm: "-", sizeInch: "-", code: prod.sku, pkg: "-", price: "Price on Request" }
    ]
  }));

  // Combine hardcoded and DB products
  const allProducts = [...cpvcProducts, ...supremeCpvcProducts, ...dbProducts];

  // Filtered products
  const filteredProducts = allProducts.filter(product => {
    const isSearchActive = searchQuery.trim().length > 0;
    
    const matchesSearch = (product.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    // When searching, ignore the brand tab selection so users can find products across all brands
    const matchesBrand = isSearchActive ? true : product.brand === selectedBrand;
    
    const matchesSize = selectedSize === 'All' || 
                        product.size === selectedSize || 
                        product.tableData?.some(row => row.sizeInch === selectedSize || row.sizeCm === selectedSize);
    
    const matchesPressure = selectedPressure === 'All' || product.pressureRating === selectedPressure;

    return matchesSearch && matchesCategory && matchesBrand && matchesSize && matchesPressure;
  });
  
  console.log("CPVC Page state:", { selectedBrand, selectedCategory, dbProductsCount: dbProducts.length, allProductsCount: allProducts.length, filteredCount: filteredProducts.length });

  return (
    <div className="pt-20 min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-orange font-bold transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
      </div>

      {/* Header Section */}
      <section className="relative py-16 md:py-24 px-6 overflow-hidden bg-[#f8fafc]">
        {/* Pattern Background (+) */}
        <div className="absolute inset-0 opacity-[0.1] pointer-events-none" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 19V0h2v19h19v2H21v19h-2V21H0v-2h19z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full bg-[#fef3c7] border border-amber-200 shadow-sm mb-8 md:mb-10"
          >
            <Shield size={14} className="text-brand-orange" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-brand-orange">AUTHORIZED DEALER — ALL BRANDS</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-8xl font-black text-slate-900 mb-6 md:mb-8 tracking-tighter"
          >
            CPVC Pipes & Fittings
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-base md:text-2xl max-w-4xl mx-auto leading-relaxed px-4"
          >
            Complete range of CPVC fittings from top brands — <span className="text-slate-900 font-medium">Astral, Birla NU, Finolex & Supreme.</span>
          </motion.p>
        </div>
      </section>

      {/* Brand Selector */}
      <section className="py-12 px-6 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4">
            {brands.map((brand, idx) => (
              <motion.button
                key={brand.name}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBrand(brand.name)}
                className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-4 md:py-5 rounded-2xl border transition-all ${
                  selectedBrand === brand.name 
                    ? 'bg-brand-orange border-brand-orange text-brand-dark shadow-xl shadow-brand-orange/20' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-orange/50'
                } ${idx === brands.length - 1 && brands.length % 2 !== 0 ? 'col-span-2 mx-auto max-w-[50%]' : ''}`}
              >
                <span className="font-black text-lg md:text-xl">{brand.name}</span>
                <span className={`text-[10px] md:text-[11px] font-bold ${selectedBrand === brand.name ? 'text-brand-dark/60' : 'text-slate-400'}`}>
                  {brand.sub}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="py-8 md:py-10 px-6 sticky top-20 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-6">
          <div className="relative flex-grow w-full lg:w-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search products... (e.g. elbow, valve, tee)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-orange/10 focus:border-brand-orange/50 transition-all text-base"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold focus:ring-2 focus:ring-brand-orange/20 outline-none"
            >
              <option value="All">All Sizes</option>
              <option value='1/2"'>1/2"</option>
              <option value='3/4"'>3/4"</option>
              <option value='1"'>1"</option>
              <option value='1 1/4"'>1 1/4"</option>
              <option value='1 1/2"'>1 1/2"</option>
              <option value='2"'>2"</option>
            </select>

            <select
              value={selectedPressure}
              onChange={(e) => setSelectedPressure(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold focus:ring-2 focus:ring-brand-orange/20 outline-none"
            >
              <option value="All">All Pressure</option>
              <option value="SDR 11">SDR 11</option>
              <option value="SDR 13.5">SDR 13.5</option>
              <option value="SCH 40">SCH 40</option>
              <option value="SCH 80">SCH 80</option>
            </select>

            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block"></div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-brand-orange border-brand-orange text-brand-dark shadow-lg shadow-brand-orange/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-brand-orange/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-20 px-6 bg-slate-50/30">
        <div className="max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:gap-8">
              {filteredProducts.map((product, idx) => (
                <div
                  key={idx}
                  onClick={() => onProductSelect(product)}
                  className="cursor-pointer h-full"
                >
                  <ProductCard 
                    title={product.title}
                    description={product.description}
                    image={product.image}
                    bgColor={product.bgColor}
                    category={product.category}
                    onAddToQuote={(e) => {
                      e.stopPropagation();
                      onOpenSizeSelection(product);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
              <div className="text-xs text-slate-400 mt-4 mb-4">
                Debug: Brand={selectedBrand}, Cat={selectedCategory}, DB={dbProducts.length}, All={allProducts.length}
              </div>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-6 text-brand-orange font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const self = this as any;
    if (self.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(self.state.error.message);
        if (parsed.error && (parsed.error as string).includes("Missing or insufficient permissions")) {
          errorMessage = "You don't have permission to perform this action.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#1e293b] rounded-3xl p-8 border border-white/10 shadow-2xl">
            <AlertTriangle className="text-brand-orange mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-white/60 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-orange text-brand-dark py-3 rounded-xl font-bold hover:bg-orange-400 transition-all"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return self.props.children;
  }
}

export default function App() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'HOME' | 'CPVC_PIPES' | 'ANJUL_SANITARYWARE' | 'ASTRAL_PRODUCTS' | 'WHY_US' | 'CONTACT_US' | 'PRODUCT_DETAIL' | 'LOGIN' | 'USER_DASHBOARD'>('HOME');
  const [previousView, setPreviousView] = useState<'HOME' | 'CPVC_PIPES' | 'ANJUL_SANITARYWARE' | 'ASTRAL_PRODUCTS' | 'WHY_US' | 'CONTACT_US'>('HOME');
  const [selectedProduct, setSelectedProduct] = useState<CPVCProduct | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [productForQuote, setProductForQuote] = useState<CPVCProduct | null>(null);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteItemCount, setQuoteItemCount] = useState(0);
  const [astralInitialCollection, setAstralInitialCollection] = useState('All');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      await logAction('login', 'User logged in via Google');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logAction('logout', 'User logged out');
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleViewChange = (view: any, collection: string = 'All') => {
    setAstralInitialCollection(collection);
    setCurrentView(view);
  };

  // Scroll to top whenever currentView changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleOpenSizeSelection = (product: CPVCProduct) => {
    setProductForQuote(product);
    setIsSizeModalOpen(true);
  };

  const handleSizeConfirm = (size: string) => {
    if (productForQuote) {
      setQuoteMessage(prev => {
        const newItem = `- ${productForQuote.title} (Size: ${size})`;
        if (prev) {
          return `${prev}\n${newItem}`;
        }
        return `I would like to get a quote for:\n${newItem}`;
      });
      setQuoteItemCount(prev => prev + 1);
      setIsSizeModalOpen(false);
      // Do not open quote modal automatically
      // setIsQuoteModalOpen(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdminOpen(false);
      }
      if (currentUser) {
        // Ensure user document exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: currentUser.email === 'anshsinghal1500@gmail.com' ? 'admin' : 'client',
              createdAt: serverTimestamp()
            });
          } else {
            // Optional: Update role if it's the admin email but not set as admin
            const data = userDoc.data();
            if (currentUser.email === 'anshsinghal1500@gmail.com' && data.role !== 'admin') {
              await updateDoc(userRef, { role: 'admin' });
            }
          }
        } catch (error) {
          console.error("Error ensuring user document:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const trackVisitor = async () => {
      let sessionId = sessionStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('visitor_session_id', sessionId);
      }

      const visitorRef = doc(db, 'visitors', sessionId);
      const updateVisitor = async (action = 'Viewing Page') => {
        try {
          // Try to get IP-based location for "automatic" experience
          let locationInfo = 'Live Visitor';
          try {
            const geoRes = await fetch('https://ipapi.co/json/');
            const geoData = await geoRes.json();
            if (geoData.city) {
              locationInfo = `${geoData.city}, ${geoData.region}`;
            }
          } catch (e) {
            console.warn("IP Geolocation fallback:", e);
          }

          await setDoc(visitorRef, {
            id: sessionId,
            lastActive: serverTimestamp(),
            page: window.location.pathname + window.location.hash,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            action: action,
            city: locationInfo
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `visitors/${sessionId}`);
        }
      };

      updateVisitor();
      const handleHashChange = () => updateVisitor();
      window.addEventListener('hashchange', handleHashChange);
      const interval = setInterval(() => updateVisitor('Active'), 30000);

      return () => {
        window.removeEventListener('hashchange', handleHashChange);
        clearInterval(interval);
      };
    };

    trackVisitor();
  }, []);

  useEffect(() => {
    // Request geolocation on load, but only once per session to avoid repeated prompts
    const hasRequested = sessionStorage.getItem('geo_requested');
    if (!hasRequested && "geolocation" in navigator) {
      sessionStorage.setItem('geo_requested', 'true');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location access granted:", position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Location access denied or error:", error.message);
        }
      );
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-brand-dark">
        <Navbar 
          onOpenQuote={() => setIsQuoteModalOpen(true)} 
          onOpenAdmin={() => setIsAdminOpen(true)}
          onViewChange={handleViewChange}
          quoteItemCount={quoteItemCount}
        />
        <main>
          <AnimatePresence mode="wait">
            {currentView === 'LOGIN' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoginPage onLoginSuccess={() => setCurrentView('HOME')} />
              </motion.div>
            ) : currentView === 'USER_DASHBOARD' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-screen bg-[#020617] pt-32 pb-20"
              >
                <UserDashboard onOpenQuote={() => setIsQuoteModalOpen(true)} />
              </motion.div>
            ) : currentView === 'WHY_US' ? (
              <motion.div
                key="why-us"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WhyUsPage onBack={() => setCurrentView('HOME')} />
              </motion.div>
            ) : currentView === 'CONTACT_US' ? (
              <motion.div
                key="contact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ContactUsPage />
              </motion.div>
            ) : currentView === 'HOME' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Hero 
                  onOpenQuote={() => setIsQuoteModalOpen(true)} 
                  onSearch={(query) => {
                    setGlobalSearchQuery(query);
                    setCurrentView('CPVC_PIPES');
                  }}
                  onExplore={() => {
                    setGlobalSearchQuery('');
                    setCurrentView('CPVC_PIPES');
                  }}
                />
                <ProductRange onViewChange={handleViewChange} />
                <PopularFittings />
                <TopBrands />
                <ServiceArea />
                <WhyUs onViewChange={setCurrentView} />
                <HowWeWork />
                <TrustTestimonials />
              </motion.div>
            ) : currentView === 'CPVC_PIPES' ? (
              <motion.div
                key="cpvc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CPVCPipesPage 
                  onOpenQuote={() => setIsQuoteModalOpen(true)} 
                  onProductSelect={(product) => {
                    setSelectedProduct(product);
                    setPreviousView('CPVC_PIPES');
                    setCurrentView('PRODUCT_DETAIL');
                  }}
                  onBack={() => setCurrentView('HOME')}
                  onOpenSizeSelection={handleOpenSizeSelection}
                  initialSearchQuery={globalSearchQuery}
                />
              </motion.div>
            ) : currentView === 'ANJUL_SANITARYWARE' ? (
              <motion.div
                key="anjul"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnjulSanitarywarePage 
                  onOpenQuote={() => setIsQuoteModalOpen(true)} 
                  onProductSelect={(product) => {
                    setSelectedProduct(product as CPVCProduct);
                    setPreviousView('ANJUL_SANITARYWARE');
                    setCurrentView('PRODUCT_DETAIL');
                  }}
                  onBack={() => setCurrentView('HOME')}
                  onOpenSizeSelection={handleOpenSizeSelection}
                />
              </motion.div>
            ) : currentView === 'ASTRAL_PRODUCTS' ? (
              <motion.div
                key="astral"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AstralProductsPage 
                  onOpenQuote={() => setIsQuoteModalOpen(true)} 
                  onProductSelect={(product) => {
                    setSelectedProduct(product as CPVCProduct);
                    setPreviousView('ASTRAL_PRODUCTS');
                    setCurrentView('PRODUCT_DETAIL');
                  }}
                  onBack={() => setCurrentView('HOME')}
                  onOpenSizeSelection={handleOpenSizeSelection}
                  initialCollection={astralInitialCollection}
                />
              </motion.div>
            ) : (
              <motion.div
                key="product-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ProductDetailPage 
                  product={selectedProduct} 
                  onBack={() => setCurrentView(previousView)} 
                  onOpenSizeSelection={handleOpenSizeSelection}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <Footer onViewChange={setCurrentView} />
        <PriceBanner />
        <FloatingButtons onOpenChat={() => setIsChatOpen(!isChatOpen)} />
        <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        <QuoteModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} initialMessage={quoteMessage} onSuccess={() => { setQuoteMessage(''); setQuoteItemCount(0); }} />
        {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
        <SizeSelectionModal 
          isOpen={isSizeModalOpen} 
          onClose={() => setIsSizeModalOpen(false)} 
          product={productForQuote} 
          onConfirm={handleSizeConfirm} 
        />
      </div>
    </ErrorBoundary>
  );
}
