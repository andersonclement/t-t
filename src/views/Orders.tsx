import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Clock, 
  User, 
  Package, 
  ChevronRight, 
  Loader2, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Check, 
  AlertTriangle,
  FileText,
  CreditCard,
  X
} from 'lucide-react';
import { useOrders, Order, OrderStatus } from '../components/OrderContext';
import { cn } from '../lib/utils';

export function Orders() {
  const { orders, updateOrderStatus, loading } = useOrders();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status lists
  const activeStatuses: OrderStatus[] = ['pending_validation', 'validated', 'preparing', 'out_for_delivery', 'en_cours'];
  const historyStatuses: OrderStatus[] = ['delivered', 'rejected', 'livre', 'annule'];

  // Helper to get status details
  const getStatusDetails = (status: OrderStatus) => {
    switch (status) {
      case 'pending_validation':
        return { label: 'À Valider', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      case 'validated':
        return { label: 'Validée', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Check };
      case 'preparing':
        return { label: 'En Préparation', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package };
      case 'out_for_delivery':
        return { label: 'En Livraison', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck };
      case 'delivered':
      case 'livre':
        return { label: 'Livrée', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'rejected':
      case 'annule':
        return { label: 'Refusée', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
      default:
        return { label: 'Inconnu', bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock };
    }
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
      // Update selectedOrder view state if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err) {
      console.error("Failed to transition status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'active' 
      ? activeStatuses.includes(order.status)
      : historyStatuses.includes(order.status);

    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (order.paymentMethod && order.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-brand-600" size={48} />
        <p className="font-bold uppercase tracking-widest text-[10px] text-slate-500">Chargement du flux des commandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-2 h-10 bg-brand-600 rounded-full" />
            Gestion des Commandes
          </h1>
          <p className="text-slate-500 font-medium">Validez, préparez et suivez le traitement des commandes en temps réel.</p>
        </div>
      </header>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: List with Filters */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto shrink-0">
              <button 
                onClick={() => {
                  setActiveTab('active');
                  setSelectedOrder(null);
                }}
                className={cn(
                  "flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  activeTab === 'active' ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Clock size={14} />
                Nouveaux ({orders.filter(o => activeStatuses.includes(o.status)).length})
              </button>
              <button 
                onClick={() => {
                  setActiveTab('history');
                  setSelectedOrder(null);
                }}
                className={cn(
                  "flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                  activeTab === 'history' ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <CheckCircle2 size={14} />
                Historique ({orders.filter(o => historyStatuses.includes(o.status)).length})
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-4 top-3 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Numéro, médicament..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-brand-600/10 focus:border-brand-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Orders list container */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 border border-slate-100">
                  <Package size={28} />
                </div>
                <div>
                  <p className="text-slate-900 font-black text-sm">Aucune commande trouvée</p>
                  <p className="text-slate-400 text-xs font-medium mt-1">Les commandes de vos patients apparaîtront ici.</p>
                </div>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const statusInfo = getStatusDetails(order.status);
                const StatusIcon = statusInfo.icon;
                const hasRegulatedItem = order.items.some(item => item.id && !item.id.startsWith('med-local-')); // Or keep it simple

                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedOrder(order)}
                    className={cn(
                      "p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-all cursor-pointer group",
                      selectedOrder?.id === order.id ? "bg-slate-50/90 border-l-4 border-l-brand-600 pl-5" : ""
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                        order.status === 'pending_validation' ? "bg-amber-50 border-amber-100 text-amber-500 animate-pulse" :
                        order.status === 'delivered' || order.status === 'livre' ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
                        "bg-blue-50 border-blue-100 text-blue-500"
                      )}>
                        <Package size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">Commande #{order.id.substring(0, 8).toUpperCase()}</h4>
                          <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", statusInfo.bg)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-sm font-medium">
                          {order.items.map(item => `${item.count}x ${item.name}`).join(', ')}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                          <span className="flex items-center gap-1"><User size={12} /> Patient: {order.patientId.substring(0, 6).toUpperCase()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {order.date || 'Récemment'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-none pt-4 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="font-black text-slate-900 text-sm">{order.total.toLocaleString()} FCFA</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{order.paymentMethod === 'cash' ? 'À la livraison' : 'Paiement Mobile'}</p>
                      </div>
                      <ChevronRight className={cn(
                        "text-slate-300 transition-all",
                        selectedOrder?.id === order.id ? "text-brand-600 translate-x-1" : "group-hover:text-brand-600 group-hover:translate-x-0.5"
                      )} size={18} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Order Detail & Actions */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div 
                key={selectedOrder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg p-6 space-y-6 sticky top-6"
              >
                {/* Detail Header */}
                <div className="flex justify-between items-start pb-4 border-b">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fiche de Commande</span>
                    <h3 className="font-display font-black text-slate-900 text-lg mt-0.5">#{selectedOrder.id.substring(0, 12).toUpperCase()}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Créée le {selectedOrder.date || 'Date récente'}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 border flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Patient Information */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={12} /> Informations Patient
                  </h4>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">ID Patient: <span className="font-mono font-black text-slate-600">{selectedOrder.patientId.toUpperCase()}</span></p>
                    <p className="text-slate-500 font-medium mt-1">Mode de Récupération: <span className="font-bold text-brand-600 uppercase">{selectedOrder.mode === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'}</span></p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package size={12} /> Produits Commandés
                  </h4>
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 border rounded-xl flex items-center justify-center shrink-0">
                            <Package className="text-slate-400" size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{item.price.toLocaleString()} FCFA / u</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">x{item.count}</p>
                          <p className="text-[11px] font-bold text-brand-600">{(item.price * item.count).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total and Payment */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Moyen de règlement :</span>
                    <span className="font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                      <CreditCard size={12} />
                      {selectedOrder.paymentMethod === 'cash' ? 'À la livraison' : 
                       selectedOrder.paymentMethod === 'om' ? 'Orange Money' : 'MTN MoMo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Montant total</span>
                    <span className="text-xl font-display font-black text-slate-900">{selectedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Interactive Workflow Action Buttons */}
                <div className="pt-2">
                  {updatingId === selectedOrder.id ? (
                    <div className="flex items-center justify-center py-4 text-slate-500 gap-2 font-bold text-xs uppercase tracking-widest">
                      <Loader2 className="animate-spin text-brand-600" size={18} />
                      Mise à jour en cours...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedOrder.status === 'pending_validation' && (
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'rejected')}
                            className="w-full py-3.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Refuser
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-600/10"
                          >
                            Valider & Préparer
                          </button>
                        </div>
                      )}

                      {selectedOrder.status === 'preparing' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'out_for_delivery')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Expédier / Prêt pour retrait
                        </button>
                      )}

                      {selectedOrder.status === 'out_for_delivery' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Marquer comme Livré
                        </button>
                      )}

                      {historyStatuses.includes(selectedOrder.status) && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed flex items-center justify-center text-slate-400 gap-2">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold uppercase tracking-widest">Commande Archivée</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 border-dashed p-12 text-center text-slate-400 sticky top-6">
                <FileText className="mx-auto text-slate-300 mb-4" size={40} />
                <h4 className="font-bold text-slate-700 text-sm">Aucune commande sélectionnée</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-medium">Sélectionnez une commande dans la liste pour voir sa fiche détaillée et lancer les actions de préparation.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
