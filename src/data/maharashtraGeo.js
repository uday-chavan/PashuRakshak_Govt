// Geo-coordinates (Centroids) for all 36 districts in Maharashtra (with modern & historical aliases)
export const DISTRICT_COORDINATES = {
  Ahmednagar: { lat: 19.0948, lng: 74.7480 },
  Ahilyanagar: { lat: 19.0948, lng: 74.7480 },
  Akola: { lat: 20.7002, lng: 77.0082 },
  Amravati: { lat: 20.9374, lng: 77.7796 },
  Aurangabad: { lat: 19.8762, lng: 75.3433 },
  'Chhatrapati Sambhajinagar': { lat: 19.8762, lng: 75.3433 },
  Beed: { lat: 18.9891, lng: 75.7601 },
  Bhandara: { lat: 21.1714, lng: 79.6543 },
  Buldhana: { lat: 20.5292, lng: 76.1843 },
  Chandrapur: { lat: 19.9615, lng: 79.2961 },
  Dhule: { lat: 20.9042, lng: 74.7749 },
  Gadchiroli: { lat: 20.1849, lng: 80.0030 },
  Gondia: { lat: 21.4598, lng: 80.1961 },
  Hingoli: { lat: 19.7180, lng: 77.1478 },
  Jalgaon: { lat: 21.0077, lng: 75.5626 },
  Jalna: { lat: 19.8410, lng: 75.8864 },
  Kolhapur: { lat: 16.7050, lng: 74.2433 },
  Latur: { lat: 18.4088, lng: 76.5604 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  'Mumbai City': { lat: 19.0760, lng: 72.8777 },
  'Mumbai Suburban': { lat: 19.1136, lng: 72.8697 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Nanded: { lat: 19.1383, lng: 77.3210 },
  Nandurbar: { lat: 21.3736, lng: 74.2402 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
  Osmanabad: { lat: 18.1856, lng: 76.0416 },
  Dharashiv: { lat: 18.1856, lng: 76.0416 },
  Palghar: { lat: 19.6967, lng: 72.7655 },
  Parbhani: { lat: 19.2686, lng: 76.7708 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Raigad: { lat: 18.5158, lng: 73.1812 },
  Ratnagiri: { lat: 16.9902, lng: 73.3120 },
  Sangli: { lat: 16.8524, lng: 74.5815 },
  Satara: { lat: 17.6805, lng: 74.0183 },
  Sindhudurg: { lat: 16.1100, lng: 73.6800 },
  Solapur: { lat: 17.6599, lng: 75.9064 },
  Thane: { lat: 19.2183, lng: 72.9781 },
  Wardha: { lat: 20.7453, lng: 78.6022 },
  Washim: { lat: 20.1097, lng: 77.1350 },
  Yavatmal: { lat: 20.3888, lng: 78.1204 },
};

export const DISTRICT_ALIASES = {
  Ahilyanagar: 'Ahmednagar',
  'Ahmed Nagar': 'Ahmednagar',
  'Chhatrapati Sambhajinagar': 'Aurangabad',
  'Chhatrapati Sambhaji Nagar': 'Aurangabad',
  Dharashiv: 'Osmanabad',
  'Mumbai City': 'Mumbai',
  'Mumbai Suburban': 'Mumbai Suburban',
  // Talukas & Towns for Ahmednagar / Ahilyanagar
  Kopargaon: 'Ahmednagar',
  Shirdi: 'Ahmednagar',
  Rahata: 'Ahmednagar',
  Sangamner: 'Ahmednagar',
  Shrirampur: 'Ahmednagar',
  Nevasa: 'Ahmednagar',
  Shevgaon: 'Ahmednagar',
  Parner: 'Ahmednagar',
  Akole: 'Ahmednagar',
  Rahuri: 'Ahmednagar',
  Pathardi: 'Ahmednagar',
  Shrigonda: 'Ahmednagar',
  Karjat: 'Ahmednagar',
  Jamkhed: 'Ahmednagar',
  // Talukas for other major districts
  Niphad: 'Nashik',
  Manmad: 'Nashik',
  Malegaon: 'Nashik',
  Sinnar: 'Nashik',
  Baramati: 'Pune',
  Haveli: 'Pune',
  Daund: 'Pune',
  Shirur: 'Pune',
  Pandharpur: 'Solapur',
  Barshi: 'Solapur',
  Udgir: 'Latur',
  Paithan: 'Aurangabad',
};

// 36 Official Districts in alphabetical order
export const ALL_36_MAHARASHTRA_DISTRICTS = [
  'Ahmednagar',
  'Akola',
  'Amravati',
  'Aurangabad',
  'Beed',
  'Bhandara',
  'Buldhana',
  'Chandrapur',
  'Dhule',
  'Gadchiroli',
  'Gondia',
  'Hingoli',
  'Jalgaon',
  'Jalna',
  'Kolhapur',
  'Latur',
  'Mumbai',
  'Mumbai Suburban',
  'Nagpur',
  'Nanded',
  'Nandurbar',
  'Nashik',
  'Osmanabad',
  'Palghar',
  'Parbhani',
  'Pune',
  'Raigad',
  'Ratnagiri',
  'Sangli',
  'Satara',
  'Sindhudurg',
  'Solapur',
  'Thane',
  'Wardha',
  'Washim',
  'Yavatmal',
];

export function normalizeDistrictName(name) {
  if (!name) return '';
  const trimmed = String(name).trim();

  // Strip common administrative suffixes like " Division", " District", " Taluka", " Region"
  const cleaned = trimmed
    .replace(/\s+(division|district|taluka|region|circle|block|area)$/i, '')
    .trim();

  if (DISTRICT_ALIASES[trimmed]) return DISTRICT_ALIASES[trimmed];
  if (DISTRICT_ALIASES[cleaned]) return DISTRICT_ALIASES[cleaned];

  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    if (trimmed.toLowerCase() === alias.toLowerCase() || cleaned.toLowerCase() === alias.toLowerCase()) {
      return canonical;
    }
  }
  for (const dist of ALL_36_MAHARASHTRA_DISTRICTS) {
    if (dist.toLowerCase() === trimmed.toLowerCase() || dist.toLowerCase() === cleaned.toLowerCase()) {
      return dist;
    }
  }
  // Substring matching (e.g. "Nashik Division" contains "Nashik")
  for (const dist of ALL_36_MAHARASHTRA_DISTRICTS) {
    if (cleaned.toLowerCase().includes(dist.toLowerCase()) || dist.toLowerCase().includes(cleaned.toLowerCase())) {
      return dist;
    }
  }
  return cleaned || trimmed;
}

export function matchDistrict(dist1, dist2) {
  if (!dist1 || !dist2) return false;
  const n1 = normalizeDistrictName(dist1).toLowerCase();
  const n2 = normalizeDistrictName(dist2).toLowerCase();
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

export const MAHARASHTRA_CENTER = { lat: 19.35, lng: 76.5 };
export const MAHARASHTRA_DEFAULT_ZOOM = 6;

import maharashtraGeoJson from './maharashtra_districts.json';

/**
 * Standard Ray-Casting algorithm to check if a point [lng, lat] is inside a polygon ring [[lng, lat], ...]
 */
function pointInPolygonRing(point, ring) {
  const [x, y] = point; // x = lng, y = lat
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if point [lng, lat] is inside a Polygon or MultiPolygon GeoJSON geometry
 */
function pointInGeometry(point, geometry) {
  if (!geometry || !geometry.coordinates) return false;
  const { type, coordinates } = geometry;

  if (type === 'Polygon') {
    if (!pointInPolygonRing(point, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInPolygonRing(point, coordinates[i])) return false;
    }
    return true;
  }

  if (type === 'MultiPolygon') {
    for (let p = 0; p < coordinates.length; p++) {
      const polygonCoords = coordinates[p];
      if (pointInPolygonRing(point, polygonCoords[0])) {
        let inHole = false;
        for (let i = 1; i < polygonCoords.length; i++) {
          if (pointInPolygonRing(point, polygonCoords[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
    return false;
  }

  return false;
}

/**
 * Reverse-geocodes [lat, lng] to the exact Maharashtra district by testing official GeoJSON polygons,
 * with nearest centroid distance fallback.
 */
export function getDistrictFromCoordinates(rawLat, rawLng) {
  if (rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) return '';

  let lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat || '').trim().replace(/[^0-9.-]/g, ''));
  let lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng || '').trim().replace(/[^0-9.-]/g, ''));

  if (isNaN(lat) || isNaN(lng)) return '';

  // Unswap if [lng, lat]
  if (lat > 65 && lat < 95 && lng > 12 && lng < 32) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  // 1. Point-in-polygon check against official GeoJSON district boundaries
  if (maharashtraGeoJson?.features) {
    for (const feature of maharashtraGeoJson.features) {
      if (pointInGeometry([lng, lat], feature.geometry)) {
        const raw = feature.properties?.district || feature.properties?.District || feature.properties?.NAME_2 || feature.properties?.name || '';
        if (raw) return normalizeDistrictName(raw);
      }
    }
  }

  // 2. Spatial proximity fallback: find nearest district centroid
  let closestDistrict = '';
  let minDistance = Infinity;

  for (const [distName, coords] of Object.entries(DISTRICT_COORDINATES)) {
    const dLat = lat - coords.lat;
    const dLng = lng - coords.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      closestDistrict = distName;
    }
  }

  return normalizeDistrictName(closestDistrict);
}

/**
 * Deterministic jitter for cases without exact GPS coordinates or sharing district centroid.
 * Spreads pins within ~1.5km - 6km radius so they do not overlap on a single point.
 */
export function getDeterministicOffset(strOrId) {
  const str = String(strOrId || '1');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const distance = 0.015 + ((Math.abs(hash >> 3) % 45) / 1000);
  return {
    dLat: Math.sin(angle) * distance,
    dLng: Math.cos(angle) * distance,
  };
}

export const MAHARASHTRA_TOWNS = [
  // Ahmednagar / Ahilyanagar
  { name: 'Kopargaon', district: 'Ahmednagar', lat: 19.8867, lng: 74.4789 },
  { name: 'Shirdi', district: 'Ahmednagar', lat: 19.7667, lng: 74.4767 },
  { name: 'Rahata', district: 'Ahmednagar', lat: 19.7042, lng: 74.4947 },
  { name: 'Sangamner', district: 'Ahmednagar', lat: 19.5694, lng: 74.2089 },
  { name: 'Shrirampur', district: 'Ahmednagar', lat: 19.6192, lng: 74.6569 },
  { name: 'Nevasa', district: 'Ahmednagar', lat: 19.5539, lng: 74.9217 },
  { name: 'Rahuri', district: 'Ahmednagar', lat: 19.3900, lng: 74.6500 },
  { name: 'Shevgaon', district: 'Ahmednagar', lat: 19.3400, lng: 75.2200 },
  { name: 'Parner', district: 'Ahmednagar', lat: 19.0000, lng: 74.4400 },
  { name: 'Akole', district: 'Ahmednagar', lat: 19.5400, lng: 73.9300 },
  { name: 'Pathardi', district: 'Ahmednagar', lat: 19.1700, lng: 75.1800 },
  { name: 'Shrigonda', district: 'Ahmednagar', lat: 18.6200, lng: 74.7000 },
  { name: 'Karjat', district: 'Ahmednagar', lat: 18.9100, lng: 75.0000 },
  { name: 'Jamkhed', district: 'Ahmednagar', lat: 18.7300, lng: 75.3200 },
  { name: 'Ahmednagar', district: 'Ahmednagar', lat: 19.0948, lng: 74.7480 },

  // Nashik
  { name: 'Nashik', district: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { name: 'Sinnar', district: 'Nashik', lat: 19.8472, lng: 73.9989 },
  { name: 'Niphad', district: 'Nashik', lat: 20.0800, lng: 74.1100 },
  { name: 'Yeola', district: 'Nashik', lat: 20.0400, lng: 74.4800 },
  { name: 'Malegaon', district: 'Nashik', lat: 20.5539, lng: 74.5289 },
  { name: 'Manmad', district: 'Nashik', lat: 20.2500, lng: 74.4400 },
  { name: 'Igatpuri', district: 'Nashik', lat: 19.6967, lng: 73.5583 },
  { name: 'Dindori', district: 'Nashik', lat: 20.2000, lng: 73.8300 },
  { name: 'Trimbak', district: 'Nashik', lat: 19.9300, lng: 73.5300 },
  { name: 'Kalwan', district: 'Nashik', lat: 20.4800, lng: 73.9600 },
  { name: 'Satana', district: 'Nashik', lat: 20.5900, lng: 74.2000 },

  // Pune
  { name: 'Pune', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Haveli', district: 'Pune', lat: 18.4500, lng: 73.9000 },
  { name: 'Shirur', district: 'Pune', lat: 18.8272, lng: 74.3789 },
  { name: 'Baramati', district: 'Pune', lat: 18.1517, lng: 74.5772 },
  { name: 'Daund', district: 'Pune', lat: 18.4650, lng: 74.5822 },
  { name: 'Indapur', district: 'Pune', lat: 18.1100, lng: 75.0300 },
  { name: 'Junnar', district: 'Pune', lat: 19.2000, lng: 73.8700 },
  { name: 'Khed', district: 'Pune', lat: 18.8500, lng: 73.9000 },
  { name: 'Ambegaon', district: 'Pune', lat: 19.0300, lng: 73.7800 },
  { name: 'Maval', district: 'Pune', lat: 18.7500, lng: 73.5000 },
  { name: 'Mulshi', district: 'Pune', lat: 18.5000, lng: 73.5100 },
  { name: 'Bhor', district: 'Pune', lat: 18.1300, lng: 73.8500 },
  { name: 'Purandar', district: 'Pune', lat: 18.2800, lng: 73.9700 },
  { name: 'Velhe', district: 'Pune', lat: 18.3000, lng: 73.6300 },

  // Aurangabad (Chhatrapati Sambhajinagar)
  { name: 'Aurangabad', district: 'Aurangabad', lat: 19.8762, lng: 75.3433 },
  { name: 'Paithan', district: 'Aurangabad', lat: 19.4800, lng: 75.3800 },
  { name: 'Vaijapur', district: 'Aurangabad', lat: 19.9200, lng: 74.7300 },
  { name: 'Gangapur', district: 'Aurangabad', lat: 19.7000, lng: 75.0100 },
  { name: 'Kannad', district: 'Aurangabad', lat: 20.2600, lng: 75.1300 },
  { name: 'Sillod', district: 'Aurangabad', lat: 20.3000, lng: 75.6500 },
  { name: 'Khuldabad', district: 'Aurangabad', lat: 20.0000, lng: 75.1800 },

  // Solapur
  { name: 'Solapur', district: 'Solapur', lat: 17.6599, lng: 75.9064 },
  { name: 'Pandharpur', district: 'Solapur', lat: 17.6778, lng: 75.3283 },
  { name: 'Barshi', district: 'Solapur', lat: 18.2333, lng: 75.6833 },
  { name: 'Karmala', district: 'Solapur', lat: 18.4200, lng: 75.2000 },
  { name: 'Madha', district: 'Solapur', lat: 18.0300, lng: 75.5200 },
  { name: 'Sangola', district: 'Solapur', lat: 17.4300, lng: 75.1900 },
  { name: 'Mangalwedha', district: 'Solapur', lat: 17.5100, lng: 75.4400 },
  { name: 'Mohol', district: 'Solapur', lat: 17.8100, lng: 75.6500 },
  { name: 'Akkalkot', district: 'Solapur', lat: 17.5200, lng: 76.2000 },

  // Satara
  { name: 'Satara', district: 'Satara', lat: 17.6805, lng: 74.0183 },
  { name: 'Karad', district: 'Satara', lat: 17.2800, lng: 74.2000 },
  { name: 'Phaltan', district: 'Satara', lat: 17.9800, lng: 74.4300 },
  { name: 'Wai', district: 'Satara', lat: 17.9500, lng: 73.8900 },
  { name: 'Koregaon', district: 'Satara', lat: 17.7000, lng: 74.1700 },
  { name: 'Mahabaleshwar', district: 'Satara', lat: 17.9237, lng: 73.6586 },

  // Kolhapur
  { name: 'Kolhapur', district: 'Kolhapur', lat: 16.7050, lng: 74.2433 },
  { name: 'Ichalkaranji', district: 'Kolhapur', lat: 16.7000, lng: 74.4600 },
  { name: 'Hatkanangle', district: 'Kolhapur', lat: 16.7500, lng: 74.4500 },
  { name: 'Shirol', district: 'Kolhapur', lat: 16.7200, lng: 74.6000 },
  { name: 'Kagal', district: 'Kolhapur', lat: 16.5800, lng: 74.3200 },
  { name: 'Radhanagari', district: 'Kolhapur', lat: 16.4100, lng: 73.9900 },
  { name: 'Panhala', district: 'Kolhapur', lat: 16.8200, lng: 74.1100 },

  // Sangli
  { name: 'Sangli', district: 'Sangli', lat: 16.8524, lng: 74.5815 },
  { name: 'Miraj', district: 'Sangli', lat: 16.8200, lng: 74.6500 },
  { name: 'Islampur', district: 'Sangli', lat: 17.0500, lng: 74.2600 },
  { name: 'Tasgaon', district: 'Sangli', lat: 17.0300, lng: 74.6000 },
  { name: 'Vita', district: 'Sangli', lat: 17.2700, lng: 74.5400 },
  { name: 'Jat', district: 'Sangli', lat: 17.0500, lng: 75.3300 },

  // Jalgaon
  { name: 'Jalgaon', district: 'Jalgaon', lat: 21.0077, lng: 75.5626 },
  { name: 'Bhusawal', district: 'Jalgaon', lat: 21.0500, lng: 75.7700 },
  { name: 'Chalisgaon', district: 'Jalgaon', lat: 20.4600, lng: 75.0100 },
  { name: 'Pachora', district: 'Jalgaon', lat: 20.6700, lng: 75.3500 },
  { name: 'Amalner', district: 'Jalgaon', lat: 21.0500, lng: 75.0500 },
  { name: 'Chopda', district: 'Jalgaon', lat: 21.2500, lng: 75.3000 },
  { name: 'Raver', district: 'Jalgaon', lat: 21.2500, lng: 75.9700 },

  // Jalna
  { name: 'Jalna', district: 'Jalna', lat: 19.8410, lng: 75.8864 },
  { name: 'Partur', district: 'Jalna', lat: 19.5900, lng: 76.2100 },
  { name: 'Ambad', district: 'Jalna', lat: 19.6100, lng: 75.7900 },
  { name: 'Bhokardan', district: 'Jalna', lat: 20.2600, lng: 75.7700 },

  // Beed
  { name: 'Beed', district: 'Beed', lat: 18.9891, lng: 75.7601 },
  { name: 'Parli Vaijnath', district: 'Beed', lat: 18.8500, lng: 76.5300 },
  { name: 'Majalgaon', district: 'Beed', lat: 19.1500, lng: 76.2200 },
  { name: 'Georai', district: 'Beed', lat: 19.2600, lng: 75.7500 },
  { name: 'Ambajogai', district: 'Beed', lat: 18.7300, lng: 76.3800 },

  // Latur
  { name: 'Latur', district: 'Latur', lat: 18.4088, lng: 76.5604 },
  { name: 'Udgir', district: 'Latur', lat: 18.3900, lng: 77.1200 },
  { name: 'Ausa', district: 'Latur', lat: 18.2500, lng: 76.5000 },
  { name: 'Nilanga', district: 'Latur', lat: 18.1300, lng: 76.7600 },
  { name: 'Ahmedpur', district: 'Latur', lat: 18.7000, lng: 76.9300 },

  // Nanded
  { name: 'Nanded', district: 'Nanded', lat: 19.1383, lng: 77.3210 },
  { name: 'Deglur', district: 'Nanded', lat: 18.5500, lng: 77.5800 },
  { name: 'Mukhed', district: 'Nanded', lat: 18.7200, lng: 77.3700 },
  { name: 'Kandhar', district: 'Nanded', lat: 18.9000, lng: 77.2000 },
  { name: 'Kinwat', district: 'Nanded', lat: 19.6300, lng: 78.2000 },
  { name: 'Hadgaon', district: 'Nanded', lat: 19.5000, lng: 77.6700 },

  // Parbhani & Hingoli
  { name: 'Parbhani', district: 'Parbhani', lat: 19.2686, lng: 76.7708 },
  { name: 'Gangakhed', district: 'Parbhani', lat: 18.9500, lng: 76.7500 },
  { name: 'Jintur', district: 'Parbhani', lat: 19.6100, lng: 76.6900 },
  { name: 'Sailu', district: 'Parbhani', lat: 19.4500, lng: 76.4500 },
  { name: 'Hingoli', district: 'Hingoli', lat: 19.7180, lng: 77.1478 },
  { name: 'Basmath', district: 'Hingoli', lat: 19.3200, lng: 77.1500 },
  { name: 'Kalamnuri', district: 'Hingoli', lat: 19.6700, lng: 77.3000 },

  // Osmanabad (Dharashiv)
  { name: 'Osmanabad', district: 'Osmanabad', lat: 18.1856, lng: 76.0416 },
  { name: 'Tuljapur', district: 'Osmanabad', lat: 18.0100, lng: 76.0800 },
  { name: 'Omerga', district: 'Osmanabad', lat: 17.8400, lng: 76.6200 },
  { name: 'Bhum', district: 'Osmanabad', lat: 18.4700, lng: 75.6700 },
  { name: 'Kalamb', district: 'Osmanabad', lat: 18.4500, lng: 76.0500 },

  // Nagpur & Vidarbha
  { name: 'Nagpur', district: 'Nagpur', lat: 21.1458, lng: 79.0882 },
  { name: 'Kamptee', district: 'Nagpur', lat: 21.2200, lng: 79.2000 },
  { name: 'Katol', district: 'Nagpur', lat: 21.2700, lng: 78.5800 },
  { name: 'Umred', district: 'Nagpur', lat: 20.8500, lng: 79.3300 },
  { name: 'Ramtek', district: 'Nagpur', lat: 21.4000, lng: 79.3300 },
  { name: 'Amravati', district: 'Amravati', lat: 20.9374, lng: 77.7796 },
  { name: 'Achalpur', district: 'Amravati', lat: 21.2600, lng: 77.5100 },
  { name: 'Akola', district: 'Akola', lat: 20.7002, lng: 77.0082 },
  { name: 'Akot', district: 'Akola', lat: 21.1000, lng: 77.0600 },
  { name: 'Buldhana', district: 'Buldhana', lat: 20.5292, lng: 76.1843 },
  { name: 'Khamgaon', district: 'Buldhana', lat: 20.6800, lng: 76.5700 },
  { name: 'Shegaon', district: 'Buldhana', lat: 20.7900, lng: 76.6900 },
  { name: 'Yavatmal', district: 'Yavatmal', lat: 20.3888, lng: 78.1204 },
  { name: 'Pusad', district: 'Yavatmal', lat: 19.9100, lng: 77.5700 },
  { name: 'Wardha', district: 'Wardha', lat: 20.7453, lng: 78.6022 },
  { name: 'Hinganghat', district: 'Wardha', lat: 20.5700, lng: 78.8400 },
  { name: 'Chandrapur', district: 'Chandrapur', lat: 19.9615, lng: 79.2961 },
  { name: 'Ballarpur', district: 'Chandrapur', lat: 19.8500, lng: 79.3500 },
  { name: 'Gadchiroli', district: 'Gadchiroli', lat: 20.1849, lng: 80.0030 },
  { name: 'Bhandara', district: 'Bhandara', lat: 21.1714, lng: 79.6543 },
  { name: 'Gondia', district: 'Gondia', lat: 21.4598, lng: 80.1961 },

  // North Maharashtra & Khandesh
  { name: 'Dhule', district: 'Dhule', lat: 20.9042, lng: 74.7749 },
  { name: 'Shirpur', district: 'Dhule', lat: 21.3500, lng: 74.8800 },
  { name: 'Nandurbar', district: 'Nandurbar', lat: 21.3736, lng: 74.2402 },
  { name: 'Shahada', district: 'Nandurbar', lat: 21.5500, lng: 74.4700 },

  // Konkan Coast
  { name: 'Thane', district: 'Thane', lat: 19.2183, lng: 72.9781 },
  { name: 'Kalyan', district: 'Thane', lat: 19.2400, lng: 73.1300 },
  { name: 'Palghar', district: 'Palghar', lat: 19.6967, lng: 72.7655 },
  { name: 'Vasai', district: 'Palghar', lat: 19.3800, lng: 72.8300 },
  { name: 'Alibag', district: 'Raigad', lat: 18.6400, lng: 72.8700 },
  { name: 'Panvel', district: 'Raigad', lat: 18.9900, lng: 73.1200 },
  { name: 'Ratnagiri', district: 'Ratnagiri', lat: 16.9902, lng: 73.3120 },
  { name: 'Chiplun', district: 'Ratnagiri', lat: 17.5300, lng: 73.5200 },
  { name: 'Sindhudurg Nagari', district: 'Sindhudurg', lat: 16.1100, lng: 73.6800 },
  { name: 'Sawantwadi', district: 'Sindhudurg', lat: 15.9000, lng: 73.8200 },
];

/**
 * Reverse geocodes [lat, lng] to both the nearest town/village and accurate district.
 * If the incoming raw village/district contradicts the true coordinates by > 25km,
 * this function automatically overrides it with the true local town and district.
 */
export function getNearestTownAndDistrict(rawLat, rawLng, rawVillage = '', rawDistrict = '') {
  if (rawLat === undefined || rawLat === null || rawLng === undefined || rawLng === null) {
    const normDist = normalizeDistrictName(rawDistrict) || 'Maharashtra';
    return {
      village: rawVillage ? String(rawVillage).trim() : `${normDist} Area`,
      district: normDist,
    };
  }

  let lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat || '').trim().replace(/[^0-9.-]/g, ''));
  let lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng || '').trim().replace(/[^0-9.-]/g, ''));

  if (isNaN(lat) || isNaN(lng)) {
    const normDist = normalizeDistrictName(rawDistrict) || 'Maharashtra';
    return {
      village: rawVillage ? String(rawVillage).trim() : `${normDist} Area`,
      district: normDist,
    };
  }

  // Unswap if [lng, lat]
  if (lat > 65 && lat < 95 && lng > 12 && lng < 32) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  // 1. Find accurate district from GeoJSON boundary polygons
  let geoDistrict = getDistrictFromCoordinates(lat, lng);

  // 2. Find closest known town / taluka / village center
  let closestTown = null;
  let minTownDistSq = Infinity;

  for (const town of MAHARASHTRA_TOWNS) {
    const dLat = lat - town.lat;
    const dLng = lng - town.lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minTownDistSq) {
      minTownDistSq = distSq;
      closestTown = town;
    }
  }

  // If closest town is within ~45km (distSq < 0.2), its district is highly accurate
  if (closestTown && minTownDistSq < 0.2) {
    if (!geoDistrict || geoDistrict === 'Maharashtra') {
      geoDistrict = closestTown.district;
    }
  }

  const finalDistrict = geoDistrict || normalizeDistrictName(rawDistrict) || 'Maharashtra';

  let rawV = rawVillage ? String(rawVillage).trim() : '';

  // Clean rawVillage if it includes district suffix (e.g. "Shirur, Pune" or "Kopargaon, Ahmednagar")
  if (rawV.includes(',')) {
    const parts = rawV.split(',');
    rawV = parts[0].trim();
  }

  const isGenericVillage =
    !rawV ||
    rawV.toLowerCase() === 'area sector' ||
    rawV.toLowerCase() === 'village' ||
    rawV.toLowerCase() === 'unknown' ||
    rawV.toLowerCase() === 'area' ||
    rawV.toLowerCase() === 'village area' ||
    rawV.toLowerCase() === 'observation';

  let resolvedVillage = rawV;

  if (isGenericVillage && closestTown) {
    resolvedVillage = closestTown.name;
  } else if (closestTown) {
    const rawDistClean = normalizeDistrictName(rawDistrict);
    const rawAliasDist = DISTRICT_ALIASES[rawV] ? normalizeDistrictName(DISTRICT_ALIASES[rawV]) : '';

    // Check if the given village belongs to a completely different district (e.g., Shirur is in Pune, but coordinates are in Kopargaon/Ahmednagar)
    const isContradicting =
      (rawDistClean && rawDistClean !== 'Maharashtra' && rawDistClean !== finalDistrict) ||
      (rawAliasDist && rawAliasDist !== finalDistrict) ||
      (rawV.toLowerCase() === 'shirur' && finalDistrict !== 'Pune');

    if (isContradicting && minTownDistSq < 0.5) {
      resolvedVillage = closestTown.name;
    } else if (!resolvedVillage) {
      resolvedVillage = closestTown.name;
    }
  }

  return {
    village: resolvedVillage || (closestTown ? closestTown.name : `${finalDistrict} Area`),
    district: finalDistrict,
  };
}

/**
 * Parses, sanitizes, and normalizes animal cases coming from mobile app / DB.
 * Automatically resolves and populates district name & village from coordinates if missing or contradictory.
 */
export function parseAnimalCaseToPin(c) {
  if (!c) return null;

  const rawDistrict = c.district || c.district_name || c.districtName || '';
  const rawVillage = c.village_area || c.village || c.villageArea || c.village_name || c.location || '';

  // Extract raw coordinates from any possible mobile field naming convention
  let rawLat = c.latitude ?? c.lat ?? c.location_lat ?? c.gps_latitude ?? c.gps_lat;
  let rawLng = c.longitude ?? c.lng ?? c.lon ?? c.location_lng ?? c.gps_longitude ?? c.gps_lng;

  // Handle location string or object if lat/lng are still undefined
  if ((rawLat === undefined || rawLat === null || rawLat === '') && c.location) {
    if (typeof c.location === 'object') {
      rawLat = c.location.lat ?? c.location.latitude;
      rawLng = c.location.lng ?? c.location.lon ?? c.location.longitude;
    } else if (typeof c.location === 'string' && c.location.includes(',')) {
      const parts = c.location.split(',');
      rawLat = parts[0];
      rawLng = parts[1];
    }
  }

  // Handle coords array if present
  if ((rawLat === undefined || rawLat === null || rawLat === '') && Array.isArray(c.coords) && c.coords.length >= 2) {
    rawLat = c.coords[0];
    rawLng = c.coords[1];
  }

  // Parse to clean numeric floats
  let lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat || '').trim().replace(/[^0-9.-]/g, ''));
  let lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng || '').trim().replace(/[^0-9.-]/g, ''));

  // Detect and un-swap swapped coordinates (e.g. mobile GPS libraries outputting [lng, lat] or reversed fields)
  // In India: Latitude is ~15-22°N, Longitude is ~72-81°E
  if (!isNaN(lat) && !isNaN(lng)) {
    if (lat > 65 && lat < 95 && lng > 12 && lng < 32) {
      const temp = lat;
      lat = lng;
      lng = temp;
    }
  }

  // Check if coordinates are within the valid Maharashtra / Central India bounding box
  const isValidCoord =
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= 14.5 &&
    lat <= 23.5 &&
    lng >= 71.5 &&
    lng <= 82.5 &&
    !(Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001);

  // Reverse geocode to exact town and district
  const { village: resolvedVillage, district: resolvedDistrict } = getNearestTownAndDistrict(lat, lng, rawVillage, rawDistrict);

  if (!isValidCoord) {
    // Graceful fallback: centroid of district + deterministic offset so pin is placed within correct district
    const centroid = DISTRICT_COORDINATES[resolvedDistrict] || DISTRICT_COORDINATES[rawDistrict] || DISTRICT_COORDINATES['Aurangabad'];
    if (centroid) {
      const offset = getDeterministicOffset(c.id || c.case_ref || rawVillage || '1');
      lat = centroid.lat + offset.dLat;
      lng = centroid.lng + offset.dLng;
    }
  }

  if (isNaN(lat) || isNaN(lng)) return null;

  const caseRef = c.case_ref || c.caseRef || c.case_id || (c.id ? (typeof c.id === 'string' && c.id.startsWith('CS-') ? c.id : `CS-260${c.id}`) : 'CS-LIVE');
  const disease = c.confirmed_disease || c.suspected_disease || c.disease || c.suspectedDisease || 'Undiagnosed Condition';
  const vet = c.assigned_vet || c.assignedVet || c.vet || c.doctor || 'Field Veterinary Officer';
  const animal = c.animal || c.species || 'Livestock';
  const status = c.status || 'Active';
  const dateTime = c.date_time || c.dateTime || c.date || c.created_at || new Date().toISOString();

  return {
    id: c.id || caseRef,
    caseRef,
    lat,
    lng,
    animal,
    village: resolvedVillage,
    district: resolvedDistrict,
    disease,
    status,
    vet,
    dateTime,
    rawLat: c.latitude,
    rawLng: c.longitude,
    ownerName: c.owner_name || c.ownerName,
    ownerContact: c.owner_contact || c.ownerContact,
    herdSize: c.herd_size || c.herdSize || 1,
    symptoms: c.symptoms || '',
  };
}


