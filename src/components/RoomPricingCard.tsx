import React from 'react';
import { Home, Zap, Droplets, Wifi, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { RoomListing } from '../types';
import { calculateRoomPricing, ChargeItem } from '../utils/pricingCalculator';

interface RoomPricingCardProps {
  room: Partial<RoomListing>;
  variant?: 'compact' | 'detailed';
  className?: string;
  showNegotiable?: boolean;
}

export const RoomPricingCard: React.FC<RoomPricingCardProps> = ({
  room,
  variant = 'compact',
  className = '',
  showNegotiable = true
}) => {
  const pricing = calculateRoomPricing(room);
  const { totalMonthlyCost, totalFormatted, baseRentFormatted, charges, statusSummary, variableChargesNote } = pricing;

  // Icon selector
  const renderChargeIcon = (key: ChargeItem['key'], iconClassName = 'w-4 h-4') => {
    switch (key) {
      case 'roomRent':
        return <Home className={`${iconClassName} text-amber-600`} />;
      case 'electricity':
        return <Zap className={`${iconClassName} text-amber-500`} />;
      case 'water':
        return <Droplets className={`${iconClassName} text-sky-500`} />;
      case 'wifi':
        return <Wifi className={`${iconClassName} text-emerald-500`} />;
      default:
        return <Sparkles className={`${iconClassName} text-indigo-500`} />;
    }
  };

  // -----------------------------------------------------------
  // 1. COMPACT VARIANT (Used on Room Finder Listing Cards)
  // -----------------------------------------------------------
  if (variant === 'compact') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {/* Prominent Total Header */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 border border-amber-200/90 rounded-xl p-2.5 flex items-baseline justify-between gap-2 shadow-2xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900/80 block">
              Total Monthly Cost
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-extrabold text-amber-950 font-heading">
                {totalFormatted}
              </span>
            </div>
          </div>

          {room.negotiable && showNegotiable && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
              Negotiable
            </span>
          )}
        </div>

        {/* Separated Line Items */}
        <div className="space-y-1 text-xs">
          {charges.map((item) => {
            const isRent = item.key === 'roomRent';
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between py-1 px-1.5 rounded-lg transition-colors ${
                  isRent
                    ? 'font-bold text-stone-900 bg-amber-50/60 border border-amber-100'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{renderChargeIcon(item.key, 'w-3.5 h-3.5')}</span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span
                    className={`font-semibold ${
                      isRent
                        ? 'text-amber-950 font-bold'
                        : item.isIncludedInRent
                        ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[11px]'
                        : item.isNotIncluded
                        ? 'text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded text-[11px]'
                        : 'text-stone-900 font-bold'
                    }`}
                  >
                    {item.amountText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Breakdown Summary */}
        <div className="pt-1.5 border-t border-amber-100/80 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
            <span className="font-semibold text-stone-500">Electricity:</span>
            <span className={`font-bold ${statusSummary.electricityStatus.toLowerCase().includes('included') && !statusSummary.electricityStatus.toLowerCase().includes('not') ? 'text-emerald-700' : 'text-stone-700'}`}>
              {statusSummary.electricityStatus}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
            <span className="font-semibold text-stone-500">Water:</span>
            <span className={`font-bold ${statusSummary.waterStatus.toLowerCase().includes('included') ? 'text-emerald-700' : 'text-stone-700'}`}>
              {statusSummary.waterStatus}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
            <span className="font-semibold text-stone-500">Wi-Fi:</span>
            <span className={`font-bold ${statusSummary.wifiStatus.toLowerCase().includes('included') ? 'text-emerald-700' : 'text-stone-700'}`}>
              {statusSummary.wifiStatus}
            </span>
          </span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. DETAILED VARIANT (Used on Room Detail Page / Modal)
  // -----------------------------------------------------------
  return (
    <div className={`bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 ${className}`}>
      {/* 1. Most Prominent Total Monthly Cost Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500 text-stone-950">
              Total Monthly Cost
            </span>
            {room.negotiable && showNegotiable && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Negotiable with owner
              </span>
            )}
          </div>
          <div className="text-3xl sm:text-4xl font-black text-amber-950 font-heading mt-1.5 tracking-tight">
            {totalFormatted}
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Known monthly payable amount (Room Rent + applicable fixed charges)
          </p>
        </div>

        <div className="bg-white/90 border border-amber-200 rounded-2xl p-3 sm:text-right shrink-0">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
            Base Room Rent
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-heading">
            {baseRentFormatted}
          </div>
          <span className="text-[11px] text-stone-400">Excludes separate utility usage</span>
        </div>
      </div>

      {/* 2. Visual Separation: Charges Itemized List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5 flex items-center gap-1.5">
          <span>Charges Breakdown</span>
          <span className="text-stone-300">•</span>
          <span className="text-stone-400 font-normal">All utility & service charges</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {charges.map((item) => {
            const isRent = item.key === 'roomRent';
            return (
              <div
                key={item.key}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  isRent
                    ? 'bg-amber-100/70 border-amber-300 text-amber-950 ring-1 ring-amber-300/60'
                    : item.isIncludedInTotal
                    ? 'bg-white border-amber-200 text-stone-900 shadow-2xs'
                    : item.isIncludedInRent
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-stone-50/90 border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/90 border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {renderChargeIcon(item.key, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm block truncate">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      {isRent
                        ? 'Base Monthly Rent'
                        : item.isIncludedInTotal
                        ? 'Fixed Monthly Charge'
                        : item.isIncludedInRent
                        ? 'Free with Rent'
                        : item.isUsageBased
                        ? 'Usage / Sub-meter'
                        : 'Separate Bill'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-black text-sm sm:text-base ${
                      isRent
                        ? 'text-amber-950'
                        : item.isIncludedInRent
                        ? 'text-emerald-700'
                        : item.isNotIncluded
                        ? 'text-stone-600'
                        : 'text-stone-900'
                    }`}
                  >
                    {item.amountText}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      item.isIncludedInTotal
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : item.isIncludedInRent
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Small Breakdown / Status Section Below */}
      <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 space-y-2">
        <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>Status Summary:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="font-bold text-stone-600 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Electricity:
            </span>
            <span
              className={`font-extrabold ${
                statusSummary.electricityStatus.toLowerCase().includes('included') && !statusSummary.electricityStatus.toLowerCase().includes('not')
                  ? 'text-emerald-700'
                  : 'text-stone-700'
              }`}
            >
              {statusSummary.electricityStatus}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="font-bold text-stone-600 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-500" /> Water:
            </span>
            <span
              className={`font-extrabold ${
                statusSummary.waterStatus.toLowerCase().includes('included')
                  ? 'text-emerald-700'
                  : 'text-stone-700'
              }`}
            >
              {statusSummary.waterStatus}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="font-bold text-stone-600 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-500" /> Wi-Fi:
            </span>
            <span
              className={`font-extrabold ${
                statusSummary.wifiStatus.toLowerCase().includes('included')
                  ? 'text-emerald-700'
                  : 'text-stone-700'
              }`}
            >
              {statusSummary.wifiStatus}
            </span>
          </div>
        </div>

        {/* Variable or per-unit note */}
        {variableChargesNote && (
          <p className="text-[11px] text-stone-500 italic pt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            {variableChargesNote}
          </p>
        )}
      </div>
    </div>
  );
};
