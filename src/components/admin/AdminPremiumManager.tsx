import React, { useState, useEffect } from 'react';
import {
  Crown,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Check,
  Edit2,
  Save,
  CheckCircle2,
  Sparkles,
  Users,
  Search,
  UserCheck,
  UserX,
  Building,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useContent } from '../../context/ContentContext';
import { useRooms } from '../../context/RoomContext';
import { PremiumBenefitItem, UserProfile } from '../../types';

export const AdminPremiumManager: React.FC<{ onNavigateToPayments?: () => void }> = ({
  onNavigateToPayments
}) => {
  const {
    premiumConfig,
    updatePremiumConfig,
    addPremiumBenefit,
    updatePremiumBenefit,
    deletePremiumBenefit
  } = useContent();

  const { setUserPremiumStatus, rooms } = useRooms();

  const [activeTab, setActiveTab] = useState<'config' | 'benefits' | 'users'>('config');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Premium config edit state
  const [priceNPR, setPriceNPR] = useState(premiumConfig.priceNPR || 200);
  const [title, setTitle] = useState(premiumConfig.title || '');
  const [subtitle, setSubtitle] = useState(premiumConfig.subtitle || '');
  const [durationText, setDurationText] = useState(premiumConfig.durationText || 'Lifetime Access');
  const [rulesText, setRulesText] = useState(premiumConfig.rulesText || '');
  const [savingConfig, setSavingConfig] = useState(false);

  // New benefit state
  const [newBenefitText, setNewBenefitText] = useState('');
  const [showAddBenefit, setShowAddBenefit] = useState(false);

  // Users state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'premium' | 'non-premium'>('premium');

  useEffect(() => {
    setPriceNPR(premiumConfig.priceNPR || 200);
    setTitle(premiumConfig.title || '');
    setSubtitle(premiumConfig.subtitle || '');
    setDurationText(premiumConfig.durationText || 'Lifetime Access');
    setRulesText(premiumConfig.rulesText || '');
  }, [premiumConfig]);

  // Load all users for user management
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push({ uid: d.id, ...d.data() } as UserProfile);
      });
      setAllUsers(list);
    });
    return () => unsub();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await updatePremiumConfig({
        priceNPR: Number(priceNPR),
        title: title.trim(),
        subtitle: subtitle.trim(),
        durationText: durationText.trim(),
        rulesText: rulesText.trim()
      });
      setFeedbackMsg({ type: 'success', text: 'Premium settings updated successfully.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update premium settings.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleGlobalEnabled = async () => {
    try {
      await updatePremiumConfig({ enabled: !premiumConfig.enabled });
      setFeedbackMsg({
        type: 'success',
        text: `Premium feature ${!premiumConfig.enabled ? 'Enabled' : 'Disabled'} globally.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to toggle premium status.' });
    }
  };

  const handleToggleGlobalVisible = async () => {
    try {
      await updatePremiumConfig({ visible: !premiumConfig.visible });
      setFeedbackMsg({
        type: 'success',
        text: `Premium page is now ${!premiumConfig.visible ? 'Visible' : 'Hidden'} for users.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to toggle premium visibility.' });
    }
  };

  const handleAddBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBenefitText.trim()) return;
    try {
      await addPremiumBenefit({
        text: newBenefitText.trim(),
        active: true
      });
      setNewBenefitText('');
      setShowAddBenefit(false);
      setFeedbackMsg({ type: 'success', text: 'New premium perk added.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to add benefit.' });
    }
  };

  const handleToggleBenefitActive = async (b: PremiumBenefitItem) => {
    try {
      await updatePremiumBenefit(b.id, { active: !b.active });
    } catch {
      // Ignore
    }
  };

  const handleDeleteBenefit = async (b: PremiumBenefitItem) => {
    if (confirm(`Delete benefit "${b.text}"?`)) {
      try {
        await deletePremiumBenefit(b.id);
        setFeedbackMsg({ type: 'success', text: 'Benefit removed.' });
        setTimeout(() => setFeedbackMsg(null), 2500);
      } catch {
        setFeedbackMsg({ type: 'error', text: 'Failed to remove benefit.' });
      }
    }
  };

  const handleToggleUserPremium = async (u: UserProfile) => {
    const willBePremium = !u.isPremium;
    const confirmMsg = willBePremium
      ? `Grant lifetime Premium Gold access to ${u.displayName || u.email}? All their room listings will instantly get gold badges.`
      : `Revoke Premium access from ${u.displayName || u.email}?`;

    if (confirm(confirmMsg)) {
      try {
        await setUserPremiumStatus(u.uid, willBePremium);
        setFeedbackMsg({
          type: 'success',
          text: `Premium status ${willBePremium ? 'Granted to' : 'Revoked from'} ${u.displayName || u.email}.`
        });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch {
        setFeedbackMsg({ type: 'error', text: 'Failed to update user premium status.' });
      }
    }
  };

  // Filter users
  const filteredUsers = allUsers.filter((u) => {
    const isPrem = Boolean(u.isPremium);
    const matchesFilter =
      userFilter === 'all' ||
      (userFilter === 'premium' && isPrem) ||
      (userFilter === 'non-premium' && !isPrem);

    const q = userSearch.toLowerCase();
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const totalPremiumUsers = allUsers.filter((u) => u.isPremium).length;

  return (
    <div className="space-y-6">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
              <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Landlord Premium Management & Monetization
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Premium Program & Gold Member Control
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Configure pricing, perks, rules, and toggle visibility. View all active Gold landlords in Janakpur and grant or revoke status in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToPayments && (
              <button
                onClick={onNavigateToPayments}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                Review Payment Approvals
              </button>
            )}
          </div>
        </div>

        {/* Global toggles summary */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 font-bold">Premium System:</span>
            <button
              onClick={handleToggleGlobalEnabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                premiumConfig.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {premiumConfig.enabled ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  Globally Active
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-rose-400" />
                  Temporarily Disabled
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 font-bold">User Visibility:</span>
            <button
              onClick={handleToggleGlobalVisible}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                premiumConfig.visible
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600'
              }`}
            >
              {premiumConfig.visible ? (
                <>
                  <Eye className="w-4 h-4 text-sky-400" />
                  Visible to Owners
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  Hidden from Users
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Users className="w-4 h-4" />
            <span>{totalPremiumUsers} Active Gold Landlords</span>
          </div>
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

      {/* Master Premium System Switch Card according to User Specification */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-black font-heading text-slate-900 tracking-tight">
                Premium System
              </h3>
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                  premiumConfig.enabled
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Premium Status: {premiumConfig.enabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Global master control for landlord monetization. Switch between full monetization mode and 100% free mode for all property owners across Janakpur.
            </p>
          </div>

          {/* Big [ ON / OFF ] Switch Component */}
          <div className="flex items-center gap-3 shrink-0 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-extrabold text-slate-600 pl-2">Premium Status:</span>
            <div className="flex items-center rounded-xl bg-white shadow-xs p-1 border border-slate-200/90">
              <button
                type="button"
                onClick={async () => {
                  if (!premiumConfig.enabled) {
                    await handleToggleGlobalEnabled();
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  premiumConfig.enabled
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ON</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (premiumConfig.enabled) {
                    await handleToggleGlobalEnabled();
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  !premiumConfig.enabled
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>OFF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Mode Explanations matching the user brief */}
        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ON Description Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              premiumConfig.enabled
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50/60 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">
                  ON → Premium features & restrictions active
                </span>
              </div>
              {premiumConfig.enabled && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Owners receive <strong>1 lifetime free listing</strong>. Additional room listings require upgrading to Lifetime Gold Premium (Rs {premiumConfig.priceNPR || 200}). Gold badges, payment verification, and priority rankings are active.
            </p>
          </div>

          {/* OFF Description Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              !premiumConfig.enabled
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50/60 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-950">
                  OFF → All owners can use the app for free
                </span>
              </div>
              {!premiumConfig.enabled && (
                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              All listing restrictions are lifted. Property owners and landlords in Janakpur can list <strong>unlimited rooms for free</strong> without paid upgrade gates, restriction warnings, or payment requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'config'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Plan Settings & Pricing
        </button>
        <button
          onClick={() => setActiveTab('benefits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'benefits'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manage Perks & Benefits ({premiumConfig.benefits?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Premium Landlords Directory ({totalPremiumUsers})
        </button>
      </div>

      {/* Tab 1: Plan Settings & Pricing */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSaveConfig} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Premium Price (in NPR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    Rs
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={priceNPR}
                    onChange={(e) => setPriceNPR(Number(e.target.value))}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-extrabold text-slate-900 rounded-xl border border-slate-200 focus:border-amber-600 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Current default is Rs 200 one-time fee</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Duration / Access Term *
                </label>
                <input
                  type="text"
                  value={durationText}
                  onChange={(e) => setDurationText(e.target.value)}
                  placeholder="e.g. Lifetime Access, 1 Year"
                  required
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RoomSewa Janakpur Lifetime Gold Pass"
                required
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Plan Subtitle / Tagline
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short pitch shown to owners on the upgrade screen..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Terms & Rules for Landlords
              </label>
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={4}
                placeholder="Specify approval conditions, verification requirements, and refund policy..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-amber-600 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 fill-slate-950" />
                {savingConfig ? 'Saving Changes...' : 'Save Premium Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Manage Perks & Benefits */}
      {activeTab === 'benefits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Manage the perks displayed to landlords on the Premium upgrade screen.
            </p>
            <button
              onClick={() => setShowAddBenefit(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Perk
            </button>
          </div>

          {showAddBenefit && (
            <form
              onSubmit={handleAddBenefit}
              className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3"
            >
              <input
                type="text"
                value={newBenefitText}
                onChange={(e) => setNewBenefitText(e.target.value)}
                placeholder="e.g. Featured in Janakpur Facebook group announcements"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-indigo-200 bg-white outline-none focus:border-indigo-600"
              />
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
                >
                  Save Perk
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBenefit(false)}
                  className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {premiumConfig.benefits?.map((b, idx) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      b.active ? 'text-slate-800' : 'text-slate-400 line-through'
                    }`}
                  >
                    {b.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleBenefitActive(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      b.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {b.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDeleteBenefit(b)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Delete Perk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Premium Landlords Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, phone, or email..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {(['premium', 'all', 'non-premium'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    userFilter === f
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'premium' ? `Gold Landlords (${totalPremiumUsers})` : f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const userRoomsCount = rooms.filter((r) => r.ownerId === u.uid).length;

                return (
                  <div
                    key={u.uid}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          u.isPremium
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.isPremium ? <Crown className="w-5 h-5 fill-slate-950" /> : (u.displayName?.[0] || 'U')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900 font-heading">
                            {u.displayName || 'Unnamed User'}
                          </span>
                          {u.isPremium && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                              <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                              Gold Member
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>{u.email}</span>
                          {u.phoneNumber && <span>• {u.phoneNumber}</span>}
                          <span className="flex items-center gap-1 text-slate-600">
                            <Building className="w-3 h-3 text-indigo-500" />
                            {userRoomsCount} Listed Rooms
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleUserPremium(u)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          u.isPremium
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs'
                        }`}
                      >
                        {u.isPremium ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Revoke Gold
                          </>
                        ) : (
                          <>
                            <Crown className="w-3.5 h-3.5 fill-slate-950" />
                            Grant Lifetime Gold
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 p-6">
                  <Crown className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No users found matching current filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
