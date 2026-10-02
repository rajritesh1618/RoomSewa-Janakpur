export interface SuggestCoordinatesParams {
  chowk: string;
  wardNumber?: string;
  addressLine?: string;
  landmark?: string;
}

export interface SuggestedCoordinatesResult {
  lat: number;
  lng: number;
  chowk: string;
  locationDescription: string;
  confidence: 'high' | 'medium' | 'estimated';
  nearbyLandmarks: string[];
  source: 'gemini_api' | 'cached_directory' | 'city_center_default';
}

// In-memory client cache to avoid redundant network calls
const coordinatesCache = new Map<string, SuggestedCoordinatesResult>();

export async function suggestChowkCoordinates(
  params: SuggestCoordinatesParams
): Promise<SuggestedCoordinatesResult> {
  const cacheKey = `${params.chowk.toLowerCase().trim()}_${params.wardNumber || ''}_${params.landmark || ''}`;
  
  if (coordinatesCache.has(cacheKey)) {
    return coordinatesCache.get(cacheKey)!;
  }

  // Instant accurate local directory for Janakpur Chowks & Areas
  const fallback = getClientFallbackCoordinates(params.chowk);
  coordinatesCache.set(cacheKey, fallback);
  return fallback;
}

export function getClientFallbackCoordinates(chowkName: string): SuggestedCoordinatesResult {
  const normalized = chowkName.toLowerCase().trim().replace(/\s+/g, '-');
  
  const knownLocations: Record<string, { lat: number; lng: number; desc: string; landmarks: string[] }> = {
    'bhanu-chowk': {
      lat: 26.7271,
      lng: 85.9250,
      desc: 'Central commercial area around the Bhanu Chowk Clock Tower.',
      landmarks: ['Clock Tower', 'Main Bazaar', 'Station Road Junction']
    },
    'shiva-chowk': {
      lat: 26.7280,
      lng: 85.9230,
      desc: 'Key junction near Shiva Temple and prominent commercial banks.',
      landmarks: ['Shiva Mandir', 'Commercial Bank Row', 'Market Lane']
    },
    'ramanand-chowk': {
      lat: 26.7335,
      lng: 85.9220,
      desc: 'North-central educational coaching and medical hub.',
      landmarks: ['Ramanand Gate', 'Coaching Hub', 'Eye Hospital']
    },
    'murali-chowk': {
      lat: 26.7220,
      lng: 85.9180,
      desc: 'Student campus area near Ramshwaroop Ramsagar Multiple Campus.',
      landmarks: ['R.R. Multiple Campus', 'Murali Pond']
    },
    'janaki-mandir-area': {
      lat: 26.7303,
      lng: 85.9264,
      desc: 'Historic religious sanctum around Janaki Mandir and Vivah Mandap.',
      landmarks: ['Janaki Mandir', 'Vivah Mandap', 'Dhanush Sagar']
    },
    'pidari-chowk': {
      lat: 26.7450,
      lng: 85.9280,
      desc: 'Northern junction connecting to the highway bypass.',
      landmarks: ['Bypass Junction', 'Transport Terminal']
    },
    'zero-mile': {
      lat: 26.7550,
      lng: 85.9350,
      desc: 'Northern entry corridor towards Dhalkebar.',
      landmarks: ['Highway Entry', 'Northern Ring']
    },
    'mills-area': {
      lat: 26.7250,
      lng: 85.9320,
      desc: 'Near Janakpurdham Railway Station and historical mills grounds.',
      landmarks: ['Railway Station', 'Old Mills Grounds']
    },
    'hospital-road': {
      lat: 26.7310,
      lng: 85.9215,
      desc: 'Leading directly to the Provincial Hospital Janakpur.',
      landmarks: ['Provincial Hospital', 'Medical Clinics']
    }
  };

  for (const [key, val] of Object.entries(knownLocations)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        lat: val.lat,
        lng: val.lng,
        chowk: chowkName,
        locationDescription: val.desc,
        confidence: 'high',
        nearbyLandmarks: val.landmarks,
        source: 'cached_directory'
      };
    }
  }

  return {
    lat: 26.7288,
    lng: 85.9244,
    chowk: chowkName,
    locationDescription: `Central Janakpurdham location near ${chowkName}.`,
    confidence: 'estimated',
    nearbyLandmarks: ['Janakpur Center', 'Janaki Mandir Area'],
    source: 'city_center_default'
  };
}
