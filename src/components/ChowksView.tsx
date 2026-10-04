import React from 'react';
import { MapPin, Building2, ArrowRight } from 'lucide-react';
import { MithilaLotusIcon } from './common/MithilaMotifs';
import { useRooms } from '../context/RoomContext';

interface ChowksViewProps {
  onSelectChowk: (chowkName: string) => void;
}

export const ChowksView: React.FC<ChowksViewProps> = ({ onSelectChowk }) => {
  const { chowks, rooms } = useRooms();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 text-amber-950 font-bold text-xs mb-3 border border-amber-300/80">
          <MithilaLotusIcon size={14} color="#ea580c" />
          <span>जनकपुरधामका प्रमुख चोकहरू</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-heading">
          Explore Janakpur Chowks & Hubs
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Discover room listings, studio apartments, and flats categorized by major Janakpurdham chowks and key landmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chowks.filter((c) => !c.isHidden).map((chowk) => {
          const matchedRooms = rooms.filter(
            (r) => !r.isHidden && !r.isDeleted && r.approvalStatus === 'approved' && r.chowk === chowk.name
          );
          const availableCount = matchedRooms.filter((r) => r.status === 'available').length;

          return (
            <div
              key={chowk.id}
              onClick={() => onSelectChowk(chowk.name)}
              className="bg-white p-5 rounded-2xl border border-amber-200/90 hover:border-amber-400 mithila-card-shadow mithila-card-hover transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="h-0.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 absolute top-0 inset-x-0" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5 text-rose-600" />
                  </div>
                  {chowk.wardNo && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-900 border border-amber-200/60">
                      {chowk.wardNo}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-bold text-base text-stone-900 group-hover:text-orange-700 transition-colors">
                  {chowk.name}
                </h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  {chowk.popularLandmark || 'Core commercial and residential neighborhood'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-950">
                  {availableCount} Available Rooms
                </span>
                <span className="text-stone-400 group-hover:text-orange-700 flex items-center gap-1 font-bold transition-colors">
                  Browse <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
