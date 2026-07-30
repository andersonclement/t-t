import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Search, 
  Navigation, 
  PhoneCall, 
  Star, 
  Building2,
  Microscope,
  Route,
  Pill,
  Maximize2,
  Minimize2,
  Activity,
  AlertTriangle,
  Car,
  Footprints
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
  type: 'pharmacy' | 'hospital' | 'lab';
  address: string;
  distance: string;
  isOpen: boolean;
  rating: number;
  coordinates: [number, number]; // [lat, lng]
  isDuty?: boolean;
}

// Relocated coordinates near Akwa, Douala (central point [4.0450, 9.7000]) 
// to correspond perfectly to their specified distances!
const MOCK_ACTORS: HealthActor[] = [
  { id: '1', name: 'Pharmacie de la Paix', type: 'pharmacy', address: 'Boulevard de la Liberté, Akwa, Douala', distance: '450m', isOpen: true, rating: 4.8, coordinates: [4.0475, 9.7032] },
  { id: '2', name: 'Hôpital Général de Douala', type: 'hospital', address: 'Quartier Ngodi, Douala', distance: '1.2km', isOpen: true, rating: 4.5, coordinates: [4.0535, 9.6925] },
  { id: '3', name: 'Laboratoire Central', type: 'lab', address: 'Rue de l\'Hôpital, Bonapriso, Douala', distance: '800m', isOpen: false, rating: 4.2, coordinates: [4.0405, 9.6960] },
  { id: '4', name: 'Hôpital de Référence de Douala', type: 'hospital', address: 'Quartier Bonanjo, Douala', distance: '2.1km', isOpen: true, rating: 4.9, coordinates: [4.0315, 9.6912] },
  { id: '5', name: 'Pharmacie Saint-Jean', type: 'pharmacy', address: 'Ancien Boulevard, Douala', distance: '1.5km', isOpen: true, rating: 4.6, coordinates: [4.0375, 9.7115] },
  { id: '6', name: 'Clinique de l\'Espoir', type: 'hospital', address: 'Quartier Logpom, Douala', distance: '3.2km', isOpen: true, rating: 4.3, coordinates: [4.0625, 9.7150] },
];

// Handles map view sync when center changes
function MapController({ center, isExpanded }: { center: [number, number]; isExpanded: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 14));
  }, [center, map]);

  return null;
}

// Automatically refits map viewport when container dimensions or state changes
function ResizeListener() {
  const map = useMap();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Invalidate size on load
    map.invalidateSize();
    
    // Setup high fidelity ResizeObserver to keep tiles loading perfectly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);
  return null;
}

