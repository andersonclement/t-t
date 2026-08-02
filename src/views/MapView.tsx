import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Circle } from 'react-leaflet';
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
  Pill,
  Maximize2,
  Minimize2,
  Car,
  Footprints,
  Crosshair,
  Layers,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageContainer,
  PageHeader,
  SectionHeader,
} from '../components/ui';

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

type ActorType = 'pharmacy' | 'hospital' | 'lab';

interface HealthActor {
  id: string;
  name: string;
  type: ActorType;
  address: string;
  distance: string;
  isOpen: boolean;
  rating: number;
  coordinates: [number, number]; // [lat, lng]
  isDuty?: boolean;
}

const DOUALA_CENTER: [number, number] = [4.0450, 9.7000];

// Coordinates sit near Akwa, Douala so the listed distances hold up.
const MOCK_ACTORS: HealthActor[] = [
  { id: '1', name: 'Pharmacie de la Paix', type: 'pharmacy', address: 'Boulevard de la Liberté, Akwa, Douala', distance: '450m', isOpen: true, rating: 4.8, coordinates: [4.0475, 9.7032], isDuty: true },
  { id: '2', name: 'Hôpital Général de Douala', type: 'hospital', address: 'Quartier Ngodi, Douala', distance: '1.2km', isOpen: true, rating: 4.5, coordinates: [4.0535, 9.6925] },
  { id: '3', name: 'Laboratoire Central', type: 'lab', address: "Rue de l'Hôpital, Bonapriso, Douala", distance: '800m', isOpen: false, rating: 4.2, coordinates: [4.0405, 9.6960] },
  { id: '4', name: 'Hôpital de Référence de Douala', type: 'hospital', address: 'Quartier Bonanjo, Douala', distance: '2.1km', isOpen: true, rating: 4.9, coordinates: [4.0315, 9.6912] },
  { id: '5', name: 'Pharmacie Saint-Jean', type: 'pharmacy', address: 'Ancien Boulevard, Douala', distance: '1.5km', isOpen: true, rating: 4.6, coordinates: [4.0375, 9.7115], isDuty: true },
  { id: '6', name: "Clinique de l'Espoir", type: 'hospital', address: 'Quartier Logpom, Douala', distance: '3.2km', isOpen: true, rating: 4.3, coordinates: [4.0625, 9.7150] },
];

const TYPE_META: Record<ActorType, { label: string; plural: string; color: string; chip: string; icon: React.ReactNode }> = {
  pharmacy: {
    label: 'Pharmacie',
    plural: 'Pharmacies',
    color: '#10b981',
    chip: 'bg-emerald-500',
    icon: <Pill size={18} />,
  },
  hospital: {
    label: 'Hôpital',
    plural: 'Hôpitaux',
    color: '#2563eb',
    chip: 'bg-blue-600',
    icon: <Building2 size={18} />,
  },
  lab: {
    label: 'Laboratoire',
    plural: 'Laboratoires',
    color: '#a855f7',
    chip: 'bg-purple-500',
    icon: <Microscope size={18} />,
  },
};

/**
 * Basemaps. These are the public tile services their providers publish for
 * this use — no API key, no scraped endpoint.
 */
const BASEMAPS = {
  clair: {
    label: 'Clair',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
  sombre: {
    label: 'Sombre',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
} as const;

type BasemapKey = keyof typeof BASEMAPS;

/** Stroke paths for the glyph drawn inside each map marker. */
const MARKER_GLYPH: Record<ActorType, string> = {
  pharmacy:
    '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  hospital: '<path d="M12 7v10"/><path d="M7 12h10"/>',
  lab: '<path d="M10 2v7.5L4.7 20.5a1 1 0 0 0 .9 1.5h12.8a1 1 0 0 0 .9-1.5L14 9.5V2"/><path d="M8.5 2h7"/>',
};

/** Keeps the Leaflet view in sync with the app's notion of "center". */
function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom ?? Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [center, zoom, map]);

  return null;
}

