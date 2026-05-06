import React from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, User, Package, ChevronRight, Loader2 } from 'lucide-react';
import { useOrders } from '../components/OrderContext';

export function Orders() {
  const { orders, loading } = useOrders();

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="font-bold uppercase tracking-widest text-xs">Chargement des commandes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-display font-bold text-slate-900">Gestion des Commandes</h1>
        <p className="text-slate-500 font-medium">Suivez et traitez les commandes de vos clients.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">Toutes ({orders.length})</button>
            <button className="px-4 py-2 text-slate-500 hover:bg-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">En attente</button>
            <button className="px-4 py-2 text-slate-500 hover:bg-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Prêts</button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {orders.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Package size={32} />
              </div>
              <p className="text-slate-500 font-medium italic">Aucune commande pour le moment.</p>
            </div>
          ) : (
            orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">Commande {order.id.substring(0, 8)}</h4>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-black uppercase">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                      <span className="flex items-center gap-1"><User size={12} /> Patient: {order.patientId.substring(0, 6)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {order.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="font-black text-slate-900 leading-tight">{order.total.toLocaleString()} FCFA</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{order.paymentMethod || 'Non spécifié'}</p>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-brand-600 transition-colors" size={20} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
