import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  Bath,
  Droplets,
  Wifi,
  Utensils,
  Car,
  Sun,
  Shield,
  Zap,
  Activity,
  Compass,
  Clock,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  CheckSquare,
  CircleDot,
  FileText,
  Hash,
  ToggleLeft,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Lock,
  Tv,
  Coffee,
  Wind,
  Flame,
  Home,
  Tag,
  Radio,
  HelpCircle,
  Eye as PreviewEye
} from 'lucide-react';
import { RoomFeature, FeatureInputType, FeatureOption } from '../../types';

interface AdminFeaturesManagerProps {
  features: RoomFeature[];
  onAddFeature: (feature: Omit<RoomFeature, 'id'>) => Promise<void>;
  onUpdateFeature: (id: string, updates: Partial<RoomFeature>) => Promise<void>;
  onDeleteFeature: (id: string) => Promise<void>;
  onToggleFeatureHidden: (id: string, currentHidden?: boolean) => Promise<void>;
  onToggleFeatureDisabled?: (id: string, currentDisabled?: boolean) => Promise<void>;
  onReorderFeature?: (id: string, newOrder: number) => Promise<void>;
  onResetFeatures?: () => Promise<void>;
}

export const AVAILABLE_ICONS = [
  { key: 'Zap', label: 'Electricity / Power', component: Zap },
  { key: 'Droplets', label: 'Water Supply', component: Droplets },
  { key: 'Bath', label: 'Bathroom', component: Bath },
  { key: 'Wifi', label: 'Wi-Fi Internet', component: Wifi },
  { key: 'Utensils', label: 'Kitchen / Dining', component: Utensils },
  { key: 'Car', label: 'Parking', component: Car },
  { key: 'Sun', label: 'Balcony / Sunlight', component: Sun },
  { key: 'Shield', label: 'CCTV / Security', component: Shield },
  { key: 'Activity', label: 'Sub-Meter / Meter', component: Activity },
  { key: 'Compass', label: 'Landmark / Direction', component: Compass },
  { key: 'Clock', label: 'Time / Gate Curfew', component: Clock },
  { key: 'Calendar', label: 'Date / Availability', component: Calendar },
  { key: 'DollarSign', label: 'Price / Money', component: DollarSign },
  { key: 'CheckSquare', label: 'Checklist / Rules', component: CheckSquare },
  { key: 'CircleDot', label: 'Single Select', component: CircleDot },
  { key: 'FileText', label: 'Manual Text', component: FileText },
  { key: 'Hash', label: 'Number / Quantity', component: Hash },
  { key: 'Home', label: 'Room / House', component: Home },
  { key: 'Tv', label: 'Television', component: Tv },
  { key: 'Coffee', label: 'Cafe / Dining', component: Coffee },
  { key: 'Wind', label: 'AC / Ventilation', component: Wind },
  { key: 'Flame', label: 'Gas / Cooking', component: Flame },
  { key: 'Lock', label: 'Privacy / Lock', component: Lock },
  { key: 'Layers', label: 'Facilities / Other', component: Layers }
];

export const INPUT_TYPE_CONFIGS: {
  type: FeatureInputType;
  label: string;
  badgeColor: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  usesOptions: boolean;
}[] = [
  {
    type: 'single_select',
    label: 'Single Selection',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Owner selects only ONE option (e.g. Room For: Anyone, Male, Female; or Water: 24h, Choose Time)',
    icon: CircleDot,
    usesOptions: true
  },
  {
    type: 'checklist',
    label: 'Multiple / Checklist',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Owner can select multiple options (e.g. Rules: No Smoking, No Alcohol; or Facilities: Balcony, Kitchen)',
    icon: CheckSquare,
    usesOptions: true
  },
  {
    type: 'number',
    label: 'Number Input',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Numeric value with unit (e.g. Electricity Charge: 15 NPR per unit, or Room Area sq ft)',
    icon: Hash,
    usesOptions: false
  },
  {
    type: 'text',
    label: 'Manual Text',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    description: 'Single-line text for manual input (e.g. Nearby Landmark, Special Directions)',
    icon: FileText,
    usesOptions: false
  },
  {
    type: 'time',
    label: 'Time Input',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Time selector (e.g. Gate Closing Curfew: 10:00 PM)',
    icon: Clock,
    usesOptions: false
  },
  {
    type: 'price',
    label: 'Price / Amount',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Monetary value formatted in रु / NPR (e.g. Monthly Rent, Advance Deposit)',
    icon: DollarSign,
    usesOptions: false
  },
  {
    type: 'price_unit',
    label: 'Price + Unit',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Options that can have conditional rate inputs (e.g. Rate per unit or Included in Rent)',
    icon: DollarSign,
    usesOptions: true
  },
  {
    type: 'yes_no',
    label: 'Yes / No',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Simple Yes/No toggle with custom labels (e.g. Wi-Fi: Yes / No)',
    icon: ToggleLeft,
    usesOptions: false
  },
  {
    type: 'date',
    label: 'Date Input',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Calendar date picker (e.g. Move-in Available From)',
    icon: Calendar,
    usesOptions: false
  },
  {
    type: 'image_upload',
    label: 'Image Upload',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Direct file upload from phone or computer',
    icon: ImageIcon,
    usesOptions: false
  }
];

