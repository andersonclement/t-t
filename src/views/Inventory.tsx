import React from 'react';
import { Pill, Search, Plus, Filter, AlertTriangle, ArrowUpRight } from 'lucide-react';

export function Inventory() {
  const stock = [
    { name: "Paracétamol 500mg", type: "Comprimé", stock: 154, price: "1,500 FCFA", status: "ok" },
    { name: "Amoxicilline 1g", type: "Gélule", stock: 12, price: "4,500 FCFA", status: "low" },
    { name: "Sirop Toux Enfant", type: "Sirop", stock: 45, price: "3,200 FCFA", status: "ok" },
    { name: "Artéméther", type: "Injectable", stock: 8, price: "2,800 FCFA", status: "low" },
    { name: "Bétadine 100ml", type: "Solution", stock: 0, price: "1,800 FCFA", status: "out" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Inventaire & Stock</h1>
          <p className="text-slate-500 font-medium">Gérez vos produits et mettez à jour vos prix.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
          <Plus size={20} />
          Ajouter un Produit
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StockInfoCard label="Total Produits" value="1,245" color="bg-blue-600" />
        <StockInfoCard label="Ruptures" value="12" color="bg-rose-600" />
        <StockInfoCard label="Seuil Critique" value="34" color="bg-amber-600" />
        <StockInfoCard label="Valeur Stock" value="4.2M" unit="FCFA" color="bg-emerald-600" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600 outline-none transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
            <Filter size={16} />
            Filtres avancés
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produit</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Stock</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Prix Unitaire</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stock.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors">
                        <Pill size={18} />
                      </div>
                      <span className="font-bold text-slate-900 border-b border-transparent group-hover:border-brand-600/30 transition-all">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{item.type}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-sm font-black ${
                        item.status === 'out' ? 'text-rose-600' : item.status === 'low' ? 'text-amber-600' : 'text-slate-900'
                      }`}>
                        {item.stock}
                      </span>
                      {item.status !== 'ok' && (
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-rose-500">
                          <AlertTriangle size={8} /> Rupture
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-900 text-sm">{item.price}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors">
                      <ArrowUpRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StockInfoCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br ${color} from-slate-900`}>{value}</span>
        {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}
