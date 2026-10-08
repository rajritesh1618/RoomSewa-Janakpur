import { RoomListing } from '../types';
import { getRoomWifiDetails } from './wifiHelper';

export interface ChargeItem {
  key: 'roomRent' | 'electricity' | 'water' | 'wifi' | 'other';
  label: string;
  emoji: string; // '🏠' | '💡' | '🚰' | '📶'
  icon: string; // 'Home' | 'Zap' | 'Droplets' | 'Wifi'
  amount: number | null; // numeric fixed monthly amount added to total (if applicable)
  amountText: string; // e.g. "NPR 6,000", "NPR 1,000", "Included", "Not included", "NPR 15/unit — Not included"
  displayText: string; // e.g. "🏠 Room Rent — NPR 6,000", "💡 Electricity — Not included", "🚰 Water — Included", "📶 Wi-Fi — NPR 1,000/month"
  statusText: string; // "Included" | "Not included" | "NPR 1,000" | "NPR 15/unit — Not included"
  isIncludedInTotal: boolean; // whether this item was added to totalMonthlyCost
  isIncludedInRent: boolean; // whether it's free/included in base rent
  isNotIncluded: boolean; // whether tenant pays separately or not included
  isUsageBased: boolean; // per unit or sub-meter
  note?: string;
}

export interface PricingBreakdown {
  totalMonthlyCost: number; // Sum of base rent + only applicable fixed monthly charges
  totalFormatted: string; // e.g. "NPR 8,500/month"
  baseRent: number;
  baseRentFormatted: string; // e.g. "NPR 6,000"
  charges: ChargeItem[];
  hasVariableCharges: boolean; // true if electricity is per-unit or water/other is meter-based
  variableChargesNote: string | null; // e.g. "Electricity (NPR 15/unit) not included in total"
  statusSummary: {
    electricityStatus: string; // "Included" | "Not included" | "NPR 15/unit — Not included" | "NPR 1,000"
    waterStatus: string; // "Included" | "Not included" | "NPR 500"
    wifiStatus: string; // "Included" | "Not included" | "NPR 1,000/month"
  };
}

/**
 * Calculates the exact room rent, additional charges, and prominent total monthly cost.
 * Adheres strictly to the rule:
 * - The Room Rent is always shown separately.
 * - Only charges that are actually applicable/included should be added to the displayed total.
 * - If electricity is marked as Not Included, do NOT add its amount to the total.
 * - If water is marked as Not Included, do NOT add it to the total.
 * - If Wi-Fi is marked as Not Included, do NOT add it to the total.
 * - If a charge is included, show "Included" clearly.
 * - If a charge is not included, show "Not included" clearly.
 * - Never assume a charge is included when the owner has not selected it.
 * - If a charge is based on usage/per-unit pricing rather than a fixed monthly amount,
 *   display the pricing method (e.g. NPR 15/unit — Not included) instead of incorrectly adding it to monthly total.
 */
