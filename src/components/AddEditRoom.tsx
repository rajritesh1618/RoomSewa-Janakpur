import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  Droplets,
  Zap,
  Wifi,
  GraduationCap,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Home,
  Crown,
  Clock
} from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { RoomListing, RoomType } from '../types';
import { DynamicFeaturesInput } from './DynamicFeaturesInput';
import { cleanCustomFeatures } from '../utils/sanitizeFirestore';
import { suggestChowkCoordinates } from '../services/geminiGeocode';
import { LocationPickerMap } from './LocationPickerMap';

interface AddEditRoomProps {
  initialData?: RoomListing | null;
  onSuccess: () => void;
  onCancel: () => void;
  onNavigatePremium?: () => void;
}

const ROOM_TYPES: RoomType[] = [
  'Single Room',
  'Double Room',
  '1BHK',
  '2BHK',
  'Flat',
  'Hostel/Bed'
];

const FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  'Top Floor / Terrace'
];

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80'
];

export const AddEditRoom: React.FC<AddEditRoomProps> = ({
  initialData,
  onSuccess,
  onCancel,
  onNavigatePremium
}) => {
  const { chowks, addRoom, submitRoomEdit, updateRoom, rooms } = useRooms();
  const { features, premiumConfig } = useContent();
  const { currentUser, userProfile, isPremium, isAdmin, setUserRole } = useAuth();
  const [upgradingRole, setUpgradingRole] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [chowk, setChowk] = useState(initialData?.chowk || chowks[0]?.name || 'Bhanu Chowk');
  const [wardNumber, setWardNumber] = useState(initialData?.wardNumber || 'Ward 4');
  const [addressLine, setAddressLine] = useState(initialData?.addressLine || '');
  const [rentPerMonth, setRentPerMonth] = useState(initialData?.rentPerMonth ? String(initialData.rentPerMonth) : '5000');
  const [negotiable, setNegotiable] = useState(initialData?.negotiable ?? true);
  const [roomType, setRoomType] = useState<RoomType>(initialData?.roomType || 'Single Room');
  const [floor, setFloor] = useState(initialData?.floor || '1st Floor');
  const [studentsAllowed, setStudentsAllowed] = useState(initialData?.studentsAllowed ?? true);
  const [waterFacility, setWaterFacility] = useState<RoomListing['waterFacility']>(
    initialData?.waterFacility || '24/7 Supply'
  );
  const [electricityFacility, setElectricityFacility] = useState<RoomListing['electricityFacility']>(
    initialData?.electricityFacility || 'Separate Meter'
  );
  const [wifiAvailable, setWifiAvailable] = useState(initialData?.wifiAvailable ?? true);
  const [kitchenAvailable, setKitchenAvailable] = useState(initialData?.kitchenAvailable ?? true);
  const [parkingAvailable, setParkingAvailable] = useState(initialData?.parkingAvailable ?? true);
  const [attachedBathroom, setAttachedBathroom] = useState(initialData?.attachedBathroom ?? false);
  const [balconyAvailable, setBalconyAvailable] = useState(initialData?.balconyAvailable ?? true);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(initialData?.facilities || []);
  const [customFeatures, setCustomFeatures] = useState<Record<string, any>>(() => {
    const base = initialData?.customFeatures ? { ...initialData.customFeatures } : {};
    if (initialData?.electricityChargePerUnit && !base['feature-electricity']) {
      base['feature-electricity'] = initialData.electricityChargePerUnit;
    }
    if (initialData?.waterAvailabilityType && !base['feature-water']) {
      base['feature-water'] = {
        mode: initialData.waterAvailabilityType === '24_hours' ? '24 Hours' : 'Choose Time',
        timeSlots: initialData.waterTimeSlots || []
      };
    }
    if (initialData?.waterSource && !base['feature-water-source']) {
      base['feature-water-source'] =
        initialData.waterSource === 'Other'
          ? { selected: 'Other', customText: initialData.waterSourceCustom || '' }
          : initialData.waterSource;
    }
    if (initialData?.gateClosingTime && !base['feature-gate-time']) {
      base['feature-gate-time'] = initialData.gateClosingTime.toLowerCase().includes('no fixed')
        ? 'No Fixed Closing Time'
        : { selected: 'Fixed Closing Time', time: initialData.gateClosingTime };
    }
    if (initialData?.rules && !base['feature-rules']) {
      base['feature-rules'] = [...(initialData.rules || []), ...(initialData.customRules || [])];
    }
    return base;
  });
  const [featureErrors, setFeatureErrors] = useState<Record<string, string>>({});
  const [rulesAndDetails, setRulesAndDetails] = useState(initialData?.rulesAndDetails || '');
  const [status, setStatus] = useState<RoomListing['status']>(initialData?.status || 'available');
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | undefined>(
    initialData?.locationCoordinates
  );
  const [suggestingCoords, setSuggestingCoords] = useState(false);
  const [coordFeedback, setCoordFeedback] = useState<string | null>(null);

  // Photos: support custom image URLs or direct file upload via FileReader (base64)
  const [photos, setPhotos] = useState<string[]>(
    initialData?.photos && initialData.photos.length > 0
      ? initialData.photos
      : [PRESET_SAMPLE_PHOTOS[0]]
  );
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [submittedSuccessType, setSubmittedSuccessType] = useState<'created' | 'edited' | 'resubmitted' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check lifetime listing history: owner gets ONLY ONE free room listing ever
  // Tracked based on lifetime listing history, NOT active room count
  const isEditing = Boolean(initialData);
  const lifetimeCount = userProfile?.lifetimeListingCount ?? 0;
  const hasUsedFreeListing = Boolean(
    userProfile?.hasUsedFreeListing === true ||
    lifetimeCount >= 1 ||
    rooms.some((r) => r.ownerId === currentUser?.uid)
  );

  // Premium restrictions active ONLY when Premium System is ON (enabled: true)
  // When Premium is OFF -> All owners can use the app for free without quota limits!
  const isPremiumSystemActive = Boolean(premiumConfig?.enabled);
  const isLimitReached = isPremiumSystemActive && !isEditing && !isPremium && !isAdmin && hasUsedFreeListing;

  // Validation check: Owner can only place the exact room pin on map after mandatory fields are completed
  const missingMandatoryFields: string[] = [];
  if (!title.trim()) missingMandatoryFields.push('Room Title');
  if (!chowk) missingMandatoryFields.push('Chowk / Location');
  if (!rentPerMonth || isNaN(Number(rentPerMonth)) || Number(rentPerMonth) <= 0) {
    missingMandatoryFields.push('Monthly Rent');
  }
  if (!roomType) missingMandatoryFields.push('Room Type');
  if (!floor) missingMandatoryFields.push('Floor');

  const electricityCheckVal = customFeatures['feature-electricity'] ?? customFeatures['Electricity'];
  if (
    electricityCheckVal === undefined ||
    electricityCheckVal === null ||
    electricityCheckVal === '' ||
    isNaN(Number(electricityCheckVal)) ||
    Number(electricityCheckVal) <= 0
  ) {
    missingMandatoryFields.push('Electricity Charge (NPR/unit)');
  }

  const waterCheckVal = customFeatures['feature-water'] ?? customFeatures['Water Availability'];
  if (!waterCheckVal) {
    missingMandatoryFields.push('Water Availability Schedule');
  }

  if (!photos || photos.length === 0) {
    missingMandatoryFields.push('At least 1 Room Photo');
  }

  const isLocationPickerLocked = missingMandatoryFields.length > 0;
  const hasExactLocation = Boolean(locationCoordinates?.lat && locationCoordinates?.lng);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotoUrl = () => {
    if (!customPhotoInput.trim()) return;
    setPhotos(prev => [...prev, customPhotoInput.trim()]);
    setCustomPhotoInput('');
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Strict role restriction: Seekers cannot list rooms
    const isOwnerOrAdmin = userProfile?.role === 'owner' || isAdmin;
    if (!isOwnerOrAdmin) {
      setErrorMsg('Room listing is exclusively reserved for Property Owners and Admins. Switch your account role to Owner to list your rooms.');
      return;
    }

    if (isLimitReached) {
      setErrorMsg('Your free room listing has already been used. Premium is required to list another room.');
      return;
    }

    if (!title.trim() || !chowk) {
      setErrorMsg('Please enter a valid title and chowk location.');
      return;
    }

    const rentNum = parseInt(rentPerMonth, 10);
    if (isNaN(rentNum) || rentNum < 500) {
      setErrorMsg('Please specify a reasonable monthly rent amount (at least Rs 500).');
      return;
    }

    // 1. Mandatory Electricity Validation: NPR per unit
    const electricityVal =
      customFeatures['feature-electricity'] ??
      customFeatures['Electricity'] ??
      Object.entries(customFeatures).find(([k]) => {
        const feat = features.find((f) => f.id === k);
        return feat?.name.toLowerCase() === 'electricity';
      })?.[1];

    if (
      electricityVal === undefined ||
      electricityVal === null ||
      electricityVal === '' ||
      isNaN(Number(electricityVal)) ||
      Number(electricityVal) <= 0
    ) {
      setErrorMsg('Electricity Charge (NPR per unit) is mandatory. Please enter the electricity price per unit.');
      setFeatureErrors((prev) => ({
        ...prev,
        'feature-electricity': 'Electricity charge per unit is mandatory'
      }));
      return;
    }

    // 2. Water Availability Check: if Choose Time, must have valid From/To time slot
    const waterVal =
      customFeatures['feature-water'] ??
      customFeatures['Water Availability'] ??
      Object.entries(customFeatures).find(([k]) => {
        const feat = features.find((f) => f.id === k);
        return feat?.name.toLowerCase().includes('water availability');
      })?.[1];

    if (
      typeof waterVal === 'object' &&
      waterVal?.mode === 'Choose Time' &&
      (!waterVal?.timeSlots || waterVal.timeSlots.length === 0)
    ) {
      setErrorMsg('Please specify at least one time period (From and To) for Water Availability.');
      setFeatureErrors((prev) => ({
        ...prev,
        'feature-water': 'At least one From/To time slot is required'
      }));
      return;
    }

    // 3. Dynamic required features check & price-required check
    for (const feat of features) {
      if (feat.isHidden || feat.isDisabled) continue;
      const val = customFeatures[feat.id];

      if (feat.isRequired) {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === 'object' && !val.selected && (!val.timeSlots || val.timeSlots.length === 0))
        ) {
          setErrorMsg(`"${feat.name}" is a mandatory feature. Please fill it in.`);
          setFeatureErrors((prev) => ({
            ...prev,
            [feat.id]: `${feat.name} is required`
          }));
          return;
        }
      }

      // If the selected option requires price, ensure valid price is entered
      if (typeof val === 'object' && val?.selected && feat.options) {
        const matchedOpt = feat.options.find(
          (o) => o.name === val.selected || o.id === val.selected
        );
        if (
          matchedOpt?.hasPriceInput &&
          matchedOpt?.priceRequired &&
          (val.price === undefined || val.price === null || val.price === '' || isNaN(Number(val.price)))
        ) {
          setErrorMsg(`Rate/price for "${matchedOpt.name}" in "${feat.name}" is required.`);
          setFeatureErrors((prev) => ({
            ...prev,
            [feat.id]: `Price for ${matchedOpt.name} is required`
          }));
          return;
        }
      }
    }

    // 4. Exact room location on map is mandatory for every room listing
    if (!locationCoordinates || typeof locationCoordinates.lat !== 'number' || typeof locationCoordinates.lng !== 'number') {
      setErrorMsg('Exact room location on the map is mandatory. Please drag the pin or click on the map to set the exact property location.');
      return;
    }

    // Generic, bulletproof cleaning of customFeatures:
    // - Never introduces undefined
    // - Omit empty optional features
    // - Only attaches price if the feature/option supports price and has valid numeric value
    const sanitizedCustomFeatures = cleanCustomFeatures(customFeatures, features);

    const electricityChargeNum = Number(electricityVal) || 15;
    const isWater24 =
      !waterVal ||
      waterVal === '24 Hours' ||
      (typeof waterVal === 'object' && (waterVal.mode === '24 Hours' || waterVal.selected === '24 Hours'));
    const waterSlots = typeof waterVal === 'object' && waterVal?.timeSlots ? waterVal.timeSlots : [];

    const waterSourceRaw = customFeatures['feature-water-source'] || customFeatures['Water Source'];
    const waterSourceVal =
      typeof waterSourceRaw === 'object' ? waterSourceRaw?.selected : waterSourceRaw || 'Tap Only';
    const waterSourceCustomVal =
      typeof waterSourceRaw === 'object' ? waterSourceRaw?.customText || '' : '';

    const gateTimeRaw = customFeatures['feature-gate-time'] || customFeatures['Gate Closing Time'];
    const gateClosingTimeVal =
      typeof gateTimeRaw === 'object'
        ? gateTimeRaw?.time || '10:00 PM'
        : gateTimeRaw || 'No Fixed Closing Time';

    const rulesRaw = customFeatures['feature-rules'] || customFeatures['House Rules'];
    const rulesList = Array.isArray(rulesRaw) ? rulesRaw : [];

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (isEditing && initialData) {
        // Enforce owner edit rules:
        // Edits by owners on approved listings require Admin approval before going public.
        // Old approved version stays live until Admin approves.
        await submitRoomEdit(initialData.id, {
          title: title.trim(),
          description: description.trim(),
          chowk,
          wardNumber,
          addressLine: addressLine.trim(),
          rentPerMonth: rentNum,
          negotiable,
          roomType,
          floor,
          studentsAllowed,
          waterFacility: isWater24 ? '24/7 Supply' : 'Morning/Evening',
          electricityFacility: 'Separate Meter',
          wifiAvailable,
          kitchenAvailable,
          parkingAvailable,
          attachedBathroom,
          balconyAvailable,
          facilities: selectedFacilities,
          customFeatures: sanitizedCustomFeatures,
          electricityChargePerUnit: electricityChargeNum,
          waterAvailabilityType: isWater24 ? '24_hours' : 'custom_time',
          waterTimeSlots: waterSlots,
          waterSource: waterSourceVal,
          waterSourceCustom: waterSourceCustomVal,
          gateClosingTime: gateClosingTimeVal,
          rules: rulesList,
          rulesAndDetails: rulesAndDetails.trim(),
          photos: photos.length > 0 ? photos : [PRESET_SAMPLE_PHOTOS[0]],
          status,
          ...(locationCoordinates ? { locationCoordinates } : {})
        });
      } else {
        await addRoom({
          title: title.trim(),
          description: description.trim(),
          chowk,
          wardNumber,
          addressLine: addressLine.trim(),
          rentPerMonth: rentNum,
          negotiable,
          roomType,
          floor,
          studentsAllowed,
          waterFacility: isWater24 ? '24/7 Supply' : 'Morning/Evening',
          electricityFacility: 'Separate Meter',
          wifiAvailable,
          kitchenAvailable,
          parkingAvailable,
          attachedBathroom,
          balconyAvailable,
          facilities: selectedFacilities,
          customFeatures: sanitizedCustomFeatures,
          electricityChargePerUnit: electricityChargeNum,
          waterAvailabilityType: isWater24 ? '24_hours' : 'custom_time',
          waterTimeSlots: waterSlots,
          waterSource: waterSourceVal,
          waterSourceCustom: waterSourceCustomVal,
          gateClosingTime: gateClosingTimeVal,
          rules: rulesList,
          rulesAndDetails: rulesAndDetails.trim(),
          status: 'available',
          photos: photos.length > 0 ? photos : [PRESET_SAMPLE_PHOTOS[0]],
          ownerId: currentUser.uid,
          ownerName: userProfile?.displayName || currentUser.displayName || 'Owner',
          ownerEmail: currentUser.email || '',
          ownerPhone: userProfile?.phoneNumber || '+9779844012345',
          ownerPhoto: userProfile?.photoURL || '',
          isOwnerPremium: isPremium,
          ...(locationCoordinates ? { locationCoordinates } : {})
        });
      }

      if (isEditing && initialData) {
        if (initialData.approvalStatus === 'rejected') {
          setSubmittedSuccessType('resubmitted');
        } else {
          setSubmittedSuccessType('edited');
        }
      } else {
        setSubmittedSuccessType('created');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save room listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="mb-6 pb-6 border-b border-slate-100">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isEditing ? 'Edit Room Listing' : 'List a New Room in Janakpur'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provide clear details and high-quality room photos to connect with verified room seekers quickly.
          </p>
        </div>

        {userProfile?.role === 'seeker' && !isAdmin ? (
          <div className="py-10 px-4 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading">
              Room Listing is Reserved for Property Owners
            </h2>
            <p className="text-sm text-slate-600 mt-2 mb-6">
              You are currently logged in as a <strong>Room Seeker</strong>. Room seekers can browse, save, and contact landlords in Janakpur, but are not permitted to list rooms.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                Browse Janakpur Rooms
              </button>

              <button
                type="button"
                disabled={upgradingRole}
                onClick={async () => {
                  setUpgradingRole(true);
                  try {
                    await setUserRole('owner');
                    setErrorMsg('');
                  } catch (err: any) {
                    setErrorMsg('Failed to switch role. Please try again.');
                  } finally {
                    setUpgradingRole(false);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {upgradingRole ? 'Switching...' : 'I am a Landlord (Switch to Owner)'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {!isPremiumSystemActive && !isEditing && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-emerald-200 text-emerald-800 shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-extrabold text-emerald-900">
                      All Owners Free Access Active (Premium Status: OFF)
                    </p>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Premium restrictions are currently turned OFF. All owners can list rooms completely for free without quota limits!
                    </p>
                  </div>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                  Free Unlimited Mode
                </span>
              </div>
            )}

            {isLimitReached && (
              <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-200/80 text-amber-900 shrink-0 mt-0.5">
                    <Crown className="w-5 h-5 text-amber-700 fill-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-950">
                      Your free room listing has already been used. Premium is required to list another room.
                    </p>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Every owner receives <strong>only 1 free room listing ever</strong> based on lifetime listing history. Deleting previous rooms, marking them rented, or having zero active rooms does not reset your free listing. Upgrade to Lifetime Premium for Rs {premiumConfig.priceNPR || 200} to list unlimited rooms across Janakpur.
                    </p>
                  </div>
                </div>
                {onNavigatePremium && (
                  <button
                    type="button"
                    onClick={onNavigatePremium}
                    className="shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    Upgrade to Premium (Rs {premiumConfig.priceNPR || 200})
                  </button>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Owner Notice: Listing Edit Admin Approval workflow */}
            {isEditing && !isAdmin && (
              <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-950">
                      Approval Policy: Edited Listings Require Admin Review
                    </p>
                    <p className="text-blue-800 mt-0.5 leading-relaxed">
                      To safeguard room quality in Janakpur, any changes you save will be submitted for <strong>Admin Review</strong>. Your currently approved listing remains public to seekers with its existing details until the Admin approves your updates.
                    </p>
                    {initialData?.editStatus === 'pending' && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 font-medium">
                        ⏳ <strong>You already have an edit pending approval</strong> submitted on{' '}
                        {initialData.pendingEdit?.submittedAt ? new Date(initialData.pendingEdit.submittedAt).toLocaleDateString() : 'earlier'}.
                        Admins will review your submitted changes soon.
                      </div>
                    )}
                    {initialData?.editStatus === 'rejected' && initialData.lastEditRejectionReason && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900">
                        ❌ <strong>Previous edit review note:</strong> {initialData.lastEditRejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Title & Chowk */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spacious 1BHK Flat near Bhanu Chowk"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium text-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Chowk / Location *
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    setSuggestingCoords(true);
                    setCoordFeedback(null);
                    try {
                      const res = await suggestChowkCoordinates({
                        chowk,
                        wardNumber,
                        addressLine
                      });
                      setLocationCoordinates({ lat: res.lat, lng: res.lng });
                      setCoordFeedback(`${res.lat.toFixed(4)}° N, ${res.lng.toFixed(4)}° E`);
                    } catch {
                      setCoordFeedback('Unable to fetch coordinates');
                    } finally {
                      setSuggestingCoords(false);
                    }
                  }}
                  disabled={suggestingCoords}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Use Gemini AI to suggest geographic coordinates for this chowk"
                >
                  <Sparkles className={`w-3 h-3 ${suggestingCoords ? 'animate-spin' : ''}`} />
                  <span>{suggestingCoords ? 'AI Estimating...' : 'AI Coordinates'}</span>
                </button>
              </div>
              <select
                value={chowk}
                onChange={(e) => {
                  setChowk(e.target.value);
                  setLocationCoordinates(undefined);
                  setCoordFeedback(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium text-slate-900 bg-white"
              >
                {chowks.filter((c) => !c.isHidden).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.wardNo ? `(${c.wardNo})` : ''}
                  </option>
                ))}
              </select>
              {(coordFeedback || locationCoordinates) && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>
                    Coordinates: {coordFeedback || `${locationCoordinates?.lat.toFixed(4)}° N, ${locationCoordinates?.lng.toFixed(4)}° E`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Pricing, Ward & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Monthly Rent (NPR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400">Rs</span>
                <input
                  type="number"
                  value={rentPerMonth}
                  onChange={(e) => setRentPerMonth(e.target.value)}
                  min={500}
                  step={100}
                  required
                  placeholder="5000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-bold text-slate-900"
                />
              </div>
              <label className="mt-2 flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Rent is negotiable
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Type *
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium text-slate-900 bg-white"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Floor *
              </label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium text-slate-900 bg-white"
              >
                {FLOORS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Exact Address line & Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ward Number
              </label>
              <input
                type="text"
                value={wardNumber}
                onChange={(e) => setWardNumber(e.target.value)}
                placeholder="e.g. Ward 4"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium text-slate-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Address / Nearby Landmark
              </label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. 50 meters behind Shiva Mandir, White building"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Section 4: Facilities & Amenities (Dynamic Features Builder Driven) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6">
            <DynamicFeaturesInput
              features={features}
              values={customFeatures}
              errors={featureErrors}
              onChange={(featId, val) => {
                setCustomFeatures((prev) => ({ ...prev, [featId]: val }));
                setFeatureErrors((prev) => {
                  const copy = { ...prev };
                  delete copy[featId];
                  return copy;
                });
              }}
            />

            {/* Quick Property Inclusions */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Quick Highlights & Room Inclusions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={wifiAvailable}
                    onChange={(e) => setWifiAvailable(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>High Speed Wi-Fi</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={studentsAllowed}
                    onChange={(e) => setStudentsAllowed(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Students Allowed</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={attachedBathroom}
                    onChange={(e) => setAttachedBathroom(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Attached Bathroom</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={kitchenAvailable}
                    onChange={(e) => setKitchenAvailable(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Kitchen Space</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={parkingAvailable}
                    onChange={(e) => setParkingAvailable(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Bike/Car Parking</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300">
                  <input
                    type="checkbox"
                    checked={balconyAvailable}
                    onChange={(e) => setBalconyAvailable(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Balcony / Terrace</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Photos */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Room Photos (Upload or add Image URL)
            </label>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Upload Photos from Device
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* URL add */}
              <div className="flex-1 flex items-center gap-2 min-w-[240px]">
                <input
                  type="url"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoUrl}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Add URL
                </button>
              </div>
            </div>

            {/* Photos Preview Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {photos.map((p, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200">
                  <img src={p} alt="Room preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Exact Property Location on Map (Mandatory) */}
          <div className="pt-2">
            <LocationPickerMap
              selectedChowk={chowk}
              wardNumber={wardNumber}
              addressLine={addressLine}
              value={locationCoordinates}
              onChange={(coords) => {
                setLocationCoordinates(coords);
                setCoordFeedback(`${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E`);
                setErrorMsg('');
              }}
              isLocked={isLocationPickerLocked}
              missingFields={missingMandatoryFields}
            />
          </div>

          {/* Section 6: Description & Rules */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Room Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe ventilation, sunlight, proximity to colleges/markets, road access..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              House Rules & Notes
            </label>
            <textarea
              value={rulesAndDetails}
              onChange={(e) => setRulesAndDetails(e.target.value)}
              rows={2}
              placeholder="e.g. Gate closing time 10 PM, no loud music, 1 month advance deposit required..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none text-sm text-slate-900"
            />
          </div>

          {/* If Editing, allow Status change directly */}
          {isEditing && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-800">Room Status</span>
                <p className="text-xs text-slate-500">Toggle whether this room is currently available or rented</p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                isLimitReached ||
                (userProfile?.role === 'seeker' && !isAdmin) ||
                isLocationPickerLocked ||
                !hasExactLocation
              }
              className="px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {submitting
                ? 'Saving...'
                : isLimitReached
                ? 'Premium Required to List'
                : isLocationPickerLocked
                ? 'Complete Required Details to Pin Location'
                : !hasExactLocation
                ? '📍 Set Exact Pin on Map to Publish'
                : isEditing
                ? 'Update Listing'
                : 'Publish Room Listing (Free)'}
            </button>
          </div>
        </form>
        </>
        )}
      </div>

      {/* Submission Confirmation Modal */}
      {submittedSuccessType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>

            <h3 className="text-xl font-black text-slate-900 font-heading">
              {submittedSuccessType === 'created'
                ? 'Room Listing Submitted!'
                : submittedSuccessType === 'resubmitted'
                ? 'Listing Resubmitted!'
                : 'Room Changes Submitted!'}
            </h3>

            <div className="text-sm font-bold text-amber-950 mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {submittedSuccessType === 'edited'
                  ? 'Your room changes have been submitted and are waiting for admin approval.'
                  : 'Your room listing has been submitted and is waiting for admin approval.'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {submittedSuccessType === 'edited'
                ? 'Seekers will continue to see your currently approved listing until your new changes are approved by admin.'
                : 'The listing is currently pending approval and will be published live immediately once reviewed and approved by the admin.'}
            </p>

            <button
              type="button"
              onClick={onSuccess}
              className="mt-6 w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Go to My Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