/** Leaflet needs a nudge whenever its container is resized. */
function ResizeListener() {
  const map = useMap();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    map.invalidateSize();

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export function MapView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ActorType>('all');
  const [onlyDuty, setOnlyDuty] = useState(false);
  const [showGeolocBanner, setShowGeolocBanner] = useState(false);
  const [basemap, setBasemap] = useState<BasemapKey>('clair');
  const [basemapOpen, setBasemapOpen] = useState(false);

  const [userLocation, setUserLocation] = useState<[number, number]>(DOUALA_CENTER);
  const [activeActor, setActiveActor] = useState<HealthActor | null>(MOCK_ACTORS[0]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DOUALA_CENTER);
  const [isExpanded, setIsExpanded] = useState(false);

  // OSRM routing
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState('');
  const [routeDuration, setRouteDuration] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');

  const locate = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setShowGeolocBanner(false);
      },
      () => setShowGeolocBanner(true),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  // Try once on mount; fall back to Douala with a dismissible banner.
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setShowGeolocBanner(false);
      },
      () => setShowGeolocBanner(true),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return MOCK_ACTORS.filter((actor) => {
      const matchesFilter = filter === 'all' || actor.type === filter;
      const matchesSearch =
        !query ||
        actor.name.toLowerCase().includes(query) ||
        actor.address.toLowerCase().includes(query);
      const matchesDuty = !onlyDuty || actor.isDuty === true;
      return matchesFilter && matchesSearch && matchesDuty;
    });
  }, [filter, searchQuery, onlyDuty]);

  // Keep the selection valid as filters narrow the list.
  useEffect(() => {
    if (filtered.length === 0) {
      setActiveActor(null);
      return;
    }
    if (!filtered.some((a) => a.id === activeActor?.id)) {
      setActiveActor(filtered[0]);
      setMapCenter(filtered[0].coordinates);
    }
  }, [filtered, activeActor?.id]);

  const straightLineDistance = (p1: [number, number], p2: [number, number]) => {
    const R = 6371; // km
    const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
    const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((p1[0] * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { km, label: km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km` };
  };

  /** Road route via OSRM, degrading to a straight line if the service is down. */
  const calculateRoute = useCallback(
    async (start: [number, number], end: [number, number], mode: 'driving' | 'walking') => {
      setIsRouting(true);
      const profile = mode === 'walking' ? 'foot' : 'driving';
      const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?geometries=geojson&overview=full`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('OSRM routing failed');

        const data = await response.json();
        const route = data?.routes?.[0];
        if (data.code !== 'Ok' || !route) throw new Error('No route returned');

        setRouteCoordinates(
          route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number])
        );
        setRouteDistance(
          route.distance < 1000
            ? `${Math.round(route.distance)} m`
            : `${(route.distance / 1000).toFixed(1)} km`
        );
        setRouteDuration(`${Math.round(route.duration / 60) || 1} min`);
      } catch {
        const { km, label } = straightLineDistance(start, end);
        setRouteCoordinates([start, end]);
        setRouteDistance(label);
        // Rough pace: 5 km/h on foot, ~17 km/h through Douala traffic.
        setRouteDuration(`${Math.max(1, Math.round(km * (mode === 'walking' ? 12 : 3.5)))} min`);
      } finally {
        setIsRouting(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeActor) {
      setRouteCoordinates([]);
      setRouteDistance('');
      setRouteDuration('');
      return;
    }
    calculateRoute(userLocation, activeActor.coordinates, travelMode);
  }, [activeActor, userLocation, travelMode, calculateRoute]);

  const markerIconFor = useCallback((type: ActorType, isActive: boolean) => {
    const { color } = TYPE_META[type];
    const size = isActive ? 46 : 34;
    const glyph = isActive ? 20 : 15;

    return L.divIcon({
      html: `
        <div style="width:${size}px;height:${size}px" class="relative flex items-center justify-center">
          ${isActive ? `<span style="background:${color}" class="absolute inset-0 rounded-full opacity-25 animate-ping"></span>` : ''}
          <span style="background:${color};box-shadow:0 6px 16px -4px ${color}99"
                class="relative flex items-center justify-center w-full h-full rounded-full border-[3px] border-white">
            <svg width="${glyph}" height="${glyph}" viewBox="0 0 24 24" fill="none"
                 stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              ${MARKER_GLYPH[type]}
            </svg>
          </span>
        </div>`,
      className: 'dokta-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  const userIcon = useMemo(
    () =>
      L.divIcon({
        html: `
          <div class="relative flex items-center justify-center" style="width:22px;height:22px">
            <span class="absolute w-full h-full rounded-full bg-blue-500/25 animate-ping"></span>
            <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-lg"></span>
          </div>`,
        className: 'dokta-user-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    []
  );

  const openCount = filtered.filter((a) => a.isOpen).length;
  const dutyCount = MOCK_ACTORS.filter((a) => a.isDuty).length;

  const selectActor = (actor: HealthActor) => {
    setActiveActor(actor);
    setMapCenter(actor.coordinates);
  };

  const mapSurface = (
    <div
      className={cn(
        'relative overflow-hidden bg-slate-200 transition-all duration-300',
        isExpanded
          ? 'fixed inset-0 z-[1200] rounded-none'
          : 'rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm h-[520px] md:h-[600px]'
      )}
    >
      <MapContainer
        center={mapCenter}
        zoom={14}
        minZoom={3}
        maxZoom={20}
        scrollWheelZoom
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          key={basemap}
          attribution={BASEMAPS[basemap].attribution}
          url={BASEMAPS[basemap].url}
          maxZoom={BASEMAPS[basemap].maxZoom}
        />
        <MapController center={mapCenter} />
        <ResizeListener />

        {/* Accuracy halo around the user's position. */}
        <Circle
          center={userLocation}
          radius={120}
          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.08, weight: 1, opacity: 0.3 }}
        />
        <Marker position={userLocation} icon={userIcon} />

        {filtered.map((actor) => (
          <Marker
            key={actor.id}
            position={actor.coordinates}
            icon={markerIconFor(actor.type, activeActor?.id === actor.id)}
            eventHandlers={{ click: () => selectActor(actor) }}
          />
        ))}

        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: activeActor ? TYPE_META[activeActor.type].color : '#10b981',
                weight: 9,
                opacity: 0.2,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: activeActor ? TYPE_META[activeActor.type].color : '#10b981',
                weight: 4,
                opacity: 1,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Floating controls — top right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <div className="relative">
          <button
            onClick={() => setBasemapOpen((v) => !v)}
            aria-label="Changer le fond de carte"
            className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-700 hover:text-brand-600 transition-colors"
          >
            <Layers size={18} />
          </button>

          <AnimatePresence>
            {basemapOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="absolute top-12 right-0 w-36 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl space-y-0.5"
              >
                {(Object.keys(BASEMAPS) as BasemapKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setBasemap(key);
                      setBasemapOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors',
                      basemap === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {BASEMAPS[key].label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={locate}
          aria-label="Centrer sur ma position"
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-700 hover:text-brand-600 transition-colors"
        >
          <Crosshair size={18} />
        </button>

        <button
          onClick={() => setIsExpanded((v) => !v)}
          aria-label={isExpanded ? 'Réduire la carte' : 'Agrandir la carte'}
          className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-700 hover:text-brand-600 transition-colors"
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {/* Geolocation fallback notice */}
      <AnimatePresence>
        {showGeolocBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-4 left-4 right-16 md:right-auto md:max-w-sm z-[1000]"
          >
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/95 backdrop-blur-md border border-amber-200 shadow-lg">
              <MapPin size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-900">Position approximative</p>
                <p className="text-[11px] text-amber-700 leading-snug mt-0.5">
                  Nous vous situons à Douala par défaut. Activez le GPS pour des distances exactes.
                </p>
                <button
                  onClick={locate}
                  className="mt-2 text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Réessayer
                </button>
              </div>
              <button
                onClick={() => setShowGeolocBanner(false)}
                aria-label="Masquer"
                className="text-amber-500 hover:text-amber-800 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip card — floats over the map bottom */}
      <AnimatePresence mode="wait">
        {activeActor && (
          <motion.div
            key={activeActor.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="absolute bottom-4 left-4 right-4 md:right-auto md:w-[22rem] z-[1000]"
          >
            <TripCard
              actor={activeActor}
              distance={routeDistance}
              duration={routeDuration}
              isRouting={isRouting}
              travelMode={travelMode}
              onTravelModeChange={setTravelMode}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isExpanded) return mapSurface;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Douala, Cameroun"
        title="Carte de Santé"
        subtitle="Pharmacies, hôpitaux et laboratoires autour de vous, avec itinéraire en temps réel."
        actions={
          <>
            <Badge tone="success">{openCount} ouvert(s)</Badge>
            <Badge tone="warning" icon={<Clock size={14} />}>
              {dutyCount} de garde
            </Badge>
          </>
        }
      />

      {/* Search + filters */}
      <Card size="sm" className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            aria-label="Rechercher un établissement de santé"
            placeholder="Chercher une pharmacie, un hôpital, un laboratoire…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Tous
          </FilterChip>
          {(Object.keys(TYPE_META) as ActorType[]).map((type) => (
            <FilterChip key={type} active={filter === type} onClick={() => setFilter(type)}>
              {TYPE_META[type].plural}
            </FilterChip>
          ))}

          <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" aria-hidden="true" />

          <button
            onClick={() => setOnlyDuty((v) => !v)}
            aria-pressed={onlyDuty}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 border transition-colors',
              onlyDuty
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            <Clock size={12} className={cn(onlyDuty && 'animate-pulse')} />
            De garde
          </button>
        </div>
      </Card>

      {mapSurface}

      {/* Results */}
      <section className="space-y-4 md:space-y-6">
        <SectionHeader
          title="Établissements à proximité"
          action={
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
              {filtered.length} résultat(s)
            </span>
          }
        />

        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<MapPin size={22} />}
              title="Aucun établissement trouvé"
              description="Élargissez votre recherche ou désactivez le filtre « de garde »."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                    setOnlyDuty(false);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((actor) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                active={activeActor?.id === actor.id}
                distance={activeActor?.id === actor.id ? routeDistance : ''}
                onSelect={() => selectActor(actor)}
              />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 border transition-colors',
        active
          ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  );
}

/** One establishment in the results grid. */
function ActorCard({
  actor,
  active,
  distance,
  onSelect,
}: {
  actor: HealthActor;
  active: boolean;
  distance: string;
  onSelect: () => void;
}) {
  const meta = TYPE_META[actor.type];

  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'text-left bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-5 border shadow-sm transition-colors w-full',
        active ? 'border-brand-600 ring-2 ring-brand-600/10' : 'border-slate-100 hover:border-slate-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0', meta.chip)}>
          {meta.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{actor.name}</h3>
            <span className="flex items-center gap-1 text-amber-500 shrink-0">
              <Star size={12} fill="currentColor" />
              <span className="text-[11px] font-bold">{actor.rating}</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{actor.address}</p>

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge tone={actor.isOpen ? 'success' : 'danger'}>{actor.isOpen ? 'Ouvert' : 'Fermé'}</Badge>
            {actor.isDuty && <Badge tone="warning">Garde</Badge>}
            {/* Distances keep their own casing — "451 m", not "451 M". */}
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold whitespace-nowrap">
              {distance || actor.distance}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/** Route summary and actions for the selected establishment. */
function TripCard({
  actor,
  distance,
  duration,
  isRouting,
  travelMode,
  onTravelModeChange,
}: {
  actor: HealthActor;
  distance: string;
  duration: string;
  isRouting: boolean;
  travelMode: 'driving' | 'walking';
  onTravelModeChange: (mode: 'driving' | 'walking') => void;
}) {
  const meta = TYPE_META[actor.type];

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/80 shadow-2xl p-3 md:p-4 space-y-2.5 md:space-y-3">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', meta.chip)}>
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-bold text-slate-900 text-sm truncate">{actor.name}</h3>
          <p className="text-[11px] text-slate-400 font-medium truncate">{actor.address}</p>
        </div>
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0 mt-1',
            actor.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
          )}
          title={actor.isOpen ? 'Ouvert' : 'Fermé'}
        />
      </div>

      {/* Travel mode */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
        {(['driving', 'walking'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onTravelModeChange(mode)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors',
              travelMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            {mode === 'driving' ? <Car size={13} /> : <Footprints size={13} />}
            {mode === 'driving' ? 'En voiture' : 'À pied'}
          </button>
        ))}
      </div>

      {/* Distance / duration */}
      <div className="flex items-center justify-between px-1">
        {isRouting ? (
          <span className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
            <Loader2 size={13} className="animate-spin" />
            Calcul de l'itinéraire…
          </span>
        ) : (
          <>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Distance</p>
              <p className="text-sm font-display font-black text-slate-900">{distance || actor.distance}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Durée</p>
              <p className="text-sm font-display font-black text-brand-600">{duration || '—'}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <a
          href="tel:+237600000000"
          className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label={`Appeler ${actor.name}`}
        >
          <PhoneCall size={17} />
        </a>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${actor.coordinates[0]},${actor.coordinates[1]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 md:h-11 flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
        >
          <Navigation size={16} />
          Lancer l'itinéraire
        </a>
      </div>
    </div>
  );
}
