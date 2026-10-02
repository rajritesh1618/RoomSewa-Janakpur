import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  Droplets,
  Zap,
  Layers,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { RoomFeature } from '../types';
import { AVAILABLE_ICONS } from './admin/AdminFeaturesManager';

interface DynamicFeaturesViewProps {
  features: RoomFeature[];
  customFeatures?: Record<string, any>;
  className?: string;
}

export const DynamicFeaturesView: React.FC<DynamicFeaturesViewProps> = ({
  features,
  customFeatures = {},
  className = ''
}) => {
  if (!customFeatures || Object.keys(customFeatures).length === 0) {
    return null;
  }

  const renderIcon = (iconKey?: string | null, iconClassName = 'w-4 h-4') => {
    const match = AVAILABLE_ICONS.find((i) => i.key === iconKey);
    const IconComp = match ? match.component : Sparkles;
    return <IconComp className={iconClassName} />;
  };

  // Helper to format time strings (HH:mm) into 12-hour AM/PM format
  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Find all features that have a populated value in customFeatures and are not hidden
  const displayedFeatures = features.filter((feat) => {
    if (feat.isHidden || feat.isDisabled) return false;
    const val = customFeatures[feat.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  if (displayedFeatures.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 font-heading">
          Property Specifications & Amenities
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedFeatures.map((feat) => {
          const val = customFeatures[feat.id];
          const inputType = feat.inputType || 'checklist';
          const isElectricity = feat.id === 'feature-electricity' || feat.name.toLowerCase() === 'electricity';
          const isWater = feat.id === 'feature-water' || feat.name.toLowerCase().includes('water availability');
          const isWaterSource = feat.id === 'feature-water-source' || feat.name.toLowerCase().includes('water source');
          const isGateTime = feat.id === 'feature-gate-time' || feat.name.toLowerCase().includes('gate closing');

          // Format value by type
          return (
            <div
              key={feat.id}
              className={`p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between ${
                isWater || (inputType === 'checklist' && Array.isArray(val) && val.length > 3)
                  ? 'sm:col-span-2'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                  {renderIcon(feat.icon, 'w-3.5 h-3.5')}
                </div>
                <span className="font-bold text-slate-700">{feat.name}</span>
              </div>

              {/* 1. ELECTRICITY */}
              {isElectricity && (
                <div className="pt-0.5">
                  <span className="text-sm font-black text-indigo-950 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 inline-block">
                    NPR {val} per unit
                  </span>
                </div>
              )}

              {/* 2. WATER AVAILABILITY */}
              {isWater && !isElectricity && (
                <div className="pt-0.5 space-y-1">
                  {typeof val === 'object' && val?.timeSlots?.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">Available:</span>
                      {val.timeSlots.map((s: { id: string; from: string; to: string }, i: number) => (
                        <span
                          key={s.id || i}
                          className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-blue-600" />
                          {formatTime12h(s.from)} – {formatTime12h(s.to)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold inline-flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                      {typeof val === 'object' ? val.selected || '24 Hours' : String(val)}
                    </span>
                  )}
                </div>
              )}

              {/* 3. WATER SOURCE */}
              {isWaterSource && !isElectricity && !isWater && (
                <div className="pt-0.5">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold inline-block">
                    {typeof val === 'object' && val?.selected === 'Other'
                      ? val.customText || 'Other Source'
                      : typeof val === 'object'
                      ? val.selected
                      : String(val)}
                  </span>
                </div>
              )}

              {/* 4. GATE CLOSING TIME */}
              {isGateTime && !isElectricity && !isWater && !isWaterSource && (
                <div className="pt-0.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {typeof val === 'object' && val?.selected === 'Fixed Closing Time'
                      ? `Gate Closing Time: ${formatTime12h(val.time)}`
                      : typeof val === 'object'
                      ? val.selected
                      : String(val)}
                  </span>
                </div>
              )}

              {/* CHECKLIST */}
              {inputType === 'checklist' && Array.isArray(val) && !isElectricity && !isWater && !isWaterSource && !isGateTime && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {val.map((item: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-800 shadow-2xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {/* SINGLE SELECT & PRICE + UNIT */}
              {(inputType === 'single_select' || inputType === 'price_unit') && !isElectricity && !isWater && !isWaterSource && !isGateTime && (
                <div className="text-xs font-bold text-slate-900 pt-1">
                  {typeof val === 'object' && val !== null ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900">
                          {val.selected}
                        </span>
                        {val.price !== undefined && val.price !== '' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-black">
                            रु {Number(val.price).toLocaleString()} {val.unit || 'per unit'}
                          </span>
                        )}
                      </div>
                      {val.customText && (
                        <p className="text-[11px] text-slate-600 italic font-medium pt-0.5">
                          "{val.customText}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900">
                      {String(val)}
                    </span>
                  )}
                </div>
              )}

              {/* MANUAL TEXT */}
              {inputType === 'text' && !isElectricity && (
                <p className="text-xs font-semibold text-slate-800 pt-0.5">
                  {String(val)}
                </p>
              )}

              {/* NUMBER */}
              {inputType === 'number' && !isElectricity && (
                <p className="text-sm font-black text-slate-900 pt-0.5">
                  {val} {feat.numberConfig?.unit || ''}
                </p>
              )}

              {/* PRICE */}
              {inputType === 'price' && !isElectricity && (
                <p className="text-sm font-black text-amber-700 pt-0.5">
                  रु {Number(val).toLocaleString()} {feat.priceConfig?.unit || ''}
                </p>
              )}

              {/* YES / NO */}
              {inputType === 'yes_no' && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold w-fit ${
                    val === true
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {val === true
                    ? feat.yesNoConfig?.yesLabel || 'Yes / Included'
                    : feat.yesNoConfig?.noLabel || 'No'}
                </span>
              )}

              {/* TIME */}
              {inputType === 'time' && (
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {String(val)}
                </p>
              )}

              {/* DATE */}
              {inputType === 'date' && (
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(val).toLocaleDateString()}
                </p>
              )}

              {/* IMAGE UPLOAD */}
              {inputType === 'image_upload' && Array.isArray(val) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {val.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${feat.name} ${i + 1}`}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
