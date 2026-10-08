import React from 'react';
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  PhoneCall,
  Crown
} from 'lucide-react';
import { JanakiMandirLogo, MithilaLotusIcon } from './common/MithilaMotifs';
import { PWAInstallButton } from './PWAInstallButton';
import { useRooms } from '../context/RoomContext';
import { useContent } from '../context/ContentContext';
import { RoomListing } from '../types';

interface HomePageProps {
  onNavigate: (view: string, extraData?: any) => void;
  onSelectRoom: (room: RoomListing) => void;
  onOpenAuth: () => void;
}

const CHOWKS = [
  'Janaki Mandir',
  'Bhanu Chowk',
  'Ramanand Chowk',
  'Shiva Chowk',
  'Murali Chowk',
  'Pidari Chowk',
  'Mills Area',
  'Station Road'
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectRoom, onOpenAuth }) => {
  const { rooms, loading } = useRooms();
  const { activeFeatures } = useContent();

  const featuredRooms = rooms.filter(r => r.available).slice(0, 4);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fff7ed] via-[#fffdfa] to-[#faf7f2] border-b border-amber-200/60 pt-10 pb-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Mithila’s #1 Verified Rental Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight font-mithila">
            Find Your Ideal Room in{' '}
            <span className="bg-gradient-to-r from-amber-700 via-rose-700 to-amber-900 bg-clip-text text-transparent">
              Janakpurdham
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Search verified single rooms, flats, and 2BHK apartments across all major chowks. 
            Connect directly with verified owners with <strong>zero broker commission</strong>.
          </p>

          {/* Download App & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <PWAInstallButton variant="hero" />

            <button
              onClick={() => onNavigate('listings')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm sm:text-base shadow-md transition active:scale-95 cursor-pointer w-full sm:w-auto"
            >
              <span>Explore All Rooms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Chowks quick selector */}
          <div className="pt-6 max-w-3xl mx-auto">
            <p className="text-xs font-bold text-amber-900/60 uppercase tracking-wider mb-3">
              Popular Chowks in Janakpur
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {CHOWKS.map((c) => (
                <button
                  key={c}
                  onClick={() => onNavigate('listings', { chowk: c })}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-100 border border-amber-200 text-stone-800 hover:text-amber-900 text-xs font-medium shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 inline text-amber-600 mr-1" />
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Lotus in Background */}
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none w-72 h-72">
          <JanakiMandirLogo size={280} />
        </div>
        <div className="absolute -bottom-10 -left-10 opacity-5 pointer-events-none w-72 h-72">
          <JanakiMandirLogo size={280} />
        </div>
      </section>

      {/* Trust Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Direct Owner Contact</h3>
              <p className="text-xs text-stone-500 mt-1">Talk straight to property owners. No brokers, no hidden middleman fees.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-100 text-rose-800">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Chowk-by-Chowk Verified</h3>
              <p className="text-xs text-stone-500 mt-1">Every listing is mapped accurately to Janakpurdham's historic chowks.</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Real-Time Firebase Sync</h3>
              <p className="text-xs text-stone-500 mt-1">Instant updates on room availability, rent, and amenities without app restarts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-stone-900 font-mithila">Featured Rooms &amp; Flats</h2>
            <p className="text-xs sm:text-sm text-stone-500">Verified properties ready for immediate move-in</p>
          </div>
          <button
            onClick={() => onNavigate('listings')}
            className="text-xs sm:text-sm font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({rooms.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-stone-200 animate-pulse" />
            ))}
          </div>
        ) : featuredRooms.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
            <p className="text-stone-500 text-sm">No rooms currently listed. Be the first to post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredRooms.map(room => (
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
                      View Details
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dynamic Amenities Section (Synced directly from Firestore via ContentContext) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[#fffdfa] rounded-3xl p-6 sm:p-10 border border-amber-200 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-mithila">
              Standard Amenities Available
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Properties in RoomSewa Janakpur include top amenities managed and verified directly by the community.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {activeFeatures.map(f => (
              <div 
                key={f.id}
                className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-xs font-semibold text-stone-800">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
