/// <reference types="@types/google.maps" />
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Lock,
  Layers,
  Crosshair,
  AlertCircle,
  Maximize2,
  Minimize2,
  Search,
  X,
  Building,
  Navigation,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { getClientFallbackCoordinates } from '../services/geminiGeocode';
import { JANAKPUR_LANDMARKS } from '../services/placeSearch';

export interface LocationPickerMapProps {
  selectedChowk: string;
  wardNumber?: string;
  addressLine?: string;
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  isLocked: boolean;
  missingFields?: string[];
  className?: string;
}

// Controller component to smoothly pan/zoom camera when chowk or search changes
const MapCameraController: React.FC<{
  targetCoords: { lat: number; lng: number };
  zoom?: number;
}> = ({ targetCoords, zoom = 16 }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !targetCoords) return;
    map.panTo(targetCoords);
    if (typeof zoom === 'number') {
      map.setZoom(zoom);
    }
  }, [map, targetCoords.lat, targetCoords.lng, zoom]);
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  selectedChowk,
  wardNumber,
  addressLine,
  value,
  onChange,
  isLocked,
  missingFields = [],
  className = ''
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isExpanded, setIsExpanded] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ title: string; subtitle: string; lat: number; lng: number }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Places library for Google Autocomplete/Search
  const placesLib = useMapsLibrary('places');

  // Determine current active coordinates: either chosen value or fallback to Chowk center
  const defaultChowkCoords = getClientFallbackCoordinates(selectedChowk);
  const currentCoords =
    value && typeof value.lat === 'number' && typeof value.lng === 'number'
      ? value
      : { lat: defaultChowkCoords.lat, lng: defaultChowkCoords.lng };

  // When selectedChowk changes and no custom pin was chosen yet, update to chowk center
  useEffect(() => {
    if (!value && selectedChowk) {
      const coords = getClientFallbackCoordinates(selectedChowk);
      onChange({ lat: coords.lat, lng: coords.lng });
    }
  }, [selectedChowk]);

  // Handle click outside search results dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle local place search (Landmarks + Google Places)
  const handleSearch = useCallback(
    async (queryText: string) => {
      setSearchQuery(queryText);
      const q = queryText.toLowerCase().trim();
      if (!q) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      setShowSearchResults(true);

      // 1. Search Janakpur Landmarks
      const matchedLandmarks = JANAKPUR_LANDMARKS.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.subtitle.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      ).map((l) => ({
        title: l.name,
        subtitle: `${l.subtitle} • Janakpur`,
        lat: l.lat,
        lng: l.lng
      }));

      // 2. Query Google Places if available
      let googleResults: Array<{
        title: string;
        subtitle: string;
        lat: number;
        lng: number;
      }> = [];

      if (placesLib) {
        try {
          // Use AutocompleteService or search
          const service = new google.maps.places.AutocompleteService();
          const predictions = await service.getPlacePredictions({
            input: queryText,
            componentRestrictions: { country: 'np' },
            locationBias: new google.maps.Circle({
              center: { lat: 26.7271, lng: 85.925 },
              radius: 10000 // 10km around Janakpur
            })
          });

          if (predictions && predictions.predictions) {
            const geocoder = new google.maps.Geocoder();
            const topPredictions = predictions.predictions.slice(0, 4);

            const geocoded = await Promise.all(
              topPredictions.map(async (pred: any) => {
                try {
                  const geoRes = await geocoder.geocode({
                    placeId: pred.place_id
                  });
                  if (geoRes.results && geoRes.results[0]) {
                    const loc = geoRes.results[0].geometry.location;
                    return {
                      title: pred.structured_formatting.main_text,
                      subtitle: pred.structured_formatting.secondary_text || 'Nepal',
                      lat: loc.lat(),
                      lng: loc.lng()
                    };
                  }
                } catch {
                  // Ignore individual place geocode errors
                }
                return null;
              })
            );

            googleResults = geocoded.filter(Boolean) as any[];
          }
        } catch {
          // If Places API predictions fail, landmark search will still provide rich Janakpur places
        }
      }

      const combined = [...matchedLandmarks, ...googleResults];
      setSearchResults(combined);
      setIsSearching(false);
    },
    [placesLib]
  );

  const handleSelectPlace = (place: {
    title: string;
    lat: number;
    lng: number;
  }) => {
    onChange({ lat: place.lat, lng: place.lng });
    setSearchQuery(place.title);
    setShowSearchResults(false);
    setSearchFeedback(`Pinned at ${place.title}`);
    setTimeout(() => setSearchFeedback(null), 3000);
  };

  // GPS Device Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5))
        };
        onChange(coords);
        setGpsLoading(false);
        setSearchFeedback('Pinned to your current GPS location');
        setTimeout(() => setSearchFeedback(null), 3000);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? 'Location access denied. Please allow GPS permission in your browser.'
            : 'Unable to acquire GPS signal. Please drag the pin manually.'
        );
        setTimeout(() => setGpsError(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Reset to selected chowk center
  const handleResetToChowk = () => {
    const coords = getClientFallbackCoordinates(selectedChowk);
    onChange({ lat: coords.lat, lng: coords.lng });
    setSearchFeedback(`Reset to ${selectedChowk} center`);
    setTimeout(() => setSearchFeedback(null), 2500);
  };

  // Marker drag end handler
  const handleMarkerDragEnd = (e: any) => {
    if (e.latLng) {
      const newLat = Number(e.latLng.lat().toFixed(5));
      const newLng = Number(e.latLng.lng().toFixed(5));
      onChange({ lat: newLat, lng: newLng });
      setSearchFeedback('Pin placed at exact location');
      setTimeout(() => setSearchFeedback(null), 2500);
    }
  };

  // Map click handler (clicking anywhere drops/moves pin)
  const handleMapClick = (e: any) => {
    if (isLocked) return;
    if (e.detail?.latLng) {
      const newLat = Number(e.detail.latLng.lat.toFixed(5));
      const newLng = Number(e.detail.latLng.lng.toFixed(5));
      onChange({ lat: newLat, lng: newLng });
      setSearchFeedback('Pin moved to clicked spot');
      setTimeout(() => setSearchFeedback(null), 2500);
    }
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 transition-all ${
        isExpanded ? 'fixed inset-3 z-50 rounded-2xl shadow-2xl flex flex-col' : className
      }`}
      style={{ minHeight: isExpanded ? '92vh' : '440px' }}
    >
      {/* Search Bar & Auto-Suggestions Overlay */}
      <div
        ref={searchContainerRef}
        className="absolute top-3 left-3 right-16 sm:right-auto sm:w-80 md:w-96 z-20 pointer-events-auto"
      >
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/80">
            <Search className="w-4 h-4 text-indigo-600 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchResults(true);
              }}
              placeholder="Search Janaki Mandir, landmark, street..."
              disabled={isLocked}
              className="w-full text-xs font-semibold bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto z-30 divide-y divide-slate-100">
              {isSearching ? (
                <div className="p-3.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Searching places...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-3.5 text-center text-xs text-slate-400">
                  No places found. Try another landmark or drag the pin.
                </div>
              ) : (
                searchResults.map((res, idx) => (
                  <button
                    key={`${res.title}-${idx}`}
                    type="button"
                    onClick={() => handleSelectPlace(res)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 transition-colors flex items-center gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Building className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {res.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {res.subtitle}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top Controls: Map / Satellite & Fullscreen */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        {/* Map Type Switcher (Roadmap vs Hybrid Satellite) */}
        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl transition-all ${
              mapType === 'roadmap'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => setMapType('hybrid')}
            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xl transition-all flex items-center gap-1 ${
              mapType === 'hybrid'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛰️</span>
            <span>Satellite</span>
          </button>
        </div>

        {/* Expand / Minimize button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 text-slate-700 hover:text-indigo-600 transition-colors"
          title={isExpanded ? 'Exit full screen' : 'Expand full screen'}
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Actual Google Maps Component */}
      <div className="w-full h-full relative" style={{ minHeight: isExpanded ? '100%' : '440px' }}>
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={currentCoords}
          defaultZoom={16}
          mapTypeId={mapType}
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Synchronize camera panning */}
          <MapCameraController targetCoords={currentCoords} zoom={16} />

          {/* Draggable Room Marker */}
          <AdvancedMarker
            position={currentCoords}
            draggable={!isLocked}
            onDragEnd={handleMarkerDragEnd}
            title="Drag to exact room location"
          >
            <div className="relative flex flex-col items-center cursor-grab active:cursor-grabbing group select-none">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 border-2 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-rose-500/30 animate-bounce">
                <MapPin className="w-5 h-5 fill-current" />
              </div>
              <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-slate-950/95 text-white text-[10px] font-extrabold whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none flex items-center gap-1">
                <span>📍 Exact Room Pin (Drag Me)</span>
              </div>
            </div>
          </AdvancedMarker>
        </Map>
      </div>

      {/* Floating Action Feedback Bubble */}
      {searchFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{searchFeedback}</span>
        </div>
      )}

      {/* Bottom Bar: Live Coordinates, GPS & Chowk Centering */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-slate-800">
                  {selectedChowk || 'Janakpurdham'}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                  Google Maps Pin
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {currentCoords.lat.toFixed(5)}° N, {currentCoords.lng.toFixed(5)}° E
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* GPS Device Location Button */}
            <button
              type="button"
              disabled={isLocked || gpsLoading}
              onClick={handleUseCurrentLocation}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-extrabold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Detect current device location via GPS"
            >
              <Crosshair
                className={`w-3.5 h-3.5 text-indigo-600 ${
                  gpsLoading ? 'animate-spin' : ''
                }`}
              />
              <span>{gpsLoading ? 'Detecting GPS...' : 'My GPS'}</span>
            </button>

            {/* Recenter to Chowk */}
            <button
              type="button"
              disabled={isLocked}
              onClick={handleResetToChowk}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-extrabold transition-colors disabled:opacity-50"
            >
              Reset to Chowk Center
            </button>
          </div>
        </div>

        {gpsError && (
          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Lock Overlay when prerequisites are not filled */}
      {isLocked && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center text-white pointer-events-auto">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 mb-3 shadow-xl">
            <Lock className="w-7 h-7" />
          </div>
          <h4 className="text-base font-extrabold font-heading">
            Fill Required Details to Unlock Map
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-sm leading-relaxed">
            Please fill in the room title, chowk, rent, floor, facilities, and upload at least one photo first. Once ready, you can pinpoint the exact building on Google Maps.
          </p>
          {missingFields.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5 justify-center max-w-md">
              {missingFields.map((f, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold"
                >
                  • {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
