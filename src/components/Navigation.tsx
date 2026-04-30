import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Pill, Leaf, User, MessageCircle, AlertCircle, Microscope, BookOpen, Building2, Zap, HeartPulse, Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthContext';

export function Navigation() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          {/* Logo Section with Menu Toggle */}
          <div className="relative">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 group p-1 -ml-1 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
                <HeartPulse className="text-white" size={20} />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-lg md:text-xl text-slate-900 leading-none">DiagPharma</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform md:hidden", isOpen && "rotate-180")} />
                </div>
                <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest mt-0.5 hidden sm:block">Santé Connectée</span>
              </div>
            </button>

            {/* Mobile Dropdown Menu */}
            <AnimatePresence>
              {isOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 top-16 bg-slate-900/10 backdrop-blur-[2px] z-[40] md:hidden"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-14 left-0 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 z-[50] md:hidden"
                  >
                    <div className="flex flex-col gap-1">
                      <MobileMenuLink to="/" icon={<Home />} label="Accueil" onClick={() => setIsOpen(false)} />
                      <MobileMenuLink to="/map" icon={<Map />} label="Carte de Santé" onClick={() => setIsOpen(false)} />
                      <MobileMenuLink to="/directory" icon={<Building2 />} label="Répertoire Santé" onClick={() => setIsOpen(false)} />
                      <MobileMenuLink to="/ai-sante" icon={<Zap />} label="Assistant IA" onClick={() => setIsOpen(false)} />
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      <MobileMenuLink to="/profile" icon={<User />} label="Mon Profil" onClick={() => setIsOpen(false)} />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 h-full">
            <NavItem to="/" icon={<Home />} label="Accueil" />
            <NavItem to="/map" icon={<Map />} label="Carte" />
            <NavItem to="/directory" icon={<Building2 />} label="Répertoire" />
            <NavItem to="/ai-sante" icon={<Zap />} label="IA Santé" />
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <NavItem to="/profile" icon={<User />} label="Profil" />
          </div>

          {/* Quick Profile Link (Mobile) */}
          <NavLink to="/profile" className="md:hidden w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200 transition-colors hover:text-brand-600">
            <User size={18} />
          </NavLink>
        </div>
      </header>

      {/* Bottom Tabs: Mobile Only (Persistent fixed band) */}
    </>
  );
}

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-slate-200 md:hidden pb-safe shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-around h-16 w-full px-2">
        <MobileBottomTab to="/" icon={<Home />} label="Accueil" />
        <MobileBottomTab to="/map" icon={<Map />} label="Carte" />
        <MobileBottomTab to="/directory" icon={<Building2 />} label="Répertoire" />
        <MobileBottomTab to="/ai-sante" icon={<Zap />} label="IA Santé" />
        <MobileBottomTab to="/profile" icon={<User />} label="Profil" />
      </div>
    </nav>
  );
}

function MobileBottomTab({ to, icon, label }: { to: string; icon: React.ReactElement; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-300",
          isActive ? "text-brand-600" : "text-slate-400"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            {React.cloneElement(icon, { size: 20 } as any)}
            {isActive && (
              <motion.div 
                layoutId="activeTabBottom"
                className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-brand-600 rounded-full"
              />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function MobileMenuLink({ to, icon, label, onClick }: { to: string; icon: React.ReactElement; label: string; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all font-bold text-sm",
          isActive ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"
        )
      }
    >
      <span className="shrink-0">{React.cloneElement(icon, { size: 18 } as any)}</span>
      {label}
    </NavLink>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactElement; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-4 py-2 transition-all duration-300 relative rounded-xl font-bold text-sm whitespace-nowrap",
          isActive ? "text-brand-600 bg-brand-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
        )
      }
    >
      {({ isActive }) => (
        <>
          {React.cloneElement(icon, { size: 18 } as any)}
          <span>{label}</span>
          {isActive && (
            <motion.div 
              layoutId="activeTab"
              className="absolute bottom-0 left-4 right-4 h-0.5 bg-brand-600 rounded-full"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] pt-16 pb-24 md:pb-0 bg-slate-50 flex flex-col relative">
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto p-3 md:p-6 lg:p-8 overflow-x-hidden mb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Floating Emergency Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[50] bg-red-600 text-white p-3 md:p-4 rounded-full shadow-xl flex items-center gap-2 group transition-all"
        onClick={() => window.location.href = 'tel:15'}
      >
        <AlertCircle size={20} className="md:w-6 md:h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap uppercase tracking-tighter text-xs md:text-sm">
          Urgence 15
        </span>
      </motion.button>
    </div>
  );
}
