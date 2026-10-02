import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  Sparkles,
  Camera,
  RotateCcw,
  Clock,
  HelpCircle,
  Eye
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { AdminSupportProfile } from '../../types';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
  'https://api.dicebear.com/7.x/bottts/svg?seed=roomsewasupport',
  'https://api.dicebear.com/7.x/identicon/svg?seed=janakpursupport'
];

export const AdminSupportProfileSettings: React.FC = () => {
  const { supportProfile, updateSupportProfile } = useChat();

  const [formData, setFormData] = useState<AdminSupportProfile>(supportProfile);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFormData(supportProfile);
  }, [supportProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSupportProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update support profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photoURL: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Admin Support Profile Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Customize how your official Support Desk appears to all seekers and owners in RoomSewa Janakpur.
            </p>
          </div>

          {success && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Support Profile Name *
            </label>
            <input
              type="text"
              required
              value={formData.profileName}
              onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
              placeholder="e.g., RoomSewa Janakpur Support or Admin"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              This name is shown as the primary title of the Support conversation.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Display Name (Agent Name) *
            </label>
            <input
              type="text"
              required
              value={formData.adminDisplayName}
              onChange={(e) => setFormData({ ...formData, adminDisplayName: e.target.value })}
              placeholder="e.g., Ritesh (Support Lead) or Helpdesk Officer"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Profile Picture / Avatar
            </label>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={formData.photoURL}
                alt="Support Avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-xs"
              />
              <div className="space-y-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload custom photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomImageUpload}
                  />
                </label>
                <p className="text-[10px] text-slate-400">Or pick from preset avatars below</p>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, photoURL: url })}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                    formData.photoURL === url ? 'border-indigo-600 scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Support Description *
            </label>
            <textarea
              rows={2}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Official Helpdesk for Janakpur room seekers & property owners. We usually reply in 5-10 minutes."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Automatic Welcome Greeting Message
            </label>
            <textarea
              rows={2}
              value={formData.welcomeMessage || ''}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              placeholder="Sent automatically when a user opens support for the first time..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Active Support Hours
            </label>
            <input
              type="text"
              value={formData.activeHours || ''}
              onChange={(e) => setFormData({ ...formData, activeHours: e.target.value })}
              placeholder="e.g., Every day: 7:00 AM – 9:00 PM (Janakpur Time)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save Support Profile'}</span>
            </button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Live User Chat Preview</span>
            </div>

            {/* Mock Chat Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={formData.photoURL}
                    alt="Preview"
                    className="w-12 h-12 rounded-2xl object-cover border border-indigo-200"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 rounded-full text-white">
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {formData.profileName || 'RoomSewa Support'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {formData.activeHours || 'Active now'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                {formData.description || 'Official Janakpur Helpdesk'}
              </div>

              {/* Sample Bot Welcome Bubble */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 ml-1">
                  {formData.adminDisplayName || 'Admin Desk'}
                </span>
                <div className="p-3 bg-slate-900 text-white rounded-2xl rounded-tl-xs text-xs">
                  {formData.welcomeMessage || 'Namaste! How can we assist you today?'}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              Changes take effect immediately across all users' chat interfaces.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
