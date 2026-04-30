import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Leaf, 
  Search, 
  Plus, 
  MessageSquare, 
  ThumbsUp, 
  Award, 
  BookOpen, 
  ArrowRight,
  ShieldCheck,
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Recipe {
  id: string;
  title: string;
  description: string;
  author: string;
  image: string;
  likes: number;
  comments: number;
  isValidated: boolean;
  category: string;
}

const MOCK_RECIPES: Recipe[] = [
  { 
    id: '1', 
    title: 'Infusion de Neem & Artémisia', 
    description: 'Renfort immunitaire traditionnel utilisé pour son action purifiante.',
    author: 'Mama Africa',
    image: 'https://images.unsplash.com/photo-1544733422-251e533ca97c?w=400&h=300&fit=crop',
    likes: 124,
    comments: 18,
    isValidated: true,
    category: 'Immunité'
  },
  { 
    id: '2', 
    title: 'Sirop de Gingembre et Miel', 
    description: 'Remède naturel contre la toux sèche et les irritations de la gorge.',
    author: 'Chef Herboriste',
    image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=300&fit=crop',
    likes: 89,
    comments: 12,
    isValidated: true,
    category: 'Respiratoire'
  },
  { 
    id: '3', 
    title: 'Macérat d\'Aloe Vera Pur', 
    description: 'Soin cicatrisant pour les brûlures légères et l\'hydratation cutanée.',
    author: 'BioSante',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop',
    likes: 256,
    comments: 45,
    isValidated: false,
    category: 'Dermatologie'
  },
];

export function Traditional() {
  const [activeFilter, setActiveFilter] = useState('Tous');

  const categories = ['Tous', 'Immunité', 'Respiratoire', 'Digestion', 'Stress', 'Dermatologie'];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Médecine Traditionnelle</h1>
          <p className="text-slate-500 font-medium">Savoir-faire ancestral & remèdes naturels validés.</p>
        </div>
        <button className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-brand-600/20 hover:scale-105 transition-all">
          <Plus size={20} />
          Publier une recette
        </button>
      </header>

      {/* Featured Banner */}
      <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 text-white min-h-[300px] flex items-center p-8 md:p-12">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1502472992487-44c130f6d901?w=1200&h=600&fit=crop" 
            className="w-full h-full object-cover opacity-40 grayscale"
            alt="Nature"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            Patrimoine Culturel
          </div>
          <h2 className="text-4xl font-display font-bold leading-tight">
            Conserver le savoir <br />
            <span className="text-brand-600 text-emerald-400">par la preuve scientifique.</span>
          </h2>
          <p className="text-slate-300">
            Chaque recette partagée est soumise à une relecture par nos pharmaciens partenaires pour garantir votre sécurité.
          </p>
          <div className="flex gap-4">
            <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
              Apprendre plus
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
              activeFilter === cat 
                ? "bg-slate-900 text-white border-slate-900" 
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_RECIPES.map((recipe, i) => (
          <motion.div 
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="relative h-64">
              <img src={recipe.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={recipe.title} />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-900">
                {recipe.category}
              </div>
              {recipe.isValidated && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                  <ShieldCheck size={18} />
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-display font-bold text-slate-900 mb-2">{recipe.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed flex-1">
                {recipe.description}
              </p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {recipe.author[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{recipe.author}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                    <ThumbsUp size={16} />
                    <span className="text-xs font-bold">{recipe.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-clinical-600 transition-colors">
                    <MessageSquare size={16} />
                    <span className="text-xs font-bold">{recipe.comments}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Encyclopedia CTA */}
      <section className="bg-slate-50 rounded-[3rem] p-8 md:p-16 text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto text-emerald-600">
          <BookOpen size={40} />
        </div>
        <h2 className="text-3xl font-display font-bold">L'Encyclopédie des Plantes</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Découvrez les propriétés et vertus botaniques de plus de 500 plantes médicinales.
        </p>
        <button className="inline-flex items-center gap-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all">
          Consulter l'almanach
          <ChevronRight size={18} />
        </button>
      </section>
    </div>
  );
}
