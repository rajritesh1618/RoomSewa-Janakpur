import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Crown,
  Calendar,
  Building2,
  AlertTriangle,
  Check,
  Ban,
  CheckCircle2,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { UserProfile, UserRole, RoomListing } from '../../types';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../../utils/nepalPhone';
import { NepalPhoneInput } from '../common/NepalPhoneInput';

interface AdminUserEditModalProps {
  user: UserProfile;
  userRooms: RoomListing[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onMessageUser?: (targetUserId: string, userName: string) => void;
}

export const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({
  user,
  userRooms,
  isOpen,
  onClose,
  onSave,
  onDeleteUser,
  onMessageUser
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [role, setRole] = useState<UserRole>(user.role || 'seeker');
  const [isPremium, setIsPremium] = useState(Boolean(user.isPremium));
  const [isDisabled, setIsDisabled] = useState(Boolean(user.isDisabled));
  const [lifetimeListingCount, setLifetimeListingCount] = useState(
    user.lifetimeListingCount?.toString() || userRooms.length.toString()
  );
  const [bio, setBio] = useState(user.bio || '');

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (phoneNumber.trim()) {
      if (!isValidNepalMobile(phoneNumber.trim())) {
        setErrorMsg(NEPAL_PHONE_ERROR_MESSAGE);
        return;
      }
    }

    setSaving(true);

    try {
      const finalPhone = phoneNumber.trim() ? formatFullNepalMobile(phoneNumber.trim()) : '';
      const updates: Partial<UserProfile> = {
        displayName: displayName.trim(),
        phoneNumber: finalPhone,
        role,
        isPremium,
        isDisabled,
        lifetimeListingCount: parseInt(lifetimeListingCount, 10) || 0,
        bio: bio.trim()
      };

      await onSave(user.uid, updates);
      setSuccessMsg('User profile updated successfully.');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await onDeleteUser(user.uid);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user profile.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              {displayName ? displayName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Manage User Account
                </h3>
                {isDisabled && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">
                    Disabled
                  </span>
                )}
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Gold
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{user.email || user.uid}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* User Stats Card */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Rooms</p>
              <p className="text-lg font-black text-slate-800 font-heading">{userRooms.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Account Type</p>
              <p className="text-xs font-extrabold uppercase text-indigo-600 mt-1">{role}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Joined Date</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <NepalPhoneInput
                value={phoneNumber}
                onChange={(_full, localDigits) => {
                  setPhoneNumber(localDigits ? formatFullNepalMobile(localDigits) : '');
                }}
                label="Phone Number"
                required={false}
                id="admin-edit-user-phone"
                error={phoneNumber && !isValidNepalMobile(phoneNumber) ? NEPAL_PHONE_ERROR_MESSAGE : null}
                helperText="10 digits starting with 98 or 97 (e.g. +977 98XXXXXXXX)."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">User Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
              >
                <option value="seeker">Room Seeker / Tenant</option>
                <option value="owner">Property Owner / Landlord</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lifetime Listed Rooms Quota</label>
              <input
                type="number"
                value={lifetimeListingCount}
                onChange={(e) => setLifetimeListingCount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Short Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="User biography or notes..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          {/* Quick Action Toggles */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Account Status & Privileges
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                    Verified Gold Member
                  </div>
                  <p className="text-[11px] text-slate-500">Unlimited listings & top priority</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-rose-300 transition-colors">
                <input
                  type="checkbox"
                  checked={isDisabled}
                  onChange={(e) => setIsDisabled(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <Ban className="w-4 h-4 text-rose-500" />
                    Disable Account
                  </div>
                  <p className="text-[11px] text-slate-500">Blocks login & hides user listings</p>
                </div>
              </label>
            </div>
          </div>

          {/* User's Listed Rooms */}
          {userRooms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                User's Listed Properties ({userRooms.length})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {userRooms.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="truncate mr-2">
                      <span className="font-bold text-slate-800">{r.title}</span>
                      <span className="text-slate-400 ml-2">({r.chowk})</span>
                    </div>
                    <span className="font-bold text-indigo-600 shrink-0">Rs. {r.rentPerMonth}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onMessageUser && (
              <button
                type="button"
                onClick={() => onMessageUser(user.uid, displayName || user.email)}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message User
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                confirmDelete
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDelete ? (deleting ? 'Deleting...' : 'Confirm Delete?') : 'Delete User'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Boolean(phoneNumber.trim() && !isValidNepalMobile(phoneNumber))}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Save User</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