export function MapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pharmacy' | 'hospital' | 'lab'>('all');
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [showGeolocBanner, setShowGeolocBanner] = useState(false);
  
  // Map style and Google Maps integration state
  const [mapStyle, setMapStyle] = useState<'google_roadmap' | 'google_hybrid' | 'google_terrain' | 'osm'>('google_roadmap');
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "44a563acc4145db94b88e1aafd9b8fca815b61e47a3fb3e1528edebb11308d69";

  // Default user location is central Akwa, Douala
  const [userLocation, setUserLocation] = useState<[number, number]>([4.0450, 9.7000]);
  const [activeActor, setActiveActor] = useState<HealthActor | null>(MOCK_ACTORS[0]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.0450, 9.7000]); 
  const [isExpanded, setIsExpanded] = useState(false);

  // Real OSRM Router states
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<string>('');
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');

  // Fetch actual user location if permitted (R2 Geolocation with fallback & banner)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const onSuccess = (position: any) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        if (!activeActor) {
          setMapCenter(coords);
        }
        setShowGeolocBanner(false);
      };

      const onError = (error: any) => {
        console.log("Geolocation error details:", error);
        if (error.code === error.PERMISSION_DENIED) {
          // Fallback Douala + banner visible
          setUserLocation([4.0450, 9.7000]);
          setMapCenter([4.0450, 9.7000]);
          setShowGeolocBanner(true);
        } else if (error.code === error.TIMEOUT) {
          // Retry without high accuracy
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            () => {
              setShowGeolocBanner(true);
            },
            { enableHighAccuracy: false, timeout: 5000 }
          );
        } else {
          setShowGeolocBanner(true);
        }
      };

      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000
        }
      );
    }
  }, []);

  const filtered = MOCK_ACTORS.filter(a => {
    const matchesFilter = filter === 'all' || a.type === filter;
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         a.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDuty = !onlyDuty || a.isDuty === true;
    return matchesFilter && matchesSearch && matchesDuty;
  });

  // Automatically sync active actor on filter/search change
  useEffect(() => {
    if (filtered.length > 0) {
      if (!filtered.find(a => a.id === activeActor?.id)) {
        setActiveActor(filtered[0]);
        setMapCenter(filtered[0].coordinates);
      }
    } else {
      setActiveActor(null);
    }
  }, [filter, searchQuery]);

  // Straight line fallback calculator
  const getStraightLineDistance = (p1: [number, number], p2: [number, number]): string => {
    const R = 6371; // km
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    if (d < 1) {
      return `${Math.round(d * 1000)} m`;
    }
    return `${d.toFixed(1)} km`;
  };

  // Dynamically calculate road routing using Open Source Routing Machine (OSRM)
  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      setIsRouting(true);
      const startLng = start[1];
      const startLat = start[0];
      const endLng = end[1];
      const endLat = end[0];
      
      const profile = travelMode === 'walking' ? 'foot' : 'driving';
      const url = `https://router.project-osrm.org/route/v1/${profile}/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("OSRM Routing failed");
      
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        setRouteCoordinates(coords);
        
        // Formatted distance
        const meters = route.distance;
        if (meters < 1000) {
          setRouteDistance(`${Math.round(meters)} m`);
        } else {
          setRouteDistance(`${(meters / 1000).toFixed(1)} km`);
        }
        
        // Formatted duration
        const minutes = Math.round(route.duration / 60);
        setRouteDuration(`${minutes || 1} min`);
      } else {
        throw new Error("No routes in response");
      }
    } catch (error) {
      console.log("Routing calculation fallback to straight line:", error);
      // Fallback straight-line line segment
      setRouteCoordinates([start, end]);
      const dist = getStraightLineDistance(start, end);
      setRouteDistance(dist);
      const rawDistanceInKm = parseFloat(dist.replace(/[^\d.]/g, '')) * (dist.includes('m') && !dist.includes('km') ? 0.001 : 1);
      
      if (travelMode === 'walking') {
        // Walking speed is approx 5 km/h -> 12 min per km
        setRouteDuration(`${Math.max(1, Math.round(rawDistanceInKm * 12))} min`);
      } else {
        setRouteDuration(`${Math.max(1, Math.round(rawDistanceInKm * 3.5))} min`);
      }
    } finally {
      setIsRouting(false);
    }
  };

  // Re-run routing when user moves, target changes, or travelMode changes
  useEffect(() => {
    if (activeActor) {
      calculateRoute(userLocation, activeActor.coordinates);
    } else {
      setRouteCoordinates([]);
      setRouteDistance('');
      setRouteDuration('');
    }
  }, [activeActor, userLocation, travelMode]);

  const customIcon = (type: string, isActive: boolean) => {
    const color = type === 'hospital' ? '#2563eb' : type === 'pharmacy' ? '#10b981' : '#a855f7';
    const emoji = type === 'pharmacy' ? '💊' : type === 'hospital' ? '🏥' : '🔬';
    const size = isActive ? 48 : 38;
    
    return L.divIcon({
      html: `
        <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
          <svg viewBox="0 0 24 24" class="absolute inset-0 w-full h-full drop-shadow-xl" fill="${color}" stroke="white" stroke-width="1.5">
            <path d="M12 21.7C12 21.7 20 16 20 9.5C20 5.1 16.4 1.5 12 1.5C7.6 1.5 4 5.1 4 9.5C4 16 12 21.7 12 21.7Z" />
            <circle cx="12" cy="9.5" r="4.5" fill="white" />
          </svg>
          <div class="relative z-10 text-[${size/4}px] mb-2">${emoji}</div>
          ${isActive ? '<div class="absolute -bottom-1 w-2 h-0.5 bg-black/20 blur-[1px] rounded-full"></div>' : ''}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size],
      popupAnchor: [0, -size],
    });
  };

  // Custom User pulsating indicator icon
  const userIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
        <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
        <div class="absolute w-4 h-4 bg-blue-500/60 rounded-full"></div>
        <div class="w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-[0_0_8px_rgba(37,99,235,0.7)]"></div>
      </div>
    `,
    className: 'user-marker-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const getAIAdvice = (actor: HealthActor, distance: string, duration: string) => {
    if (travelMode === 'walking') {
      return `🚶 Trajet de marche active vers ${actor.name} (${distance}, environ ${duration}). Conseillé pour garder la forme et éviter les embouteillages. Restez vigilant sur les axes de Douala.`;
    }
    if (actor.type === 'hospital') {
      return `🩺 Trajet médical urgent vers ${actor.name}. Care IA vous conseille d'éviter l'avenue de l'Unité aux heures de pointe et d'accéder par les voies secondaires d'Akwa. Trafic modéré.`;
    } else if (actor.type === 'pharmacy') {
      return `💊 Route directe vers ${actor.name}. Le revêtement routier est goudronné et fluide pour une arrivée rapide et sécurisée.`;
    } else {
      return `🔬 Trajet vers ${actor.name}. Suivez l'axe principal. Les deux points sont reliés sans encombrement de trafic majeur.`;
    }
  };

  return (
    <div className={cn(
      "min-h-[calc(100dvh-180px)] md:h-[calc(100vh-160px)] flex flex-col md:flex-row gap-4 transition-all duration-500",
      isExpanded && "fixed inset-0 z-[1000] h-[100dvh] w-screen p-0 bg-white md:p-4 md:bg-slate-900/40 md:backdrop-blur-md overflow-hidden"
    )}>
      {/* Left Sidebar (Desktop layout) / Top header section (Mobile layout) */}
      <div className={cn(
        "w-full md:w-96 flex flex-col gap-4 shrink-0 transition-all duration-500",
        isExpanded && "hidden md:flex md:w-0 md:opacity-0 md:pointer-events-none md:overflow-hidden h-0 md:h-auto opacity-0"
      )}>
        {/* R2 Geolocation Fallback Banner */}
        {showGeolocBanner && (
          <div className="bg-amber-50 border border-amber-100 text-amber-900 rounded-[2rem] p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">📍</span>
              <div>
                <p className="font-bold text-xs">Géolocalisation inactive</p>
                <p className="text-[11px] text-amber-700 leading-normal mt-0.5">
                  Dokta s'est positionné par défaut sur Douala. Activez le GPS pour voir les pharmacies et hôpitaux proches de vous.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                      setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                      setShowGeolocBanner(false);
                    },
                    () => {},
                    { enableHighAccuracy: true, timeout: 8000 }
                  );
                }
              }}
              className="text-[10px] font-black uppercase text-amber-950 bg-amber-200/50 hover:bg-amber-200/80 transition-colors py-1.5 px-3 rounded-lg text-center mt-1"
            >
              Réessayer la localisation GPS
            </button>
          </div>
        )}

        {/* Search & Quick Filters */}
        <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input
              type="text"
              aria-label="Chercher un établissement sur la carte"
              placeholder="Chercher pharmacie, hôpital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/10"
            />
          </div>

          <div className="flex flex-wrap gap-2 pb-1">
            <MapFilter label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} />
            <MapFilter label="Pharmacies" active={filter === 'pharmacy'} onClick={() => setFilter('pharmacy')} />
            <MapFilter label="Hôpitaux" active={filter === 'hospital'} onClick={() => setFilter('hospital')} />
            <MapFilter label="Labos" active={filter === 'lab'} onClick={() => setFilter('lab')} />
          </div>
          
          <button
            onClick={() => setOnlyDuty(!onlyDuty)}
            className={cn(
              "w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-2 mt-2",
              onlyDuty 
                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/15" 
                : "bg-amber-50/50 text-amber-800 border-amber-100/60 hover:bg-amber-100/50 hover:text-amber-950"
            )}
          >
            🌙 Pharmacie de garde ce soir
            {onlyDuty && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            <span className="ml-auto bg-amber-600/20 text-amber-950 px-2 py-0.5 rounded-lg text-[10px] font-black">
              {MOCK_ACTORS.filter(a => a.type === 'pharmacy' && a.isDuty).length} de garde
            </span>
          </button>
        </div>

        {/* Selected Actor Card on Mobile (Visible directly under filters) */}
        {activeActor && (
          <div className="block md:hidden">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={activeActor.id}
              className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-lg flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm",
                    activeActor.type === 'hospital' ? "bg-clinical-600" :
                    activeActor.type === 'pharmacy' ? "bg-emerald-500" : "bg-purple-500"
                  )}>
                    {activeActor.type === 'hospital' && <Building2 size={22} />}
                    {activeActor.type === 'pharmacy' && <Pill size={22} />}
                    {activeActor.type === 'lab' && <Microscope size={22} />}
                  </div>
                  <div>
                    <h4 className="font-display font-black text-slate-900 text-base leading-tight">
                      {activeActor.name}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <MapPin size={12} className="text-slate-300" />
                      <span className="italic">{activeActor.address}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1 text-orange-400 font-bold text-sm mb-1">
                    <Star size={14} fill="currentColor" />
                    <span>{activeActor.rating}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {routeDistance || activeActor.distance}
                  </span>
                </div>
              </div>

              {/* Transport Mode Selector */}
              <div className="grid grid-cols-2 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setTravelMode('driving')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all",
                    travelMode === 'driving' 
                      ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Car size={14} />
                  En voiture
                </button>
                <button
                  onClick={() => setTravelMode('walking')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all",
                    travelMode === 'walking' 
                      ? "bg-white text-brand-600 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-brand-600"
                  )}
                >
                  <Footprints size={14} />
                  À pied
                </button>
              </div>

              {/* Travel duration and details */}
              {routeDistance && (
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Activity size={14} className="text-brand-600 animate-pulse" />
                      Calculateur d'itinéraire
                    </span>
                    <span className="font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                      {routeDuration} ({routeDistance})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                    {getAIAdvice(activeActor, routeDistance, routeDuration)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    activeActor.isOpen ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                  )} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {activeActor.isOpen ? 'OUVERT' : 'FERMÉ'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[1.25rem] transition-all border border-slate-100 active:scale-95 shadow-sm"
                    onClick={() => window.location.href = 'tel:+237600000000'}
                  >
                    <PhoneCall size={18} />
                  </button>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeActor.coordinates[0]},${activeActor.coordinates[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.25rem] transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
                  >
                    <Route size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Scrollable Results List (Visible only on Desktop to save mobile screen space) */}
        <div className="hidden md:flex flex-col flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
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
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{actor.name}</h4>
                      {actor.isDuty && (
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-0.5">
                          Garde
                        </span>
                      )}
                    </div>
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
                  <span className="text-[10px] text-slate-500 font-bold">
                    {activeActor?.id === actor.id && routeDistance ? routeDistance : actor.distance}
                  </span>
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

      {/* Interactive Map Area */}
      <div className={cn(
        "h-[350px] md:h-full md:flex-1 bg-slate-200 rounded-[2.5rem] relative overflow-hidden border-4 border-white shadow-xl z-0 transition-all duration-500",
        isExpanded && "rounded-none md:rounded-[2.5rem] border-0 md:border-4"
      )}>
        <MapContainer 
          key={isExpanded ? 'expanded' : 'normal'} 
          center={mapCenter} 
          zoom={14} 
          minZoom={3}
          maxZoom={19}
          scrollWheelZoom={true} 
          className="w-full h-full"
        >
          {/* High-quality Google Maps TileLayer with multiple layout options or standard fallback OSM */}
          {mapStyle === 'osm' ? (
            <TileLayer
              key="style-osm"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              key={`style-${mapStyle}`}
              attribution='&copy; Google Maps'
              url={`https://mt{s}.google.com/vt/lyrs=${
                mapStyle === 'google_roadmap' ? 'm' : 
                mapStyle === 'google_hybrid' ? 'y' : 'p'
              }&x={x}&y={y}&z={z}&key=${GOOGLE_MAPS_API_KEY}`}
              subdomains={['0', '1', '2', '3']}
              maxZoom={20}
            />
          )}
          <MapController center={mapCenter} isExpanded={isExpanded} />
          <ResizeListener />

          {/* Glowing User Location Indicator */}
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="p-2 text-center">
                <span className="font-bold text-slate-800 text-xs">Ma Position</span>
                <p className="text-[10px] text-slate-400 mt-1">Douala, Cameroun</p>
              </div>
            </Popup>
          </Marker>

          {/* Health Facilities Markers */}
          {filtered.map(actor => (
            <Marker 
              key={actor.id} 
              position={actor.coordinates}
              icon={customIcon(actor.type, activeActor?.id === actor.id)}
              eventHandlers={{
                click: () => {
                  setMapCenter(actor.coordinates);
                  setActiveActor(actor);
                },
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

          {/* High Fidelity Glowing Route Polyline Layer */}
          {routeCoordinates.length > 0 && (
            <>
              {/* Outer Glow Route Path */}
              <Polyline 
                positions={routeCoordinates} 
                pathOptions={{ 
                  color: activeActor?.type === 'hospital' ? '#2563eb' : '#10b981', 
                  weight: 8, 
                  opacity: 0.35,
                  lineJoin: 'round',
                  lineCap: 'round'
                }} 
              />
              {/* Inner Core Bright Route Path */}
              <Polyline 
                positions={routeCoordinates} 
                pathOptions={{ 
                  color: activeActor?.type === 'hospital' ? '#3b82f6' : '#34d399', 
                  weight: 4, 
                  opacity: 1,
                  lineJoin: 'round',
                  lineCap: 'round'
                }} 
              />
            </>
          )}
        </MapContainer>
        
        {/* Map Header Title Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 shadow-xl">
             <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
             <span className="text-[11px] font-black text-slate-800 tracking-wider uppercase">Dokta Carte Interactive</span>
          </div>
        </div>

        {/* Floating Map Style Selector */}
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-100 shadow-xl max-w-[calc(100vw-32px)] overflow-x-auto">
          <button
            onClick={() => setMapStyle('google_roadmap')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all whitespace-nowrap",
              mapStyle === 'google_roadmap' 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Google Plan
          </button>
          <button
            onClick={() => setMapStyle('google_hybrid')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all whitespace-nowrap",
              mapStyle === 'google_hybrid' 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapStyle('google_terrain')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all whitespace-nowrap",
              mapStyle === 'google_terrain' 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            Relief
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all whitespace-nowrap",
              mapStyle === 'osm' 
                ? "bg-slate-900 text-white shadow-sm" 
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            OSM
          </button>
        </div>

        {/* Dynamic Desktop Routing Panel Overlay */}
        {activeActor && routeDistance && (
          <div className="absolute top-16 left-4 right-4 md:left-6 md:right-auto md:w-80 z-[1000] hidden md:block">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-100 shadow-2xl flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-600 tracking-wider">
                <Activity size={12} className="animate-pulse" />
                <span>Calculateur de Trajet IA</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-display font-black text-slate-800 text-sm leading-tight truncate max-w-[150px]">
                    {activeActor.name}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                    {activeActor.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-slate-800 flex items-center gap-1 justify-end">
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-xs font-bold border border-emerald-100">
                      {routeDistance}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    Durée estimée : {routeDuration}
                  </p>
                </div>
              </div>

              {/* Transport Mode Selector */}
              <div className="grid grid-cols-2 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setTravelMode('driving')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-1 rounded-lg text-[10px] font-black transition-all",
                    travelMode === 'driving' 
                      ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Car size={12} />
                  En voiture
                </button>
                <button
                  onClick={() => setTravelMode('walking')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-1 rounded-lg text-[10px] font-black transition-all",
                    travelMode === 'walking' 
                      ? "bg-white text-brand-600 shadow-sm border border-slate-100" 
                      : "text-slate-400 hover:text-brand-600"
                  )}
                >
                  <Footprints size={12} />
                  À pied
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  {getAIAdvice(activeActor, routeDistance, routeDuration)}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Expand / Collapse Button Overlay */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center border border-slate-100 shadow-xl text-slate-600 hover:text-brand-600 transition-colors active:scale-95"
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
