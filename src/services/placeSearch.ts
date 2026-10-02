// Fast search utility for Janakpur places, landmarks, chowks, and addresses

export interface SearchPlaceResult {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  category: 'chowk' | 'landmark' | 'institution' | 'osm';
}

export const JANAKPUR_LANDMARKS: SearchPlaceResult[] = [
  {
    id: 'bhanu-chowk',
    name: 'Bhanu Chowk',
    subtitle: 'Clock Tower / Central Bazaar / Station Road Junction',
    lat: 26.7271,
    lng: 85.9250,
    category: 'chowk'
  },
  {
    id: 'janaki-mandir',
    name: 'Janaki Mandir (Nau Lakha Mandir)',
    subtitle: 'Main Historic Temple Square, Ward 4',
    lat: 26.7303,
    lng: 85.9264,
    category: 'landmark'
  },
  {
    id: 'shiva-chowk',
    name: 'Shiva Chowk',
    subtitle: 'Commercial Banks & Shiva Temple Road',
    lat: 26.7280,
    lng: 85.9230,
    category: 'chowk'
  },
  {
    id: 'ramanand-chowk',
    name: 'Ramanand Chowk',
    subtitle: 'Ramanand Gate, Coaching Institutes & Eye Hospital',
    lat: 26.7335,
    lng: 85.9220,
    category: 'chowk'
  },
  {
    id: 'murali-chowk',
    name: 'Murali Chowk',
    subtitle: 'Near R.R. Multiple Campus & Murali Pond',
    lat: 26.7220,
    lng: 85.9180,
    category: 'chowk'
  },
  {
    id: 'rr-campus',
    name: 'Ramshwaroop Ramsagar (R.R.) Multiple Campus',
    subtitle: 'Student Hub & Tribhuvan University Constituent Campus',
    lat: 26.7215,
    lng: 85.9175,
    category: 'institution'
  },
  {
    id: 'hospital-road',
    name: 'Hospital Road',
    subtitle: 'Provincial Hospital (Janakpur Zonal Hospital) & Red Cross',
    lat: 26.7310,
    lng: 85.9215,
    category: 'chowk'
  },
  {
    id: 'kadam-chowk',
    name: 'Kadam Chowk',
    subtitle: 'Commercial Market, Ward 3',
    lat: 26.7295,
    lng: 85.9170,
    category: 'chowk'
  },
  {
    id: 'zero-mile',
    name: 'Zero Mile Chowk',
    subtitle: 'Dhalkebar Highway Entry & Janakpur Bypass',
    lat: 26.7450,
    lng: 85.9150,
    category: 'chowk'
  },
  {
    id: 'pidari-chowk',
    name: 'Pidari Chowk',
    subtitle: 'West Janakpur Entrance & Residential Area',
    lat: 26.7320,
    lng: 85.9080,
    category: 'chowk'
  },
  {
    id: 'station-road',
    name: 'Janakpur Railway Station & Station Road',
    subtitle: 'Nepal Railway Station & Central Market',
    lat: 26.7210,
    lng: 85.9280,
    category: 'landmark'
  },
  {
    id: 'mills-area',
    name: 'Mills Area (Janakpur Cigarette Factory)',
    subtitle: 'Madhesh Province Government Secretariat',
    lat: 26.7200,
    lng: 85.9320,
    category: 'chowk'
  },
  {
    id: 'mujelia',
    name: 'Mujelia Chowk',
    subtitle: 'Provincial Government Complex & Law Courts',
    lat: 26.7410,
    lng: 85.9250,
    category: 'chowk'
  },
  {
    id: 'ganga-sagar',
    name: 'Ganga Sagar Pond & Aarti Ghat',
    subtitle: 'Holy Pond & Swargadwari Cremation Ghat',
    lat: 26.7290,
    lng: 85.9295,
    category: 'landmark'
  },
  {
    id: 'dhanush-sagar',
    name: 'Dhanush Sagar & Ram Mandir',
    subtitle: 'Historic Pond near Ram Mandir',
    lat: 26.7285,
    lng: 85.9275,
    category: 'landmark'
  },
  {
    id: 'sankat-mochan',
    name: 'Sankat Mochan Hanuman Mandir',
    subtitle: 'Near Rangabhumi Maidan (Barah Bigha)',
    lat: 26.7260,
    lng: 85.9240,
    category: 'landmark'
  },
  {
    id: 'barah-bigha',
    name: 'Barah Bigha Ground (Rangabhumi Maidan)',
    subtitle: 'Historic Open Stadium & Fair Grounds',
    lat: 26.7245,
    lng: 85.9235,
    category: 'landmark'
  },
  {
    id: 'belbisa',
    name: 'Belbisa / Mithila Yatri Niwas Area',
    subtitle: 'North-Central Residential Neighborhood',
    lat: 26.7360,
    lng: 85.9200,
    category: 'chowk'
  },
  {
    id: 'janakpur-airport',
    name: 'Janakpur Airport Area',
    subtitle: 'Civil Aviation Airport, Ward 14',
    lat: 26.7090,
    lng: 85.9235,
    category: 'institution'
  },
  {
    id: 'vishwakarma-chowk',
    name: 'Vishwakarma Chowk',
    subtitle: 'Near College Road & Workshop Area',
    lat: 26.7265,
    lng: 85.9195,
    category: 'chowk'
  },
  {
    id: 'bramhapuri-chowk',
    name: 'Bramhapuri Chowk',
    subtitle: 'Near Old Bus Stand & Ward 2',
    lat: 26.7240,
    lng: 85.9220,
    category: 'chowk'
  }
];

// Search Janakpur places using local directory + live OpenStreetMap geocoding
export async function searchPlacesOnMap(query: string): Promise<SearchPlaceResult[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  // 1. Search local directory first for instant response (< 5ms)
  const localMatches = JANAKPUR_LANDMARKS.filter((item) => {
    return (
      item.name.toLowerCase().includes(clean) ||
      item.subtitle.toLowerCase().includes(clean) ||
      item.id.toLowerCase().includes(clean)
    );
  });

  // If we already have 3 or more high quality matches, return them immediately
  if (localMatches.length >= 3) {
    return localMatches.slice(0, 6);
  }

  // 2. Query live OpenStreetMap / Photon geocoding for specific street names / addresses
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const searchQuery = clean.includes('janakpur') ? clean : `${clean}, Janakpur, Nepal`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=np`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const osmMatches: SearchPlaceResult[] = data.map((item: any, idx: number) => ({
        id: `osm-${item.place_id || idx}`,
        name: item.display_name.split(',')[0],
        subtitle: item.display_name.split(',').slice(1, 3).join(',').trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        category: 'osm'
      }));

      // Merge avoiding duplicates
      const combined = [...localMatches];
      for (const osmItem of osmMatches) {
        if (!combined.some(c => Math.abs(c.lat - osmItem.lat) < 0.001 && Math.abs(c.lng - osmItem.lng) < 0.001)) {
          combined.push(osmItem);
        }
      }
      return combined.slice(0, 6);
    }
  } catch (err) {
    // If online geocoding fails or timeouts, return local matches
  }

  return localMatches;
}
