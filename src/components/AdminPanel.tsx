import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  X, 
  Crown, 
  Building, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useContent } from '../context/ContentContext';
import { RoomListing, AmenityFeature } from '../types';

export const AdminPanel: React.FC = () => {
  const { rooms, deleteRoom, togglePremium, approveRoom } = useRooms();
  const { 
    features, 
    addFeature, 
    editFeature, 
    deleteFeature, 
    toggleFeatureStatus 
  } = useContent();

  const [activeTab, setActiveTab] = useState<'features' | 'rooms'>('features');
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureCategory, setNewFeatureCategory] = useState('comfort');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingFeatureName, setEditingFeatureName] = useState('');

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureName.trim()) return;
    await addFeature(newFeatureName.trim(), newFeatureCategory);
    setNewFeatureName('');
  };

  const handleStartEdit = (f: AmenityFeature) => {
    setEditingFeatureId(f.id);
    setEditingFeatureName(f.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingFeatureName.trim()) return;
    await editFeature(id, { name: editingFeatureName.trim() });
    setEditingFeatureId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mithila">RoomSewa Administration</h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Real-time management of features, amenities, and room verification
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('features')}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'features' 
              ? 'border-amber-700 text-amber-900' 
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dynamic Feature Builder ({features.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'rooms' 
              ? 'border-amber-700 text-amber-900' 
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>All Rooms &amp; Listings ({rooms.length})</span>
        </button>
      </div>

      {activeTab === 'features' ? (
        <div className="space-y-6">
          {/* Add New Feature Form */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <h2 className="text-base font-bold text-stone-900 mb-1 font-mithila">
              Add New Custom Amenity / Facility
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              When added here, it updates Firestore immediately and appears in all owner &amp; seeker forms in real-time.
            </p>

            <form onSubmit={handleAddFeature} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                placeholder="e.g. Attached Bathroom, Solar Water Heater..."
                className="flex-1 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />

              <select
                value={newFeatureCategory}
                onChange={(e) => setNewFeatureCategory(e.target.value)}
                className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-700"
              >
                <option value="essential">Essential</option>
                <option value="comfort">Comfort</option>
                <option value="utilities">Utilities</option>
                <option value="rules">Rules</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Feature</span>
              </button>
            </form>
          </div>

          {/* List of Features */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-stone-900 mb-2 font-mithila">
              Existing Dynamic Amenities
            </h2>

            <div className="divide-y divide-stone-100">
              {features.map(f => (
                <div key={f.id} className="py-3 flex items-center justify-between gap-4">
                  {editingFeatureId === f.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingFeatureName}
                        onChange={(e) => setEditingFeatureName(e.target.value)}
                        className="flex-1 p-2 bg-stone-50 border border-amber-400 rounded-lg text-xs"
                      />
                      <button
                        onClick={() => handleSaveEdit(f.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingFeatureId(null)}
                        className="p-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFeatureStatus(f.id, !f.isActive)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition cursor-pointer ${
                          f.isActive 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-stone-300 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div>
                        <span className={`text-sm font-semibold ${f.isActive ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                          {f.name}
                        </span>
                        <span className="ml-2 text-[10px] uppercase font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                          {f.category || 'general'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(f)}
                      title="Edit feature name"
                      className="p-1.5 text-stone-500 hover:text-amber-800 rounded-lg hover:bg-stone-100"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFeature(f.id)}
                      title="Delete feature"
                      className="p-1.5 text-stone-400 hover:text-rose-700 rounded-lg hover:bg-stone-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 font-mithila">Room Moderation</h2>
          <div className="divide-y divide-stone-100">
            {rooms.map(room => (
              <div key={room.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-sm">{room.title}</h3>
                    {room.isPremium && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full flex items-center gap-0.5">
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>Premium</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">{room.chowk} • Rs. {room.rent.toLocaleString()} /mo • Listed by: {room.ownerName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePremium(room.id, room.isPremium || false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                  >
                    {room.isPremium ? 'Remove Premium' : 'Make Premium'}
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
