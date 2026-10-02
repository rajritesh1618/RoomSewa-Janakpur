// Utility to extract and format Wi-Fi availability and charges across all room listings

export interface RoomWifiInfo {
  isAvailable: boolean;
  price: number | null;
  priceText: string;
  displayText: string;
}

export function getRoomWifiDetails(room: {
  wifiAvailable?: boolean;
  wifiCharge?: number | string | null;
  customFeatures?: Record<string, any>;
}): RoomWifiInfo {
  const cf = room.customFeatures || {};
  const wifiFeat = cf['feature-wifi'] ?? cf['Wi-Fi Internet'] ?? cf['Wi-Fi'] ?? cf['wifi'];
  const facilitiesFeat = cf['feature-facilities'] ?? cf['Facilities & Amenities'];

  let isAvailable = Boolean(room.wifiAvailable);
  let price: number | null =
    room.wifiCharge !== undefined && room.wifiCharge !== null && room.wifiCharge !== '' && !isNaN(Number(room.wifiCharge))
      ? Number(room.wifiCharge)
      : null;

  // 1. Check dedicated Wi-Fi feature
  if (wifiFeat !== undefined && wifiFeat !== null) {
    if (typeof wifiFeat === 'object') {
      if (wifiFeat.available !== undefined) {
        isAvailable = Boolean(wifiFeat.available);
      } else if (wifiFeat.selected !== undefined) {
        isAvailable =
          wifiFeat.selected === 'Available' ||
          wifiFeat.selected === 'Yes' ||
          wifiFeat.selected === 'Included';
      }

      if (wifiFeat.price !== undefined && wifiFeat.price !== null && wifiFeat.price !== '' && !isNaN(Number(wifiFeat.price))) {
        price = Number(wifiFeat.price);
      }
    } else if (typeof wifiFeat === 'boolean') {
      isAvailable = wifiFeat;
    } else if (typeof wifiFeat === 'string') {
      isAvailable =
        wifiFeat === 'Available' ||
        wifiFeat === 'Yes' ||
        wifiFeat === 'Included' ||
        wifiFeat.toLowerCase().includes('available');
    }
  }

  // 2. Check feature-facilities list (if Wi-Fi was selected as an amenity option)
  if (Array.isArray(facilitiesFeat)) {
    for (const item of facilitiesFeat) {
      if (typeof item === 'string') {
        const lower = item.toLowerCase();
        if (lower.includes('wi-fi') || lower.includes('wifi')) {
          isAvailable = true;
        }
      } else if (typeof item === 'object' && item !== null) {
        const name = (item.name || item.selected || '').toLowerCase();
        if (name.includes('wi-fi') || name.includes('wifi')) {
          isAvailable = true;
          if (item.price !== undefined && item.price !== null && item.price !== '' && !isNaN(Number(item.price))) {
            price = Number(item.price);
          }
        }
      }
    }
  }

  // 3. Format display texts
  let priceText = '';
  let displayText = '';

  if (!isAvailable) {
    displayText = 'Not Available';
  } else if (price !== null && price > 0) {
    priceText = `Rs. ${price.toLocaleString()}/month`;
    displayText = `Available — Rs. ${price.toLocaleString()}/month`;
  } else {
    priceText = 'Free / Included';
    displayText = 'Available — Free / Included';
  }

  return {
    isAvailable,
    price,
    priceText,
    displayText
  };
}
