import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Crown,
  ArrowRight,
  TrendingUp,
  Droplets,
  Zap,
  Wifi,
  Users
} from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { RoomListing, ChowkLocation } from '../types';
import { RoomCard } from './RoomCard';

interface HomePageProps {
  onNavigateListings: (chowk?: string) => void;
  onSelectRoom: (room: RoomListing) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onNavigateAddRoom: () => void;
  onNavigatePremium: () => void;
  onOpenChat?: (conversationId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateListings,
  onSelectRoom,
  onOpenAuth,
  onNavigateAddRoom,
  onNavigatePremium,
  onOpenChat
}) => {
  const { currentUser, isOwner } = useAuth();
  const { rooms, chowks } = useRooms();
  const { appContent, isFeatureVisible, premiumConfig } = useContent();
  const [searchChowk, setSearchChowk] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Featured rooms: public only (approved, not hidden, not deleted) with priority for verified gold
  const featuredRooms = rooms
    .filter((r) => !r.isHidden && !r.isDeleted && r.approvalStatus === 'approved' && (r.isFeatured || r.isOwnerPremium))
    .slice(0, 4);
  const availableRooms = rooms
    .filter((r) => !r.isHidden && !r.isDeleted && r.approvalStatus === 'approved' && r.status === 'available')
    .slice(0, 6);
  const visibleChowks = chowks.filter((c) => !c.isHidden);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateListings(searchChowk !== 'all' ? searchChowk : undefined);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Notice / Broadcast Banner from Database if configured */}
      {((appContent.bannerActive && appContent.bannerText) || appContent.noticeText || (appContent.notices && appContent.notices.find((n) => !n.isHidden))) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[11px] uppercase tracking-wider">
                Notice
              </span>
              <span>
                {appContent.bannerActive && appContent.bannerText
                  ? appContent.bannerText
                  : appContent.noticeText ||
                    (appContent.notices && appContent.notices.find((n) => !n.isHidden)?.content) ||
                    (appContent.notices && appContent.notices.find((n) => !n.isHidden)?.title)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-rose-500/5 to-slate-50 border-b border-slate-200/80 pt-8 sm:pt-14 pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-amber-200 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800">
              {appContent.heroBadge || "Janakpurdham's #1 Verified Room & Flat Platform"}
            </span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-heading max-w-4xl mx-auto leading-tight">
            {appContent.heroTitle || 'Find the Perfect Room in Janakpur Without Middlemen'}
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto mt-4 font-normal">
            {appContent.heroSubtitle ||
              'Direct connection between room owners and students, working professionals, and families across all popular chowks in Janakpur, Nepal.'}
          </p>

          {/* Direct Search Bar Box */}
          {isFeatureVisible('search') && (
            <div className="mt-8 sm:mt-10 max-w-3xl mx-auto bg-white p-3 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200">
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row items-center gap-2.5">
                
                {/* Chowk Select */}
                {isFeatureVisible('chowks') && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 w-full sm:w-1/2 text-left">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Location / Chowk
                      </label>
                      <select
                        value={searchChowk}
                        onChange={(e) => setSearchChowk(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer"
                      >
                        <option value="all">All Janakpur Chowks</option>
                        {visibleChowks.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} {c.wardNo ? `(${c.wardNo})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Keyword / Room Type */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 w-full sm:w-1/2 text-left">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Search Keyword
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="1BHK, student room, wifi..."
                      className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                {/* Search Submit Button */}
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  Search Rooms
                </button>
              </form>
            </div>
          )}

          {/* Popular Chowks Quick Row */}
          {isFeatureVisible('chowks') && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Popular Chowks:</span>
              {['Bhanu Chowk', 'Shiva Chowk', 'Ramanand Chowk', 'Murali Chowk', 'Hospital Road'].map((name) => (
                <button
                  key={name}
                  onClick={() => onNavigateListings(name)}
                  className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-medium transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* Home Page Authentication Buttons for Non-logged-in Guests */}
          {!currentUser && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs font-medium text-slate-500">
                New to RoomSewa Janakpur?
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="home-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition-all"
                >
                  Log In
                </button>
                <button
                  id="home-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 2. CHOWK SELECTOR CARDS */}
      {isFeatureVisible('chowks') && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                Select Rooms by Janakpur Chowk
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Browse rooms situated directly in the heart of Janakpur's main neighborhoods
              </p>
            </div>
            <button
              onClick={() => onNavigateListings()}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All ({rooms.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {chowks.slice(0, 6).map((c) => {
              const count = rooms.filter(
                (r) => !r.isHidden && !r.isDeleted && r.approvalStatus === 'approved' && r.chowk === c.name
              ).length;
              return (
                <div
                  key={c.id}
                  onClick={() => onNavigateListings(c.name)}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-600 truncate">
                    {c.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {count} available rooms
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. FEATURED ROOMS (Verified Gold First) */}
      {featuredRooms.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Crown className="w-4 h-4 fill-amber-600 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                  Featured & Verified Rooms
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Recommended listings from verified property owners in Janakpur
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateListings()}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Browse All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onSelectRoom}
                onOpenAuth={() => onOpenAuth('login')}
                onOpenChat={onOpenChat}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. AVAILABLE ROOMS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
              Recently Added Available Rooms
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Vacant rooms, 1BHK flats, and student rooms ready to move in
            </p>
          </div>

          <button
            onClick={() => onNavigateListings()}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            See More Rooms
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onSelect={onSelectRoom}
              onOpenAuth={() => onOpenAuth('login')}
              onOpenChat={onOpenChat}
            />
          ))}
        </div>
      </section>

      {/* Dynamic Frequently Asked Questions from Database */}
      {appContent.faqs && appContent.faqs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                Help & Guidelines
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-heading mt-1">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Everything you need to know about renting rooms and flats in Janakpurdham.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appContent.faqs.map((faq, idx) => (
                <div key={faq.id || idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 font-extrabold font-mono">Q.</span>
                    {faq.question}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. OWNER CALLOUT: LIST YOUR ROOM & LIFETIME PREMIUM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl">
            {isFeatureVisible('premium') && premiumConfig.enabled && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400 text-slate-950 font-bold text-xs mb-4">
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                Room Owners in Janakpur
              </div>
            )}
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading">
              Have an empty room or flat in Janakpur?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              List your room for free{isFeatureVisible('premium') && premiumConfig.enabled ? ` or upgrade to Lifetime Premium for Rs ${premiumConfig.priceNPR || 200} to get unlimited listings, verified gold badges, and priority search visibility across Janakpur.` : ' and reach thousands of seekers in Janakpur.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isFeatureVisible('room_listing') && (
                <button
                  onClick={onNavigateAddRoom}
                  className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md transition-all"
                >
                  List Your Room (Owners)
                </button>
              )}
              {!currentUser ? (
                <>
                  <button
                    id="home-cta-signup-btn"
                    onClick={() => onOpenAuth('signup')}
                    className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Sign Up Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id="home-cta-login-btn"
                    onClick={() => onOpenAuth('login')}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-xs transition-all flex items-center gap-1.5"
                  >
                    Log In
                  </button>
                </>
              ) : isOwner && isFeatureVisible('premium') && premiumConfig.enabled ? (
                <button
                  id="homepage-premium-btn"
                  onClick={onNavigatePremium}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  Owner Premium Dashboard
                </button>
              ) : (
                <button
                  onClick={() => onNavigateListings()}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-xs transition-all flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-amber-300" />
                  Browse Available Rooms
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
