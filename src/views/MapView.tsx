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
    const size = isActive ? 48 : 36;
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); font-size: ${size/2}px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                ${emoji}
             </div>`,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2],
    });
  };

  return (
    <div className={cn(
      "h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 transition-all duration-500",
      isExpanded && "fixed inset-0 z-[100] h-screen w-screen p-0 md:p-4 bg-slate-900/40 backdrop-blur-md overflow-hidden"
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
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                   <button className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 transition-colors">
                     <Route size={14} />
                   </button>
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
          scrollWheelZoom={true} 
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                <div className="p-1 font-sans">
                  <h5 className="font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">{actor.name}</h5>
                  <p className="text-[10px] text-slate-500 mb-2">{actor.address}</p>
                  <button className="w-full bg-brand-600 text-white text-[10px] py-2 rounded-lg font-bold">
                    Voir détails
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Map Overlays */}
        <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-xl">
             <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
             <span className="text-xs font-bold text-slate-800">Map Interactive</span>
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
