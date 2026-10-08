import React, { useState, useMemo } from 'react';
import { Search, MapPin, Filter, Crown, Check, X, SlidersHorizontal } from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useContent } from '../context/ContentContext';
import { RoomListing } from '../types';

interface RoomListingsViewProps {
  initialChowk?: string;
  onSelectRoom: (room: RoomListing) => void;
}

const CHOWKS = [
  'All',
  'Janaki Mandir',
  'Bhanu Chowk',
  'Ramanand Chowk',
  'Shiva Chowk',
  'Murali Chowk',
  'Pidari Chowk',
  'Mills Area',
  'Station Road'
];

export const RoomListingsView: React.FC<RoomListingsViewProps> = ({ initialChowk = 'all', onSelectRoom }) => {
  const { rooms, loading } = useRooms();
  const { activeFeatures } = useContent();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChowk, setSelectedChowk] = useState(
    initialChowk.toLowerCase() === 'all' ? 'All' : initialChowk
  );
  const [selectedType, setSelectedType] = useState('all');
  const [maxRent, setMaxRent] = useState<number>(30000);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const toggleFacility = (name: string) => {
    setSelectedFacilities(prev => 
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Chowk filter
      if (selectedChowk !== 'All' && room.chowk.toLowerCase() !== selectedChowk.toLowerCase()) {
        return false;
      }
      // Type filter
      if (selectedType !== 'all' && room.roomType !== selectedType) {
        return false;
      }
      // Rent filter
      if (room.rent > maxRent) {
        return false;
      }
      // Facilities filter
      if (selectedFacilities.length > 0) {
        const hasAll = selectedFacilities.every(f => room.facilities?.includes(f));
        if (!hasAll) return false;
      }
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = room.title.toLowerCase().includes(q);
        const matchesAddress = room.address.toLowerCase().includes(q);
        const matchesChowk = room.chowk.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAddress && !matchesChowk) return false;
      }
      return true;
    });
  }, [rooms, selectedChowk, selectedType, maxRent, selectedFacilities, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-mithila">
            Verified Rooms in Janakpur
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Showing {filteredRooms.length} of {rooms.length} available listings
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by street, chowk, or title..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="md:hidden p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className={`space-y-6 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit ${
          showFiltersMobile ? 'block' : 'hidden md:block'
        }`}>
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Chowk Location</h3>
            <select
              value={selectedChowk}
              onChange={(e) => setSelectedChowk(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              {CHOWKS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Room Type</h3>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Room Types</option>
              <option value="single">Single Room</option>
              <option value="double">Double Room</option>
              <option value="1bhk">1 BHK Flat</option>
              <option value="2bhk">2 BHK Flat</option>
              <option value="flat">Full Flat / House</option>
              <option value="commercial">Commercial Space</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
              <span>Max Rent</span>
              <span className="text-rose-800 font-extrabold">Rs. {maxRent.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={2000}
              max={40000}
              step={1000}
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
          </div>

          {/* Dynamic Amenities from Firestore */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
              Desired Amenities
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeFeatures.map(f => {
                const checked = selectedFacilities.includes(f.name);
                return (
                  <label
                    key={f.id}
                    onClick={() => toggleFacility(f.name)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                      checked ? 'bg-amber-100 text-amber-900' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300'
                    }`}>
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                    <span>{f.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-stone-200 animate-pulse" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
              <p className="text-stone-600 font-semibold text-sm">No rooms match your filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedChowk('All');
                  setSelectedType('all');
                  setMaxRent(30000);
                  setSelectedFacilities([]);
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-bold text-amber-800 underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col"
                >
                  <div className="relative h-44 bg-stone-100 overflow-hidden">
                    <img
                      src={room.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur">
                      {room.chowk}
                    </div>
                    {room.isPremium && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white p-1 rounded-full shadow">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-1 group-hover:text-amber-800 transition">
                        {room.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{room.address}</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-base font-extrabold text-rose-800">
                          Rs. {room.rent.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-stone-400"> /mo</span>
                      </div>

                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        View
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
