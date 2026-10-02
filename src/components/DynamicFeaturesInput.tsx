import React, { useState } from 'react';
import {
  CheckSquare,
  CircleDot,
  FileText,
  Hash,
  DollarSign,
  ToggleLeft,
  Clock,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Upload,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Edit2,
  Droplets,
  Zap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { RoomFeature, FeatureOption } from '../types';
import { AVAILABLE_ICONS } from './admin/AdminFeaturesManager';

interface DynamicFeaturesInputProps {
  features: RoomFeature[];
  values: Record<string, any>;
  onChange: (featureId: string, value: any) => void;
  errors?: Record<string, string>;
}

export const DynamicFeaturesInput: React.FC<DynamicFeaturesInputProps> = ({
  features,
  values,
  onChange,
  errors = {}
}) => {
  // Filter active, non-hidden, non-disabled features
  const activeFeatures = features
    .filter((f) => !f.isHidden && !f.isDisabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // State to track adding a custom option per feature
  const [addingCustomForFeat, setAddingCustomForFeat] = useState<string | null>(null);
  const [customInputText, setCustomInputText] = useState('');
  const [editingCustomIndex, setEditingCustomIndex] = useState<{ featId: string; index: number } | null>(null);
  const [editingCustomText, setEditingCustomText] = useState('');

  // Water time slot addition state
  const [addingWaterSlot, setAddingWaterSlot] = useState(false);
  const [waterSlotFrom, setWaterSlotFrom] = useState('');
  const [waterSlotTo, setWaterSlotTo] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlotFrom, setEditingSlotFrom] = useState('');
  const [editingSlotTo, setEditingSlotTo] = useState('');

  if (activeFeatures.length === 0) {
    return null;
  }

  const renderIcon = (iconKey?: string | null, className = 'w-4 h-4') => {
    const match = AVAILABLE_ICONS.find((i) => i.key === iconKey);
    const IconComp = match ? match.component : Sparkles;
    return <IconComp className={className} />;
  };

  const handleAddCustomOption = (featId: string) => {
    const trimmed = customInputText.trim();
    if (!trimmed) return;

    const rawVal = values[featId];
    const feat = features.find((f) => f.id === featId);
    const isMulti = feat?.inputType === 'checklist' || feat?.selectionType === 'multiple';

    if (isMulti) {
      const selectedList: string[] = Array.isArray(rawVal) ? rawVal : [];
      if (!selectedList.includes(trimmed)) {
        onChange(featId, [...selectedList, trimmed]);
      }
    } else {
      onChange(featId, trimmed);
    }

    setCustomInputText('');
    setAddingCustomForFeat(null);
  };

  const handleSaveEditedCustomOption = (featId: string, index: number) => {
    const trimmed = editingCustomText.trim();
    if (!trimmed) return;

    const rawVal = values[featId];
    if (Array.isArray(rawVal)) {
      const updated = [...rawVal];
      updated[index] = trimmed;
      onChange(featId, updated);
    }
    setEditingCustomIndex(null);
    setEditingCustomText('');
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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 font-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Room Specifications & Features
          </h3>
          <p className="text-xs text-slate-500">
            Provide accurate property specifications configured by admin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeFeatures.map((feat) => {
          const rawVal = values[feat.id];
          const hasError = Boolean(errors[feat.id]);
          const inputType = feat.inputType || 'checklist';
          const isChecklist = inputType === 'checklist' || feat.selectionType === 'multiple';
          const activeOptions = (feat.options || []).filter((o) => !o.isHidden && !o.isDisabled);
          const isElectricity = feat.id === 'feature-electricity' || feat.name.toLowerCase() === 'electricity';
          const isWater = feat.id === 'feature-water' || feat.name.toLowerCase().includes('water availability');
          const isWaterSource = feat.id === 'feature-water-source' || feat.name.toLowerCase().includes('water source');
          const isGateTime = feat.id === 'feature-gate-time' || feat.name.toLowerCase().includes('gate closing');
          const isRules = feat.id === 'feature-rules' || feat.name.toLowerCase().includes('rules');

          return (
            <div
              key={feat.id}
              className={`p-4 rounded-2xl border transition-all ${
                hasError
                  ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
              } ${
                ['checklist', 'price_unit', 'image_upload'].includes(inputType) ||
                isChecklist ||
                isWater ||
                isRules
                  ? 'md:col-span-2'
                  : ''
              }`}
            >
              {/* Feature Header */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0">
                    {renderIcon(feat.icon, 'w-3.5 h-3.5')}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{feat.name}</span>
                      {feat.isRequired && (
                        <span className="text-rose-500 font-bold" title="Required">*</span>
                      )}
                    </label>
                    {feat.description && (
                      <p className="text-[11px] text-slate-500">{feat.description}</p>
                    )}
                  </div>
                </div>
                {hasError && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors[feat.id]}
                  </span>
                )}
              </div>

              {/* SPECIAL CASE 1: ELECTRICITY (Mandatory NPR per unit) */}
              {isElectricity && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center gap-2 max-w-sm">
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      Electricity Charge:
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={rawVal !== undefined && rawVal !== null ? rawVal : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          onChange(feat.id, val);
                        }}
                        placeholder="e.g. 15"
                        required
                        className="w-full pl-3 pr-28 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-indigo-600 outline-none font-bold text-slate-900"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 pointer-events-none">
                        NPR per unit
                      </span>
                    </div>
                  </div>
                  {rawVal && Number(rawVal) > 0 && (
                    <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                      Electricity: NPR {rawVal} per unit
                    </p>
                  )}
                </div>
              )}

              {/* SPECIAL CASE 2: WATER AVAILABILITY (24 Hours or Choose Time slots) */}
              {isWater && !isElectricity && (
                <div className="pt-1 space-y-3">
                  {/* Select Mode: 24 Hours or Choose Time */}
                  <div className="flex flex-wrap gap-2">
                    {['24 Hours', 'Choose Time'].map((mode) => {
                      const currentMode =
                        typeof rawVal === 'object' && rawVal !== null
                          ? rawVal.mode || rawVal.selected || '24 Hours'
                          : rawVal === '24 Hours'
                          ? '24 Hours'
                          : rawVal
                          ? 'Choose Time'
                          : '24 Hours';
                      const isSelected = currentMode === mode;

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            if (mode === '24 Hours') {
                              onChange(feat.id, {
                                mode: '24 Hours',
                                selected: '24 Hours',
                                timeSlots: []
                              });
                            } else {
                              const existingSlots =
                                typeof rawVal === 'object' && rawVal?.timeSlots?.length > 0
                                  ? rawVal.timeSlots
                                  : [{ id: 'slot-1', from: '06:00', to: '10:00' }];
                              onChange(feat.id, {
                                mode: 'Choose Time',
                                selected: 'Choose Time',
                                timeSlots: existingSlots
                              });
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {mode === '24 Hours' ? (
                            <Droplets className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{mode}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mode = 24 Hours */}
                  {((typeof rawVal === 'object' && rawVal?.mode === '24 Hours') ||
                    rawVal === '24 Hours' ||
                    (!rawVal && feat.options?.[0]?.name === '24 Hours')) && (
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Water Available: 24 Hours</span>
                    </div>
                  )}

                  {/* Mode = Choose Time */}
                  {((typeof rawVal === 'object' && rawVal?.mode === 'Choose Time') ||
                    (typeof rawVal === 'string' && rawVal === 'Choose Time') ||
                    (typeof rawVal === 'object' && rawVal?.timeSlots?.length > 0)) && (
                    <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-700">Water Availability Periods:</div>

                      {/* Existing time periods */}
                      <div className="space-y-2">
                        {((typeof rawVal === 'object' && rawVal?.timeSlots) || []).map(
                          (slot: { id: string; from: string; to: string }, sIdx: number) => {
                            const isEditing = editingSlotId === slot.id;

                            if (isEditing) {
                              return (
                                <div
                                  key={slot.id || sIdx}
                                  className="flex flex-wrap items-center gap-2 p-2.5 bg-white rounded-xl border border-indigo-300"
                                >
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                    <span>From:</span>
                                    <input
                                      type="time"
                                      value={editingSlotFrom}
                                      onChange={(e) => setEditingSlotFrom(e.target.value)}
                                      className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none font-bold"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                    <span>To:</span>
                                    <input
                                      type="time"
                                      value={editingSlotTo}
                                      onChange={(e) => setEditingSlotTo(e.target.value)}
                                      className="px-2 py-1 text-xs border border-slate-300 rounded-lg outline-none font-bold"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!editingSlotFrom || !editingSlotTo) return;
                                      const slots = [...(rawVal.timeSlots || [])];
                                      slots[sIdx] = { ...slots[sIdx], from: editingSlotFrom, to: editingSlotTo };
                                      onChange(feat.id, { ...rawVal, timeSlots: slots });
                                      setEditingSlotId(null);
                                    }}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSlotId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={slot.id || sIdx}
                                className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                              >
                                <span className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                  {formatTime12h(slot.from)} – {formatTime12h(slot.to)}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSlotId(slot.id);
                                      setEditingSlotFrom(slot.from);
                                      setEditingSlotTo(slot.to);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-50"
                                    title="Edit time period"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const slots = (rawVal.timeSlots || []).filter(
                                        (_: any, idx: number) => idx !== sIdx
                                      );
                                      onChange(feat.id, { ...rawVal, timeSlots: slots });
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50"
                                    title="Delete time period"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* Add another time period */}
                      {addingWaterSlot ? (
                        <div className="p-3 bg-white rounded-xl border border-indigo-400 space-y-2.5">
                          <div className="text-xs font-bold text-slate-700">Add Availability Period</div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              <span>From:</span>
                              <input
                                type="time"
                                value={waterSlotFrom}
                                onChange={(e) => setWaterSlotFrom(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              <span>To:</span>
                              <input
                                type="time"
                                value={waterSlotTo}
                                onChange={(e) => setWaterSlotTo(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-bold"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (!waterSlotFrom || !waterSlotTo) return;
                                const existing = (typeof rawVal === 'object' && rawVal?.timeSlots) || [];
                                const newSlot = {
                                  id: `slot-${Date.now()}`,
                                  from: waterSlotFrom,
                                  to: waterSlotTo
                                };
                                onChange(feat.id, {
                                  mode: 'Choose Time',
                                  selected: 'Choose Time',
                                  timeSlots: [...existing, newSlot]
                                });
                                setWaterSlotFrom('');
                                setWaterSlotTo('');
                                setAddingWaterSlot(false);
                              }}
                              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                            >
                              Add Period
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingWaterSlot(false);
                                setWaterSlotFrom('');
                                setWaterSlotTo('');
                              }}
                              className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingWaterSlot(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add More Availability Period</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SPECIAL CASE 3: WATER SOURCE (Tap Only, Handpump Only, Tap and Handpump, Other) */}
              {isWaterSource && !isElectricity && !isWater && (
                <div className="pt-1 space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {activeOptions.map((opt) => {
                      const selectedValue =
                        typeof rawVal === 'object' && rawVal !== null ? rawVal.selected : rawVal;
                      const isSelected = selectedValue === opt.name || selectedValue === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (opt.name === 'Other') {
                              onChange(feat.id, {
                                selected: 'Other',
                                customText: (typeof rawVal === 'object' && rawVal?.customText) || ''
                              });
                            } else {
                              onChange(feat.id, opt.name);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt.icon && renderIcon(opt.icon, 'w-3.5 h-3.5')}
                          <span>{opt.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* If Other selected, show custom typing */}
                  {(rawVal === 'Other' ||
                    (typeof rawVal === 'object' && rawVal?.selected === 'Other')) && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 max-w-sm animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Specify Water Source (e.g. Borewell)
                      </label>
                      <input
                        type="text"
                        value={typeof rawVal === 'object' ? rawVal?.customText || '' : ''}
                        onChange={(e) => {
                          onChange(feat.id, {
                            selected: 'Other',
                            customText: e.target.value
                          });
                        }}
                        placeholder="e.g. Borewell / Filtered Tanker"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SPECIAL CASE 4: GATE CLOSING TIME (No Fixed Closing Time or Fixed Closing Time with Time Picker) */}
              {isGateTime && !isElectricity && !isWater && !isWaterSource && (
                <div className="pt-1 space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {['No Fixed Closing Time', 'Fixed Closing Time'].map((mode) => {
                      const currentSelected =
                        typeof rawVal === 'object' && rawVal !== null
                          ? rawVal.selected
                          : rawVal === 'No Fixed Closing Time'
                          ? 'No Fixed Closing Time'
                          : rawVal
                          ? 'Fixed Closing Time'
                          : 'No Fixed Closing Time';
                      const isSelected = currentSelected === mode;

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            if (mode === 'No Fixed Closing Time') {
                              onChange(feat.id, 'No Fixed Closing Time');
                            } else {
                              onChange(feat.id, {
                                selected: 'Fixed Closing Time',
                                time: (typeof rawVal === 'object' && rawVal?.time) || '22:00'
                              });
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{mode}</span>
                        </button>
                      );
                    })}
                  </div>

                  {typeof rawVal === 'object' && rawVal?.selected === 'Fixed Closing Time' && (
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 max-w-xs animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gate Closing Time:
                      </label>
                      <input
                        type="time"
                        value={rawVal.time || '22:00'}
                        onChange={(e) => {
                          onChange(feat.id, {
                            selected: 'Fixed Closing Time',
                            time: e.target.value
                          });
                        }}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none font-bold"
                      />
                      {rawVal.time && (
                        <p className="text-[11px] font-bold text-indigo-700 pt-1">
                          Gate Closing Time: {formatTime12h(rawVal.time)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 1. CHECKLIST (Multiple Selection / Rules / General Checklist) */}
              {isChecklist && !isElectricity && !isWater && !isWaterSource && !isGateTime && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeOptions.map((opt) => {
                      const selectedList: string[] = Array.isArray(rawVal) ? rawVal : [];
                      const isChecked = selectedList.includes(opt.name) || selectedList.includes(opt.id);

                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-300'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              let next: string[];
                              if (e.target.checked) {
                                next = [...selectedList, opt.name];
                              } else {
                                next = selectedList.filter((n) => n !== opt.name && n !== opt.id);
                              }
                              onChange(feat.id, next);
                            }}
                            className="rounded text-indigo-600 w-4 h-4 shrink-0"
                          />
                          <span className="truncate">{opt.name}</span>
                        </label>
                      );
                    })}

                    {/* Any custom options added by owner that aren't in activeOptions */}
                    {Array.isArray(rawVal) &&
                      rawVal
                        .filter((item: string) => !activeOptions.some((o) => o.name === item || o.id === item))
                        .map((customItem: string, idx: number) => {
                          const isEditingThis =
                            editingCustomIndex?.featId === feat.id && editingCustomIndex?.index === idx;

                          if (isEditingThis) {
                            return (
                              <div
                                key={`custom-edit-${idx}`}
                                className="col-span-2 flex items-center gap-1.5 p-1.5 rounded-xl border border-indigo-400 bg-white"
                              >
                                <input
                                  type="text"
                                  value={editingCustomText}
                                  onChange={(e) => setEditingCustomText(e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs border border-indigo-300 rounded-lg outline-none font-bold"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditedCustomOption(feat.id, idx)}
                                  className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCustomIndex(null)}
                                  className="p-1 text-slate-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`custom-${idx}`}
                              className="flex items-center justify-between gap-1 p-2.5 rounded-xl border border-indigo-400 bg-indigo-50 text-indigo-950 text-xs font-bold ring-1 ring-indigo-300"
                            >
                              <span className="truncate flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                {customItem}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCustomIndex({ featId: feat.id, index: idx });
                                    setEditingCustomText(customItem);
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5"
                                  title="Edit custom option"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onChange(
                                      feat.id,
                                      rawVal.filter((n: string) => n !== customItem)
                                    );
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Remove custom option"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                  </div>

                  {/* Allow Owner to Add Custom Option / Rule */}
                  {feat.allowCustomOption && (
                    <div className="pt-2 border-t border-slate-200/60">
                      {addingCustomForFeat === feat.id ? (
                        <div className="flex items-center gap-2 max-w-md animate-in fade-in">
                          <input
                            type="text"
                            value={customInputText}
                            onChange={(e) => setCustomInputText(e.target.value)}
                            placeholder={
                              isRules ? 'e.g. Gate must be locked after 10 PM...' : `Enter custom ${feat.name.toLowerCase()}...`
                            }
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-indigo-400 bg-white outline-none font-medium"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomOption(feat.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddCustomOption(feat.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCustomForFeat(null);
                              setCustomInputText('');
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingCustomForFeat(feat.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ {isRules ? 'Add Custom Rule' : `Add Custom ${feat.name}`}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 2. GENERIC SINGLE SELECT */}
              {!isChecklist &&
                inputType === 'single_select' &&
                !isElectricity &&
                !isWater &&
                !isWaterSource &&
                !isGateTime && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {activeOptions.map((opt) => {
                        const selectedValue =
                          typeof rawVal === 'object' && rawVal !== null ? rawVal.selected : rawVal;
                        const isSelected = selectedValue === opt.name || selectedValue === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const newObj: Record<string, any> = {
                                selected: opt.name
                              };

                              // Only add price if this option explicitly has price input AND a valid price exists
                              if (opt.hasPriceInput) {
                                const existingPrice =
                                  typeof rawVal === 'object' &&
                                  rawVal?.price !== undefined &&
                                  rawVal?.price !== null &&
                                  rawVal?.price !== ''
                                    ? Number(rawVal.price)
                                    : typeof opt.defaultPrice === 'number' && !isNaN(opt.defaultPrice)
                                    ? opt.defaultPrice
                                    : null;

                                if (existingPrice !== null && !isNaN(existingPrice)) {
                                  newObj.price = existingPrice;
                                  if (opt.priceUnit) {
                                    newObj.unit = opt.priceUnit;
                                  }
                                }
                              }

                              // Only add customText if this option supports it AND non-empty text exists
                              if (opt.hasCustomTextInput) {
                                const existingText =
                                  typeof rawVal === 'object' && rawVal?.customText
                                    ? String(rawVal.customText).trim()
                                    : '';
                                if (existingText) {
                                  newObj.customText = existingText;
                                }
                              }

                              onChange(feat.id, newObj);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.icon && renderIcon(opt.icon, 'w-3.5 h-3.5')}
                            <span>{opt.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Conditional Fields for selected option */}
                    {(() => {
                      const selectedName =
                        typeof rawVal === 'object' && rawVal !== null ? rawVal.selected : rawVal;
                      const matchedOpt = activeOptions.find(
                        (o) => o.name === selectedName || o.id === selectedName
                      );
                      if (!matchedOpt) return null;

                      return (
                        <div className="space-y-2 pt-1 animate-in fade-in">
                          {matchedOpt.hasPriceInput && (
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                              <label className="block text-xs font-bold text-amber-950 mb-1">
                                {matchedOpt.priceLabel || 'Rate'}
                                {matchedOpt.priceRequired && <span className="text-rose-500">*</span>}
                              </label>
                              <div className="flex items-center gap-2 max-w-sm">
                                <span className="font-extrabold text-amber-800 text-xs px-2.5 py-1.5 rounded-lg bg-amber-100 border border-amber-200">
                                  {matchedOpt.currency || 'रु'}
                                </span>
                                <input
                                  type="number"
                                  value={
                                    typeof rawVal === 'object' && rawVal?.price !== undefined
                                      ? rawVal.price
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const valStr = e.target.value.trim();
                                    const newObj: Record<string, any> = {
                                      selected: matchedOpt.name
                                    };

                                    if (valStr !== '') {
                                      const p = Number(valStr);
                                      if (!isNaN(p)) {
                                        newObj.price = p;
                                        if (matchedOpt.priceUnit) {
                                          newObj.unit = matchedOpt.priceUnit;
                                        }
                                      }
                                    }

                                    if (
                                      matchedOpt.hasCustomTextInput &&
                                      typeof rawVal === 'object' &&
                                      rawVal?.customText
                                    ) {
                                      newObj.customText = String(rawVal.customText).trim();
                                    }

                                    onChange(feat.id, newObj);
                                  }}
                                  placeholder="Enter rate..."
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white outline-none font-bold"
                                />
                                <span className="text-xs font-bold text-amber-900 whitespace-nowrap">
                                  {matchedOpt.priceUnit || 'per unit'}
                                </span>
                              </div>
                            </div>
                          )}

                          {matchedOpt.hasCustomTextInput && (
                            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                              <label className="block text-xs font-bold text-slate-800 mb-1">
                                {matchedOpt.customTextLabel || 'Enter Custom Information'}
                              </label>
                              <input
                                type="text"
                                value={
                                  typeof rawVal === 'object' && rawVal?.customText !== undefined
                                    ? rawVal.customText
                                    : ''
                                }
                                onChange={(e) => {
                                  const textStr = e.target.value;
                                  const newObj: Record<string, any> = {
                                    selected: matchedOpt.name
                                  };

                                  if (
                                    matchedOpt.hasPriceInput &&
                                    typeof rawVal === 'object' &&
                                    rawVal?.price !== undefined &&
                                    rawVal?.price !== null &&
                                    rawVal?.price !== ''
                                  ) {
                                    const p = Number(rawVal.price);
                                    if (!isNaN(p)) {
                                      newObj.price = p;
                                      if (matchedOpt.priceUnit) {
                                        newObj.unit = matchedOpt.priceUnit;
                                      }
                                    }
                                  }

                                  if (textStr.trim() !== '') {
                                    newObj.customText = textStr;
                                  }

                                  onChange(feat.id, newObj);
                                }}
                                placeholder={matchedOpt.customTextPlaceholder || 'Provide details here...'}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none font-medium"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

              {/* 3. NUMBER INPUT */}
              {inputType === 'number' && !isElectricity && (
                <div className="pt-1 flex items-center gap-2 max-w-sm">
                  <input
                    type="number"
                    value={rawVal !== undefined && rawVal !== null ? rawVal : ''}
                    onChange={(e) =>
                      onChange(feat.id, e.target.value === '' ? '' : Number(e.target.value))
                    }
                    min={feat.numberConfig?.minValue ?? undefined}
                    max={feat.numberConfig?.maxValue ?? undefined}
                    step={feat.numberConfig?.allowDecimals ? '0.1' : '1'}
                    placeholder={feat.numberConfig?.placeholder || '0'}
                    required={feat.isRequired}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none font-bold text-slate-900"
                  />
                  {feat.numberConfig?.unit && (
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap bg-white px-3 py-2.5 rounded-xl border border-slate-200">
                      {feat.numberConfig.unit}
                    </span>
                  )}
                </div>
              )}

              {/* 4. MANUAL TEXT */}
              {inputType === 'text' && !isElectricity && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={typeof rawVal === 'string' ? rawVal : ''}
                    onChange={(e) => onChange(feat.id, e.target.value)}
                    placeholder={feat.textConfig?.placeholder || 'Enter text here...'}
                    maxLength={feat.textConfig?.maxCharacters || 150}
                    required={feat.isRequired}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none font-medium text-slate-900"
                  />
                  {feat.textConfig?.maxCharacters && (
                    <div className="text-[10px] text-slate-400 text-right mt-1">
                      Max {feat.textConfig.maxCharacters} characters
                    </div>
                  )}
                </div>
              )}

              {/* 5. PRICE INPUT */}
              {inputType === 'price' && !isElectricity && (
                <div className="pt-1 flex items-center gap-2 max-w-sm">
                  <span className="font-extrabold text-amber-900 text-xs px-3.5 py-2.5 rounded-xl bg-amber-100 border border-amber-200">
                    {feat.priceConfig?.currency || 'रु'}
                  </span>
                  <input
                    type="number"
                    value={rawVal !== undefined && rawVal !== null ? rawVal : ''}
                    onChange={(e) =>
                      onChange(feat.id, e.target.value === '' ? '' : Number(e.target.value))
                    }
                    min={feat.priceConfig?.minAmount || 0}
                    max={feat.priceConfig?.maxAmount ?? undefined}
                    placeholder="Enter amount..."
                    required={feat.isRequired}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none font-bold text-slate-900"
                  />
                  {feat.priceConfig?.unit && (
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                      {feat.priceConfig.unit}
                    </span>
                  )}
                </div>
              )}

              {/* 6. YES / NO */}
              {inputType === 'yes_no' && (
                <div className="pt-1 flex items-center gap-2 max-w-xs">
                  <button
                    type="button"
                    onClick={() => onChange(feat.id, true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      rawVal === true
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {feat.yesNoConfig?.yesLabel || 'Yes / Available'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(feat.id, false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      rawVal === false
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {feat.yesNoConfig?.noLabel || 'No / Not Available'}
                  </button>
                </div>
              )}

              {/* 7. TIME */}
              {inputType === 'time' && (
                <div className="pt-1 flex items-center gap-2 max-w-xs">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="time"
                    value={typeof rawVal === 'string' ? rawVal : ''}
                    onChange={(e) => onChange(feat.id, e.target.value)}
                    required={feat.isRequired}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none font-bold text-slate-900"
                  />
                </div>
              )}

              {/* 8. DATE */}
              {inputType === 'date' && (
                <div className="pt-1 flex items-center gap-2 max-w-xs">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={typeof rawVal === 'string' ? rawVal : ''}
                    onChange={(e) => onChange(feat.id, e.target.value)}
                    min={feat.dateConfig?.minDate ?? undefined}
                    required={feat.isRequired}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-indigo-600 outline-none font-bold text-slate-900"
                  />
                </div>
              )}

              {/* 9. IMAGE UPLOAD */}
              {inputType === 'image_upload' && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Upload Photos</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const existing: string[] = Array.isArray(rawVal) ? rawVal : [];
                          const maxCount = feat.imageConfig?.maxImages || 3;

                          Array.from(files).forEach((file) => {
                            if (existing.length >= maxCount) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                onChange(feat.id, [...existing, event.target!.result as string]);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Up to {feat.imageConfig?.maxImages || 3} images
                    </span>
                  </div>

                  {Array.isArray(rawVal) && rawVal.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {rawVal.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group"
                        >
                          <img
                            src={imgUrl}
                            alt={`Upload ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onChange(
                                feat.id,
                                rawVal.filter((_, idx) => idx !== i)
                              );
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