export const AdminFeaturesManager: React.FC<AdminFeaturesManagerProps> = ({
  features,
  onAddFeature,
  onUpdateFeature,
  onDeleteFeature,
  onToggleFeatureHidden,
  onToggleFeatureDisabled,
  onReorderFeature,
  onResetFeatures
}) => {
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Deletion modal state
  const [confirmDeleteFeature, setConfirmDeleteFeature] = useState<RoomFeature | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Builder Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [category, setCategory] = useState<'basic' | 'comfort' | 'safety' | 'utility' | 'pricing' | 'rules'>('basic');
  const [order, setOrder] = useState('1');
  const [isRequired, setIsRequired] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [inputType, setInputType] = useState<FeatureInputType>('checklist');
  const [selectionType, setSelectionType] = useState<'single' | 'multiple'>('multiple');
  const [allowCustomOption, setAllowCustomOption] = useState(true);

  // Options State
  const [options, setOptions] = useState<FeatureOption[]>([]);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [optionName, setOptionName] = useState('');
  const [optionDesc, setOptionDesc] = useState('');
  const [optionIsDefault, setOptionIsDefault] = useState(false);
  const [optionError, setOptionError] = useState('');
  const [optionHasPrice, setOptionHasPrice] = useState(false);
  const [optionPriceLabel, setOptionPriceLabel] = useState('Electricity Rate');
  const [optionCurrency, setOptionCurrency] = useState('रु');
  const [optionPriceUnit, setOptionPriceUnit] = useState('per unit');
  const [optionPriceReq, setOptionPriceReq] = useState(true);
  const [optionDefaultPrice, setOptionDefaultPrice] = useState<number | ''>('');
  const [optionHasCustomText, setOptionHasCustomText] = useState(false);
  const [optionCustomTextLabel, setOptionCustomTextLabel] = useState('Custom Details');
  const [optionCustomTextPlaceholder, setOptionCustomTextPlaceholder] = useState('Enter details here...');

  // Type Specific Settings State
  const [textLabel, setTextLabel] = useState('');
  const [textPlaceholder, setTextPlaceholder] = useState('');
  const [textMaxChars, setTextMaxChars] = useState<number | ''>(120);

  const [numLabel, setNumLabel] = useState('');
  const [numPlaceholder, setNumPlaceholder] = useState('');
  const [numMin, setNumMin] = useState<number | ''>(1);
  const [numMax, setNumMax] = useState<number | ''>('');
  const [numAllowDecimals, setNumAllowDecimals] = useState(false);
  const [numUnit, setNumUnit] = useState('NPR per unit');

  const [priceCurrency, setPriceCurrency] = useState('रु');
  const [priceLabel, setPriceLabel] = useState('Rent / Amount');
  const [priceMin, setPriceMin] = useState<number | ''>('');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [priceUnit, setPriceUnit] = useState('per month');

  const [yesLabel, setYesLabel] = useState('Yes / Available');
  const [noLabel, setNoLabel] = useState('No / Not Available');

  const [timeLabel, setTimeLabel] = useState('Closing Time');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  const [dateLabel, setDateLabel] = useState('Available From');

  const [imgMaxCount, setImgMaxCount] = useState<number>(3);
  const [imgMaxSizeMB, setImgMaxSizeMB] = useState<number>(5);

  const [submitting, setSubmitting] = useState(false);
  const [builderError, setBuilderError] = useState('');

  // Interactive Live Preview State inside modal
  const [previewVal, setPreviewVal] = useState<any>(null);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMsg(msg);
      setTimeout(() => setActionErrorMsg(null), 5000);
    } else {
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const renderIconComponent = (iconKey?: string | null, className = 'w-4 h-4') => {
    const match = AVAILABLE_ICONS.find((i) => i.key === iconKey);
    const IconComp = match ? match.component : Sparkles;
    return <IconComp className={className} />;
  };

  // Open Add Feature Builder
  const handleOpenAdd = () => {
    setEditingFeatureId(null);
    setName('');
    setDescription('');
    setIcon('Layers');
    setCategory('basic');
    setOrder((features.length + 1).toString());
    setIsRequired(false);
    setIsHidden(false);
    setIsDisabled(false);
    setInputType('checklist');
    setSelectionType('multiple');
    setAllowCustomOption(true);

    // Default options initialized empty for clean start or customizable addition
    setOptions([]);
    resetOptionForm();

    setTextLabel('Enter details');
    setTextPlaceholder('Type here...');
    setTextMaxChars(150);

    setNumLabel('Electricity Charge');
    setNumPlaceholder('e.g. 15');
    setNumMin(1);
    setNumMax('');
    setNumAllowDecimals(false);
    setNumUnit('NPR per unit');

    setPriceCurrency('रु');
    setPriceLabel('Amount');
    setPriceMin('');
    setPriceMax('');
    setPriceUnit('per month');

    setYesLabel('Yes / Available');
    setNoLabel('No / Not Available');

    setTimeLabel('Select Time');
    setTimeFormat('12h');

    setDateLabel('Available From Date');

    setImgMaxCount(3);
    setImgMaxSizeMB(5);

    setPreviewVal(null);
    setBuilderError('');
    setShowBuilderModal(true);
  };

  // Open Edit Existing Feature
  const handleOpenEdit = (feat: RoomFeature) => {
    setEditingFeatureId(feat.id);
    setName(feat.name);
    setDescription(feat.description || '');
    setIcon(feat.icon || 'Layers');
    setCategory((feat.category as any) || 'basic');
    setOrder((feat.order ?? 1).toString());
    setIsRequired(Boolean(feat.isRequired));
    setIsHidden(Boolean(feat.isHidden));
    setIsDisabled(Boolean(feat.isDisabled));
    setInputType(feat.inputType || 'checklist');
    setSelectionType(feat.selectionType || (feat.inputType === 'single_select' ? 'single' : 'multiple'));
    setAllowCustomOption(feat.allowCustomOption ?? true);

    setOptions(feat.options ? [...feat.options] : []);
    resetOptionForm();

    // Text
    setTextLabel(feat.textConfig?.label || '');
    setTextPlaceholder(feat.textConfig?.placeholder || '');
    setTextMaxChars(feat.textConfig?.maxCharacters ?? 150);

    // Number
    setNumLabel(feat.numberConfig?.label || '');
    setNumPlaceholder(feat.numberConfig?.placeholder || '');
    setNumMin(feat.numberConfig?.minValue ?? 1);
    setNumMax(feat.numberConfig?.maxValue ?? '');
    setNumAllowDecimals(Boolean(feat.numberConfig?.allowDecimals));
    setNumUnit(feat.numberConfig?.unit || 'NPR per unit');

    // Price
    setPriceCurrency(feat.priceConfig?.currency || 'रु');
    setPriceLabel(feat.priceConfig?.priceLabel || 'Price');
    setPriceMin(feat.priceConfig?.minAmount ?? '');
    setPriceMax(feat.priceConfig?.maxAmount ?? '');
    setPriceUnit(feat.priceConfig?.unit || 'per month');

    // Yes/No
    setYesLabel(feat.yesNoConfig?.yesLabel || 'Yes / Available');
    setNoLabel(feat.yesNoConfig?.noLabel || 'No / Not Available');

    // Time
    setTimeLabel(feat.timeConfig?.label || 'Select Time');
    setTimeFormat(feat.timeConfig?.format || '12h');

    // Date
    setDateLabel(feat.dateConfig?.label || 'Select Date');

    // Image
    setImgMaxCount(feat.imageConfig?.maxImages || 3);
    setImgMaxSizeMB(feat.imageConfig?.maxSizeMB || 5);

    setPreviewVal(null);
    setBuilderError('');
    setShowBuilderModal(true);
  };

  const resetOptionForm = () => {
    setEditingOptionIndex(null);
    setOptionName('');
    setOptionDesc('');
    setOptionIsDefault(false);
    setOptionError('');
    setOptionHasPrice(false);
    setOptionPriceLabel('Electricity Rate');
    setOptionCurrency('रु');
    setOptionPriceUnit('per unit');
    setOptionPriceReq(true);
    setOptionDefaultPrice('');
    setOptionHasCustomText(false);
    setOptionCustomTextLabel('Custom Information');
    setOptionCustomTextPlaceholder('Enter details here...');
  };

  const handleEditOptionClick = (idx: number) => {
    const opt = options[idx];
    setEditingOptionIndex(idx);
    setOptionError('');
    setOptionName(opt.name);
    setOptionDesc(opt.description || '');
    setOptionIsDefault(Boolean(opt.isDefault));
    setOptionHasPrice(Boolean(opt.hasPriceInput));
    setOptionPriceLabel(opt.priceLabel || 'Electricity Rate');
    setOptionCurrency(opt.currency || 'रु');
    setOptionPriceUnit(opt.priceUnit || 'per unit');
    setOptionPriceReq(opt.priceRequired ?? true);
    setOptionDefaultPrice(opt.defaultPrice ?? '');
    setOptionHasCustomText(Boolean(opt.hasCustomTextInput));
    setOptionCustomTextLabel(opt.customTextLabel || 'Custom Information');
    setOptionCustomTextPlaceholder(opt.customTextPlaceholder || 'Enter details here...');
  };

  const handleAddOption = () => {
    const currentOptions = Array.isArray(options) ? options : [];
    const newOrder = currentOptions.length + 1;
    const newId = `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newOpt: FeatureOption = {
      id: newId,
      name: `Option ${newOrder}`,
      description: '',
      order: newOrder,
      isHidden: false,
      isDisabled: false,
      isDefault: false,
      hasPriceInput: false,
      priceLabel: null,
      currency: null,
      priceUnit: null,
      priceRequired: false,
      defaultPrice: null,
      hasCustomTextInput: false,
      customTextLabel: null,
      customTextPlaceholder: null,
      customTextRequired: false
    };

    const updated = [...currentOptions, newOpt];
    setOptions(updated);

    const newIndex = updated.length - 1;
    setEditingOptionIndex(newIndex);
    setOptionName(newOpt.name);
    setOptionDesc('');
    setOptionIsDefault(false);
    setOptionError('');
    setOptionHasPrice(false);
    setOptionPriceLabel('Electricity Rate');
    setOptionCurrency('रु');
    setOptionPriceUnit('per unit');
    setOptionPriceReq(true);
    setOptionDefaultPrice('');
    setOptionHasCustomText(false);
    setOptionCustomTextLabel('Custom Information');
    setOptionCustomTextPlaceholder('Enter details here...');
  };

  const handleSaveOption = () => {
    if (!optionName.trim()) {
      setOptionError('Please enter an option name (e.g. Attached Bathroom, Tap Only, or No Smoking).');
      return;
    }
    setOptionError('');

    const currentOptions = Array.isArray(options) ? options : [];
    const targetId =
      editingOptionIndex !== null && editingOptionIndex >= 0 && currentOptions[editingOptionIndex]?.id
        ? currentOptions[editingOptionIndex].id
        : `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const targetOrder =
      editingOptionIndex !== null && editingOptionIndex >= 0 && currentOptions[editingOptionIndex]?.order
        ? currentOptions[editingOptionIndex].order
        : currentOptions.length + 1;

    const existingHidden =
      editingOptionIndex !== null && editingOptionIndex >= 0
        ? Boolean(currentOptions[editingOptionIndex]?.isHidden)
        : false;

    const existingDisabled =
      editingOptionIndex !== null && editingOptionIndex >= 0
        ? Boolean(currentOptions[editingOptionIndex]?.isDisabled)
        : false;

    const savedOpt: FeatureOption = {
      id: targetId,
      name: optionName.trim(),
      description: optionDesc.trim() || null,
      order: targetOrder,
      isHidden: existingHidden,
      isDisabled: existingDisabled,
      isDefault: Boolean(optionIsDefault),
      hasPriceInput: Boolean(optionHasPrice),
      priceLabel: optionHasPrice ? (optionPriceLabel.trim() || 'Electricity Rate') : null,
      currency: optionHasPrice ? optionCurrency : null,
      priceUnit: optionHasPrice ? (optionPriceUnit.trim() || 'per unit') : null,
      priceRequired: optionHasPrice ? Boolean(optionPriceReq) : false,
      defaultPrice:
        optionHasPrice && optionDefaultPrice !== '' && optionDefaultPrice !== null && optionDefaultPrice !== undefined
          ? Number(optionDefaultPrice)
          : null,
      hasCustomTextInput: Boolean(optionHasCustomText),
      customTextLabel: optionHasCustomText ? (optionCustomTextLabel.trim() || 'Custom Details') : null,
      customTextPlaceholder: optionHasCustomText ? (optionCustomTextPlaceholder.trim() || 'Enter details...') : null,
      customTextRequired: false
    };

    if (editingOptionIndex !== null && editingOptionIndex >= 0 && editingOptionIndex < currentOptions.length) {
      setOptions(currentOptions.map((o, idx) => (idx === editingOptionIndex ? savedOpt : o)));
    } else {
      setOptions([...currentOptions, savedOpt]);
    }
    resetOptionForm();
  };

  const handleDeleteOption = (idx: number) => {
    setOptions(prev => (Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []));
    if (editingOptionIndex === idx) {
      resetOptionForm();
    } else if (editingOptionIndex !== null && editingOptionIndex > idx) {
      setEditingOptionIndex(editingOptionIndex - 1);
    }
  };

  const handleMoveOption = (idx: number, direction: 'up' | 'down') => {
    const currentOptions = Array.isArray(options) ? [...options] : [];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentOptions.length) return;
    const temp = currentOptions[idx];
    currentOptions[idx] = currentOptions[targetIdx];
    currentOptions[targetIdx] = temp;
    currentOptions.forEach((o, i) => { o.order = i + 1; });
    setOptions(currentOptions);
    if (editingOptionIndex === idx) {
      setEditingOptionIndex(targetIdx);
    } else if (editingOptionIndex === targetIdx) {
      setEditingOptionIndex(idx);
    }
  };

  const handleToggleOptionHidden = (idx: number) => {
    setOptions(prev => (Array.isArray(prev) ? prev : []).map((o, i) => (i === idx ? { ...o, isHidden: !o.isHidden } : o)));
  };

  // Submit Feature Builder
  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderError('');

    if (!name.trim()) {
      setBuilderError('Feature name is required.');
      return;
    }

    const typeConfig = INPUT_TYPE_CONFIGS.find(t => t.type === inputType);

    setSubmitting(true);
    try {
      const orderNum = parseInt(order, 10) || 1;

      // Sanitize options to guarantee NO undefined fields
      const sanitizedOptions: FeatureOption[] = (Array.isArray(options) ? options : []).map((opt, i) => ({
        id: opt?.id || `opt-${Date.now()}-${i}`,
        name: (opt?.name || `Option ${i + 1}`).trim(),
        description: opt?.description ? opt.description.trim() : null,
        icon: opt?.icon ?? null,
        order: opt?.order ?? (i + 1),
        isHidden: Boolean(opt?.isHidden),
        isDisabled: Boolean(opt?.isDisabled),
        isDefault: Boolean(opt?.isDefault),
        hasPriceInput: Boolean(opt?.hasPriceInput),
        priceLabel: opt?.hasPriceInput ? (opt?.priceLabel?.trim() || 'Electricity Rate') : null,
        currency: opt?.hasPriceInput ? (opt?.currency || 'रु') : null,
        priceUnit: opt?.hasPriceInput ? (opt?.priceUnit?.trim() || 'per unit') : null,
        priceRequired: opt?.hasPriceInput ? Boolean(opt?.priceRequired) : false,
        defaultPrice:
          opt?.hasPriceInput && opt?.defaultPrice !== null && opt?.defaultPrice !== undefined && (opt?.defaultPrice as any) !== ''
            ? Number(opt.defaultPrice)
            : null,
        hasCustomTextInput: Boolean(opt?.hasCustomTextInput),
        customTextLabel: opt?.hasCustomTextInput ? (opt?.customTextLabel?.trim() || 'Custom Details') : null,
        customTextPlaceholder: opt?.hasCustomTextInput ? (opt?.customTextPlaceholder?.trim() || 'Enter details...') : null,
        customTextRequired: false
      }));

      const payload: Omit<RoomFeature, 'id'> = {
        name: name.trim(),
        description: description.trim(),
        icon: icon || 'Layers',
        category: category || 'basic',
        order: orderNum,
        isRequired: Boolean(isRequired),
        isHidden: Boolean(isHidden),
        isDisabled: Boolean(isDisabled),
        inputType,
        selectionType: typeConfig?.usesOptions ? selectionType : (inputType === 'single_select' ? 'single' : 'multiple'),
        allowCustomOption: typeConfig?.usesOptions ? Boolean(allowCustomOption) : false,
        options: typeConfig?.usesOptions ? sanitizedOptions : [],
        textConfig: inputType === 'text' ? {
          label: textLabel.trim() || name.trim(),
          placeholder: textPlaceholder.trim() || '',
          maxCharacters: textMaxChars !== '' && textMaxChars !== null && textMaxChars !== undefined ? Number(textMaxChars) : 150
        } : null,
        numberConfig: inputType === 'number' ? {
          label: numLabel.trim() || name.trim(),
          placeholder: numPlaceholder.trim() || '',
          minValue: numMin !== '' && numMin !== null && numMin !== undefined ? Number(numMin) : 0,
          maxValue: numMax !== '' && numMax !== null && numMax !== undefined ? Number(numMax) : null,
          allowDecimals: Boolean(numAllowDecimals),
          unit: numUnit.trim() || 'NPR per unit'
        } : null,
        priceConfig: inputType === 'price' || inputType === 'price_unit' ? {
          currency: priceCurrency || 'रु',
          priceLabel: priceLabel.trim() || name.trim(),
          minAmount: priceMin !== '' && priceMin !== null && priceMin !== undefined ? Number(priceMin) : null,
          maxAmount: priceMax !== '' && priceMax !== null && priceMax !== undefined ? Number(priceMax) : null,
          unit: priceUnit.trim() || 'per month'
        } : null,
        yesNoConfig: inputType === 'yes_no' ? {
          yesLabel: yesLabel.trim() || 'Yes',
          noLabel: noLabel.trim() || 'No'
        } : null,
        timeConfig: inputType === 'time' ? {
          label: timeLabel.trim() || name.trim(),
          format: timeFormat || '12h'
        } : null,
        dateConfig: inputType === 'date' ? {
          label: dateLabel.trim() || name.trim(),
          minDate: null
        } : null,
        imageConfig: inputType === 'image_upload' ? {
          maxImages: Number(imgMaxCount) || 3,
          maxSizeMB: Number(imgMaxSizeMB) || 5
        } : null
      };

      if (editingFeatureId) {
        await onUpdateFeature(editingFeatureId, payload);
        showNotification(`Feature "${name.trim()}" updated successfully.`);
      } else {
        await onAddFeature(payload);
        showNotification(`New feature "${name.trim()}" created successfully and saved.`);
      }

      setShowBuilderModal(false);
    } catch (err: any) {
      setBuilderError(err.message || 'Failed to save feature to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmDeleteFeature) return;
    try {
      await onDeleteFeature(confirmDeleteFeature.id);
      showNotification(`Feature "${confirmDeleteFeature.name}" deleted permanently.`);
      setConfirmDeleteFeature(null);
    } catch (err: any) {
      showNotification(`Error: ${err.message || 'Failed to delete feature.'}`, true);
    }
  };

  const handleExecuteReset = async () => {
    if (onResetFeatures) {
      try {
        await onResetFeatures();
        showNotification('Features reset to standard Janakpur configuration.');
        setConfirmResetModal(false);
      } catch (err: any) {
        showNotification(`Error: ${err.message || 'Failed to reset features.'}`, true);
      }
    }
  };

  // Filtered Features
  const filteredFeatures = features.filter(f => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = f.name.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesType = typeFilter === 'all' || f.inputType === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic Property Configuration Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Feature Builder
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Create, customize, and configure all room specifications, amenities, and house rules. Changes are stored in the database and immediately appear in the Room Owner listing form.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onResetFeatures && (
              <button
                type="button"
                onClick={() => setConfirmResetModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                title="Populate standard default features"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                Reset Defaults
              </button>
            )}

            <button
              id="add-new-feature-btn"
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              + Add New Feature
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {actionErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Toolbar / Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search features by name or keyword..."
            className="w-full pl-4 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="basic">Basic Utilities</option>
            <option value="comfort">Comfort & Living</option>
            <option value="safety">Safety & Security</option>
            <option value="utility">Utilities & Tech</option>
            <option value="rules">Rules & Policy</option>
            <option value="pricing">Financial / Pricing</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 outline-none"
          >
            <option value="all">All Types ({features.length})</option>
            {INPUT_TYPE_CONFIGS.map(t => (
              <option key={t.type} value={t.type}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Features Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map((feat, index) => {
          const typeConf = INPUT_TYPE_CONFIGS.find(t => t.type === (feat.inputType || 'checklist'));
          const optionsCount = feat.options ? feat.options.length : 0;
          const isChecklist = feat.inputType === 'checklist' || feat.selectionType === 'multiple';

          return (
            <div
              key={feat.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                feat.isDisabled
                  ? 'bg-slate-50/90 border-slate-200 opacity-60'
                  : feat.isHidden
                  ? 'bg-amber-50/30 border-amber-200/60'
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/80">
                      {renderIconComponent(feat.icon, 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">
                        {feat.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 capitalize font-medium">
                        {feat.category || 'Basic'} Category
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    #{feat.order || index + 1}
                  </span>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${typeConf?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                    {typeConf?.label || feat.inputType}
                  </span>

                  {feat.isRequired ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                      Required
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Optional
                    </span>
                  )}

                  {optionsCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                      {optionsCount} Options {isChecklist ? '(Multi)' : '(Single)'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px]">
                      Direct Input
                    </span>
                  )}

                  {feat.allowCustomOption && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                      +Custom Allowed
                    </span>
                  )}
                </div>

                {/* Description */}
                {feat.description && (
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                    {feat.description}
                  </p>
                )}

                {/* Options Preview */}
                {feat.options && feat.options.length > 0 && (
                  <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Configured Choices ({feat.options.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {feat.options.slice(0, 6).map((opt) => (
                        <span
                          key={opt.id}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                            opt.isHidden
                              ? 'bg-slate-100 text-slate-400 line-through border-slate-200'
                              : opt.hasPriceInput
                              ? 'bg-amber-50 text-amber-900 border-amber-200'
                              : opt.isDefault
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.name}
                          {opt.isDefault && <span className="text-[9px] text-indigo-600">★</span>}
                          {opt.hasPriceInput && (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 rounded">
                              +Rate
                            </span>
                          )}
                        </span>
                      ))}
                      {feat.options.length > 6 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md">
                          +{feat.options.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Number / Price details */}
                {feat.inputType === 'number' && feat.numberConfig && (
                  <div className="mb-3 text-[11px] text-purple-900 font-bold bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                    Input: Numeric ({feat.numberConfig.unit || 'units'}) • Min: {feat.numberConfig.minValue ?? 'None'}
                  </div>
                )}

                {feat.inputType === 'price' && feat.priceConfig && (
                  <div className="mb-3 text-[11px] text-amber-900 font-bold bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                    Currency: {feat.priceConfig.currency || 'रु'} • {feat.priceConfig.unit || 'per month'}
                  </div>
                )}
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                {/* Reorder / Status */}
                <div className="flex items-center gap-1">
                  {onReorderFeature && (
                    <>
                      <button
                        type="button"
                        onClick={() => onReorderFeature(feat.id, Math.max(1, (feat.order || index + 1) - 1))}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                        title="Move Up in Listing Form"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderFeature(feat.id, (feat.order || index + 1) + 1)}
                        disabled={index === features.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30"
                        title="Move Down in Listing Form"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {onToggleFeatureDisabled && (
                    <button
                      type="button"
                      onClick={() => onToggleFeatureDisabled(feat.id, feat.isDisabled)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all border ${
                        feat.isDisabled
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={feat.isDisabled ? 'Click to Enable' : 'Click to Disable'}
                    >
                      {feat.isDisabled ? 'Disabled' : 'Active'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleFeatureHidden(feat.id, feat.isHidden)}
                    className={`p-1.5 rounded-xl text-xs font-bold transition-all border ${
                      feat.isHidden
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={feat.isHidden ? 'Hidden from owners (Click to make visible)' : 'Visible (Click to hide)'}
                  >
                    {feat.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Edit & Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(feat)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200/60"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteFeature(feat)}
                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Feature"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFeatures.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-800 text-base">No features found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No features match your search criteria. You can create a new feature using the "+ Add New Feature" button above.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FEATURE BUILDER MODAL                                                     */}
      {/* ========================================================================= */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  {editingFeatureId ? `Edit Feature: ${name || 'Untitled'}` : 'Add New Feature'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure feature parameters, selection types, option choices, and live owner preview.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowBuilderModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveFeature} className="p-6 space-y-6 overflow-y-auto flex-1">
              {builderError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {builderError}
                </div>
              )}

              {/* SECTION 1: Basic Information */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  1. Feature Identity & Behavior
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Feature Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Electricity, Water Supply, Landmark, Facilities..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-semibold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Icon
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0">
                        {renderIconComponent(icon, 'w-4 h-4')}
                      </div>
                      <select
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
                      >
                        {AVAILABLE_ICONS.map(i => (
                          <option key={i.key} value={i.key}>{i.label} ({i.key})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Description / Help Note for Room Owners
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Specify electricity rate per unit or water schedule in Janakpur"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none"
                    >
                      <option value="basic">Basic Utility (Water, Electricity, Chowk)</option>
                      <option value="comfort">Comfort & Living (Attached Bath, Balcony)</option>
                      <option value="safety">Safety & Security (CCTV, Gated)</option>
                      <option value="utility">Utility & Tech (Wi-Fi, Inverter)</option>
                      <option value="rules">Rules & Guidelines (Curfew, Tenant Type)</option>
                      <option value="pricing">Financial & Pricing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Display Order (in Owner form)
                    </label>
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      min={1}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 outline-none text-xs font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-slate-200/60">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    <span>Required (Owner cannot submit listing without this)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={(e) => setIsDisabled(!e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span>Active (Enabled for room listings)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHidden}
                      onChange={(e) => setIsHidden(e.target.checked)}
                      className="rounded text-amber-600 w-4 h-4"
                    />
                    <span>Hidden (Hide from public view)</span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: Input Type Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    2. Choose Input Type
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Determines how the Room Owner enters or selects this feature
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {INPUT_TYPE_CONFIGS.map((t) => {
                    const IconComp = t.icon;
                    const isSelected = inputType === t.type;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => {
                          setInputType(t.type);
                          if (t.type === 'checklist') {
                            setSelectionType('multiple');
                          } else if (t.type === 'single_select') {
                            setSelectionType('single');
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 text-indigo-950 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs">{t.label}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                            {t.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Options / Type-Specific Builder */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  3. Configure Options & Field Details
                </h4>

                {/* 3A. OPTIONS BUILDER (For Single Select, Checklist, Price+Unit) */}
                {['checklist', 'single_select', 'price_unit'].includes(inputType) && (
                  <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                    {/* Selection Type & Custom Option Settings */}
                    <div className="p-4 rounded-xl bg-white border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Selection Mode</span>
                        <div className="flex items-center gap-4 mt-1.5">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="selType"
                              checked={selectionType === 'single' || inputType === 'single_select'}
                              onChange={() => {
                                setSelectionType('single');
                                setInputType('single_select');
                              }}
                              className="text-indigo-600"
                            />
                            <span>Single Selection (Radio)</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name="selType"
                              checked={selectionType === 'multiple' || inputType === 'checklist'}
                              onChange={() => {
                                setSelectionType('multiple');
                                setInputType('checklist');
                              }}
                              className="text-indigo-600"
                            />
                            <span>Multiple Selection (Checklist)</span>
                          </label>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={allowCustomOption}
                          onChange={(e) => setAllowCustomOption(e.target.checked)}
                          className="rounded text-indigo-600 w-4 h-4"
                        />
                        <span>Allow Owner to Add Custom Option / Rule</span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h5 className="font-bold text-xs text-indigo-950 font-heading">
                          Options List ({options.length})
                        </h5>
                        <p className="text-[11px] text-indigo-800/80">
                          Add the choices room owners can pick from. Click "+ Add Option" to add more.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Add Option
                      </button>
                    </div>

                    {/* Inline Option Editor */}
                    {editingOptionIndex !== null && (
                      <div className="p-4 rounded-2xl bg-white border border-indigo-300 shadow-md space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-xs text-slate-900">
                            {editingOptionIndex >= 0 ? `Edit Option: "${options[editingOptionIndex]?.name}"` : 'Add New Option'}
                          </span>
                          <button
                            type="button"
                            onClick={resetOptionForm}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {optionError && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{optionError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Option Name *
                            </label>
                            <input
                              type="text"
                              value={optionName}
                              onChange={(e) => setOptionName(e.target.value)}
                              placeholder="e.g. Attached Bathroom, Tap Only, No Smoking..."
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Short Description (Optional)
                            </label>
                            <input
                              type="text"
                              value={optionDesc}
                              onChange={(e) => setOptionDesc(e.target.value)}
                              placeholder="e.g. Western or eastern private commode"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={optionIsDefault}
                              onChange={(e) => setOptionIsDefault(e.target.checked)}
                              className="rounded text-indigo-600"
                            />
                            <span>Selected by Default (e.g. standard house rule)</span>
                          </label>
                        </div>

                        {/* Conditional Price Settings */}
                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={optionHasPrice}
                              onChange={(e) => setOptionHasPrice(e.target.checked)}
                              className="rounded text-amber-600 w-4 h-4"
                            />
                            <span className="text-xs font-bold text-amber-950">
                              Conditional Price Input: {optionHasPrice ? 'ON' : 'OFF'}
                            </span>
                            <span className="text-[10px] text-amber-800">
                              (When owner selects this option, ask for a rate/price)
                            </span>
                          </label>

                          {optionHasPrice && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-amber-200/60 animate-in fade-in">
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                                  Price Label
                                </label>
                                <input
                                  type="text"
                                  value={optionPriceLabel}
                                  onChange={(e) => setOptionPriceLabel(e.target.value)}
                                  placeholder="e.g. Electricity Rate"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white outline-none font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                                  Currency
                                </label>
                                <select
                                  value={optionCurrency}
                                  onChange={(e) => setOptionCurrency(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white outline-none font-bold"
                                >
                                  <option value="रु">रु (NPR)</option>
                                  <option value="NPR">NPR</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                                  Unit
                                </label>
                                <input
                                  type="text"
                                  value={optionPriceUnit}
                                  onChange={(e) => setOptionPriceUnit(e.target.value)}
                                  placeholder="e.g. per unit"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white outline-none font-semibold"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={resetOptionForm}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveOption}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Save Option
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Options List Items */}
                    <div className="space-y-2">
                      {options.map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs ${opt.isHidden ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                  {opt.name}
                                </span>
                                {opt.isDefault && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-extrabold border border-indigo-200">
                                    Default
                                  </span>
                                )}
                                {opt.hasPriceInput && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
                                    +Rate ({opt.currency || 'रु'} / {opt.priceUnit || 'unit'})
                                  </span>
                                )}
                                {opt.isHidden && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              {opt.description && (
                                <p className="text-[11px] text-slate-500">{opt.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Reorder and Edit Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveOption(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOption(idx, 'down')}
                              disabled={idx === options.length - 1}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleOptionHidden(idx)}
                              className={`p-1.5 rounded-lg text-xs ${opt.isHidden ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'}`}
                              title={opt.isHidden ? 'Unhide' : 'Hide option'}
                            >
                              {opt.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditOptionClick(idx)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50"
                              title="Edit Option"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(idx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="Delete Option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {options.length === 0 && (
                        <p className="text-xs text-indigo-900/70 italic text-center py-4 bg-white/70 rounded-xl border border-dashed border-indigo-200">
                          No choices added yet. Click "+ Add Option" above to build the options.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3B. NUMBER INPUT CONFIG */}
                {inputType === 'number' && (
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-3">
                    <h5 className="font-bold text-xs text-purple-950">Number Field Configuration</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Label</label>
                        <input
                          type="text"
                          value={numLabel}
                          onChange={(e) => setNumLabel(e.target.value)}
                          placeholder="e.g. Electricity Charge"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit</label>
                        <input
                          type="text"
                          value={numUnit}
                          onChange={(e) => setNumUnit(e.target.value)}
                          placeholder="e.g. NPR per unit, sq ft"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Value</label>
                        <input
                          type="number"
                          value={numMin}
                          onChange={(e) => setNumMin(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="1"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3C. MANUAL TEXT CONFIG */}
                {inputType === 'text' && (
                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                    <h5 className="font-bold text-xs text-sky-950">Manual Text Configuration</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Label</label>
                        <input
                          type="text"
                          value={textLabel}
                          onChange={(e) => setTextLabel(e.target.value)}
                          placeholder="e.g. Nearby Landmark"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Placeholder</label>
                        <input
                          type="text"
                          value={textPlaceholder}
                          onChange={(e) => setTextPlaceholder(e.target.value)}
                          placeholder="e.g. Opposite Green School"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Characters</label>
                        <input
                          type="number"
                          value={textMaxChars}
                          onChange={(e) => setTextMaxChars(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="120"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3D. PRICE CONFIG */}
                {inputType === 'price' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3">
                    <h5 className="font-bold text-xs text-amber-950">Price Configuration (रु / NPR)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Price Label</label>
                        <input
                          type="text"
                          value={priceLabel}
                          onChange={(e) => setPriceLabel(e.target.value)}
                          placeholder="e.g. Monthly Rent"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Currency</label>
                        <select
                          value={priceCurrency}
                          onChange={(e) => setPriceCurrency(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-bold"
                        >
                          <option value="रु">रु (NPR)</option>
                          <option value="NPR">NPR</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={priceUnit}
                          onChange={(e) => setPriceUnit(e.target.value)}
                          placeholder="e.g. per month"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3E. TIME CONFIG */}
                {inputType === 'time' && (
                  <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-3">
                    <h5 className="font-bold text-xs text-orange-950">Time Selector Configuration</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Label</label>
                        <input
                          type="text"
                          value={timeLabel}
                          onChange={(e) => setTimeLabel(e.target.value)}
                          placeholder="e.g. Gate Closing Time"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Format</label>
                        <select
                          value={timeFormat}
                          onChange={(e) => setTimeFormat(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                        >
                          <option value="12h">12-Hour Format (e.g. 10:00 PM)</option>
                          <option value="24h">24-Hour Format (e.g. 22:00)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3F. YES / NO CONFIG */}
                {inputType === 'yes_no' && (
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-3">
                    <h5 className="font-bold text-xs text-teal-950">Yes / No Labels</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">"Yes" Label</label>
                        <input
                          type="text"
                          value={yesLabel}
                          onChange={(e) => setYesLabel(e.target.value)}
                          placeholder="e.g. Yes / Available"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-bold text-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">"No" Label</label>
                        <input
                          type="text"
                          value={noLabel}
                          onChange={(e) => setNoLabel(e.target.value)}
                          placeholder="e.g. No / Not Available"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none font-bold text-rose-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: LIVE OWNER PREVIEW */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <PreviewEye className="w-4 h-4 text-indigo-400" />
                    4. Live Room Owner Preview
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Real-time Simulation
                  </span>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-slate-100">
                  <label className="block text-xs font-bold text-white mb-1 flex items-center gap-2">
                    {renderIconComponent(icon, 'w-3.5 h-3.5 text-indigo-400')}
                    <span>{name || 'Feature Name'}</span>
                    {isRequired && <span className="text-rose-400">*</span>}
                  </label>
                  {description && (
                    <p className="text-[11px] text-slate-400 mb-2">{description}</p>
                  )}

                  {/* Render based on selected input type */}
                  {inputType === 'checklist' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {options.filter(o => !o.isHidden).map((o) => (
                          <span
                            key={o.id}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <input type="checkbox" readOnly checked={o.isDefault} className="rounded text-indigo-500" />
                            {o.name}
                          </span>
                        ))}
                      </div>
                      {allowCustomOption && (
                        <span className="text-[11px] text-indigo-300 font-bold block pt-1">
                          + Room Owner can click "Add Custom Option"
                        </span>
                      )}
                    </div>
                  )}

                  {inputType === 'single_select' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {options.filter(o => !o.isHidden).map((o, i) => (
                          <span
                            key={o.id}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${i === 0 ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-700 text-slate-200 border-slate-600'}`}
                          >
                            {o.name}
                          </span>
                        ))}
                      </div>
                      {allowCustomOption && (
                        <span className="text-[11px] text-indigo-300 font-bold block pt-1">
                          + Custom option input available if needed
                        </span>
                      )}
                    </div>
                  )}

                  {inputType === 'number' && (
                    <div className="flex items-center gap-2 max-w-xs pt-1">
                      <input
                        type="number"
                        placeholder={numPlaceholder || '0'}
                        readOnly
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-600 bg-slate-700 text-white font-bold"
                      />
                      <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                        {numUnit || 'NPR per unit'}
                      </span>
                    </div>
                  )}

                  {inputType === 'text' && (
                    <input
                      type="text"
                      placeholder={textPlaceholder || 'Enter text here...'}
                      readOnly
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-600 bg-slate-700 text-slate-300"
                    />
                  )}

                  {inputType === 'price' && (
                    <div className="flex items-center gap-2 max-w-xs pt-1">
                      <span className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                        {priceCurrency || 'रु'}
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        readOnly
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-600 bg-slate-700 text-white font-bold"
                      />
                      <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                        {priceUnit || 'per month'}
                      </span>
                    </div>
                  )}

                  {inputType === 'yes_no' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
                        {yesLabel}
                      </button>
                      <button type="button" className="px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300 font-bold text-xs">
                        {noLabel}
                      </button>
                    </div>
                  )}

                  {inputType === 'time' && (
                    <div className="flex items-center gap-2 max-w-xs pt-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <input
                        type="time"
                        defaultValue="22:00"
                        readOnly
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-600 bg-slate-700 text-white font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Saving to Database...' : editingFeatureId ? 'Update Feature' : 'Create & Save Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Feature Confirmation Modal */}
      {confirmDeleteFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-heading mb-1">
              Delete Feature "{confirmDeleteFeature.name}"?
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to permanently remove this feature? This will remove the feature configuration from the database. Existing room listings will preserve their saved values safely.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteFeature(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 font-heading mb-1">
              Reset Features to Defaults?
            </h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              This will populate standard Janakpur configurations (Electricity per unit, Water Availability, Water Source, Gate Closing Time, House Rules with custom rule support, Facilities, and Room For).
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
