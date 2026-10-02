import React, { useState } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Compass,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Building
} from 'lucide-react';
import { RoomListing } from '../types';
import { getClientFallbackCoordinates } from '../services/geminiGeocode';

interface InteractiveRoomMapProps {
  room: RoomListing;
  className?: string;
}

// Prominent Janakpur hubs for walking/driving distance estimates
const JANAKPUR_HUBS = [
  { name: 'Janaki Mandir', lat: 26.7303, lng: 85.9264 },
  { name: 'Janakpur Railway Station', lat: 26.7250, lng: 85.9320 },
  { name: 'R.R. Multiple Campus', lat: 26.7220, lng: 85.9180 },
  { name: 'Provincial Hospital', lat: 26.7310, lng: 85.9215 }
];

// Calculate distance in kilometers using the Haversine formula
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const InteractiveRoomMap: React.FC<InteractiveRoomMapProps> = ({
  room,
  className = ''
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fallbackChowk = getClientFallbackCoordinates(room.chowk);
  const hasExactCoordinates = Boolean(
    room.locationCoordinates?.lat && room.locationCoordinates?.lng
  );

  const coords = hasExactCoordinates
    ? {
        lat: room.locationCoordinates!.lat,
        lng: room.locationCoordinates!.lng
      }
    : {
        lat: fallbackChowk.lat,
        lng: fallbackChowk.lng
      };

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 flex flex-col ${
        isExpanded ? 'fixed inset-3 z-50 rounded-2xl shadow-2xl' : className
      }`}
      style={{ minHeight: isExpanded ? '92vh' : '420px' }}
    >
      {/* Top Header Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-auto">
        {/* Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            {hasExactCoordinates ? 'Verified Pinned Location' : `${room.chowk} Area`}
          </span>
        </div>

        {/* View Mode & Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Map vs Satellite Toggle */}
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
      </div>

      {/* Google Map */}
      <div className="w-full flex-1 relative" style={{ minHeight: isExpanded ? '100%' : '320px' }}>
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={coords}
          defaultZoom={16}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Room Location Marker */}
          <AdvancedMarker position={coords} title={room.title}>
            <div className="relative flex flex-col items-center group select-none cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 border-2 border-white shadow-2xl flex items-center justify-center text-white ring-4 ring-indigo-500/30">
                <MapPin className="w-5 h-5 fill-current" />
              </div>
              <div className="mt-1 px-2.5 py-1 rounded-xl bg-slate-950/95 text-white shadow-xl border border-slate-700 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[11px] font-extrabold text-amber-300 font-mono">
                  Rs. {room.rentPerMonth.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  • {room.chowk}
                </span>
              </div>
            </div>
          </AdvancedMarker>
        </Map>
      </div>

      {/* Bottom Information & Navigation Tray */}
      <div className="p-3.5 bg-white border-t border-slate-200 space-y-3 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">
                {room.title}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold">
                {room.roomType}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {room.addressLine ? `${room.addressLine}, ` : ''}{room.chowk}, Janakpurdham
              <span className="font-mono text-slate-400 ml-2">
                ({coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyCoordinates}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Copy GPS coordinates"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Lat/Lng</span>
                </>
              )}
            </button>

            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>
          </div>
        </div>

        {/* Proximity / Distance to Key Janakpur Hubs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          {JANAKPUR_HUBS.map((hub) => {
            const dist = calculateDistanceKm(coords.lat, coords.lng, hub.lat, hub.lng);
            const walkMin = Math.round((dist / 4.5) * 60); // Average walking speed ~4.5 km/h
            return (
              <div
                key={hub.name}
                className="p-2 rounded-xl bg-slate-50 border border-slate-100/80 text-[10px]"
              >
                <p className="font-bold text-slate-700 truncate">{hub.name}</p>
                <p className="text-slate-500 font-medium mt-0.5">
                  <span className="font-bold text-indigo-600">{dist.toFixed(1)} km</span>
                  <span className="text-slate-400 ml-1">({walkMin} min walk)</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
