import React, { useState } from 'react';
import {
  Settings,
  Save,
  Check,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  User,
  ShieldCheck,
  DollarSign,
  Lock,
  ToggleLeft,
  ToggleRight,
  CreditCard
} from 'lucide-react';
import { AdminSettings } from '../../types';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../../utils/nepalPhone';
import { NepalPhoneInput } from '../common/NepalPhoneInput';

interface AdminSettingsManagerProps {
  settings: AdminSettings;
  onSaveSettings: (updates: Partial<AdminSettings>) => Promise<void>;
}

export const AdminSettingsManager: React.FC<AdminSettingsManagerProps> = ({
  settings,
  onSaveSettings
}) => {
  const [adminDisplayName, setAdminDisplayName] = useState(settings.adminDisplayName || 'Janakpur Admin Desk');
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || 'roomsewajanakpur@gmail.com');
  const [adminPhone, setAdminPhone] = useState(settings.adminPhone || '+977 9800000000');
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone || '+977 9800000000');
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || 'support@roomsewa.com');
  const [supportWhatsApp, setSupportWhatsApp] = useState(settings.supportWhatsApp || '+977 9800000000');
  const [officeAddress, setOfficeAddress] = useState(settings.officeAddress || 'Station Road, Janakpurdham, Nepal');

  // App Business Rules
  const [lifetimeFreeListingQuota, setLifetimeFreeListingQuota] = useState(
    (settings.lifetimeFreeListingQuota ?? 1).toString()
  );
  const [premiumFeeNPR, setPremiumFeeNPR] = useState((settings.premiumFeeNPR ?? 200).toString());
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(settings.maintenanceMode));
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    settings.maintenanceMessage || 'RoomSewa Janakpur is briefly upgrading its servers. We will be back online shortly!'
  );
  const [allowDirectRegistration, setAllowDirectRegistration] = useState(
    settings.allowDirectRegistration ?? true
  );
  const [autoApproveVerifiedOwners, setAutoApproveVerifiedOwners] = useState(
    Boolean(settings.autoApproveVerifiedOwners)
  );

  // Payment Accounts
  const [esewaId, setEsewaId] = useState(settings.esewaId || '9800000000 (RoomSewa Janakpur)');
  const [khaltiId, setKhaltiId] = useState(settings.khaltiId || '9800000000 (RoomSewa Janakpur)');
  const [bankDetails, setBankDetails] = useState(
    settings.bankDetails || 'Nepal Bank Ltd, Janakpur Branch, A/C: 0123456789, Name: RoomSewa Janakpur'
  );

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!adminPhone.trim() || !isValidNepalMobile(adminPhone)) {
      setErrorMsg(`Admin Mobile is invalid. ${NEPAL_PHONE_ERROR_MESSAGE}`);
      return;
    }

    setSaving(true);

    try {
      const quotaNum = parseInt(lifetimeFreeListingQuota, 10) || 1;
      const feeNum = parseInt(premiumFeeNPR, 10) || 200;

      await onSaveSettings({
        adminDisplayName: adminDisplayName.trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: formatFullNepalMobile(adminPhone.trim()),
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
        supportWhatsApp: supportWhatsApp.trim(),
        officeAddress: officeAddress.trim(),
        lifetimeFreeListingQuota: quotaNum,
        premiumFeeNPR: feeNum,
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
        allowDirectRegistration,
        autoApproveVerifiedOwners,
        esewaId: esewaId.trim(),
        khaltiId: khaltiId.trim(),
        bankDetails: bankDetails.trim()
      });

      setSuccessMsg('Admin and platform settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save admin settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 font-heading flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            Central System & Admin Settings
          </h3>
          <p className="text-xs text-slate-500">
            Configure platform policies, admin contacts, fees, quotas, and payment gateways.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || !isValidNepalMobile(adminPhone)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Settings...' : 'Save All Settings'}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Admin Profile Details */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          Admin Profile & Identity
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Display Name</label>
            <input
              type="text"
              value={adminDisplayName}
              onChange={(e) => setAdminDisplayName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <NepalPhoneInput
              value={adminPhone}
              onChange={(_full, localDigits) => {
                setAdminPhone(localDigits ? formatFullNepalMobile(localDigits) : '');
              }}
              label="Admin Mobile"
              required
              id="admin-settings-admin-phone"
              error={adminPhone && !isValidNepalMobile(adminPhone) ? NEPAL_PHONE_ERROR_MESSAGE : null}
              helperText="Fixed +977 prefix, 10 digits starting with 98 or 97."
            />
          </div>
        </div>
      </div>

      {/* Pricing & Listing Quotas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-600" />
          Listing Rules & Gold Premium Pricing
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Free Listing Quota Per Owner
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={lifetimeFreeListingQuota}
              onChange={(e) => setLifetimeFreeListingQuota(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default 1 free room listing</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lifetime Gold Premium Fee (Rs. NPR)
            </label>
            <input
              type="number"
              min={50}
              value={premiumFeeNPR}
              onChange={(e) => setPremiumFeeNPR(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">Standard: Rs. 200 one-time</p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApproveVerifiedOwners}
                onChange={(e) => setAutoApproveVerifiedOwners(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span>Auto-approve listings for Gold Owners</span>
            </label>
          </div>
        </div>
      </div>

      {/* Payment Accounts for Owners */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          Official Payment Accounts (Shown to Owners for Gold Upgrade)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">eSewa ID / Mobile</label>
            <input
              type="text"
              value={esewaId}
              onChange={(e) => setEsewaId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Khalti ID / Mobile</label>
            <input
              type="text"
              value={khaltiId}
              onChange={(e) => setKhaltiId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Bank Transfer Details</label>
          <input
            type="text"
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              Platform Maintenance Mode
            </h4>
            <p className="text-xs text-slate-500">
              When enabled, a maintenance banner will inform visitors about routine upgrades.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded"
            />
            <span className={maintenanceMode ? 'text-rose-600 font-extrabold' : 'text-slate-600'}>
              {maintenanceMode ? 'Maintenance ACTIVE' : 'Disabled'}
            </span>
          </label>
        </div>

        {maintenanceMode && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Notice</label>
            <textarea
              rows={2}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-rose-200 bg-rose-50/40 text-rose-900 outline-none focus:border-rose-600"
            />
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving || !isValidNepalMobile(adminPhone)}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Settings...' : 'Save All Settings'}
        </button>
      </div>
    </form>
  );
};
