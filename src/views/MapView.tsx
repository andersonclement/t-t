import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Search, 
  Navigation, 
  PhoneCall, 
  Clock, 
  Star, 
  Filter,
  Hospital,
  Building2,
  Microscope,
  Stethoscope as DoctorIcon,
  ChevronRight,
  Route,
  Pill,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../lib/utils';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface HealthActor {
  id: string;
  name: string;
  type: 'pharmacy' | 'hospital' | 'lab' | 'practitioner';
  address: string;
  distance: string;
  isOpen: boolean;
  rating: number;
  specialty?: string;
  coordinates: [number, number]; // [lat, lng]
}

const MOCK_ACTORS: HealthActor[] = [
  { id: '1', name: 'Pharmacie de la Paix', type: 'pharmacy', address: 'Akwa, Douala', distance: '450m', isOpen: true, rating: 4.8, coordinates: [4.0511, 9.7679] },
  { id: '2', name: 'Hôpital Général', type: 'hospital', address: 'Quartier Ngodi, Douala', distance: '1.2km', isOpen: true, rating: 4.5, coordinates: [4.0611, 9.7779] },
  { id: '3', name: 'Laboratoire Central', type: 'lab', address: 'Bonapriso, Douala', distance: '800m', isOpen: false, rating: 4.2, coordinates: [4.0411, 9.7579] },
  { id: '4', name: 'Hôpital de Référence', type: 'hospital', address: 'Messa, Yaoundé', distance: '2.1km', isOpen: true, rating: 4.9, coordinates: [3.8480, 11.5021] },
  { id: '5', name: 'Pharmacie Saint-Jean', type: 'pharmacy', address: 'Bonanjo, Douala', distance: '1.5km', isOpen: true, rating: 4.6, coordinates: [4.045, 9.770] },
  { id: '6', name: 'Clinique de l\'Espoir', type: 'hospital', address: 'Logpom, Douala', distance: '3.2km', isOpen: true, rating: 4.3, coordinates: [4.080, 9.750] },
];

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function MapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pharmacy' | 'hospital' | 'lab'>('all');
  const [activeActor, setActiveActor] = useState<HealthActor | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0511, 9.7679]); 
  const [isExpanded, setIsExpanded] = useState(false);

  const filtered = MOCK_ACTORS.filter(a => {
    const matchesFilter = filter === 'all' || a.type === filter;
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         a.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const customIcon = (type: string, isActive: boolean) => {
    const color = type === 'hospital' ? '#2563eb' : type === 'pharmacy' ? '#10b981' : '#a855f7';
    const emoji = type === 'pharmacy' ? '💊' : type === 'hospital' ? '🏥' : '🔬';
    const size = isActive ? 48 : 38;
    
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
          <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full drop-shadow-lg" fill="${color}" stroke="white" stroke-width="1.5">
            <path d="M12 21.7C12 21.7 20 16 20 9.5C20 5.1 16.4 1.5 12 1.5C7.6 1.5 4 5.1 4 9.5C4 16 12 21.7 12 21.7Z" />
            <circle cx="12" cy="9.5" r="4.5" fill="white" />
          </svg>
          <div class="relative z-10 text-[${size/4}px] mb-2">${emoji}</div>
          ${isActive ? '<div class="absolute -bottom-1 w-2 h-0.5 bg-black/20 blur-[1px] rounded-full"></div>' : ''}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size], // Anchor at bottom center
      popupAnchor: [0, -size],
    });
  };

  return (
    <div className={cn(
      "h-[calc(100dvh-220px)] md:h-[calc(100vh-160px)] flex flex-col md:flex-row gap-4 transition-all duration-500",
      isExpanded && "fixed inset-0 z-[1000] h-[100dvh] w-screen p-0 bg-white md:p-4 md:bg-slate-900/40 md:backdrop-blur-md overflow-hidden"
    )}>
      {/* Search & Sidebar */}
      <div className={cn(
        "w-full md:w-96 flex flex-col gap-4 transition-all duration-500",
        isExpanded && "hidden md:flex md:w-0 md:opacity-0 md:pointer-events-none md:overflow-hidden overflow-hidden h-0 md:h-auto opacity-0"
      )}>
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Chercher pharmacie, hôpital..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-brand-600/10 outline-none transition-all text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 pb-1">
            <MapFilter label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} />
            <MapFilter label="Pharmacies" active={filter === 'pharmacy'} onClick={() => setFilter('pharmacy')} />
            <MapFilter label="Hôpitaux" active={filter === 'hospital'} onClick={() => setFilter('hospital')} />
            <MapFilter label="Labos" active={filter === 'lab'} onClick={() => setFilter('lab')} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {filtered.map(actor => (
            <motion.div 
              key={actor.id}
              whileHover={{ x: 5 }}
              onClick={() => {
                setMapCenter(actor.coordinates);
                setActiveActor(actor);
              }}
              className={cn(
                "bg-white rounded-2xl p-4 border border-slate-100 shadow-sm cursor-pointer group transition-all",
                activeActor?.id === actor.id && "border-brand-600 ring-2 ring-brand-600/10"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl text-white",
                    actor.type === 'hospital' ? "bg-clinical-600" :
                    actor.type === 'pharmacy' ? "bg-emerald-500" : "bg-purple-500"
                  )}>
                    {actor.type === 'hospital' && <Building2 size={18} />}
                    {actor.type === 'pharmacy' && <Pill size={18} />}
                    {actor.type === 'lab' && <Microscope size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{actor.name}</h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium italic">
                      <MapPin size={10} />
                      {actor.address}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-400 mb-1">
                    <Star size={10} fill="currentColor" />
                    <span className="text-[10px] font-bold">{actor.rating}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">{actor.distance}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    actor.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {actor.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>
                <div className="flex gap-2">
                   <button className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors">
                     <PhoneCall size={14} />
                   </button>
                   <a 
                     href={`https://www.google.com/maps/dir/?api=1&destination=${actor.coordinates[0]},${actor.coordinates[1]}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 transition-colors"
                   >
                     <Navigation size={14} />
                   </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Real Interactive Map Content Area */}
      <div className={cn(
        "flex-1 bg-slate-200 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-xl z-0 transition-all duration-500 min-h-[300px] md:min-h-0",
        isExpanded && "rounded-none md:rounded-[2.5rem] border-0 md:border-4"
      )}>
        <MapContainer 
          key={isExpanded ? 'expanded' : 'normal'} // Force re-render to recalculate size
          center={mapCenter} 
          zoom={13} 
          minZoom={3}
          maxZoom={19}
          scrollWheelZoom={true} 
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ChangeView center={mapCenter} />
          {filtered.map(actor => (
            <Marker 
              key={actor.id} 
              position={actor.coordinates}
              icon={customIcon(actor.type, activeActor?.id === actor.id)}
              eventHandlers={{
                click: () => setActiveActor(actor),
              }}
            >
              <Popup>
                <div className="p-1 font-sans min-w-[200px]">
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
                    <span>{actor.name}</span>
                  </h5>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 text-orange-400">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-bold">{actor.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">• {actor.distance}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4 flex items-start gap-1 leading-relaxed">
                    <MapPin size={12} className="mt-0.5 shrink-0 text-brand-600" />
                    {actor.address}
                  </p>
                  <div className="flex gap-2">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${actor.coordinates[0]},${actor.coordinates[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-brand-600 text-white text-[10px] py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-sm active:scale-95"
                    >
                      <Navigation size={14} />
                      Itinéraire
                    </a>
                    <button className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                      <PhoneCall size={14} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Map Overlays */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/40 shadow-xl">
             <div className="w-3 h-3 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
             <span className="text-xs font-bold text-slate-800 tracking-tight">Carte Haute Précision</span>
          </div>

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl text-slate-600 hover:text-brand-600 transition-colors"
          >
            {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MapFilter({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
        active ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20" : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
      )}
    >
      {label}
    </button>
  );
}
