import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  LogOut, 
  FileText, 
  ShoppingBag, 
  Heart,
  ChevronRight,
  Shield,
  HelpCircle,
  Mail,
  Calendar,
  Building2
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useOrders, Order } from '../components/OrderContext';
import { cn } from '../lib/utils';

export function Profile() {
  const { user, profile, logout, signInWithGoogle } = useAuth();
  const { orders } = useOrders();
  const [showOrders, setShowOrders] = React.useState(false);
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <User size={64} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display font-bold text-slate-900">Bienvenue sur PharmaConnect</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            Connectez-vous pour accéder à votre historique médical, vos prescriptions et suivre vos commandes.
          </p>
        </div>
        <button 
          onClick={signInWithGoogle}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all active:scale-95"
        >
          Se connecter avec Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 ring-8 ring-slate-50">
        <div className="relative">
          <img 
            src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'} 
            className="w-32 h-32 rounded-[2rem] object-cover ring-4 ring-brand-600/10" 
            alt="User" 
          />
          <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-2 rounded-xl shadow-lg border-4 border-white">
            <Settings size={16} />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
             {profile?.role === 'pharmacist' ? 'Pharmacien Certifié' : 'Patient Vérifié'}
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900">{user.displayName || 'Utilisateur'}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
            <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
              <Mail size={14} />
              {user.email}
            </p>
            <p className="text-slate-400 text-sm flex items-center gap-1 font-medium">
              <Calendar size={14} />
              Membre depuis fév. 2026
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="bg-slate-50 text-slate-400 p-4 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={24} />
        </button>
      </section>

      {/* Conditional Rendering: Main Hub vs Order History */}
      {!showOrders ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Context Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 px-1 italic">
              {profile?.role === 'pharmacist' ? 'Ma Pharmacie & Boutique' : 'Santé & Administratif'}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {profile?.role === 'pharmacist' ? (
                <>
                  <ProfileLink icon={<FileText className="text-blue-500" />} label="Licence Professionnelle" trailing="Valide" />
                  <ProfileLink icon={<Building2 className="text-emerald-500" />} label="Informations Établissement" />
                  <ProfileLink icon={<Shield className="text-slate-400" />} label="Paramètres de Sécurité" />
                </>
              ) : (
                <>
                  <ProfileLink icon={<FileText className="text-blue-500" />} label="Dossier Médical" trailing="Complet à 80%" />
                  <ProfileLink icon={<CreditCard className="text-emerald-500" />} label="Carte Vitale / Mutuelle" trailing="Vérifiée" />
                  <ProfileLink icon={<Heart className="text-red-500" />} label="Antécédents & Allergies" />
                  <ProfileLink icon={<Shield className="text-slate-400" />} label="Sécurité des données" />
                </>
              )}
            </div>
          </div>

          {/* Activity & Settings Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold text-slate-900 px-1 italic">
              {profile?.role === 'pharmacist' ? 'Gestion & Activité' : 'Commandes & Activité'}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {profile?.role === 'pharmacist' ? (
                <>
                  <ProfileLink icon={<ShoppingBag className="text-purple-500" />} label="Dashboard Ventes" onClick={() => window.location.href = '/'} />
                  <ProfileLink icon={<Bell className="text-orange-500" />} label="Alertes de Stock" trailing="12 alertes" />
                  <ProfileLink icon={<HelpCircle className="text-slate-400" />} label="Support Professionnel" />
                </>
              ) : (
                <>
                  <ProfileLink 
                    icon={<ShoppingBag className="text-purple-500" />} 
                    label="Historique de commandes" 
                    trailing={orders.length.toString()} 
                    onClick={() => setShowOrders(true)}
                  />
                  <ProfileLink icon={<Bell className="text-orange-500" />} label="Notifications & Rappels" trailing="3 actifs" />
                  <ProfileLink icon={<HelpCircle className="text-slate-400" />} label="Centre d'aide / FAQ" />
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-display font-bold text-slate-900">Historique de commandes</h3>
            <button 
              onClick={() => setShowOrders(false)}
              className="text-brand-600 font-bold text-sm hover:underline"
            >
              Retour au profil
            </button>
          </div>
          
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  className={cn(
                    "bg-white rounded-[2rem] border transition-all cursor-pointer overflow-hidden",
                    expandedOrderId === order.id ? "ring-2 ring-brand-600 border-transparent shadow-xl" : "border-slate-100 shadow-sm hover:shadow-md"
                  )}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.id}</p>
                        <p className="text-sm font-bold text-slate-900">{order.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          order.status === 'en_cours' ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {order.status === 'en_cours' ? 'En préparation' : 'Livré'}
                        </span>
                        <ChevronRight 
                          size={16} 
                          className={cn("text-slate-300 transition-transform", expandedOrderId === order.id && "rotate-90")} 
                        />
                      </div>
                    </div>
                    
                    {!expandedOrderId || expandedOrderId !== order.id ? (
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag size={20} className="text-slate-300" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    
                    {expandedOrderId === order.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-4 border-t border-slate-50"
                      >
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ShoppingBag size={14} className="text-slate-300" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">Prix unitaire: {item.price.toLocaleString()} FCFA</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-900">{item.count} x</p>
                                <p className="text-xs font-bold text-brand-600">{(item.price * item.count).toLocaleString()} FCFA</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Paiement</p>
                        <p className="text-xs font-bold text-slate-700">{order.paymentMethod.toUpperCase()}</p>
                      </div>
                      <p className="text-xl font-display font-bold text-brand-600">{order.total.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center space-y-4 italic text-slate-400">
                <ShoppingBag size={48} className="mx-auto opacity-20" />
                <p>Vous n'avez pas encore passé de commande.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Health Pass Concept Card */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="bg-gradient-to-br from-clinical-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-2xl font-display font-bold">Pass PharmaConnect</h4>
            <p className="text-blue-100 text-sm max-w-sm">
              Présentez ce code en pharmacie ou à l'hôpital pour un accès instantané à votre profil partagé.
            </p>
          </div>
          <div className="bg-white p-4 rounded-3xl w-48 h-48 mx-auto md:mx-0 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
               {/* Simulating QR */}
               <div className="grid grid-cols-4 gap-1 p-2">
                 {[...Array(16)].map((_, i) => (
                   <div key={i} className={cn("w-4 h-4 rounded-sm", (Math.random() > 0.5) ? "bg-slate-800" : "bg-transparent")} />
                 ))}
               </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      </motion.div>
    </div>
  );
}

function ProfileLink({ icon, label, trailing, onClick }: { icon: React.ReactNode; label: string; trailing?: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none group",
        !onClick && "cursor-default hover:bg-transparent"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-white transition-colors">{icon}</div>
        <span className="font-bold text-slate-800">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {trailing && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{trailing}</span>}
        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </button>
  );
}
