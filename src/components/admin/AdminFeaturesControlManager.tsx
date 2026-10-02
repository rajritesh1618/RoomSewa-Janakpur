import React, { useState } from 'react';
import {
  Sliders,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  FolderTree
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { AppFeatureControl } from '../../types';

export const AdminFeaturesControlManager: React.FC = () => {
  const {
    featureControls,
    updateFeatureControl,
    addFeatureControl,
    deleteFeatureControl,
    resetFeatureControls
  } = useContent();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New feature form state
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<AppFeatureControl['category']>('custom');
  const [newEnabled, setNewEnabled] = useState(true);
  const [newVisible, setNewVisible] = useState(true);

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'core', label: 'Core App' },
    { id: 'discovery', label: 'Discovery & Search' },
    { id: 'communication', label: 'Communication & Contact' },
    { id: 'account', label: 'User Account' },
    { id: 'interactive', label: 'Interactive & Social' },
    { id: 'custom', label: 'Custom' }
  ];

  const filteredFeatures = featureControls.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleToggleEnabled = async (feature: AppFeatureControl) => {
    try {
      await updateFeatureControl(feature.id, { enabled: !feature.enabled });
      setFeedbackMsg({
        type: 'success',
        text: `"${feature.name}" ${!feature.enabled ? 'Enabled' : 'Disabled'} successfully.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update feature setting.' });
    }
  };

  const handleToggleVisible = async (feature: AppFeatureControl) => {
    try {
      await updateFeatureControl(feature.id, { visible: !feature.visible });
      setFeedbackMsg({
        type: 'success',
        text: `"${feature.name}" is now ${!feature.visible ? 'Visible' : 'Hidden'} for users.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update visibility setting.' });
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newName.trim()) return;

    const formattedKey = newKey.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_');
    const existing = featureControls.find((f) => f.key === formattedKey);
    if (existing) {
      alert(`A feature with key "${formattedKey}" already exists.`);
      return;
    }

    try {
      await addFeatureControl({
        key: formattedKey,
        name: newName.trim(),
        description: newDesc.trim() || 'Custom app feature control for RoomSewa Janakpur',
        category: newCategory,
        enabled: newEnabled,
        visible: newVisible
      });

      setShowAddModal(false);
      setNewKey('');
      setNewName('');
      setNewDesc('');
      setFeedbackMsg({ type: 'success', text: `Custom feature "${newName}" created successfully!` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to create new feature.' });
    }
  };

  const handleDelete = async (feature: AppFeatureControl) => {
    if (confirm(`Are you sure you want to delete custom feature "${feature.name}"? This action cannot be undone.`)) {
      try {
        await deleteFeatureControl(feature.id);
        setFeedbackMsg({ type: 'success', text: `Feature "${feature.name}" deleted.` });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch {
        setFeedbackMsg({ type: 'error', text: 'Failed to delete feature.' });
      }
    }
  };

  const handleReset = async () => {
    try {
      await resetFeatureControls();
      setShowResetConfirm(false);
      setFeedbackMsg({ type: 'success', text: 'All feature controls reset to default configuration.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to reset feature controls.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls info banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
              <Sliders className="w-3.5 h-3.5" />
              Central App Controls & Visibility Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Feature Management & Visibility
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Turn any feature ON or OFF, or HIDE/UNHIDE buttons and sections across RoomSewa Janakpur in real time without touching source code. Existing rooms and user records are permanently preserved.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Feature
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
              title="Reset to default features"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Safety Note */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-amber-300/90">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Safety Guarantee:</strong> Hiding a feature only hides its UI components from seekers and owners. The Admin Panel itself can never be hidden, and database listings remain 100% safe.
          </span>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedbackMsg.text}
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features by name, key, or description..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFeatures.map((feat) => {
          const isCoreApp = ['room_listing', 'premium', 'search', 'filters', 'chowk_selection'].includes(feat.key);

          return (
            <div
              key={feat.id}
              className={`p-5 rounded-3xl border transition-all ${
                !feat.enabled || !feat.visible
                  ? 'bg-slate-50/80 border-dashed border-slate-300 opacity-90'
                  : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200">
                      key: {feat.key}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md ${
                        feat.category === 'core'
                          ? 'bg-purple-100 text-purple-700'
                          : feat.category === 'discovery'
                          ? 'bg-blue-100 text-blue-700'
                          : feat.category === 'communication'
                          ? 'bg-emerald-100 text-emerald-700'
                          : feat.category === 'account'
                          ? 'bg-amber-100 text-amber-700'
                          : feat.category === 'interactive'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {feat.category}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 font-heading mt-1.5">
                    {feat.name}
                  </h3>
                </div>

                {!isCoreApp && (
                  <button
                    onClick={() => handleDelete(feat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete custom feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {feat.description}
              </p>

              {/* Status Controls Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                {/* ON / OFF Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Status:</span>
                  <button
                    onClick={() => handleToggleEnabled(feat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      feat.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {feat.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        Enabled (ON)
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-600" />
                        Disabled (OFF)
                      </>
                    )}
                  </button>
                </div>

                {/* Hide / Unhide Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisible(feat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      feat.visible
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {feat.visible ? (
                      <>
                        <Eye className="w-4 h-4 text-indigo-600" />
                        Visible in App
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-slate-600" />
                        Hidden from Users
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8">
          <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 font-heading">No matching features found</h3>
          <p className="text-xs text-slate-500 mt-1">Try changing your search term or category filter.</p>
        </div>
      )}

      {/* Add Custom Feature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-extrabold text-slate-900 font-heading mb-1">
              Add New App Feature Control
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Register a new controllable feature key to dynamically manage its availability and visibility.
            </p>

            <form onSubmit={handleCreateFeature} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Feature Key (Unique Identifier) *
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. hostel_booking, virtual_tour, rent_agreement"
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Feature Display Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Student Hostel Online Booking"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 bg-white"
                >
                  <option value="core">Core</option>
                  <option value="discovery">Discovery & Search</option>
                  <option value="communication">Communication</option>
                  <option value="account">User Account</option>
                  <option value="interactive">Interactive & Social</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Explain what this feature does in RoomSewa Janakpur..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newEnabled}
                    onChange={(e) => setNewEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Enabled by Default</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newVisible}
                    onChange={(e) => setNewVisible(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Visible by Default</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Create Feature Control
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Reset Feature Controls to Default?
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
              This will restore all default system features to their original enabled and visible states. Your room listings and user data will NOT be modified.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md"
              >
                Yes, Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
