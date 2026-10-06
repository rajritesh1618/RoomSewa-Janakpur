import { RoomListing } from '../types';
import { getRoomWifiDetails } from './wifiHelper';

export interface ChargeItem {
  key: 'roomRent' | 'electricity' | 'water' | 'wifi' | 'other';
  label: string;
  icon: string; // 'Home' | 'Zap' | 'Droplets' | 'Wifi'
  amount: number | null; // numeric fixed monthly amount added to total (if applicable)
  amountText: string; // e.g. "NPR 6,000", "NPR 1,000", "NPR 15/unit"
  displayText: string; // e.g. "🏠 Room Rent — NPR 6,000", "💡 Electricity — Not included", "🚰 Water — Included", "📶 Wi-Fi — NPR 1,000/month"
  statusText: string; // "Included" | "Not included" | "NPR 1,000" | "NPR 15/unit"
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
 * - Only applicable fixed monthly charges are added to total.
 * - If marked "Not included", never add to total.
 * - If based on per-unit/usage, display pricing method and never add arbitrary amount to total.
 */
export function calculateRoomPricing(room: Partial<RoomListing>): PricingBreakdown {
  const baseRent = typeof room.rentPerMonth === 'number' && !isNaN(room.rentPerMonth) && room.rentPerMonth > 0
    ? room.rentPerMonth
    : 0;

  const cf = room.customFeatures || {};

  // ----------------------------------------------------
  // 1. Electricity calculation
  // ----------------------------------------------------
  let electricityAmount: number | null = null;
  let electricityText = '';
  let electricityDisplayText = '';
  let electricityStatus = 'Not included';
  let isElectricityIncludedInTotal = false;
  let isElectricityIncludedInRent = false;
  let isElectricityNotIncluded = true;
  let isElectricityUsageBased = false;

  // Check custom features or direct fields for per-unit or fixed electricity
  const rawUnitCharge = room.electricityChargePerUnit ?? cf['feature-electricity'] ?? cf['Electricity'];
  const rawFixedElectricity = room.electricityCharge ?? cf['electricityCharge'] ?? cf['feature-electricity-monthly'];
  const isElectricityExplicitlyIncluded =
    room.electricityIncluded === true ||
    cf['electricityIncluded'] === true ||
    cf['feature-electricity'] === 'Included';
  const isElectricityExplicitlyNotIncluded =
    room.electricityIncluded === false ||
    cf['electricityIncluded'] === false ||
    cf['feature-electricity'] === 'Not Included';

  // Case A: Fixed monthly electricity charge explicitly entered
  if (
    rawFixedElectricity !== undefined &&
    rawFixedElectricity !== null &&
    rawFixedElectricity !== '' &&
    !isNaN(Number(rawFixedElectricity)) &&
    Number(rawFixedElectricity) > 0 &&
    !isElectricityExplicitlyNotIncluded
  ) {
    const fixedElec = Number(rawFixedElectricity);
    electricityAmount = fixedElec;
    electricityText = `NPR ${fixedElec.toLocaleString()}`;
    electricityDisplayText = `💡 Electricity — NPR ${fixedElec.toLocaleString()}`;
    electricityStatus = `NPR ${fixedElec.toLocaleString()}`;
    isElectricityIncludedInTotal = true;
    isElectricityNotIncluded = false;
  }
  // Case B: Explicitly included in rent
  else if (isElectricityExplicitlyIncluded) {
    electricityAmount = null;
    electricityText = 'Included';
    electricityDisplayText = '💡 Electricity — Included';
    electricityStatus = 'Included';
    isElectricityIncludedInRent = true;
    isElectricityNotIncluded = false;
  }
  // Case C: Explicitly not included without rate
  else if (isElectricityExplicitlyNotIncluded && (!rawUnitCharge || isNaN(Number(rawUnitCharge)))) {
    electricityAmount = null;
    electricityText = 'Not included';
    electricityDisplayText = '💡 Electricity — Not included';
    electricityStatus = 'Not included';
    isElectricityNotIncluded = true;
  }
  // Case D: Per-unit rate specified (e.g. NPR 15/unit)
  else if (rawUnitCharge !== undefined && rawUnitCharge !== null && rawUnitCharge !== '' && !isNaN(Number(rawUnitCharge)) && Number(rawUnitCharge) > 0) {
    const unitPrice = Number(rawUnitCharge);
    electricityAmount = null; // Do NOT add to total
    isElectricityUsageBased = true;
    electricityText = `NPR ${unitPrice}/unit`;
    electricityDisplayText = `💡 Electricity — NPR ${unitPrice}/unit (Not included)`;
    electricityStatus = `NPR ${unitPrice}/unit — Not included`;
    isElectricityNotIncluded = true;
  }
  // Case E: Facility string check
  else if (room.electricityFacility === 'Separate Meter') {
    electricityAmount = null;
    isElectricityUsageBased = true;
    electricityText = 'Separate Meter';
    electricityDisplayText = '💡 Electricity — Separate Meter (Not included)';
    electricityStatus = 'Not included';
    isElectricityNotIncluded = true;
  } else if (room.electricityFacility === 'Shared Bill') {
    electricityAmount = null;
    isElectricityUsageBased = true;
    electricityText = 'Shared Bill';
    electricityDisplayText = '💡 Electricity — Shared Bill (Not included)';
    electricityStatus = 'Not included';
    isElectricityNotIncluded = true;
  } else if (room.electricityFacility === '24 Hours / Inverter' && !room.electricityChargePerUnit) {
    electricityAmount = null;
    electricityText = 'Included';
    electricityDisplayText = '💡 Electricity — Included (24h/Inverter)';
    electricityStatus = 'Included';
    isElectricityIncludedInRent = true;
    isElectricityNotIncluded = false;
  } else {
    // Default safe fallback: Not included
    electricityAmount = null;
    electricityText = 'Not included';
    electricityDisplayText = '💡 Electricity — Not included';
    electricityStatus = 'Not included';
    isElectricityNotIncluded = true;
  }

  // ----------------------------------------------------
  // 2. Water calculation
  // ----------------------------------------------------
  let waterAmount: number | null = null;
  let waterText = '';
  let waterDisplayText = '';
  let waterStatus = 'Included';
  let isWaterIncludedInTotal = false;
  let isWaterIncludedInRent = true;
  let isWaterNotIncluded = false;

  const rawFixedWater = room.waterCharge ?? cf['waterCharge'] ?? cf['feature-water-charge'];
  const isWaterExplicitlyNotIncluded =
    room.waterIncluded === false ||
    cf['waterIncluded'] === false ||
    room.waterFacility === 'Limited';
  const isWaterExplicitlyIncluded =
    room.waterIncluded === true ||
    cf['waterIncluded'] === true;

  if (
    rawFixedWater !== undefined &&
    rawFixedWater !== null &&
    rawFixedWater !== '' &&
    !isNaN(Number(rawFixedWater)) &&
    Number(rawFixedWater) > 0 &&
    !isWaterExplicitlyNotIncluded
  ) {
    const fixedWater = Number(rawFixedWater);
    waterAmount = fixedWater;
    waterText = `NPR ${fixedWater.toLocaleString()}`;
    waterDisplayText = `🚰 Water — NPR ${fixedWater.toLocaleString()}`;
    waterStatus = `NPR ${fixedWater.toLocaleString()}`;
    isWaterIncludedInTotal = true;
    isWaterIncludedInRent = false;
  } else if (isWaterExplicitlyNotIncluded) {
    waterAmount = null;
    waterText = 'Not included';
    waterDisplayText = '🚰 Water — Not included';
    waterStatus = 'Not included';
    isWaterIncludedInRent = false;
    isWaterNotIncluded = true;
  } else {
    // Water in Janakpur is traditionally included with 24/7 Supply, Handpump, or Tap unless specified
    waterAmount = null;
    waterText = 'Included';
    waterDisplayText = '🚰 Water — Included';
    waterStatus = 'Included';
    isWaterIncludedInRent = true;
    isWaterNotIncluded = false;
  }

  // ----------------------------------------------------
  // 3. Wi-Fi calculation
  // ----------------------------------------------------
  let wifiAmount: number | null = null;
  let wifiText = '';
  let wifiDisplayText = '';
  let wifiStatus = 'Not included';
  let isWifiIncludedInTotal = false;
  let isWifiIncludedInRent = false;
  let isWifiNotIncluded = true;

  const wifiInfo = getRoomWifiDetails({
    wifiAvailable: room.wifiAvailable,
    wifiCharge: room.wifiCharge,
    customFeatures: room.customFeatures
  });

  if (!wifiInfo.isAvailable) {
    wifiAmount = null;
    wifiText = 'Not included';
    wifiDisplayText = '📶 Wi-Fi — Not included';
    wifiStatus = 'Not included';
    isWifiNotIncluded = true;
  } else if (wifiInfo.price !== null && wifiInfo.price > 0) {
    wifiAmount = wifiInfo.price;
    wifiText = `NPR ${wifiInfo.price.toLocaleString()}/month`;
    wifiDisplayText = `📶 Wi-Fi — NPR ${wifiInfo.price.toLocaleString()}/month`;
    wifiStatus = `NPR ${wifiInfo.price.toLocaleString()}/month`;
    isWifiIncludedInTotal = true;
    isWifiNotIncluded = false;
  } else {
    wifiAmount = null;
    wifiText = 'Included';
    wifiDisplayText = '📶 Wi-Fi — Included';
    wifiStatus = 'Included';
    isWifiIncludedInRent = true;
    isWifiNotIncluded = false;
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
      icon: 'Home',
      amount: baseRent,
      amountText: `NPR ${baseRent.toLocaleString()}`,
      displayText: `🏠 Room Rent — NPR ${baseRent.toLocaleString()}`,
      statusText: `NPR ${baseRent.toLocaleString()}`,
      isIncludedInTotal: true,
      isIncludedInRent: true,
      isNotIncluded: false,
      isUsageBased: false
    },
    {
      key: 'electricity',
      label: 'Electricity',
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
    baseRentFormatted: `NPR ${baseRent.toLocaleString()}`,
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
