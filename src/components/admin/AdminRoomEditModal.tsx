import React, { useState } from 'react';
import {
  X,
  Check,
  Building2,
  MapPin,
  DollarSign,
  Phone,
  User,
  Image,
  Plus,
  Trash2,
  Crown,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { RoomListing, ChowkLocation, RoomType, RoomFeature } from '../../types';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../../utils/nepalPhone';
import { NepalPhoneInput } from '../common/NepalPhoneInput';
import { DynamicFeaturesInput } from '../DynamicFeaturesInput';
import { cleanCustomFeatures } from '../../utils/sanitizeFirestore';
import { LocationPickerMap } from '../LocationPickerMap';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface AdminRoomEditModalProps {
  room: RoomListing;
  chowks: ChowkLocation[];
  features: RoomFeature[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (roomId: string, updates: Partial<RoomListing>) => Promise<void>;
  onDelete?: (roomId: string) => Promise<void>;
}

export const AdminRoomEditModal: React.FC<AdminRoomEditModalProps> = ({
  room,
  chowks,
  features,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  // Form States initialized from room
  const [title, setTitle] = useState(room.title || '');
  const [description, setDescription] = useState(room.description || '');
  const [chowk, setChowk] = useState(room.chowk || chowks[0]?.name || 'Bhanu Chowk');
  const [wardNumber, setWardNumber] = useState(room.wardNumber || '');
  const [landmark, setLandmark] = useState(room.landmark || room.addressLine || '');
  const [rentPerMonth, setRentPerMonth] = useState(room.rentPerMonth?.toString() || '0');
  const [negotiable, setNegotiable] = useState(Boolean(room.negotiable));
  const [roomType, setRoomType] = useState<RoomType>(room.roomType || 'Single Room');
  const [floor, setFloor] = useState(room.floor || '1st Floor');
  const [roomFor, setRoomFor] = useState<'Male' | 'Female' | 'Family' | 'Anyone' | 'Students'>(
    room.roomFor || (room.studentsAllowed ? 'Students' : 'Anyone')
  );
  const [bestFor, setBestFor] = useState(room.bestFor || 'Students & Working Professionals');
  const [waterFacility, setWaterFacility] = useState(room.waterFacility || '24/7 Supply');
  const [electricityFacility, setElectricityFacility] = useState(room.electricityFacility || 'Separate Meter');
  const [wifiAvailable, setWifiAvailable] = useState(Boolean(room.wifiAvailable));
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    room.facilities || [
      room.attachedBathroom ? 'attached-bathroom' : null,
      room.kitchenAvailable ? 'private-kitchen' : null,
      room.parkingAvailable ? 'parking-bike-car' : null,
      room.balconyAvailable ? 'balcony-terrace' : null,
      room.wifiAvailable ? 'wifi-highspeed' : null
    ].filter(Boolean) as string[]
  );
  const [gateClosingTime, setGateClosingTime] = useState(room.gateClosingTime || '10:00 PM');
  const [guestPolicy, setGuestPolicy] = useState(room.guestPolicy || 'Guests allowed during daytime');
  const [rulesAndDetails, setRulesAndDetails] = useState(room.rulesAndDetails || '');
  const [photos, setPhotos] = useState<string[]>(room.photos && room.photos.length > 0 ? room.photos : []);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [customFeatures, setCustomFeatures] = useState<Record<string, any>>(room.customFeatures || {});
  const [ownerName, setOwnerName] = useState(room.ownerName || '');
  const [ownerPhone, setOwnerPhone] = useState(room.ownerPhone || '');
  const [ownerWhatsapp, setOwnerWhatsapp] = useState(room.ownerWhatsapp || room.ownerPhone || '');
  const [ownerEmail, setOwnerEmail] = useState(room.ownerEmail || '');
  const [status, setStatus] = useState<'available' | 'rented'>((room.status as any) === 'rented' ? 'rented' : 'available');
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>(
    (room.approvalStatus as any) || 'approved'
  );
  const [isHidden, setIsHidden] = useState(Boolean(room.isHidden));
  const [isFeatured, setIsFeatured] = useState(Boolean(room.isFeatured));
  const [isOwnerPremium, setIsOwnerPremium] = useState(Boolean(room.isOwnerPremium));
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | undefined>(
    room.locationCoordinates
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const toggleFacility = (facilityId: string) => {
    if (selectedFacilities.includes(facilityId)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== facilityId));
    } else {
      setSelectedFacilities([...selectedFacilities, facilityId]);
    }
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotos([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSetPrimaryPhoto = (index: number) => {
    if (index === 0) return;
    const chosen = photos[index];
    const rest = photos.filter((_, i) => i !== index);
    setPhotos([chosen, ...rest]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Room title is required.');
      return;
    }
    const rentNum = parseInt(rentPerMonth, 10);
    if (isNaN(rentNum) || rentNum <= 0) {
      setErrorMsg('Please enter a valid monthly rent in NPR.');
      return;
    }

    if (!ownerPhone.trim() || !isValidNepalMobile(ownerPhone)) {
      setErrorMsg(`Owner Phone is invalid. ${NEPAL_PHONE_ERROR_MESSAGE}`);
      return;
    }
    if (ownerWhatsapp.trim() && !isValidNepalMobile(ownerWhatsapp)) {
      setErrorMsg(`WhatsApp number is invalid. ${NEPAL_PHONE_ERROR_MESSAGE}`);
      return;
    }

    setSaving(true);

    try {
      const updates: Partial<RoomListing> = {
        title: title.trim(),
        description: description.trim(),
        chowk,
        wardNumber: wardNumber.trim(),
        addressLine: landmark.trim(),
        landmark: landmark.trim(),
        rentPerMonth: rentNum,
        negotiable,
        roomType,
        floor,
        roomFor,
        bestFor: bestFor.trim(),
        studentsAllowed: roomFor === 'Students' || roomFor === 'Anyone',
        waterFacility,
        electricityFacility,
        wifiAvailable,
        attachedBathroom: selectedFacilities.includes('attached-bathroom'),
        kitchenAvailable: selectedFacilities.includes('private-kitchen'),
        parkingAvailable: selectedFacilities.includes('parking-bike-car'),
        balconyAvailable: selectedFacilities.includes('balcony-terrace'),
        facilities: selectedFacilities,
        gateClosingTime: gateClosingTime.trim(),
        guestPolicy: guestPolicy.trim(),
        rulesAndDetails: rulesAndDetails.trim(),
        photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
        customFeatures: cleanCustomFeatures(customFeatures, features),
        ownerName: ownerName.trim(),
        ownerPhone: formatFullNepalMobile(ownerPhone.trim()),
        ownerWhatsapp: ownerWhatsapp.trim() ? formatFullNepalMobile(ownerWhatsapp.trim()) : '',
        ownerEmail: ownerEmail.trim(),
        status,
        approvalStatus,
        isHidden,
        isFeatured,
        isOwnerPremium,
        ...(locationCoordinates ? { locationCoordinates } : {}),
        updatedAt: new Date().toISOString()
      };

      await onSave(room.id, updates);
      setSuccessMsg('Room updated successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update room listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  Edit Room Listing (Admin)
                </h3>
                {isHidden && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase">
                    Hidden
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    approvalStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : approvalStatus === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {approvalStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">ID: {room.id} • Owner: {ownerName || room.ownerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* Section 1: Visibility & Admin Controls */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Admin Controls & Visibility
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Approval Status</label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Availability</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHidden}
                    onChange={(e) => setIsHidden(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  {isHidden ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  <span>Hide Listing</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Featured Room</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Basic Room Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Basic Room Information
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Spacious Sunny Single Room with Attached Bathroom"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Area / Chowk *</label>
                  <select
                    value={chowk}
                    onChange={(e) => setChowk(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                  >
                    {chowks.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.wardNo ? `(Ward ${c.wardNo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ward Number</label>
                  <input
                    type="text"
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Landmark / Street Address</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Janaki Temple East Gate"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Rent (Rs.) *</label>
                  <input
                    type="number"
                    value={rentPerMonth}
                    onChange={(e) => setRentPerMonth(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={negotiable}
                      onChange={(e) => setNegotiable(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <span>Price Negotiable</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                  >
                    <option value="Single Room">Single Room</option>
                    <option value="Double Room">Double Room</option>
                    <option value="1BHK">1BHK</option>
                    <option value="2BHK">2BHK</option>
                    <option value="Flat">Full Flat</option>
                    <option value="Hostel/Bed">Hostel / Bed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor</label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="Top Floor / Roof">Top Floor / Roof</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room For (Tenants)</label>
                  <select
                    value={roomFor}
                    onChange={(e) => setRoomFor(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                  >
                    <option value="Anyone">Anyone (No preference)</option>
                    <option value="Students">Students Only</option>
                    <option value="Male">Male / Boys</option>
                    <option value="Female">Female / Girls</option>
                    <option value="Family">Family Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Best For</label>
                  <input
                    type="text"
                    value={bestFor}
                    onChange={(e) => setBestFor(e.target.value)}
                    placeholder="e.g. RR Campus Students, Hospital Doctors, Family"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the room, sunlight, surrounding..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Utilities & Facilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Utilities, Amenities & Facilities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Water Supply</label>
                <select
                  value={waterFacility}
                  onChange={(e) => setWaterFacility(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                >
                  <option value="24/7 Supply">24/7 Supply</option>
                  <option value="Morning/Evening">Morning/Evening</option>
                  <option value="Handpump / Boring">Handpump / Boring</option>
                  <option value="Limited">Limited</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Electricity Facility</label>
                <select
                  value={electricityFacility}
                  onChange={(e) => setElectricityFacility(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                >
                  <option value="Separate Meter">Separate Meter</option>
                  <option value="24 Hours / Inverter">24 Hours / Inverter</option>
                  <option value="Shared Bill">Shared Bill</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wifiAvailable}
                    onChange={(e) => setWifiAvailable(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  <span>High-Speed Wi-Fi Included</span>
                </label>
              </div>
            </div>

            {/* Dynamic Features Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Included Amenities & Facilities (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {features
                  .filter((f) => !f.isHidden)
                  .map((feat) => {
                    const isSelected = selectedFacilities.includes(feat.id);
                    return (
                      <button
                        type="button"
                        key={feat.id}
                        onClick={() => toggleFacility(feat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {feat.name}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Custom Dynamic Features Inputs */}
            {features && features.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <DynamicFeaturesInput
                  features={features}
                  values={customFeatures}
                  onChange={(featId, val) => setCustomFeatures((prev) => ({ ...prev, [featId]: val }))}
                />
              </div>
            )}
          </div>

          {/* Section 4: Rules & Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gate Closing Time</label>
              <input
                type="text"
                value={gateClosingTime}
                onChange={(e) => setGateClosingTime(e.target.value)}
                placeholder="e.g. 10:00 PM or No restriction"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Guest Policy</label>
              <input
                type="text"
                value={guestPolicy}
                onChange={(e) => setGuestPolicy(e.target.value)}
                placeholder="e.g. Daytime visitors allowed, no overnight guests"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rules & Notes</label>
            <textarea
              rows={2}
              value={rulesAndDetails}
              onChange={(e) => setRulesAndDetails(e.target.value)}
              placeholder="e.g. No loud music after 10 PM, vegetarian cooking preferred..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          {/* Section: Exact Property Location on Map */}
          <div>
            <LocationPickerMap
              selectedChowk={chowk}
              wardNumber={wardNumber}
              addressLine={landmark}
              value={locationCoordinates}
              onChange={(coords) => setLocationCoordinates(coords)}
              isLocked={false}
              missingFields={[]}
            />
          </div>

          {/* Section 5: Photos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
              <span>Room Photos ({photos.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">First photo is cover image</span>
            </h4>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3">
                    <img src={url} alt={`Room photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-xs">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhoto(idx)}
                          title="Set as Cover"
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Paste direct photo image URL (https://...)"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Photo
              </button>
            </div>
          </div>

          {/* Section 6: Owner Information */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              Room Owner / Landlord Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <NepalPhoneInput
                  value={ownerPhone}
                  onChange={(_full, localDigits) => {
                    setOwnerPhone(localDigits ? formatFullNepalMobile(localDigits) : '');
                  }}
                  label="Owner Phone"
                  required
                  id="admin-edit-room-owner-phone"
                  error={ownerPhone && !isValidNepalMobile(ownerPhone) ? NEPAL_PHONE_ERROR_MESSAGE : null}
                  helperText="Mandatory +977 prefix, 10 digits starting with 98 or 97."
                />
              </div>

              <div>
                <NepalPhoneInput
                  value={ownerWhatsapp}
                  onChange={(_full, localDigits) => {
                    setOwnerWhatsapp(localDigits ? formatFullNepalMobile(localDigits) : '');
                  }}
                  label="WhatsApp Number"
                  required={false}
                  id="admin-edit-room-owner-whatsapp"
                  error={ownerWhatsapp && !isValidNepalMobile(ownerWhatsapp) ? NEPAL_PHONE_ERROR_MESSAGE : null}
                  helperText="Optional +977 prefix, 10 digits starting with 98 or 97."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Owner Email</label>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOwnerPremium}
                  onChange={(e) => setIsOwnerPremium(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Mark Owner as Verified Gold Member (Priority visibility across chowks)</span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 sticky bottom-0 z-20">
          <div>
            {onDelete && (
              <button
                type="button"
                disabled={deleting || saving}
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Room</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting || saving}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                saving ||
                deleting ||
                !isValidNepalMobile(ownerPhone) ||
                Boolean(ownerWhatsapp.trim() && !isValidNepalMobile(ownerWhatsapp))
              }
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save All Room Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        roomTitle={room.title}
        isDeleting={deleting}
        isAdmin={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (!onDelete) return;
          setDeleting(true);
          try {
            await onDelete(room.id);
            setShowDeleteConfirm(false);
            onClose();
          } catch (err: any) {
            setErrorMsg(err.message || 'Failed to delete room listing.');
            setShowDeleteConfirm(false);
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
};
