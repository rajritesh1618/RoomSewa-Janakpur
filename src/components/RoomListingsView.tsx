import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Droplets,
  Zap,
  Wifi,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  X,
  Building,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useContent } from '../context/ContentContext';
import { RoomListing, RoomType } from '../types';
import { RoomCard } from './RoomCard';

interface RoomListingsViewProps {
  initialChowk?: string;
  onSelectRoom: (room: RoomListing) => void;
  onOpenAuth?: () => void;
  onOpenChat?: (conversationId: string) => void;
}

const ROOM_TYPES: RoomType[] = [
  'Single Room',
  'Double Room',
  '1BHK',
  '2BHK',
  'Flat',
  'Hostel/Bed'
];

export const RoomListingsView: React.FC<RoomListingsViewProps> = ({
  initialChowk = 'all',
  onSelectRoom,
  onOpenAuth,
  onOpenChat
}) => {
  const { rooms, chowks, loadingRooms } = useRooms();
  const { isFeatureVisible } = useContent();

  // Filter States
  const [selectedChowk, setSelectedChowk] = useState<string>(initialChowk);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'rented'>('all');
  const [maxRent, setMaxRent] = useState<number>(25000);
  const [studentsOnly, setStudentsOnly] = useState<boolean>(false);
  const [waterFilter, setWaterFilter] = useState<string>('all');
  const [electricityFilter, setElectricityFilter] = useState<string>('all');
  const [wifiRequired, setWifiRequired] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'newest' | 'verified'>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Compute filtered rooms
  const visibleChowks = useMemo(() => chowks.filter((c) => !c.isHidden), [chowks]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Critical Public Visibility Rule:
      // Never show hidden, deleted, pending-approval, or rejected rooms in public listings
      if (room.isHidden || room.isDeleted || room.approvalStatus !== 'approved') {
        return false;
      }

      // Chowk filter
      if (selectedChowk !== 'all' && room.chowk !== selectedChowk) {
        return false;
      }

      // Room Type
      if (selectedRoomType !== 'all' && room.roomType !== selectedRoomType) {
        return false;
      }

      // Available / Rented Status
      if (statusFilter !== 'all' && room.status !== statusFilter) {
        return false;
      }

      // Verified Status Filter
      if (verifiedFilter === 'verified' && !room.isOwnerPremium && !room.isFeatured) {
        return false;
      }

      // Max Rent
      if (room.rentPerMonth > maxRent) {
        return false;
      }

      // Students Allowed
      if (studentsOnly && !room.studentsAllowed) {
        return false;
      }

      // Water Supply
      if (waterFilter !== 'all' && room.waterFacility !== waterFilter) {
        return false;
      }

      // Electricity
      if (electricityFilter !== 'all' && room.electricityFacility !== electricityFilter) {
        return false;
      }

      // Wi-Fi
      if (wifiRequired && !room.wifiAvailable) {
        return false;
      }

      // Search keyword
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = room.title.toLowerCase().includes(q);
        const matchesChowk = room.chowk.toLowerCase().includes(q);
        const matchesDesc = room.description.toLowerCase().includes(q);
        const matchesOwner = room.ownerName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesChowk && !matchesDesc && !matchesOwner) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Verified Status First
      if (sortBy === 'verified') {
        const aVerified = a.isOwnerPremium || a.isFeatured;
        const bVerified = b.isOwnerPremium || b.isFeatured;
        if (aVerified && !bVerified) return -1;
        if (!aVerified && bVerified) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Price (Low to High)
      if (sortBy === 'price-low') {
        return a.rentPerMonth - b.rentPerMonth;
      }
      // Price (High to Low)
      if (sortBy === 'price-high') {
        return b.rentPerMonth - a.rentPerMonth;
      }
      // Newest Arrival
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Recommended / Featured
      if (sortBy === 'recommended') {
        if (a.isOwnerPremium && !b.isOwnerPremium) return -1;
        if (!a.isOwnerPremium && b.isOwnerPremium) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [
    rooms,
    selectedChowk,
    selectedRoomType,
    statusFilter,
    verifiedFilter,
    maxRent,
    studentsOnly,
    waterFilter,
    electricityFilter,
    wifiRequired,
    searchTerm,
    sortBy
  ]);

  const resetFilters = () => {
    setSelectedChowk('all');
    setSelectedRoomType('all');
    setStatusFilter('all');
    setVerifiedFilter('all');
    setMaxRent(25000);
    setStudentsOnly(false);
    setWaterFilter('all');
    setElectricityFilter('all');
    setWifiRequired(false);
    setSearchTerm('');
    setSortBy('recommended');
  };

  const activeFilterCount = [
    selectedChowk !== 'all',
    selectedRoomType !== 'all',
    statusFilter !== 'all',
    verifiedFilter !== 'all',
    maxRent < 25000,
    studentsOnly,
    waterFilter !== 'all',
    electricityFilter !== 'all',
    wifiRequired,
    searchTerm.trim().length > 0
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Search Bar */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Explore Rooms & Flats in Janakpur
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Showing {filteredRooms.length} available & rented listings across Janakpurdham's popular chowks
        </p>

        {/* Global Search & Quick Chowk Pills */}
        <div className="mt-4 flex flex-col md:flex-row gap-3 items-stretch">
          {isFeatureVisible('search') && (
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Chowk, Ward, Room type, or keywords..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Sort selector */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <label htmlFor="sort-listings-select" className="text-slate-500 font-bold hidden sm:inline">Sort:</label>
              <select
                id="sort-listings-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent outline-none cursor-pointer font-bold text-slate-900"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="newest">Newest Arrival</option>
                {isFeatureVisible('premium') && <option value="verified">Verified Status (Gold First)</option>}
                <option value="recommended">Featured & Recommended</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Mobile Filter Toggle Button */}
            {isFeatureVisible('filters') && (
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden flex items-center gap-1.5 px-4 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Quick Chowks Scroll Strip */}
        {isFeatureVisible('chowks') && (
          <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1">
            <button
              onClick={() => setSelectedChowk('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedChowk === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Janakpur
            </button>
            {visibleChowks.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChowk(c.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedChowk === c.name
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content: Left Filters Sidebar + Right Grid */}
      <div className={`grid grid-cols-1 ${isFeatureVisible('filters') ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-6 items-start`}>
        {/* FILTERS SIDEBAR (Desktop & Mobile Modal) */}
        {isFeatureVisible('filters') && (
          <div
            className={`bg-white rounded-3xl border border-slate-200 p-5 shadow-xs md:sticky md:top-24 space-y-5 ${
              mobileFilterOpen ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Filter Listings
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* 1. Chowk / Location */}
            {isFeatureVisible('chowks') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Chowk / Location
                </label>
                <select
                  value={selectedChowk}
                  onChange={(e) => setSelectedChowk(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                >
                  <option value="all">All Locations</option>
                  {visibleChowks.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.wardNo ? `(${c.wardNo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* 2. Room Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Room Type
            </label>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="all">All Types</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 3. Availability Status (Available vs Rented) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
              {(['all', 'available', 'rented'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Verified Owner Filter */}
          {isFeatureVisible('premium') && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Verified Status</span>
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </label>
              <select
                id="verified-filter-select"
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
              >
                <option value="all">All Rooms (Standard & Gold)</option>
                <option value="verified">Verified Owners Only (Gold Badge)</option>
              </select>
            </div>
          )}

          {/* 4. Maximum Monthly Rent Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              <span>Max Rent</span>
              <span className="text-indigo-700 font-extrabold font-heading">
                Rs {maxRent.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={1500}
              max={25000}
              step={500}
              value={maxRent}
              onChange={(e) => setMaxRent(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>Rs 1,500</span>
              <span>Rs 25,000+</span>
            </div>
          </div>

          {/* 5. Water Facility */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Water Facility
            </label>
            <select
              value={waterFilter}
              onChange={(e) => setWaterFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="all">Any Water Facility</option>
              <option value="24/7 Supply">24/7 Supply</option>
              <option value="Morning/Evening">Morning/Evening</option>
              <option value="Handpump / Boring">Handpump / Boring</option>
            </select>
          </div>

          {/* 6. Electricity Facility */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Electricity
            </label>
            <select
              value={electricityFilter}
              onChange={(e) => setElectricityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            >
              <option value="all">Any Electricity Option</option>
              <option value="Separate Meter">Separate Meter</option>
              <option value="24 Hours / Inverter">24 Hours / Inverter</option>
              <option value="Shared Bill">Shared Bill</option>
            </select>
          </div>

          {/* 7. Checkboxes: Students only & Wi-Fi */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={studentsOnly}
                onChange={(e) => setStudentsOnly(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Students Allowed Only
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={wifiRequired}
                onChange={(e) => setWifiRequired(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              High Speed Wi-Fi
            </label>
          </div>
        </div>
      )}

      {/* LISTINGS GRID (3 Columns on Desktop) */}
      <div className={`${isFeatureVisible('filters') ? 'md:col-span-3' : 'md:col-span-1'} space-y-4`}>
          {loadingRooms ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading verified Janakpur rooms...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
              <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No rooms match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Try widening your rent range or clearing some facility filters to see rooms in Janakpur.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onSelect={onSelectRoom}
                  onOpenAuth={onOpenAuth}
                  onOpenChat={onOpenChat}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
