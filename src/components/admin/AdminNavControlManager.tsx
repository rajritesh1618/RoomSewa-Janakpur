import React, { useState } from 'react';
import {
  Menu,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { AppNavControl } from '../../types';

export const AdminNavControlManager: React.FC = () => {
  const { navControls, updateNavControl, reorderNavControls, resetNavControls } = useContent();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleToggleVisible = async (nav: AppNavControl) => {
    try {
      await updateNavControl(nav.id, { visible: !nav.visible });
      setFeedbackMsg({
        type: 'success',
        text: `Menu item "${nav.label}" is now ${!nav.visible ? 'Visible' : 'Hidden'} in navigation.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update menu visibility.' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navControls.length) return;

    const newOrder = [...navControls];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    try {
      await reorderNavControls(newOrder);
      setFeedbackMsg({ type: 'success', text: `Menu order updated.` });
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to reorder menu items.' });
    }
  };

  const handleStartEdit = (nav: AppNavControl) => {
    setEditingId(nav.id);
    setEditingLabel(nav.label);
  };

  const handleSaveLabel = async (id: string) => {
    if (!editingLabel.trim()) return;
    try {
      await updateNavControl(id, { label: editingLabel.trim() });
      setEditingId(null);
      setFeedbackMsg({ type: 'success', text: `Menu label updated to "${editingLabel.trim()}".` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to save menu label.' });
    }
  };

  const handleReset = async () => {
    try {
      await resetNavControls();
      setShowResetConfirm(false);
      setFeedbackMsg({ type: 'success', text: 'Navigation menu items reset to default.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to reset navigation items.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sky-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold mb-3">
              <Menu className="w-3.5 h-3.5" />
              Menu & Navigation Control Center
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Navigation Menu Visibility & Order
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Control which menu tabs appear in the top navbar and mobile drawer. Hide items with one click, reorder positions, or customize display labels.
            </p>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Menu Defaults
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-sky-200/90">
          <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400" />
          <span>
            Admin Panel navigation button is permanently protected and will always remain visible to authorized administrators.
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

      {/* Nav items list */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-heading">
              Active Navigation Tabs ({navControls.length})
            </h3>
            <p className="text-xs text-slate-500">
              Arranged in current display order from left to right.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {navControls.map((item, idx) => {
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  !item.visible ? 'bg-slate-50/70 opacity-75' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Left: Position, Label, Key */}
                <div className="flex items-center gap-3.5">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>

                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-indigo-400 outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveLabel(item.id)}
                          className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 hover:bg-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 font-heading">
                          {item.label}
                        </span>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          title="Rename label"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        nav_key: {item.key}
                      </span>
                      {item.requireAuth && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200/60">
                          Auth Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Reorder Buttons + Visibility Toggle */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Order arrows */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === navControls.length - 1}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Visibility Button */}
                  <button
                    onClick={() => handleToggleVisible(item)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      item.visible
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {item.visible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                        Hidden
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Reset Navigation Menu to Defaults?
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
              This will restore standard navigation tab names, positions, and visibility.
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
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md"
              >
                Yes, Reset Navigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
