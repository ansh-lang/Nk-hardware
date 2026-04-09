import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Boxes, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  FileText, 
  Package, 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowRight,
  BarChart3
} from 'lucide-react';
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
import { db, handleFirestoreError, OperationType } from '../firebase';
import { logAction } from '../lib/audit';

interface InventoryManagerProps {
  onManageSuppliers?: () => void;
}

const InventoryManager = ({ onManageSuppliers }: InventoryManagerProps) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', sku: '', stock: 0, minStock: 0, category: 'Pipes' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(items);
      setLoading(false);

      // Low Stock Alert Logic
      items.forEach(async (item: any) => {
        if (item.stock <= item.minStock && item.status !== 'low-stock-alerted') {
          // Create notification
          try {
            await addDoc(collection(db, 'notifications'), {
              type: 'low_stock',
              message: `Low stock alert for ${item.name} (SKU: ${item.sku}). Current stock: ${item.stock}, Min stock: ${item.minStock}`,
              createdAt: serverTimestamp(),
              read: false
            });
            // Update item status to avoid duplicate alerts
            await updateDoc(doc(db, 'inventory', item.id), { status: 'low-stock-alerted' });
          } catch (error) {
            console.error("Failed to create low stock notification:", error);
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedItems) {
        await deleteDoc(doc(db, 'inventory', id));
      }
      await logAction('bulk_delete_inventory', `Deleted ${selectedItems.size} inventory items`);
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Error bulk deleting:", error);
    }
  };

  const handleAddStock = async () => {
    if (!newItem.name || !newItem.sku) return;
    setSubmitting(true);
    try {
      const status = newItem.stock === 0 ? 'out-of-stock' : newItem.stock < newItem.minStock ? 'low-stock' : 'in-stock';
      await addDoc(collection(db, 'inventory'), {
        ...newItem,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      await logAction('add_inventory', `Added new inventory item: ${newItem.name} (${newItem.sku})`);
      setIsAddModalOpen(false);
      setNewItem({ name: '', sku: '', stock: 0, minStock: 0, category: 'Pipes' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inventory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      await logAction('delete_inventory', `Deleted inventory item ID: ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
    }
  };

  const updateStockLevel = async (id: string, currentStock: number, change: number) => {
    try {
      const newStock = Math.max(0, currentStock + change);
      const item = inventory.find(i => i.id === id);
      if (!item) return;
      
      const status = newStock === 0 ? 'out-of-stock' : newStock < item.minStock ? 'low-stock' : 'in-stock';
      
      await updateDoc(doc(db, 'inventory', id), {
        stock: newStock,
        status,
        updatedAt: serverTimestamp()
      });
      await logAction('update_inventory_stock', `Updated stock for ${item.name} to ${newStock}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
    }
  };

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(i => i.status === 'low-stock').length;
  const outOfStockItems = inventory.filter(i => i.status === 'out-of-stock').length;
  const totalStockValue = inventory.reduce((acc, curr) => acc + (curr.stock * 100), 0); // Mock value calculation

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Stock & Inventory</h3>
          <p className="text-white/60 text-sm">Real-time inventory tracking and automated stock alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onManageSuppliers}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 text-sm transition-all"
          >
            <Truck size={16} /> Manage Suppliers
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-dark rounded-xl font-bold text-sm transition-all hover:scale-105"
          >
            <Plus size={18} /> Add Stock
          </button>
        </div>
      </div>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-white">Add New Stock Item</h4>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Product Name</label>
                  <input 
                    type="text" 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors"
                    placeholder="e.g. Birla CPVC Pipe 1.5 inch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">SKU / Code</label>
                  <input 
                    type="text" 
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors"
                    placeholder="e.g. B-CPVC-15"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Initial Stock</label>
                    <input 
                      type="number" 
                      value={newItem.stock}
                      onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Min. Threshold</label>
                    <input 
                      type="number" 
                      value={newItem.minStock}
                      onChange={(e) => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors appearance-none"
                  >
                    <option value="Pipes">Pipes</option>
                    <option value="Fittings">Fittings</option>
                    <option value="Sanitaryware">Sanitaryware</option>
                    <option value="Tools">Tools</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddStock}
                  disabled={submitting || !newItem.name || !newItem.sku}
                  className="flex-1 px-6 py-3 bg-brand-orange text-brand-dark rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirm Add'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems.toLocaleString(), icon: Boxes, color: 'text-blue-500' },
          { label: 'Low Stock', value: lowStockItems.toString(), icon: AlertCircle, color: 'text-amber-500' },
          { label: 'Out of Stock', value: outOfStockItems.toString(), icon: X, color: 'text-red-500' },
          { label: 'Stock Value', value: `₹${(totalStockValue / 100000).toFixed(1)}L`, icon: BarChart3, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{stat.label}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="text-white/40 text-sm">
            {selectedItems.size} items selected
          </div>
          {selectedItems.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 size={16} /> Delete Selected
            </button>
          )}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4">
                  <input 
                    type="checkbox"
                    checked={selectedItems.size === inventory.length && inventory.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(inventory.map(i => i.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                    className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                  />
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Product / SKU</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Category</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-center">Stock Level</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-orange mb-4" size={32} />
                    <p className="text-white/40">Loading inventory...</p>
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-white/40">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedItems);
                          if (e.target.checked) newSet.add(item.id);
                          else newSet.delete(item.id);
                          setSelectedItems(newSet);
                        }}
                        className="rounded border-white/10 bg-white/5 text-brand-orange focus:ring-brand-orange"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-brand-orange transition-colors">
                          <Package size={14} />
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{item.name}</div>
                          <div className="text-[10px] text-white/40 font-mono">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateStockLevel(item.id, item.stock, -1)}
                            className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
                          >
                            <TrendingDown size={12} />
                          </button>
                          <div className="text-sm font-bold text-white">{item.stock}</div>
                          <button 
                            onClick={() => updateStockLevel(item.id, item.stock, 1)}
                            className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
                          >
                            <TrendingUp size={12} />
                          </button>
                        </div>
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.status === 'out-of-stock' ? 'bg-red-500' :
                              item.status === 'low-stock' ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min((item.stock / (item.minStock * 2)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        item.status === 'in-stock' ? 'bg-emerald-500/10 text-emerald-500' :
                        item.status === 'low-stock' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-brand-orange transition-colors" title="Edit Stock">
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-red-500 transition-colors" 
                          title="Delete Item"
                        >
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

      {/* Automated Alerts */}
      <div className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-amber-500" size={24} />
          <h4 className="text-lg font-bold text-white">Automated Stock Alerts</h4>
        </div>
        <p className="text-sm text-white/60 mb-6 max-w-2xl">
          System detected {lowStockItems + outOfStockItems} items below minimum stock threshold. Automated purchase orders have been drafted for your primary suppliers.
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-amber-500 text-brand-dark rounded-xl font-bold text-sm hover:bg-amber-400 transition-all">Review Purchase Orders</button>
          <button className="px-6 py-2 bg-white/5 rounded-xl text-white font-bold text-sm hover:bg-white/10">Dismiss All</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
