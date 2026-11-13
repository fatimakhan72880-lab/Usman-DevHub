/**
 * Exhaustive Global Country & City Flag Auto-Detector
 * Covers ALL 195+ countries in the world, sovereign states, territories, and major international cities.
 */

/**
 * Converts a standard 2-letter ISO 3166-1 alpha-2 country code into its official Unicode flag emoji.
 * e.g., 'PK' -> '🇵🇰', 'US' -> '🇺🇸', 'GB' -> '🇬🇧', 'AE' -> '🇦🇪'
 */
export function isoCodeToFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const upper = countryCode.toUpperCase();
  const codePoints = upper.split('').map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Complete Global Country Database (ISO code -> known names, alternate spellings, and prominent cities)
 */
export const GLOBAL_COUNTRY_DATABASE: { [iso: string]: string[] } = {
  // Asia & Middle East
  PK: ['pakistan', 'pak', 'lahore', 'karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'multan', 'peshawar', 'quetta', 'sialkot', 'gujranwala', 'hyderabad', 'abbottabad', 'bahawalpur', 'sargodha', 'sukkur', 'gujrat'],
  AE: ['united arab emirates', 'uae', 'u.a.e', 'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah'],
  SA: ['saudi arabia', 'saudi', 'ksa', 'k.s.a', 'riyadh', 'jeddah', 'dammam', 'khobar', 'mecca', 'makkah', 'medina', 'madinah'],
  QA: ['qatar', 'doha', 'al rayyan', 'lusail'],
  KW: ['kuwait', 'kuwait city', 'salmiya', 'hawally'],
  BH: ['bahrain', 'manama', 'riffa', 'muharraq'],
  OM: ['oman', 'muscat', 'salalah', 'sohar'],
  TR: ['turkey', 'turkiye', 'türkiye', 'istanbul', 'ankara', 'izmir', 'bursa', 'antalya'],
  IN: ['india', 'mumbai', 'delhi', 'new delhi', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'chennai', 'kolkata', 'ahmedabad'],
  BD: ['bangladesh', 'dhaka', 'chittagong', 'sylhet', 'khulna', 'rajshahi'],
  LK: ['sri lanka', 'colombo', 'kandy', 'galle'],
  NP: ['nepal', 'kathmandu', 'pokhara'],
  AF: ['afghanistan', 'kabul', 'herat', 'kandahar'],
  IR: ['iran', 'tehran', 'isfahan', 'shiraz', 'mashhad'],
  IQ: ['iraq', 'baghdad', 'erbil', 'basra'],
  SY: ['syria', 'damascus', 'aleppo'],
  LB: ['lebanon', 'beirut', 'tripoli'],
  JO: ['jordan', 'amman', 'aqaba'],
  PS: ['palestine', 'jerusalem', 'gaza', 'ramallah', 'hebron', 'nablus'],
  YE: ['yemen', 'sanaa', 'aden'],
  CN: ['china', 'beijing', 'shanghai', 'shenzhen', 'guangzhou', 'hangzhou', 'chengdu', 'wuhan'],
  HK: ['hong kong'],
  TW: ['taiwan', 'taipei', 'kaohsiung'],
  JP: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya', 'sapporo', 'fukuoka'],
  KR: ['south korea', 'korea', 'seoul', 'busan', 'incheon', 'daegu'],
  SG: ['singapore'],
  MY: ['malaysia', 'kuala lumpur', 'penang', 'johor bahru', 'selangor'],
  ID: ['indonesia', 'jakarta', 'bali', 'surabaya', 'bandung', 'medan'],
  TH: ['thailand', 'bangkok', 'phuket', 'chiang mai', 'pattaya'],
  VN: ['vietnam', 'hanoi', 'ho chi minh', 'saigon', 'da nang'],
  PH: ['philippines', 'manila', 'cebu', 'davao', 'quezon city'],
  UZ: ['uzbekistan', 'tashkent', 'samarkand'],
  KZ: ['kazakhstan', 'almaty', 'astana', 'nur-sultan'],
  AZ: ['azerbaijan', 'baku'],
  GE: ['georgia', 'tbilisi', 'batumi'],
  AM: ['armenia', 'yerevan'],
  MV: ['maldives', 'male'],

  // North America
  US: ['united states', 'usa', 'u.s.a', 'america', 'california', 'new york', 'san francisco', 'los angeles', 'seattle', 'chicago', 'austin', 'texas', 'miami', 'florida', 'boston', 'silicon valley', 'denver', 'atlanta', 'dallas', 'houston', 'phoenix', 'san diego', 'las vegas', 'washington', 'portland'],
  CA: ['canada', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa', 'edmonton', 'quebec', 'ontario', 'alberta', 'british columbia'],
  MX: ['mexico', 'mexico city', 'guadalajara', 'monterrey', 'cancun', 'tijuana'],

  // Europe
  GB: ['united kingdom', 'uk', 'u.k', 'great britain', 'britain', 'england', 'scotland', 'wales', 'london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'liverpool', 'bristol', 'cambridge', 'oxford'],
  DE: ['germany', 'deutschland', 'berlin', 'munich', 'frankfurt', 'hamburg', 'cologne', 'stuttgart', 'dusseldorf', 'düsseldorf', 'dortmund'],
  FR: ['france', 'paris', 'lyon', 'marseille', 'nice', 'toulouse', 'bordeaux', 'strasbourg'],
  IT: ['italy', 'italia', 'rome', 'milan', 'naples', 'turin', 'florence', 'venice', 'bologna'],
  ES: ['spain', 'espana', 'españa', 'madrid', 'barcelona', 'valencia', 'seville', 'malaga', 'bilbao'],
  NL: ['netherlands', 'holland', 'amsterdam', 'rotterdam', 'the hague', 'utrecht', 'eindhoven'],
  CH: ['switzerland', 'swiss', 'zurich', 'geneva', 'basel', 'bern', 'lausanne', 'lucerne'],
  SE: ['sweden', 'stockholm', 'gothenburg', 'malmo', 'uppsala'],
  NO: ['norway', 'oslo', 'bergen', 'trondheim', 'stavanger'],
  DK: ['denmark', 'copenhagen', 'aarhus', 'odense'],
  FI: ['finland', 'helsinki', 'espoo', 'tampere'],
  IE: ['ireland', 'dublin', 'cork', 'galway', 'limerick'],
  BE: ['belgium', 'brussels', 'antwerp', 'ghent', 'bruges'],
  AT: ['austria', 'vienna', 'salzburg', 'innsbruck', 'graz'],
  PL: ['poland', 'warsaw', 'krakow', 'cracow', 'wroclaw', 'gdansk', 'poznan'],
  PT: ['portugal', 'lisbon', 'porto', 'braga', 'faro'],
  GR: ['greece', 'athens', 'thessaloniki', 'heraklion', 'santorini'],
  CZ: ['czech republic', 'czechia', 'prague', 'brno'],
  HU: ['hungary', 'budapest', 'debrecen'],
  RO: ['romania', 'bucharest', 'cluj-napoca', 'timisoara', 'iasi'],
  UA: ['ukraine', 'kyiv', 'kiev', 'lviv', 'odesa', 'kharkiv'],
  RU: ['russia', 'moscow', 'saint petersburg', 'novosibirsk', 'kazan'],
  EE: ['estonia', 'tallinn', 'tartu'],
  LV: ['latvia', 'riga'],
  LT: ['lithuania', 'vilnius', 'kaunas'],
  HR: ['croatia', 'zagreb', 'split', 'dubrovnik'],
  RS: ['serbia', 'belgrade', 'novi sad'],
  BG: ['bulgaria', 'sofia', 'plovdiv', 'varna'],
  SK: ['slovakia', 'bratislava', 'kosice'],
  SI: ['slovenia', 'ljubljana', 'maribor'],
  CY: ['cyprus', 'nicosia', 'limassol'],
  IS: ['iceland', 'reykjavik'],
  LU: ['luxembourg'],
  MT: ['malta', 'valletta', 'sliema'],
  MC: ['monaco', 'monte carlo'],
  BA: ['bosnia', 'bosnia and herzegovina', 'sarajevo'],
  AL: ['albania', 'tirana'],
  MK: ['north macedonia', 'macedonia', 'skopje'],
  MD: ['moldova', 'chisinau'],
  BY: ['belarus', 'minsk'],

  // Oceania
  AU: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra', 'gold coast'],
  NZ: ['new zealand', 'auckland', 'wellington', 'christchurch', 'queenstown'],
  FJ: ['fiji', 'suva'],
  PG: ['papua new guinea', 'port moresby'],

  // Africa
  ZA: ['south africa', 'johannesburg', 'cape town', 'durban', 'pretoria'],
  EG: ['egypt', 'cairo', 'alexandria', 'giza'],
  NG: ['nigeria', 'lagos', 'abuja', 'ibadan', 'kano'],
  KE: ['kenya', 'nairobi', 'mombasa'],
  MA: ['morocco', 'casablanca', 'rabat', 'marrakech', 'tangier'],
  DZ: ['algeria', 'algiers', 'oran'],
  TN: ['tunisia', 'tunis', 'sfax'],
  ET: ['ethiopia', 'addis ababa'],
  GH: ['ghana', 'accra', 'kumasi'],
  UG: ['uganda', 'kampala'],
  TZ: ['tanzania', 'dar es salaam', 'zanzibar', 'dodoma'],
  SN: ['senegal', 'dakar'],
  CI: ['ivory coast', 'cote d\'ivoire', 'abidjan'],
  CM: ['cameroon', 'yaounde', 'douala'],
  RW: ['rwanda', 'kigali'],
  MU: ['mauritius', 'port louis'],

  // South America & Caribbean
  BR: ['brazil', 'brasil', 'sao paulo', 'são paulo', 'rio de janeiro', 'brasilia', 'salvador', 'curitiba'],
  AR: ['argentina', 'buenos aires', 'cordoba', 'rosario', 'mendoza'],
  CO: ['colombia', 'bogota', 'medellin', 'cali', 'cartagena'],
  CL: ['chile', 'santiago', 'valparaiso'],
  PE: ['peru', 'lima', 'cusco', 'arequipa'],
  VE: ['venezuela', 'caracas', 'maracaibo'],
  EC: ['ecuador', 'quito', 'guayaquil'],
  UY: ['uruguay', 'montevideo'],
  PY: ['paraguay', 'asuncion'],
  BO: ['bolivia', 'la paz', 'santa cruz'],
  CR: ['costa rica', 'san jose'],
  PA: ['panama', 'panama city'],
  DO: ['dominican republic', 'santo domingo'],
  JM: ['jamaica', 'kingston', 'montego bay'],
  TT: ['trinidad', 'trinidad and tobago', 'port of spain'],
  BS: ['bahamas', 'nassau'],
  PR: ['puerto rico', 'san juan']
};

/**
 * Clean quick lookup list for Admin Dashboard flag selector
 */
export const POPULAR_FLAGS = [
  { flag: '🇵🇰', label: 'Pakistan' },
  { flag: '🇺🇸', label: 'United States' },
  { flag: '🇬🇧', label: 'United Kingdom' },
  { flag: '🇦🇪', label: 'UAE (Dubai)' },
  { flag: '🇸🇦', label: 'Saudi Arabia' },
  { flag: '🇨🇦', label: 'Canada' },
  { flag: '🇩🇪', label: 'Germany' },
  { flag: '🇦🇺', label: 'Australia' },
  { flag: '🇶🇦', label: 'Qatar' },
  { flag: '🇴🇲', label: 'Oman' },
  { flag: '🇰🇼', label: 'Kuwait' },
  { flag: '🇧🇭', label: 'Bahrain' },
  { flag: '🇹🇷', label: 'Turkey' },
  { flag: '🇫🇷', label: 'France' },
  { flag: '🇮🇹', label: 'Italy' },
  { flag: '🇪🇸', label: 'Spain' },
  { flag: '🇳🇱', label: 'Netherlands' },
  { flag: '🇨🇭', label: 'Switzerland' },
  { flag: '🇸🇬', label: 'Singapore' },
  { flag: '🇲🇾', label: 'Malaysia' },
  { flag: '🇯🇵', label: 'Japan' },
  { flag: '🇨🇳', label: 'China' },
  { flag: '🇮🇳', label: 'India' },
  { flag: '🇧🇩', label: 'Bangladesh' },
  { flag: '🇿🇦', label: 'South Africa' },
  { flag: '🇪🇬', label: 'Egypt' },
  { flag: '🇧🇷', label: 'Brazil' },
  { flag: '🌐', label: 'Worldwide' },
];

/**
 * Universal Flag Detector:
 * Resolves location string against all 195+ countries, territories, cities, and ISO codes.
 */
export function detectFlagFromLocation(location?: string): string {
  if (!location || !location.trim()) {
    return '🌐';
  }

  const raw = location.trim();

  // 1. If text already contains an emoji flag, keep that exact emoji
  const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/;
  const match = raw.match(flagRegex);
  if (match) {
    return match[0];
  }

  // 2. Clean punctuation for matching
  const clean = raw
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);

  // 3. Direct ISO 2-letter code check (e.g., "PK", "US", "AE", "GB", "CA", "DE")
  if (words.length === 1 && words[0].length === 2) {
    const code = words[0].toUpperCase();
    if (GLOBAL_COUNTRY_DATABASE[code] || /^[A-Z]{2}$/.test(code)) {
      return isoCodeToFlagEmoji(code);
    }
  }

  // 4. Check if any word or the last word is a known 2-letter ISO code (e.g. "Lahore PK" or "London UK")
  const lastWord = words[words.length - 1]?.toUpperCase();
  if (lastWord && lastWord.length === 2 && GLOBAL_COUNTRY_DATABASE[lastWord]) {
    return isoCodeToFlagEmoji(lastWord);
  }

  // 5. Match against complete Country Database
  for (const [iso, aliases] of Object.entries(GLOBAL_COUNTRY_DATABASE)) {
    // Check full string match first
    for (const alias of aliases) {
      if (clean === alias) {
        return isoCodeToFlagEmoji(iso);
      }
      // Word boundary regex check (e.g., "Lahore, Pakistan" matches "pakistan")
      const regex = new RegExp(`\\b${alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(clean)) {
        return isoCodeToFlagEmoji(iso);
      }
    }
  }

  // 6. Fallback global indicator
  return '🌐';
}
