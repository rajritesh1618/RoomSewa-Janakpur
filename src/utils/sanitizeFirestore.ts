import { RoomFeature } from '../types';

/**
 * Recursively sanitizes any data payload before sending to Firestore (setDoc, updateDoc, addDoc).
 * STRICT REQUIREMENTS:
 * 1. Never send `undefined` to Firestore in any property or nested structure.
 * 2. Omit fields whose value is `undefined`.
 * 3. Filter `undefined` items from arrays.
 * 4. Convert Date instances to ISO 8601 strings.
 * 5. Safely preserve valid boolean false, numeric 0, null, and non-empty strings.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    // If value is undefined, omit it entirely from the object
    if (value === undefined) {
      continue;
    }

    const cleanChild = sanitizeForFirestore(value);
    // If recursively sanitized child turned out undefined, skip it
    if (cleanChild !== undefined) {
      sanitized[key] = cleanChild;
    }
  }

  return sanitized as T;
}

/**
 * Safely normalizes and builds dynamic customFeatures data:
 * - Omit any feature keys with undefined, null, or empty data.
 * - Only add `price` when the feature/option actually uses a price field AND a valid numeric price exists.
 * - For features that do not use price (e.g. `feature-room-for`, simple checklists, single selects), NEVER create a price property.
 * - Only add `unit` when a valid price exists or unit is explicitly configured.
 * - Only add `customText` when non-empty.
 * - Only add `timeSlots` when valid non-empty periods exist.
 * - Works generically across ALL dynamic custom features.
 */
export function cleanCustomFeatures(
  customFeatures: Record<string, any> | undefined | null,
  featuresList: RoomFeature[] = []
): Record<string, any> {
  if (!customFeatures || typeof customFeatures !== 'object') {
    return {};
  }

  const cleaned: Record<string, any> = {};

  for (const [key, rawVal] of Object.entries(customFeatures)) {
    if (rawVal === undefined || rawVal === null) {
      continue;
    }

    const matchedFeat = featuresList.find((f) => f.id === key);

    // 1. Primitive: string
    if (typeof rawVal === 'string') {
      const trimmed = rawVal.trim();
      if (trimmed !== '') {
        cleaned[key] = trimmed;
      }
      continue;
    }

    // 2. Primitive: number
    if (typeof rawVal === 'number') {
      if (!isNaN(rawVal)) {
        cleaned[key] = rawVal;
      }
      continue;
    }

    // 3. Primitive: boolean
    if (typeof rawVal === 'boolean') {
      cleaned[key] = rawVal;
      continue;
    }

    // 4. Array (checklist, image uploads, time slots, etc.)
    if (Array.isArray(rawVal)) {
      const filtered = rawVal
        .filter((item) => item !== undefined && item !== null && item !== '')
        .map((item) => (typeof item === 'string' ? item.trim() : item));
      if (filtered.length > 0) {
        cleaned[key] = filtered;
      }
      continue;
    }

    // 5. Object (single select option with conditional fields, water schedules, etc.)
    if (typeof rawVal === 'object') {
      const objCleaned: Record<string, any> = {};

      const rawSelected = rawVal.selected;
      if (rawSelected !== undefined && rawSelected !== null && String(rawSelected).trim() !== '') {
        objCleaned.selected = String(rawSelected).trim();
      }

      const rawMode = rawVal.mode;
      if (rawMode !== undefined && rawMode !== null && String(rawMode).trim() !== '') {
        objCleaned.mode = String(rawMode).trim();
      }

      // Determine if price is legitimately supported by this feature/option:
      const selectedName = objCleaned.selected || (typeof rawVal.selected === 'string' ? rawVal.selected : '');
      const matchedOpt = matchedFeat?.options?.find(
        (o) => o.name === selectedName || o.id === selectedName
      );

      const supportsPrice =
        matchedFeat?.inputType === 'price' ||
        matchedFeat?.inputType === 'price_unit' ||
        Boolean(matchedOpt?.hasPriceInput);

      // Only attach `price` if the feature legitimately supports it AND has a valid finite number
      if (supportsPrice && rawVal.price !== undefined && rawVal.price !== null && rawVal.price !== '') {
        const numPrice = Number(rawVal.price);
        if (!isNaN(numPrice) && isFinite(numPrice)) {
          objCleaned.price = numPrice;
          const unit = rawVal.unit || matchedOpt?.priceUnit || matchedFeat?.priceConfig?.unit;
          if (unit && String(unit).trim() !== '') {
            objCleaned.unit = String(unit).trim();
          }
        }
      }

      // customText: only if option or feature supports custom input and non-empty
      const supportsCustomText =
        Boolean(matchedOpt?.hasCustomTextInput) ||
        Boolean(matchedFeat?.allowCustomOption) ||
        matchedFeat?.inputType === 'text' ||
        rawVal.selected === 'Other';

      if (rawVal.customText !== undefined && rawVal.customText !== null) {
        const textStr = String(rawVal.customText).trim();
        if (textStr !== '' && (supportsCustomText || !matchedFeat)) {
          objCleaned.customText = textStr;
        }
      }

      // time
      if (rawVal.time !== undefined && rawVal.time !== null && String(rawVal.time).trim() !== '') {
        objCleaned.time = String(rawVal.time).trim();
      }

      // timeSlots
      if (Array.isArray(rawVal.timeSlots) && rawVal.timeSlots.length > 0) {
        const validSlots = rawVal.timeSlots.filter(
          (s: any) => s && typeof s === 'object' && s.from && s.to
        );
        if (validSlots.length > 0) {
          objCleaned.timeSlots = validSlots;
        }
      }

      // Other generic safe fields if present
      for (const [k, v] of Object.entries(rawVal)) {
        if (['selected', 'mode', 'price', 'unit', 'customText', 'time', 'timeSlots'].includes(k)) {
          continue;
        }
        if (v !== undefined && v !== null && v !== '') {
          objCleaned[k] = v;
        }
      }

      // If the object only has `selected` and no special conditional fields,
      // it is a clean object `{ selected: '...' }` with ZERO undefined properties.
      if (Object.keys(objCleaned).length > 0) {
        cleaned[key] = objCleaned;
      }
    }
  }

  return cleaned;
}
