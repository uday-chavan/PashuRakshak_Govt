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
  const trimmed = name.trim();
  if (DISTRICT_ALIASES[trimmed]) return DISTRICT_ALIASES[trimmed];
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    if (trimmed.toLowerCase() === alias.toLowerCase()) return canonical;
  }
  for (const dist of ALL_36_MAHARASHTRA_DISTRICTS) {
    if (dist.toLowerCase() === trimmed.toLowerCase()) return dist;
  }
  return trimmed;
}

export function matchDistrict(dist1, dist2) {
  if (!dist1 || !dist2) return false;
  const n1 = normalizeDistrictName(dist1).toLowerCase();
  const n2 = normalizeDistrictName(dist2).toLowerCase();
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

export const MAHARASHTRA_CENTER = { lat: 19.35, lng: 76.5 };
export const MAHARASHTRA_DEFAULT_ZOOM = 6;

