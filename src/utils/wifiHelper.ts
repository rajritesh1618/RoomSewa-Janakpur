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

  let price: number | null = null;
  const rawDirectPrice = room.wifiCharge ?? cf['wifiCharge'] ?? cf['feature-wifi-charge'];
  if (rawDirectPrice !== undefined && rawDirectPrice !== null && rawDirectPrice !== '' && !isNaN(Number(rawDirectPrice))) {
    price = Number(rawDirectPrice);
  }

  let isAvailable = Boolean(room.wifiAvailable) || (price !== null && price > 0);

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
        isAvailable = true;
      }
    } else if (typeof wifiFeat === 'boolean') {
      isAvailable = wifiFeat;
    } else if (typeof wifiFeat === 'number' && wifiFeat > 0) {
      price = wifiFeat;
      isAvailable = true;
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

  if (price !== null && price > 0) {
    isAvailable = true;
  }

  // 3. Format display texts
  let priceText = '';
  let displayText = '';

  if (!isAvailable) {
    displayText = 'Not Available';
  } else if (price !== null && price > 0) {
    priceText = `NPR ${price.toLocaleString()}/month`;
    displayText = `Available — NPR ${price.toLocaleString()}/month`;
  } else {
    priceText = 'Included';
    displayText = 'Included';
  }

  return {
    isAvailable,
    price,
    priceText,
    displayText
  };
}
