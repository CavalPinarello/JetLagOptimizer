/**
 * Comprehensive City/Timezone Database
 *
 * Contains major cities with their IANA timezone and standard UTC offset.
 * Organized by region for easier browsing.
 */

export interface CityTimezone {
  city: string;
  country: string;
  timezone: string;
  offset: number;  // Standard UTC offset in hours (not accounting for DST)
  airport?: string; // Primary airport IATA code
}

// North America
const NORTH_AMERICA: CityTimezone[] = [
  { city: 'New York', country: 'USA', timezone: 'America/New_York', offset: -5, airport: 'JFK' },
  { city: 'Los Angeles', country: 'USA', timezone: 'America/Los_Angeles', offset: -8, airport: 'LAX' },
  { city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles', offset: -8, airport: 'SFO' },
  { city: 'Chicago', country: 'USA', timezone: 'America/Chicago', offset: -6, airport: 'ORD' },
  { city: 'Miami', country: 'USA', timezone: 'America/New_York', offset: -5, airport: 'MIA' },
  { city: 'Boston', country: 'USA', timezone: 'America/New_York', offset: -5, airport: 'BOS' },
  { city: 'Seattle', country: 'USA', timezone: 'America/Los_Angeles', offset: -8, airport: 'SEA' },
  { city: 'Denver', country: 'USA', timezone: 'America/Denver', offset: -7, airport: 'DEN' },
  { city: 'Phoenix', country: 'USA', timezone: 'America/Phoenix', offset: -7, airport: 'PHX' },
  { city: 'Dallas', country: 'USA', timezone: 'America/Chicago', offset: -6, airport: 'DFW' },
  { city: 'Houston', country: 'USA', timezone: 'America/Chicago', offset: -6, airport: 'IAH' },
  { city: 'Atlanta', country: 'USA', timezone: 'America/New_York', offset: -5, airport: 'ATL' },
  { city: 'Washington DC', country: 'USA', timezone: 'America/New_York', offset: -5, airport: 'IAD' },
  { city: 'Las Vegas', country: 'USA', timezone: 'America/Los_Angeles', offset: -8, airport: 'LAS' },
  { city: 'Honolulu', country: 'USA', timezone: 'Pacific/Honolulu', offset: -10, airport: 'HNL' },
  { city: 'Anchorage', country: 'USA', timezone: 'America/Anchorage', offset: -9, airport: 'ANC' },
  { city: 'Toronto', country: 'Canada', timezone: 'America/Toronto', offset: -5, airport: 'YYZ' },
  { city: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver', offset: -8, airport: 'YVR' },
  { city: 'Montreal', country: 'Canada', timezone: 'America/Montreal', offset: -5, airport: 'YUL' },
  { city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City', offset: -6, airport: 'MEX' },
  { city: 'Cancun', country: 'Mexico', timezone: 'America/Cancun', offset: -5, airport: 'CUN' },
];

// Europe
const EUROPE: CityTimezone[] = [
  { city: 'London', country: 'UK', timezone: 'Europe/London', offset: 0, airport: 'LHR' },
  { city: 'Paris', country: 'France', timezone: 'Europe/Paris', offset: 1, airport: 'CDG' },
  { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', offset: 1, airport: 'BER' },
  { city: 'Frankfurt', country: 'Germany', timezone: 'Europe/Berlin', offset: 1, airport: 'FRA' },
  { city: 'Munich', country: 'Germany', timezone: 'Europe/Berlin', offset: 1, airport: 'MUC' },
  { city: 'Amsterdam', country: 'Netherlands', timezone: 'Europe/Amsterdam', offset: 1, airport: 'AMS' },
  { city: 'Rome', country: 'Italy', timezone: 'Europe/Rome', offset: 1, airport: 'FCO' },
  { city: 'Milan', country: 'Italy', timezone: 'Europe/Rome', offset: 1, airport: 'MXP' },
  { city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid', offset: 1, airport: 'MAD' },
  { city: 'Barcelona', country: 'Spain', timezone: 'Europe/Madrid', offset: 1, airport: 'BCN' },
  { city: 'Lisbon', country: 'Portugal', timezone: 'Europe/Lisbon', offset: 0, airport: 'LIS' },
  { city: 'Vienna', country: 'Austria', timezone: 'Europe/Vienna', offset: 1, airport: 'VIE' },
  { city: 'Zurich', country: 'Switzerland', timezone: 'Europe/Zurich', offset: 1, airport: 'ZRH' },
  { city: 'Geneva', country: 'Switzerland', timezone: 'Europe/Zurich', offset: 1, airport: 'GVA' },
  { city: 'Brussels', country: 'Belgium', timezone: 'Europe/Brussels', offset: 1, airport: 'BRU' },
  { city: 'Copenhagen', country: 'Denmark', timezone: 'Europe/Copenhagen', offset: 1, airport: 'CPH' },
  { city: 'Stockholm', country: 'Sweden', timezone: 'Europe/Stockholm', offset: 1, airport: 'ARN' },
  { city: 'Oslo', country: 'Norway', timezone: 'Europe/Oslo', offset: 1, airport: 'OSL' },
  { city: 'Helsinki', country: 'Finland', timezone: 'Europe/Helsinki', offset: 2, airport: 'HEL' },
  { city: 'Warsaw', country: 'Poland', timezone: 'Europe/Warsaw', offset: 1, airport: 'WAW' },
  { city: 'Prague', country: 'Czech Republic', timezone: 'Europe/Prague', offset: 1, airport: 'PRG' },
  { city: 'Budapest', country: 'Hungary', timezone: 'Europe/Budapest', offset: 1, airport: 'BUD' },
  { city: 'Athens', country: 'Greece', timezone: 'Europe/Athens', offset: 2, airport: 'ATH' },
  { city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul', offset: 3, airport: 'IST' },
  { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow', offset: 3, airport: 'SVO' },
  { city: 'Dublin', country: 'Ireland', timezone: 'Europe/Dublin', offset: 0, airport: 'DUB' },
  { city: 'Edinburgh', country: 'UK', timezone: 'Europe/London', offset: 0, airport: 'EDI' },
  { city: 'Manchester', country: 'UK', timezone: 'Europe/London', offset: 0, airport: 'MAN' },
];

// Asia
const ASIA: CityTimezone[] = [
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', offset: 9, airport: 'NRT' },
  { city: 'Osaka', country: 'Japan', timezone: 'Asia/Tokyo', offset: 9, airport: 'KIX' },
  { city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul', offset: 9, airport: 'ICN' },
  { city: 'Beijing', country: 'China', timezone: 'Asia/Shanghai', offset: 8, airport: 'PEK' },
  { city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai', offset: 8, airport: 'PVG' },
  { city: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong', offset: 8, airport: 'HKG' },
  { city: 'Taipei', country: 'Taiwan', timezone: 'Asia/Taipei', offset: 8, airport: 'TPE' },
  { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', offset: 8, airport: 'SIN' },
  { city: 'Bangkok', country: 'Thailand', timezone: 'Asia/Bangkok', offset: 7, airport: 'BKK' },
  { city: 'Kuala Lumpur', country: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', offset: 8, airport: 'KUL' },
  { city: 'Jakarta', country: 'Indonesia', timezone: 'Asia/Jakarta', offset: 7, airport: 'CGK' },
  { city: 'Bali', country: 'Indonesia', timezone: 'Asia/Makassar', offset: 8, airport: 'DPS' },
  { city: 'Manila', country: 'Philippines', timezone: 'Asia/Manila', offset: 8, airport: 'MNL' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', offset: 7, airport: 'SGN' },
  { city: 'Hanoi', country: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', offset: 7, airport: 'HAN' },
  { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', offset: 5.5, airport: 'BOM' },
  { city: 'Delhi', country: 'India', timezone: 'Asia/Kolkata', offset: 5.5, airport: 'DEL' },
  { city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata', offset: 5.5, airport: 'BLR' },
  { city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', offset: 4, airport: 'DXB' },
  { city: 'Abu Dhabi', country: 'UAE', timezone: 'Asia/Dubai', offset: 4, airport: 'AUH' },
  { city: 'Doha', country: 'Qatar', timezone: 'Asia/Qatar', offset: 3, airport: 'DOH' },
  { city: 'Tel Aviv', country: 'Israel', timezone: 'Asia/Jerusalem', offset: 2, airport: 'TLV' },
  { city: 'Riyadh', country: 'Saudi Arabia', timezone: 'Asia/Riyadh', offset: 3, airport: 'RUH' },
];

// Oceania
const OCEANIA: CityTimezone[] = [
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', offset: 10, airport: 'SYD' },
  { city: 'Melbourne', country: 'Australia', timezone: 'Australia/Melbourne', offset: 10, airport: 'MEL' },
  { city: 'Brisbane', country: 'Australia', timezone: 'Australia/Brisbane', offset: 10, airport: 'BNE' },
  { city: 'Perth', country: 'Australia', timezone: 'Australia/Perth', offset: 8, airport: 'PER' },
  { city: 'Auckland', country: 'New Zealand', timezone: 'Pacific/Auckland', offset: 12, airport: 'AKL' },
  { city: 'Wellington', country: 'New Zealand', timezone: 'Pacific/Auckland', offset: 12, airport: 'WLG' },
  { city: 'Fiji', country: 'Fiji', timezone: 'Pacific/Fiji', offset: 12, airport: 'NAN' },
];

// South America
const SOUTH_AMERICA: CityTimezone[] = [
  { city: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo', offset: -3, airport: 'GRU' },
  { city: 'Rio de Janeiro', country: 'Brazil', timezone: 'America/Sao_Paulo', offset: -3, airport: 'GIG' },
  { city: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', offset: -3, airport: 'EZE' },
  { city: 'Lima', country: 'Peru', timezone: 'America/Lima', offset: -5, airport: 'LIM' },
  { city: 'Bogotá', country: 'Colombia', timezone: 'America/Bogota', offset: -5, airport: 'BOG' },
  { city: 'Santiago', country: 'Chile', timezone: 'America/Santiago', offset: -4, airport: 'SCL' },
  { city: 'Caracas', country: 'Venezuela', timezone: 'America/Caracas', offset: -4, airport: 'CCS' },
];

// Africa
const AFRICA: CityTimezone[] = [
  { city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo', offset: 2, airport: 'CAI' },
  { city: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg', offset: 2, airport: 'JNB' },
  { city: 'Cape Town', country: 'South Africa', timezone: 'Africa/Johannesburg', offset: 2, airport: 'CPT' },
  { city: 'Nairobi', country: 'Kenya', timezone: 'Africa/Nairobi', offset: 3, airport: 'NBO' },
  { city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos', offset: 1, airport: 'LOS' },
  { city: 'Casablanca', country: 'Morocco', timezone: 'Africa/Casablanca', offset: 1, airport: 'CMN' },
  { city: 'Marrakech', country: 'Morocco', timezone: 'Africa/Casablanca', offset: 1, airport: 'RAK' },
];

// Combined list of all cities
export const ALL_CITIES: CityTimezone[] = [
  ...NORTH_AMERICA,
  ...EUROPE,
  ...ASIA,
  ...OCEANIA,
  ...SOUTH_AMERICA,
  ...AFRICA,
].sort((a, b) => a.city.localeCompare(b.city));

// Popular cities for quick selection
export const POPULAR_CITIES: CityTimezone[] = [
  { city: 'New York', country: 'USA', timezone: 'America/New_York', offset: -5, airport: 'JFK' },
  { city: 'Los Angeles', country: 'USA', timezone: 'America/Los_Angeles', offset: -8, airport: 'LAX' },
  { city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles', offset: -8, airport: 'SFO' },
  { city: 'London', country: 'UK', timezone: 'Europe/London', offset: 0, airport: 'LHR' },
  { city: 'Paris', country: 'France', timezone: 'Europe/Paris', offset: 1, airport: 'CDG' },
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', offset: 9, airport: 'NRT' },
  { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore', offset: 8, airport: 'SIN' },
  { city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', offset: 4, airport: 'DXB' },
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', offset: 10, airport: 'SYD' },
  { city: 'Hong Kong', country: 'Hong Kong', timezone: 'Asia/Hong_Kong', offset: 8, airport: 'HKG' },
];

/**
 * Search cities by name (case-insensitive, partial match)
 */
export function searchCities(query: string): CityTimezone[] {
  if (!query || query.length < 2) return POPULAR_CITIES;

  const lowerQuery = query.toLowerCase();
  return ALL_CITIES.filter(
    (city) =>
      city.city.toLowerCase().includes(lowerQuery) ||
      city.country.toLowerCase().includes(lowerQuery) ||
      (city.airport && city.airport.toLowerCase().includes(lowerQuery))
  ).slice(0, 20);
}

/**
 * Find a city by exact name
 */
export function findCity(cityName: string): CityTimezone | undefined {
  return ALL_CITIES.find(
    (c) => c.city.toLowerCase() === cityName.toLowerCase()
  );
}

/**
 * Get formatted UTC offset string
 */
export function formatOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  if (offset % 1 === 0) {
    return `UTC${sign}${offset}`;
  }
  const hours = Math.floor(Math.abs(offset));
  const minutes = (Math.abs(offset) % 1) * 60;
  const signStr = offset >= 0 ? '+' : '-';
  return `UTC${signStr}${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate timezone shift between two cities
 */
export function calculateShift(origin: CityTimezone, destination: CityTimezone): number {
  return destination.offset - origin.offset;
}