export function calculateRoomPricing(room: Partial<RoomListing>): PricingBreakdown {
  const baseRent =
    typeof room.rentPerMonth === 'number' && !isNaN(room.rentPerMonth) && room.rentPerMonth > 0
      ? room.rentPerMonth
      : 0;

  const cf = room.customFeatures || {};

  // ----------------------------------------------------
  // 1. Electricity calculation
  // ----------------------------------------------------
  // Check all existing database & custom features fields:
  // - room.electricityCharge, room.electricityChargePerUnit, room.electricityIncluded, room.electricityFacility
  // - cf['electricityCharge'], cf['electricityChargePerUnit'], cf['feature-electricity'], cf['Electricity']
  let rawFixedElectricity: number | null = null;
  if (room.electricityCharge !== undefined && room.electricityCharge !== null && !isNaN(Number(room.electricityCharge)) && Number(room.electricityCharge) > 0) {
    rawFixedElectricity = Number(room.electricityCharge);
  } else if (cf['electricityCharge'] !== undefined && cf['electricityCharge'] !== null && !isNaN(Number(cf['electricityCharge'])) && Number(cf['electricityCharge']) > 0) {
    rawFixedElectricity = Number(cf['electricityCharge']);
  } else if (cf['feature-electricity-monthly'] !== undefined && cf['feature-electricity-monthly'] !== null && !isNaN(Number(cf['feature-electricity-monthly'])) && Number(cf['feature-electricity-monthly']) > 0) {
    rawFixedElectricity = Number(cf['feature-electricity-monthly']);
  } else if (typeof cf['feature-electricity'] === 'object' && cf['feature-electricity']?.price !== undefined && !isNaN(Number(cf['feature-electricity'].price)) && Number(cf['feature-electricity'].price) > 0) {
    const p = Number(cf['feature-electricity'].price);
    const unit = String(cf['feature-electricity']?.unit || '').toLowerCase();
    if (!unit.includes('unit')) {
      rawFixedElectricity = p;
    }
  } else if (typeof cf['feature-electricity'] === 'number' && cf['feature-electricity'] > 100) {
    // In Nepal, electricity rates <= 100 are per-unit; numbers > 100 (e.g. 1000) are fixed monthly charges
    rawFixedElectricity = cf['feature-electricity'];
  }

  let rawUnitCharge: number | null = null;
  if (room.electricityChargePerUnit !== undefined && room.electricityChargePerUnit !== null && !isNaN(Number(room.electricityChargePerUnit)) && Number(room.electricityChargePerUnit) > 0) {
    rawUnitCharge = Number(room.electricityChargePerUnit);
  } else if (cf['electricityChargePerUnit'] !== undefined && cf['electricityChargePerUnit'] !== null && !isNaN(Number(cf['electricityChargePerUnit'])) && Number(cf['electricityChargePerUnit']) > 0) {
    rawUnitCharge = Number(cf['electricityChargePerUnit']);
  } else if (typeof cf['feature-electricity'] === 'object' && cf['feature-electricity']?.price !== undefined && !isNaN(Number(cf['feature-electricity'].price)) && Number(cf['feature-electricity'].price) > 0) {
    const p = Number(cf['feature-electricity'].price);
    const unit = String(cf['feature-electricity']?.unit || '').toLowerCase();
    if (unit.includes('unit')) {
      rawUnitCharge = p;
    }
  } else if (typeof cf['feature-electricity'] === 'number' && cf['feature-electricity'] > 0 && cf['feature-electricity'] <= 100) {
    rawUnitCharge = cf['feature-electricity'];
  } else if (typeof cf['Electricity'] === 'number' && cf['Electricity'] > 0 && cf['Electricity'] <= 100) {
    rawUnitCharge = cf['Electricity'];
  }

  const isElectricityExplicitlyIncluded =
    room.electricityIncluded === true ||
    cf['electricityIncluded'] === true ||
    cf['feature-electricity'] === 'Included' ||
    (typeof cf['feature-electricity'] === 'object' && cf['feature-electricity']?.selected === 'Included');

  const isElectricityExplicitlyNotIncluded =
    room.electricityIncluded === false ||
    cf['electricityIncluded'] === false ||
    cf['feature-electricity'] === 'Not Included' ||
    (typeof cf['feature-electricity'] === 'object' && cf['feature-electricity']?.selected === 'Not Included');

  let electricityAmount: number | null = null;
  let electricityText = 'Not included';
  let electricityDisplayText = '💡 Electricity — Not included';
  let electricityStatus = 'Not included';
  let isElectricityIncludedInTotal = false;
  let isElectricityIncludedInRent = false;
  let isElectricityNotIncluded = true;
  let isElectricityUsageBased = false;

  // Case A: Per-unit pricing (e.g. NPR 15/unit - DO NOT add to monthly total)
  if (rawUnitCharge !== null && rawUnitCharge > 0) {
    electricityAmount = null; // NEVER add per-unit usage charges to monthly total!
    isElectricityUsageBased = true;
    isElectricityIncludedInTotal = false;
    isElectricityIncludedInRent = false;
    isElectricityNotIncluded = true;
    electricityText = `NPR ${rawUnitCharge}/unit — Not included`;
    electricityDisplayText = `💡 Electricity — NPR ${rawUnitCharge}/unit — Not included`;
    electricityStatus = `NPR ${rawUnitCharge}/unit — Not included`;
  }
  // Case B: Fixed monthly price provided (e.g. NPR 1,000/month)
  else if (rawFixedElectricity !== null && rawFixedElectricity > 0) {
    if (isElectricityExplicitlyIncluded) {
      // Owner marked included AND entered a fixed price: show BOTH status and price!
      electricityAmount = null; // included in rent
      isElectricityIncludedInTotal = false;
      isElectricityIncludedInRent = true;
      isElectricityNotIncluded = false;
      electricityText = `Included — NPR ${rawFixedElectricity.toLocaleString()}/month`;
      electricityDisplayText = `💡 Electricity — Included — NPR ${rawFixedElectricity.toLocaleString()}/month`;
      electricityStatus = `Included — NPR ${rawFixedElectricity.toLocaleString()}/month`;
    } else {
      // Extra charge, payable monthly and added to total!
      electricityAmount = rawFixedElectricity;
      isElectricityIncludedInTotal = true;
      isElectricityIncludedInRent = false;
      isElectricityNotIncluded = false;
      electricityText = `NPR ${rawFixedElectricity.toLocaleString()}/month`;
      electricityDisplayText = `💡 Electricity — NPR ${rawFixedElectricity.toLocaleString()}/month`;
      electricityStatus = `NPR ${rawFixedElectricity.toLocaleString()}/month`;
    }
  }
  // Case C: No price provided, but explicitly included or 24/7 inverter
  else if (isElectricityExplicitlyIncluded || room.electricityFacility === '24 Hours / Inverter') {
    electricityAmount = null;
    isElectricityIncludedInTotal = false;
    isElectricityIncludedInRent = true;
    isElectricityNotIncluded = false;
    electricityText = 'Included';
    electricityDisplayText = '💡 Electricity — Included';
    electricityStatus = 'Included';
  }
  // Case D: Not included
  else {
    electricityAmount = null;
    isElectricityIncludedInTotal = false;
    isElectricityIncludedInRent = false;
    isElectricityNotIncluded = true;
    electricityText = 'Not included';
    electricityDisplayText = '💡 Electricity — Not included';
    electricityStatus = 'Not included';
  }

  // ----------------------------------------------------
  // 2. Water calculation
  // ----------------------------------------------------
  // Check all existing database & custom features fields:
  // - room.waterCharge, room.waterIncluded, room.waterFacility, room.waterAvailabilityType
  // - cf['waterCharge'], cf['feature-water-charge'], cf['Water Charge'], cf['feature-water']
  let rawFixedWater: number | null = null;
  if (room.waterCharge !== undefined && room.waterCharge !== null && !isNaN(Number(room.waterCharge)) && Number(room.waterCharge) > 0) {
    rawFixedWater = Number(room.waterCharge);
  } else if (cf['waterCharge'] !== undefined && cf['waterCharge'] !== null && !isNaN(Number(cf['waterCharge'])) && Number(cf['waterCharge']) > 0) {
    rawFixedWater = Number(cf['waterCharge']);
  } else if (cf['feature-water-charge'] !== undefined && cf['feature-water-charge'] !== null && !isNaN(Number(cf['feature-water-charge'])) && Number(cf['feature-water-charge']) > 0) {
    rawFixedWater = Number(cf['feature-water-charge']);
  } else if (cf['Water Charge'] !== undefined && cf['Water Charge'] !== null && !isNaN(Number(cf['Water Charge'])) && Number(cf['Water Charge']) > 0) {
    rawFixedWater = Number(cf['Water Charge']);
  } else if (typeof cf['feature-water'] === 'object' && cf['feature-water']?.price !== undefined && !isNaN(Number(cf['feature-water'].price)) && Number(cf['feature-water'].price) > 0) {
    rawFixedWater = Number(cf['feature-water'].price);
  } else if (typeof cf['feature-water'] === 'number' && cf['feature-water'] > 0) {
    rawFixedWater = cf['feature-water'];
  }

  const isWaterExplicitlyIncluded =
    room.waterIncluded === true ||
    cf['waterIncluded'] === true ||
    cf['feature-water'] === 'Included' ||
    (typeof cf['feature-water'] === 'object' && cf['feature-water']?.selected === 'Included');

  const isWaterExplicitlyNotIncluded =
    room.waterIncluded === false ||
    cf['waterIncluded'] === false ||
    cf['feature-water'] === 'Not Included' ||
    (typeof cf['feature-water'] === 'object' && cf['feature-water']?.selected === 'Not Included') ||
    room.waterFacility === 'Limited';

  let waterAmount: number | null = null;
  let waterText = 'Not included';
  let waterDisplayText = '🚰 Water — Not included';
  let waterStatus = 'Not included';
  let isWaterIncludedInTotal = false;
  let isWaterIncludedInRent = false;
  let isWaterNotIncluded = true;

  // Case A: Fixed monthly charge entered by owner (e.g. NPR 500/month)
  if (rawFixedWater !== null && rawFixedWater > 0) {
    if (isWaterExplicitlyIncluded) {
      // Owner selected that water is included AND provided a price
      waterAmount = null; // included in rent
      isWaterIncludedInTotal = false;
      isWaterIncludedInRent = true;
      isWaterNotIncluded = false;
      waterText = `Included — NPR ${rawFixedWater.toLocaleString()}/month`;
      waterDisplayText = `🚰 Water — Included — NPR ${rawFixedWater.toLocaleString()}/month`;
      waterStatus = `Included — NPR ${rawFixedWater.toLocaleString()}/month`;
    } else {
      // Extra charge, payable monthly and added to total!
      waterAmount = rawFixedWater;
      isWaterIncludedInTotal = true;
      isWaterIncludedInRent = false;
      isWaterNotIncluded = false;
      waterText = `NPR ${rawFixedWater.toLocaleString()}/month`;
      waterDisplayText = `🚰 Water — NPR ${rawFixedWater.toLocaleString()}/month`;
      waterStatus = `NPR ${rawFixedWater.toLocaleString()}/month`;
    }
  }
  // Case B: No price provided, but explicitly included or standard facility
  else if (
    isWaterExplicitlyIncluded ||
    (!isWaterExplicitlyNotIncluded && (
      room.waterFacility === '24/7 Supply' ||
      room.waterFacility === 'Morning/Evening' ||
      room.waterFacility === 'Handpump / Boring' ||
      room.waterAvailabilityType === '24_hours'
    ))
  ) {
    waterAmount = null;
    isWaterIncludedInTotal = false;
    isWaterIncludedInRent = true;
    isWaterNotIncluded = false;
    waterText = 'Included';
    waterDisplayText = '🚰 Water — Included';
    waterStatus = 'Included';
  }
  // Case C: Not included
  else {
    waterAmount = null;
    isWaterIncludedInTotal = false;
    isWaterIncludedInRent = false;
    isWaterNotIncluded = true;
    waterText = 'Not included';
    waterDisplayText = '🚰 Water — Not included';
    waterStatus = 'Not included';
  }

  // ----------------------------------------------------
  // 3. Wi-Fi calculation
  // ----------------------------------------------------
  // Check all existing database & custom features fields:
  // - room.wifiCharge, room.wifiAvailable, room.wifiIncluded
  // - cf['wifiCharge'], cf['feature-wifi-charge'], cf['feature-wifi'], cf['Wi-Fi Internet'], cf['wifi']
  let rawFixedWifi: number | null = null;
  if (room.wifiCharge !== undefined && room.wifiCharge !== null && !isNaN(Number(room.wifiCharge)) && Number(room.wifiCharge) > 0) {
    rawFixedWifi = Number(room.wifiCharge);
  } else if (cf['wifiCharge'] !== undefined && cf['wifiCharge'] !== null && !isNaN(Number(cf['wifiCharge'])) && Number(cf['wifiCharge']) > 0) {
    rawFixedWifi = Number(cf['wifiCharge']);
  } else if (cf['feature-wifi-charge'] !== undefined && cf['feature-wifi-charge'] !== null && !isNaN(Number(cf['feature-wifi-charge'])) && Number(cf['feature-wifi-charge']) > 0) {
    rawFixedWifi = Number(cf['feature-wifi-charge']);
  } else if (typeof cf['feature-wifi'] === 'object' && cf['feature-wifi']?.price !== undefined && !isNaN(Number(cf['feature-wifi'].price)) && Number(cf['feature-wifi'].price) > 0) {
    rawFixedWifi = Number(cf['feature-wifi'].price);
  } else if (typeof cf['feature-wifi'] === 'number' && cf['feature-wifi'] > 0) {
    rawFixedWifi = cf['feature-wifi'];
  } else {
    const wifiInfo = getRoomWifiDetails({
      wifiAvailable: room.wifiAvailable,
      wifiCharge: room.wifiCharge,
      customFeatures: room.customFeatures
    });
    if (wifiInfo.price !== null && wifiInfo.price > 0) {
      rawFixedWifi = wifiInfo.price;
    }
  }

  const isWifiAvailable =
    rawFixedWifi !== null ||
    room.wifiAvailable === true ||
    cf['wifiAvailable'] === true ||
    cf['feature-wifi'] === true ||
    cf['feature-wifi'] === 'Available' ||
    cf['feature-wifi'] === 'Included' ||
    (typeof cf['feature-wifi'] === 'object' && (cf['feature-wifi']?.available === true || cf['feature-wifi']?.selected === 'Available' || cf['feature-wifi']?.selected === 'Included' || cf['feature-wifi']?.selected === 'Yes')) ||
    (Array.isArray(cf['feature-facilities']) && cf['feature-facilities'].some((f: any) => String(f).toLowerCase().includes('wifi') || String(f).toLowerCase().includes('wi-fi'))) ||
    (Array.isArray(room.facilities) && room.facilities.some((f: any) => String(f).toLowerCase().includes('wifi') || String(f).toLowerCase().includes('wi-fi')));

  const isWifiExplicitlyIncluded =
    room.wifiIncluded === true ||
    cf['wifiIncluded'] === true ||
    cf['feature-wifi'] === 'Included' ||
    (typeof cf['feature-wifi'] === 'object' && cf['feature-wifi']?.selected === 'Included');

  let wifiAmount: number | null = null;
  let wifiText = 'Not included';
  let wifiDisplayText = '📶 Wi-Fi — Not included';
  let wifiStatus = 'Not included';
  let isWifiIncludedInTotal = false;
  let isWifiIncludedInRent = false;
  let isWifiNotIncluded = true;

  // Case A: Fixed monthly charge entered by owner (e.g. NPR 1,000/month)
  if (rawFixedWifi !== null && rawFixedWifi > 0) {
    if (isWifiExplicitlyIncluded) {
      // Owner selected that Wi-Fi is included AND provided a price
      wifiAmount = null; // included in rent
      isWifiIncludedInTotal = false;
      isWifiIncludedInRent = true;
      isWifiNotIncluded = false;
      wifiText = `Included — NPR ${rawFixedWifi.toLocaleString()}/month`;
      wifiDisplayText = `📶 Wi-Fi — Included — NPR ${rawFixedWifi.toLocaleString()}/month`;
      wifiStatus = `Included — NPR ${rawFixedWifi.toLocaleString()}/month`;
    } else {
      // Extra charge, payable monthly and added to total!
      wifiAmount = rawFixedWifi;
      isWifiIncludedInTotal = true;
      isWifiIncludedInRent = false;
      isWifiNotIncluded = false;
      wifiText = `NPR ${rawFixedWifi.toLocaleString()}/month`;
      wifiDisplayText = `📶 Wi-Fi — NPR ${rawFixedWifi.toLocaleString()}/month`;
      wifiStatus = `NPR ${rawFixedWifi.toLocaleString()}/month`;
    }
  }
  // Case B: Available with no extra price (Included)
  else if (isWifiAvailable) {
    wifiAmount = null;
    isWifiIncludedInTotal = false;
    isWifiIncludedInRent = true;
    isWifiNotIncluded = false;
    wifiText = 'Included';
    wifiDisplayText = '📶 Wi-Fi — Included';
    wifiStatus = 'Included';
  }
  // Case C: Not included / Not available
  else {
    wifiAmount = null;
    isWifiIncludedInTotal = false;
    isWifiIncludedInRent = false;
    isWifiNotIncluded = true;
    wifiText = 'Not included';
    wifiDisplayText = '📶 Wi-Fi — Not included';
    wifiStatus = 'Not included';
  }

  // ----------------------------------------------------
  // 4. Total Monthly Calculation
  // Sum ONLY base rent and applicable fixed monthly charges
  // ----------------------------------------------------
  const totalMonthlyCost =
    baseRent +
    (isElectricityIncludedInTotal && electricityAmount !== null ? electricityAmount : 0) +
    (isWaterIncludedInTotal && waterAmount !== null ? waterAmount : 0) +
    (isWifiIncludedInTotal && wifiAmount !== null ? wifiAmount : 0);

  // Construct charges list
  const charges: ChargeItem[] = [
    {
      key: 'roomRent',
      label: 'Room Rent',
      emoji: '🏠',
      icon: 'Home',
      amount: baseRent,
      amountText: `NPR ${baseRent.toLocaleString()}/month`,
      displayText: `🏠 Room Rent — NPR ${baseRent.toLocaleString()}/month`,
      statusText: `NPR ${baseRent.toLocaleString()}/month`,
      isIncludedInTotal: true,
      isIncludedInRent: true,
      isNotIncluded: false,
      isUsageBased: false
    },
    {
      key: 'electricity',
      label: 'Electricity',
      emoji: '💡',
      icon: 'Zap',
      amount: isElectricityIncludedInTotal ? electricityAmount : null,
      amountText: electricityText,
      displayText: electricityDisplayText,
      statusText: electricityStatus,
      isIncludedInTotal: isElectricityIncludedInTotal,
      isIncludedInRent: isElectricityIncludedInRent,
      isNotIncluded: isElectricityNotIncluded,
      isUsageBased: isElectricityUsageBased
    },
    {
      key: 'water',
      label: 'Water',
      emoji: '🚰',
      icon: 'Droplets',
      amount: isWaterIncludedInTotal ? waterAmount : null,
      amountText: waterText,
      displayText: waterDisplayText,
      statusText: waterStatus,
      isIncludedInTotal: isWaterIncludedInTotal,
      isIncludedInRent: isWaterIncludedInRent,
      isNotIncluded: isWaterNotIncluded,
      isUsageBased: false
    },
    {
      key: 'wifi',
      label: 'Wi-Fi',
      emoji: '📶',
      icon: 'Wifi',
      amount: isWifiIncludedInTotal ? wifiAmount : null,
      amountText: wifiText,
      displayText: wifiDisplayText,
      statusText: wifiStatus,
      isIncludedInTotal: isWifiIncludedInTotal,
      isIncludedInRent: isWifiIncludedInRent,
      isNotIncluded: isWifiNotIncluded,
      isUsageBased: false
    }
  ];

  const hasVariableCharges = isElectricityUsageBased || (isElectricityNotIncluded && !isElectricityIncludedInTotal);
  let variableChargesNote: string | null = null;
  if (isElectricityUsageBased && rawUnitCharge) {
    variableChargesNote = `+ Electricity billed at NPR ${rawUnitCharge}/unit based on sub-meter usage`;
  } else if (isElectricityNotIncluded && !isElectricityIncludedInTotal) {
    variableChargesNote = '+ Electricity usage bill separate';
  }

  return {
    totalMonthlyCost,
    totalFormatted: `NPR ${totalMonthlyCost.toLocaleString()}/month`,
    baseRent,
    baseRentFormatted: `NPR ${baseRent.toLocaleString()}/month`,
    charges,
    hasVariableCharges,
    variableChargesNote,
    statusSummary: {
      electricityStatus,
      waterStatus,
      wifiStatus
    }
  };
}
