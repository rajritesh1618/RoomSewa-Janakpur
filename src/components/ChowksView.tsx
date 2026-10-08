import React from 'react';
import { MapPin, ArrowRight, Building, Sparkles } from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { JanakiMandirLogo } from './common/MithilaMotifs';

interface ChowksViewProps {
  onSelectChowk: (chowk: string) => void;
}

const CHOWK_DETAILS = [
  {
    name: 'Janaki Mandir',
    description: 'Cultural heart of Janakpurdham, close to ancient kunds, temples, and bustling markets.',
    popularFor: 'Family flats, peaceful traditional living',
    tag: 'Heritage Center'
  },
  {
    name: 'Bhanu Chowk',
    description: 'Central transit hub connected directly to Janakpur Railway Station and commercial centers.',
    popularFor: 'Commercial rooms, student rentals',
    tag: 'Railway Station Hub'
  },
  {
    name: 'Ramanand Chowk',
    description: 'Premier residential zone with hospitals, banks, educational institutions, and restaurants.',
    popularFor: 'Doctors, students, modern 2BHK flats',
    tag: 'Education & Medical Hub'
  },
  {
    name: 'Shiva Chowk',
    description: 'Active commercial and residential corridor with abundant grocery shops and transit.',
    popularFor: 'Affordable single & double rooms',
    tag: 'Market Center'
  },
  {
    name: 'Murali Chowk',
    description: 'Vibrant neighborhood with quick access to highway links and local vegetable markets.',
    popularFor: 'Budget rooms, independent houses',
    tag: 'Highway Corridor'
  },
  {
    name: 'Pidari Chowk',
    description: 'Calm suburban expansion with newly constructed modern apartments and wide roads.',
    popularFor: 'New constructions, spacious parking',
    tag: 'New Residential'
  }
];

export const ChowksView: React.FC<ChowksViewProps> = ({ onSelectChowk }) => {
  const { rooms } = useRooms();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-stone-900 font-mithila">
          Explore Janakpurdham by Chowk
        </h1>
        <p className="text-xs sm:text-sm text-stone-600">
          Every locality in Janakpur has its unique character. Choose a chowk to browse neighborhood rooms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CHOWK_DETAILS.map(c => {
          const count = rooms.filter(r => r.chowk.toLowerCase() === c.name.toLowerCase()).length;
          return (
            <div
              key={c.name}
              onClick={() => onSelectChowk(c.name)}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {c.tag}
                  </span>
                  <span className="text-xs font-bold text-rose-800">
                    {count} {count === 1 ? 'room' : 'rooms'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-800 transition flex items-center gap-1.5 font-mithila">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{c.name}</span>
                </h3>

                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {c.description}
                </p>

                <div className="mt-4 pt-3 border-t border-stone-100">
                  <span className="text-[11px] text-stone-400 font-medium">Popular for: </span>
                  <span className="text-[11px] text-stone-700 font-semibold">{c.popularFor}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:text-amber-900">
                <span>View {c.name} Listings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
