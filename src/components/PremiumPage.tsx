import React from 'react';
import { Crown, Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { JanakiMandirLogo } from './common/MithilaMotifs';

interface PremiumPageProps {
  onNavigate: (view: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-800 shadow-xs mb-2">
          <Crown className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-stone-900 font-mithila">
          RoomSewa Premium
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
          Get your rooms rented up to 4x faster with priority placement across Janakpurdham.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-stone-900 font-mithila">Free Listing</h2>
          <div className="text-3xl font-black text-stone-900">Rs. 0</div>
          <ul className="space-y-3 text-xs sm:text-sm text-stone-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Standard listing on Janakpur search</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>In-app message inquiries from seekers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Optional contact number display</span>
            </li>
          </ul>
          <button
            onClick={() => onNavigate('add-room')}
            className="w-full py-3 rounded-xl border border-stone-200 font-bold text-xs sm:text-sm hover:bg-stone-50"
          >
            Post Free Room
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-500 via-rose-600 to-amber-700 text-white rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mithila">Verified Premium</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
              Most Popular
            </span>
          </div>

          <div className="text-3xl font-black">
            Rs. 499 <span className="text-xs font-normal opacity-80">/ 30 days</span>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-amber-50">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Top sticky placement in all Chowk searches</span>
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>"Verified Premium" gold badge on listings</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-200" />
              <span>Direct WhatsApp &amp; Phone call click priority</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-200" />
              <span>Featured on RoomSewa Janakpur homepage</span>
            </li>
          </ul>

          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full py-3 rounded-xl bg-white text-stone-900 font-bold text-xs sm:text-sm shadow-md hover:bg-amber-50 transition flex items-center justify-center gap-2"
          >
            <span>Upgrade My Listings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
