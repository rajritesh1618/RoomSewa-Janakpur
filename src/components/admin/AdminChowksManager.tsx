import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Search,
  Check,
  X,
  AlertCircle,
  Building2
} from 'lucide-react';
import { ChowkLocation, RoomListing } from '../../types';

interface AdminChowksManagerProps {
  chowks: ChowkLocation[];
  rooms: RoomListing[];
  onAddChowk: (name: string, wardNo?: string, popularLandmark?: string, order?: number, isHidden?: boolean) => Promise<void>;
  onUpdateChowk: (id: string, updates: Partial<ChowkLocation>) => Promise<void>;
  onDeleteChowk: (id: string) => Promise<void>;
  onToggleHideChowk: (id: string, currentHidden?: boolean) => Promise<void>;
  onReorderChowk: (id: string, newOrder: number) => Promise<void>;
}

export const AdminChowksManager: React.FC<AdminChowksManagerProps> = ({
  chowks,
  rooms,
  onAddChowk,
  onUpdateChowk,
  onDeleteChowk,
  onToggleHideChowk,
  onReorderChowk
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChowk, setEditingChowk] = useState<ChowkLocation | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [wardNo, setWardNo] = useState('');
  const [popularLandmark, setPopularLandmark] = useState('');
  const [order, setOrder] = useState('1');
  const [isHidden, setIsHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate active rooms count per chowk
  const getRoomCount = (chowkName: string) => {
    return rooms.filter((r) => r.chowk === chowkName && r.approvalStatus === 'approved').length;
  };

  const sortedChowks = [...chowks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const filteredChowks = sortedChowks.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.wardNo && c.wardNo.includes(searchQuery)) ||
    (c.popularLandmark && c.popularLandmark.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingChowk(null);
    setName('');
    setWardNo('');
    setPopularLandmark('');
    setOrder((chowks.length + 1).toString());
    setIsHidden(false);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: ChowkLocation) => {
    setEditingChowk(c);
    setName(c.name);
    setWardNo(c.wardNo || '');
    setPopularLandmark(c.popularLandmark || '');
    setOrder((c.order ?? 1).toString());
    setIsHidden(Boolean(c.isHidden));
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleSaveChowk = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Chowk / Area name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const orderNum = parseInt(order, 10) || 1;
      if (editingChowk) {
        await onUpdateChowk(editingChowk.id, {
          name: name.trim(),
          wardNo: wardNo.trim(),
          popularLandmark: popularLandmark.trim(),
          order: orderNum,
          isHidden
        });
      } else {
        await onAddChowk(name.trim(), wardNo.trim(), popularLandmark.trim(), orderNum, isHidden);
      }
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save Chowk.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteChowk(id);
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete Chowk.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedChowks.length) return;

    const currentChowk = sortedChowks[index];
    const targetChowk = sortedChowks[targetIndex];

    const currentOrder = currentChowk.order ?? index + 1;
    const targetOrder = targetChowk.order ?? targetIndex + 1;

    await onReorderChowk(currentChowk.id, targetOrder);
    await onReorderChowk(targetChowk.id, currentOrder);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chowks, wards, or landmarks..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Chowk / Area
        </button>
      </div>

      {/* Chowks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-800 font-heading">
              Janakpur Chowks & Localities ({sortedChowks.length})
            </h3>
            <p className="text-xs text-slate-500">
              Manage all localities used across room search filters, address pickers, and owner posting forms.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3 w-16 text-center">Order</th>
                <th className="px-5 py-3">Chowk / Area Name</th>
                <th className="px-5 py-3">Ward No.</th>
                <th className="px-5 py-3">Key Landmark</th>
                <th className="px-5 py-3 text-center">Active Rooms</th>
                <th className="px-5 py-3 text-center">Visibility</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChowks.map((c, idx) => {
                const roomCount = getRoomCount(c.name);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      c.isHidden ? 'bg-slate-50/50 opacity-70' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-center font-bold text-slate-400">
                      <div className="flex items-center justify-center gap-1">
                        <span>{c.order ?? idx + 1}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 p-0.5"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === sortedChowks.length - 1}
                            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 p-0.5"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">id: {c.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3 font-semibold text-slate-700">
                      {c.wardNo ? `Ward ${c.wardNo}` : <span className="text-slate-400 italic">Not set</span>}
                    </td>

                    <td className="px-5 py-3 text-slate-600 font-medium">
                      {c.popularLandmark || <span className="text-slate-400 italic">—</span>}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                        {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleHideChowk(c.id, c.isHidden)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                          c.isHidden
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {c.isHidden ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hidden
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Visible
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Edit Chowk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {deletingId === c.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(c.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete Chowk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredChowks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No chowks match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Chowk Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                {editingChowk ? 'Edit Chowk / Area' : 'Add New Chowk / Area'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveChowk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chowk / Area Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bhanu Chowk"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ward Number</label>
                  <input
                    type="text"
                    value={wardNo}
                    onChange={(e) => setWardNo(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Popular Landmark / Description
                </label>
                <input
                  type="text"
                  value={popularLandmark}
                  onChange={(e) => setPopularLandmark(e.target.value)}
                  placeholder="e.g. Near Janaki Mandir & Bus Stand"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHidden}
                    onChange={(e) => setIsHidden(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>Hide this chowk from public dropdown filters</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : <><Check className="w-3.5 h-3.5" /> Save Chowk</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
