/**
 * Purchasing Power of Wealth Index — PROTOTYPE DATA ENGINE
 *
 * DATA_SOURCE: illustrative calibrated estimates for dev/prototype only.
 * Conceptually aligned with World Bank ICP household-consumption PPP,
 * OECD/Eurostat price-level indices, and IMF WEO recency patterns — NOT live downloads.
 *
 * Production path:
 *   1. World Bank ICP API (PA.NUS.PRVT.PP.KD) for country baselines
 *   2. OECD SDMX PLI series (COICOP categories) where available
 *   3. IMF WEO inflation carry-forward for post-ICP years
 *   4. City layer from Eurostat/OECD metro PLI supplements or rent indices
 *   5. GWR percentile tables for local/national/global wealth position
 */
/* global PPW_DATA, PPW_ENGINE */
const PPW_DATA = {
  meta: {
    version: "2026-09-17-v2",
    prototype: true,
    baseline: "USA household consumption PLI = 100",
    countryCount: 44,
    cityCount: 41,
    sourcesNote:
      "Illustrative blend: World Bank ICP 2021 household consumption PPP (conceptual), OECD PLI COICOP patterns, IMF WEO inflation carry-forward. City layer = local rent/cost deltas, not official metro ICP.",
  },

  categories: [
    "housing",
    "food",
    "transport",
    "health",
    "recreation",
    "education",
    "general",
  ],

  categoryLabels: {
    housing: "Housing",
    food: "Food",
    transport: "Transport",
    health: "Healthcare",
    recreation: "Recreation",
    education: "Education",
    general: "General consumption",
  },

  // Default home monthly spend by lifestyle (USD, illustrative household budgets)
  homeMonthlySpend: {
    retiree: 4200,
    family: 6800,
    single: 5200,
  },

  lifestyleProfiles: {
    retiree: {
      label: "Retiree",
      weights: {
        housing: 0.28,
        food: 0.16,
        transport: 0.08,
        health: 0.22,
        recreation: 0.12,
        education: 0.02,
        general: 0.12,
      },
    },
    family: {
      label: "Family",
      weights: {
        housing: 0.32,
        food: 0.18,
        transport: 0.12,
        health: 0.1,
        recreation: 0.08,
        education: 0.12,
        general: 0.08,
      },
    },
    single: {
      label: "Single professional",
      weights: {
        housing: 0.22,
        food: 0.14,
        transport: 0.14,
        health: 0.08,
        recreation: 0.18,
        education: 0.04,
        general: 0.2,
      },
    },
  },

  householdSizeFactors: {
    1: { housing: 0.85, food: 0.7, general: 0.9 },
    2: { housing: 1.0, food: 1.0, general: 1.0 },
    3: { housing: 1.12, food: 1.18, general: 1.08 },
    4: { housing: 1.22, food: 1.32, general: 1.14 },
    5: { housing: 1.28, food: 1.42, general: 1.18 },
  },

  regions: {
    americas: "Americas",
    europe: "Europe",
    "asia-pacific": "Asia-Pacific",
    "middle-east": "Middle East",
    africa: "Africa",
  },

  countries: {
    USA: { name: "United States", flag: "🇺🇸", region: "americas", pli: { housing: 108, food: 98, transport: 102, health: 145, recreation: 104, education: 112, general: 100 } },
    CAN: { name: "Canada", flag: "🇨🇦", region: "americas", pli: { housing: 102, food: 105, transport: 108, health: 95, recreation: 102, education: 92, general: 102 } },
    MEX: { name: "Mexico", flag: "🇲🇽", region: "americas", pli: { housing: 48, food: 72, transport: 55, health: 62, recreation: 58, education: 45, general: 58 } },
    BRA: { name: "Brazil", flag: "🇧🇷", region: "americas", pli: { housing: 42, food: 58, transport: 52, health: 55, recreation: 48, education: 40, general: 52 } },
    ARG: { name: "Argentina", flag: "🇦🇷", region: "americas", pli: { housing: 35, food: 42, transport: 38, health: 45, recreation: 40, education: 32, general: 38 } },
    CHL: { name: "Chile", flag: "🇨🇱", region: "americas", pli: { housing: 52, food: 68, transport: 62, health: 58, recreation: 55, education: 48, general: 58 } },
    COL: { name: "Colombia", flag: "🇨🇴", region: "americas", pli: { housing: 42, food: 55, transport: 48, health: 52, recreation: 45, education: 38, general: 48 } },
    GBR: { name: "United Kingdom", flag: "🇬🇧", region: "europe", pli: { housing: 118, food: 95, transport: 128, health: 92, recreation: 108, education: 98, general: 105 } },
    DEU: { name: "Germany", flag: "🇩🇪", region: "europe", pli: { housing: 92, food: 98, transport: 118, health: 88, recreation: 102, education: 72, general: 98 } },
    FRA: { name: "France", flag: "🇫🇷", region: "europe", pli: { housing: 88, food: 108, transport: 112, health: 82, recreation: 102, education: 72, general: 98 } },
    ESP: { name: "Spain", flag: "🇪🇸", region: "europe", pli: { housing: 72, food: 92, transport: 98, health: 78, recreation: 88, education: 74, general: 78 } },
    PRT: { name: "Portugal", flag: "🇵🇹", region: "europe", pli: { housing: 78, food: 88, transport: 95, health: 72, recreation: 82, education: 68, general: 72 } },
    ITA: { name: "Italy", flag: "🇮🇹", region: "europe", pli: { housing: 82, food: 102, transport: 108, health: 78, recreation: 95, education: 70, general: 88 } },
    NLD: { name: "Netherlands", flag: "🇳🇱", region: "europe", pli: { housing: 105, food: 98, transport: 115, health: 85, recreation: 102, education: 78, general: 102 } },
    CHE: { name: "Switzerland", flag: "🇨🇭", region: "europe", pli: { housing: 142, food: 128, transport: 135, health: 118, recreation: 125, education: 95, general: 128 } },
    SWE: { name: "Sweden", flag: "🇸🇪", region: "europe", pli: { housing: 95, food: 108, transport: 118, health: 82, recreation: 105, education: 72, general: 102 } },
    NOR: { name: "Norway", flag: "🇳🇴", region: "europe", pli: { housing: 118, food: 115, transport: 125, health: 88, recreation: 112, education: 78, general: 115 } },
    POL: { name: "Poland", flag: "🇵🇱", region: "europe", pli: { housing: 52, food: 68, transport: 72, health: 58, recreation: 62, education: 48, general: 58 } },
    CZE: { name: "Czech Republic", flag: "🇨🇿", region: "europe", pli: { housing: 58, food: 72, transport: 75, health: 62, recreation: 65, education: 52, general: 65 } },
    GRC: { name: "Greece", flag: "🇬🇷", region: "europe", pli: { housing: 62, food: 85, transport: 88, health: 68, recreation: 78, education: 58, general: 72 } },
    TUR: { name: "Turkey", flag: "🇹🇷", region: "europe", pli: { housing: 45, food: 55, transport: 52, health: 48, recreation: 42, education: 38, general: 48 } },
    JPN: { name: "Japan", flag: "🇯🇵", region: "asia-pacific", pli: { housing: 78, food: 108, transport: 112, health: 72, recreation: 98, education: 68, general: 92 } },
    KOR: { name: "South Korea", flag: "🇰🇷", region: "asia-pacific", pli: { housing: 88, food: 102, transport: 105, health: 78, recreation: 95, education: 82, general: 95 } },
    CHN: { name: "China", flag: "🇨🇳", region: "asia-pacific", pli: { housing: 55, food: 62, transport: 58, health: 65, recreation: 55, education: 52, general: 58 } },
    SGP: { name: "Singapore", flag: "🇸🇬", region: "asia-pacific", pli: { housing: 142, food: 88, transport: 95, health: 78, recreation: 92, education: 85, general: 98 } },
    THA: { name: "Thailand", flag: "🇹🇭", region: "asia-pacific", pli: { housing: 42, food: 55, transport: 48, health: 52, recreation: 45, education: 38, general: 48 } },
    MYS: { name: "Malaysia", flag: "🇲🇾", region: "asia-pacific", pli: { housing: 48, food: 58, transport: 52, health: 55, recreation: 50, education: 42, general: 55 } },
    VNM: { name: "Vietnam", flag: "🇻🇳", region: "asia-pacific", pli: { housing: 38, food: 48, transport: 42, health: 45, recreation: 40, education: 35, general: 42 } },
    IDN: { name: "Indonesia", flag: "🇮🇩", region: "asia-pacific", pli: { housing: 35, food: 45, transport: 40, health: 42, recreation: 38, education: 32, general: 40 } },
    PHL: { name: "Philippines", flag: "🇵🇭", region: "asia-pacific", pli: { housing: 38, food: 48, transport: 42, health: 45, recreation: 40, education: 35, general: 42 } },
    IND: { name: "India", flag: "🇮🇳", region: "asia-pacific", pli: { housing: 32, food: 38, transport: 35, health: 42, recreation: 30, education: 28, general: 35 } },
    AUS: { name: "Australia", flag: "🇦🇺", region: "asia-pacific", pli: { housing: 118, food: 102, transport: 108, health: 82, recreation: 105, education: 88, general: 108 } },
    NZL: { name: "New Zealand", flag: "🇳🇿", region: "asia-pacific", pli: { housing: 108, food: 105, transport: 102, health: 78, recreation: 100, education: 82, general: 102 } },
    ARE: { name: "United Arab Emirates", flag: "🇦🇪", region: "middle-east", pli: { housing: 95, food: 92, transport: 72, health: 88, recreation: 98, education: 78, general: 88 } },
    SAU: { name: "Saudi Arabia", flag: "🇸🇦", region: "middle-east", pli: { housing: 72, food: 78, transport: 65, health: 75, recreation: 82, education: 68, general: 75 } },
    ISR: { name: "Israel", flag: "🇮🇱", region: "middle-east", pli: { housing: 112, food: 105, transport: 108, health: 88, recreation: 98, education: 85, general: 105 } },
    ZAF: { name: "South Africa", flag: "🇿🇦", region: "africa", pli: { housing: 38, food: 52, transport: 48, health: 55, recreation: 42, education: 35, general: 45 } },
    EGY: { name: "Egypt", flag: "🇪🇬", region: "africa", pli: { housing: 28, food: 38, transport: 32, health: 35, recreation: 30, education: 25, general: 32 } },
    NGA: { name: "Nigeria", flag: "🇳🇬", region: "africa", pli: { housing: 32, food: 42, transport: 38, health: 40, recreation: 35, education: 28, general: 38 } },
    KEN: { name: "Kenya", flag: "🇰🇪", region: "africa", pli: { housing: 35, food: 45, transport: 40, health: 42, recreation: 38, education: 32, general: 40 } },
    RUS: { name: "Russia", flag: "🇷🇺", region: "europe", pli: { housing: 48, food: 55, transport: 52, health: 50, recreation: 45, education: 42, general: 50 } },
    UKR: { name: "Ukraine", flag: "🇺🇦", region: "europe", pli: { housing: 32, food: 42, transport: 38, health: 40, recreation: 35, education: 30, general: 38 } },
    HKG: { name: "Hong Kong", flag: "🇭🇰", region: "asia-pacific", pli: { housing: 155, food: 95, transport: 88, health: 82, recreation: 95, education: 92, general: 105 } },
    TWN: { name: "Taiwan", flag: "🇹🇼", region: "asia-pacific", pli: { housing: 82, food: 92, transport: 88, health: 72, recreation: 85, education: 75, general: 85 } },
  },

  cityDeltas: {
    "sf-usa": { housing: 1.42, food: 1.12, transport: 1.08, health: 1.15, recreation: 1.18, education: 1.1, general: 1.22 },
    "nyc-usa": { housing: 1.38, food: 1.1, transport: 1.05, health: 1.12, recreation: 1.15, education: 1.08, general: 1.2 },
    "austin-usa": { housing: 1.08, food: 1.02, transport: 1.0, health: 1.02, recreation: 1.05, education: 1.0, general: 1.03 },
    "miami-usa": { housing: 1.18, food: 1.05, transport: 1.02, health: 1.05, recreation: 1.08, education: 1.02, general: 1.08 },
    "chicago-usa": { housing: 1.05, food: 1.0, transport: 1.0, health: 1.0, recreation: 1.02, education: 1.0, general: 1.02 },
    "seattle-usa": { housing: 1.22, food: 1.08, transport: 1.02, health: 1.05, recreation: 1.1, education: 1.05, general: 1.1 },
    "vancouver-can": { housing: 1.32, food: 1.05, transport: 1.02, health: 1.0, recreation: 1.05, education: 1.02, general: 1.1 },
    "montreal-can": { housing: 0.92, food: 0.98, transport: 0.98, health: 0.95, recreation: 1.0, education: 0.95, general: 0.95 },
    "mexicocity-mex": { housing: 1.15, food: 1.02, transport: 1.0, health: 1.05, recreation: 1.05, education: 1.0, general: 1.05 },
    "saopaulo-bra": { housing: 1.18, food: 1.05, transport: 1.02, health: 1.08, recreation: 1.1, education: 1.05, general: 1.08 },
    "buenosaires-arg": { housing: 1.1, food: 0.95, transport: 0.92, health: 0.95, recreation: 0.98, education: 0.9, general: 0.95 },
    "london-gbr": { housing: 1.35, food: 1.08, transport: 1.12, health: 1.05, recreation: 1.12, education: 1.05, general: 1.15 },
    "manchester-gbr": { housing: 0.88, food: 0.95, transport: 0.95, health: 0.95, recreation: 0.95, education: 0.92, general: 0.92 },
    "berlin-deu": { housing: 0.92, food: 0.98, transport: 1.0, health: 0.98, recreation: 1.02, education: 0.95, general: 0.96 },
    "munich-deu": { housing: 1.15, food: 1.05, transport: 1.02, health: 1.0, recreation: 1.05, education: 1.02, general: 1.05 },
    "paris-fra": { housing: 1.22, food: 1.08, transport: 1.05, health: 1.0, recreation: 1.1, education: 1.02, general: 1.1 },
    "lisbon-prt": { housing: 1.05, food: 1.02, transport: 1.0, health: 0.98, recreation: 1.05, education: 0.98, general: 1.02 },
    "porto-prt": { housing: 0.88, food: 0.95, transport: 0.95, health: 0.95, recreation: 0.92, education: 0.92, general: 0.92 },
    "valencia-esp": { housing: 0.85, food: 0.98, transport: 0.95, health: 0.95, recreation: 0.95, education: 0.92, general: 0.9 },
    "barcelona-esp": { housing: 1.12, food: 1.05, transport: 1.02, health: 1.0, recreation: 1.08, education: 1.0, general: 1.05 },
    "rome-ita": { housing: 1.08, food: 1.02, transport: 1.0, health: 0.98, recreation: 1.05, education: 1.0, general: 1.02 },
    "amsterdam-nld": { housing: 1.18, food: 1.05, transport: 1.02, health: 1.0, recreation: 1.08, education: 1.02, general: 1.08 },
    "zurich-che": { housing: 1.25, food: 1.12, transport: 1.08, health: 1.05, recreation: 1.12, education: 1.05, general: 1.12 },
    "warsaw-pol": { housing: 1.05, food: 0.98, transport: 0.98, health: 0.95, recreation: 1.0, education: 0.95, general: 0.98 },
    "bangkok-tha": { housing: 1.15, food: 1.05, transport: 1.02, health: 1.08, recreation: 1.1, education: 1.05, general: 1.08 },
    "chiangmai-tha": { housing: 0.78, food: 0.92, transport: 0.88, health: 0.9, recreation: 0.85, education: 0.88, general: 0.82 },
    "kl-mys": { housing: 1.1, food: 1.02, transport: 1.0, health: 1.05, recreation: 1.05, education: 1.02, general: 1.05 },
    "mumbai-ind": { housing: 1.25, food: 1.08, transport: 1.05, health: 1.1, recreation: 1.12, education: 1.05, general: 1.12 },
    "singapore-sgp": { housing: 1.0, food: 1.0, transport: 1.0, health: 1.0, recreation: 1.0, education: 1.0, general: 1.0 },
    "tokyo-jpn": { housing: 1.18, food: 1.02, transport: 1.0, health: 0.98, recreation: 1.05, education: 1.0, general: 1.08 },
    "seoul-kor": { housing: 1.15, food: 1.05, transport: 1.02, health: 1.0, recreation: 1.08, education: 1.05, general: 1.08 },
    "hongkong-hkg": { housing: 1.0, food: 1.0, transport: 1.0, health: 1.0, recreation: 1.0, education: 1.0, general: 1.0 },
    "taipei-twn": { housing: 1.12, food: 1.02, transport: 1.0, health: 0.98, recreation: 1.05, education: 1.02, general: 1.05 },
    "sydney-aus": { housing: 1.28, food: 1.05, transport: 1.02, health: 1.0, recreation: 1.08, education: 1.02, general: 1.12 },
    "auckland-nzl": { housing: 1.15, food: 1.02, transport: 1.0, health: 0.98, recreation: 1.05, education: 1.0, general: 1.05 },
    "dubai-are": { housing: 1.12, food: 1.05, transport: 0.95, health: 1.02, recreation: 1.1, education: 1.0, general: 1.05 },
    "capetown-zaf": { housing: 1.08, food: 0.98, transport: 0.95, health: 0.98, recreation: 1.02, education: 0.95, general: 0.98 },
    "medellin-col": { housing: 0.92, food: 0.95, transport: 0.92, health: 0.9, recreation: 0.95, education: 0.88, general: 0.9 },
    "hanoi-vnm": { housing: 0.95, food: 0.98, transport: 0.95, health: 0.92, recreation: 0.92, education: 0.9, general: 0.92 },
    "bali-idn": { housing: 0.88, food: 0.95, transport: 0.92, health: 0.9, recreation: 0.92, education: 0.88, general: 0.9 },
    "manila-phl": { housing: 1.12, food: 1.02, transport: 1.0, health: 1.05, recreation: 1.05, education: 1.0, general: 1.05 },
  },

  locations: [
    { id: "sf-usa", label: "San Francisco, USA", country: "USA", cityDelta: "sf-usa", region: "americas" },
    { id: "nyc-usa", label: "New York, USA", country: "USA", cityDelta: "nyc-usa", region: "americas" },
    { id: "austin-usa", label: "Austin, USA", country: "USA", cityDelta: "austin-usa", region: "americas" },
    { id: "miami-usa", label: "Miami, USA", country: "USA", cityDelta: "miami-usa", region: "americas" },
    { id: "chicago-usa", label: "Chicago, USA", country: "USA", cityDelta: "chicago-usa", region: "americas" },
    { id: "seattle-usa", label: "Seattle, USA", country: "USA", cityDelta: "seattle-usa", region: "americas" },
    { id: "vancouver-can", label: "Vancouver, Canada", country: "CAN", cityDelta: "vancouver-can", region: "americas" },
    { id: "montreal-can", label: "Montreal, Canada", country: "CAN", cityDelta: "montreal-can", region: "americas" },
    { id: "mexicocity-mex", label: "Mexico City, Mexico", country: "MEX", cityDelta: "mexicocity-mex", region: "americas" },
    { id: "saopaulo-bra", label: "São Paulo, Brazil", country: "BRA", cityDelta: "saopaulo-bra", region: "americas" },
    { id: "buenosaires-arg", label: "Buenos Aires, Argentina", country: "ARG", cityDelta: "buenosaires-arg", region: "americas" },
    { id: "london-gbr", label: "London, UK", country: "GBR", cityDelta: "london-gbr", region: "europe" },
    { id: "manchester-gbr", label: "Manchester, UK", country: "GBR", cityDelta: "manchester-gbr", region: "europe" },
    { id: "berlin-deu", label: "Berlin, Germany", country: "DEU", cityDelta: "berlin-deu", region: "europe" },
    { id: "munich-deu", label: "Munich, Germany", country: "DEU", cityDelta: "munich-deu", region: "europe" },
    { id: "paris-fra", label: "Paris, France", country: "FRA", cityDelta: "paris-fra", region: "europe" },
    { id: "lisbon-prt", label: "Lisbon, Portugal", country: "PRT", cityDelta: "lisbon-prt", region: "europe" },
    { id: "porto-prt", label: "Porto, Portugal", country: "PRT", cityDelta: "porto-prt", region: "europe" },
    { id: "valencia-esp", label: "Valencia, Spain", country: "ESP", cityDelta: "valencia-esp", region: "europe" },
    { id: "barcelona-esp", label: "Barcelona, Spain", country: "ESP", cityDelta: "barcelona-esp", region: "europe" },
    { id: "rome-ita", label: "Rome, Italy", country: "ITA", cityDelta: "rome-ita", region: "europe" },
    { id: "amsterdam-nld", label: "Amsterdam, Netherlands", country: "NLD", cityDelta: "amsterdam-nld", region: "europe" },
    { id: "zurich-che", label: "Zurich, Switzerland", country: "CHE", cityDelta: "zurich-che", region: "europe" },
    { id: "warsaw-pol", label: "Warsaw, Poland", country: "POL", cityDelta: "warsaw-pol", region: "europe" },
    { id: "bangkok-tha", label: "Bangkok, Thailand", country: "THA", cityDelta: "bangkok-tha", region: "asia-pacific" },
    { id: "chiangmai-tha", label: "Chiang Mai, Thailand", country: "THA", cityDelta: "chiangmai-tha", region: "asia-pacific" },
    { id: "kl-mys", label: "Kuala Lumpur, Malaysia", country: "MYS", cityDelta: "kl-mys", region: "asia-pacific" },
    { id: "mumbai-ind", label: "Mumbai, India", country: "IND", cityDelta: "mumbai-ind", region: "asia-pacific" },
    { id: "singapore-sgp", label: "Singapore", country: "SGP", cityDelta: "singapore-sgp", region: "asia-pacific" },
    { id: "tokyo-jpn", label: "Tokyo, Japan", country: "JPN", cityDelta: "tokyo-jpn", region: "asia-pacific" },
    { id: "seoul-kor", label: "Seoul, South Korea", country: "KOR", cityDelta: "seoul-kor", region: "asia-pacific" },
    { id: "hongkong-hkg", label: "Hong Kong", country: "HKG", cityDelta: "hongkong-hkg", region: "asia-pacific" },
    { id: "taipei-twn", label: "Taipei, Taiwan", country: "TWN", cityDelta: "taipei-twn", region: "asia-pacific" },
    { id: "sydney-aus", label: "Sydney, Australia", country: "AUS", cityDelta: "sydney-aus", region: "asia-pacific" },
    { id: "auckland-nzl", label: "Auckland, New Zealand", country: "NZL", cityDelta: "auckland-nzl", region: "asia-pacific" },
    { id: "dubai-are", label: "Dubai, UAE", country: "ARE", cityDelta: "dubai-are", region: "middle-east" },
    { id: "capetown-zaf", label: "Cape Town, South Africa", country: "ZAF", cityDelta: "capetown-zaf", region: "africa" },
    { id: "medellin-col", label: "Medellín, Colombia", country: "COL", cityDelta: "medellin-col", region: "americas" },
    { id: "hanoi-vnm", label: "Hanoi, Vietnam", country: "VNM", cityDelta: "hanoi-vnm", region: "asia-pacific" },
    { id: "bali-idn", label: "Bali, Indonesia", country: "IDN", cityDelta: "bali-idn", region: "asia-pacific" },
    { id: "manila-phl", label: "Manila, Philippines", country: "PHL", cityDelta: "manila-phl", region: "asia-pacific" },
  ],

  // Illustrative wealth percentile stubs — replace with GWR tables
  wealthPercentileStubs: {
    global: [
      { min: 0, max: 10000, percentile: 15, topPct: 85, label: "bottom quartile globally" },
      { min: 10000, max: 50000, percentile: 35, topPct: 65, label: "below global median" },
      { min: 50000, max: 100000, percentile: 52, topPct: 48, label: "near global median" },
      { min: 100000, max: 250000, percentile: 68, topPct: 32, label: "upper-middle globally" },
      { min: 250000, max: 500000, percentile: 82, topPct: 18, label: "top quintile globally" },
      { min: 500000, max: 1000000, percentile: 91, topPct: 9, label: "top decile globally" },
      { min: 1000000, max: 5000000, percentile: 97, topPct: 3, label: "ultra-high globally" },
      { min: 5000000, max: Infinity, percentile: 99.5, topPct: 0.5, label: "peak global tail" },
    ],
    national: {
      USA: [
        { min: 0, max: 25000, percentile: 22, topPct: 78 },
        { min: 25000, max: 75000, percentile: 42, topPct: 58 },
        { min: 75000, max: 150000, percentile: 58, topPct: 42 },
        { min: 150000, max: 350000, percentile: 72, topPct: 28 },
        { min: 350000, max: 750000, percentile: 85, topPct: 15 },
        { min: 750000, max: 2000000, percentile: 93, topPct: 7 },
        { min: 2000000, max: Infinity, percentile: 98, topPct: 2 },
      ],
      default: [
        { min: 0, max: 15000, percentile: 25, topPct: 75 },
        { min: 15000, max: 50000, percentile: 45, topPct: 55 },
        { min: 50000, max: 120000, percentile: 60, topPct: 40 },
        { min: 120000, max: 300000, percentile: 75, topPct: 25 },
        { min: 300000, max: 750000, percentile: 88, topPct: 12 },
        { min: 750000, max: Infinity, percentile: 96, topPct: 4 },
      ],
    },
    local: {
      "sf-usa": [
        { min: 0, max: 50000, percentile: 18, topPct: 82 },
        { min: 50000, max: 150000, percentile: 35, topPct: 65 },
        { min: 150000, max: 400000, percentile: 52, topPct: 48 },
        { min: 400000, max: 800000, percentile: 68, topPct: 32 },
        { min: 800000, max: 2000000, percentile: 82, topPct: 18 },
        { min: 2000000, max: Infinity, percentile: 94, topPct: 6 },
      ],
      default: [
        { min: 0, max: 30000, percentile: 20, topPct: 80 },
        { min: 30000, max: 100000, percentile: 40, topPct: 60 },
        { min: 100000, max: 300000, percentile: 58, topPct: 42 },
        { min: 300000, max: 750000, percentile: 75, topPct: 25 },
        { min: 750000, max: Infinity, percentile: 90, topPct: 10 },
      ],
    },
  },

  // Prototype safe withdrawal / runway assumptions
  retirementModel: {
    safeWithdrawalRate: 0.035,
    inflationBuffer: 1.05,
    minRunwayYears: 25,
  },
};

const PPW_ENGINE = (function createEngine(data) {
  const CATS = data.categories;

  function formatMoney(x, opts) {
    const o = opts || {};
    if (!isFinite(x)) return "—";
    const abs = Math.abs(x);
    if (o.compact && abs >= 1e6) {
      return "$" + (x / 1e6).toFixed(abs >= 1e7 ? 1 : 2) + "M";
    }
    if (o.compact && abs >= 1e3) {
      return "$" + (x / 1e3).toFixed(abs >= 1e5 ? 0 : 1) + "K";
    }
    return x.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: o.decimals != null ? o.decimals : 0,
    });
  }

  function getLocation(locationId) {
    return data.locations.find((l) => l.id === locationId) || null;
  }

  function getLocationPli(locationId) {
    const loc = getLocation(locationId);
    if (!loc) return null;
    const country = data.countries[loc.country];
    if (!country) return null;
    const delta = data.cityDeltas[loc.cityDelta] || {};
    const pli = {};
    CATS.forEach((cat) => {
      pli[cat] = country.pli[cat] * (delta[cat] || 1);
    });
    return { loc, country, pli, composite: null };
  }

  function buildWeights(lifestyle, toggles, householdSize) {
    const profile = data.lifestyleProfiles[lifestyle] || data.lifestyleProfiles.retiree;
    const base = { ...profile.weights };
    const t = toggles || {};
    let excluded = 0;
    if (!t.housing) { excluded += base.housing; base.housing = 0; }
    if (!t.health) { excluded += base.health; base.health = 0; }
    if (!t.education) { excluded += base.education; base.education = 0; }
    base.general += excluded;

    const hh = data.householdSizeFactors[householdSize] || data.householdSizeFactors[2];
    base.housing *= hh.housing;
    base.food *= hh.food;
    base.general *= hh.general;

    const total = Object.values(base).reduce((a, b) => a + b, 0);
    Object.keys(base).forEach((k) => { base[k] /= total; });
    return base;
  }

  function compositePli(pli, weights) {
    return CATS.reduce((sum, cat) => sum + pli[cat] * weights[cat], 0);
  }

  function getComposite(locationId, options) {
    const o = options || {};
    const entry = getLocationPli(locationId);
    if (!entry) return null;
    const weights = buildWeights(o.lifestyle || "retiree", o.toggles, o.householdSize || 2);
    entry.composite = compositePli(entry.pli, weights);
    entry.weights = weights;
    return entry;
  }

  function wealthPowerMultiplier(homeId, destId, options) {
    const home = getComposite(homeId, options);
    const dest = getComposite(destId, options);
    if (!home || !dest) return null;
    return home.composite / dest.composite;
  }

  function rankDestinations(netWorth, homeId, options) {
    const o = options || {};
    const home = getComposite(homeId, o);
    if (!home) return [];
    return data.locations.map((loc) => {
      const dest = getComposite(loc.id, o);
      const wpi = home.composite / dest.composite;
      const equiv = netWorth * wpi;
      return {
        id: loc.id,
        label: loc.label,
        country: loc.country,
        region: loc.region,
        flag: data.countries[loc.country]?.flag || "",
        wpi,
        equiv,
        destComposite: dest.composite,
        pli: dest.pli,
        isHome: loc.id === homeId,
      };
    }).sort((a, b) => b.wpi - a.wpi);
  }

  function localPurchasingPower(netWorth, homeId, options) {
    const home = getComposite(homeId, options);
    if (!home) return null;
    const countryCode = home.loc.country;
    const country = data.countries[countryCode];
    const usa = data.countries.USA;
    const countryWeights = buildWeights(options?.lifestyle || "retiree", options?.toggles, options?.householdSize || 2);
    const countryComposite = compositePli(country.pli, countryWeights);
    const usaComposite = compositePli(usa.pli, countryWeights);

    const localPower = netWorth * (usaComposite / home.composite);
    const nationalPower = netWorth * (usaComposite / countryComposite);
    const usAvgPower = netWorth * (usaComposite / usaComposite);

    return {
      nominal: netWorth,
      localLifestylePower: localPower,
      nationalBaselinePower: nationalPower,
      usAveragePower: usAvgPower,
      homeComposite: home.composite,
      countryComposite,
      usaComposite,
      homeLabel: home.loc.label,
      countryName: country.name,
      discountVsNominal: ((localPower / netWorth) - 1) * 100,
    };
  }

  function lifestyleSpendAbroad(homeSpend, homeId, destId, options, period) {
    const home = getComposite(homeId, options);
    const dest = getComposite(destId, options);
    if (!home || !dest) return null;
    const multiplier = home.composite / dest.composite;
    const requiredSpend = homeSpend * multiplier;
    const delta = requiredSpend - homeSpend;
    const savingsPct = homeSpend > 0 ? ((homeSpend - requiredSpend) / homeSpend) * 100 : 0;
    const per = period === "month" ? "mo" : "yr";
    return {
      homeSpend,
      destSpend: requiredSpend,
      delta,
      multiplier,
      savingsPct,
      period: per,
      homeLabel: home.loc.label,
      destLabel: dest.loc.label,
      interpretation: delta < 0
        ? `Maintain your lifestyle for ${formatMoney(Math.abs(requiredSpend))}/${per} — ${formatMoney(Math.abs(delta))}/${per} less than home.`
        : `You would need ${formatMoney(requiredSpend)}/${per} — ${formatMoney(delta)}/${per} more than home.`,
    };
  }

  function equivalentWealthAtDest(netWorth, homeId, destId, options) {
    const mult = wealthPowerMultiplier(homeId, destId, options);
    if (mult == null) return null;
    const home = getComposite(homeId, options);
    const dest = getComposite(destId, options);
    return {
      nominal: netWorth,
      equivalent: netWorth * mult,
      multiplier: mult,
      homeLabel: home.loc.label,
      destLabel: dest.loc.label,
    };
  }

  function defaultMonthlySpend(lifestyle) {
    return data.homeMonthlySpend[lifestyle] || data.homeMonthlySpend.retiree;
  }

  function retirementAffordability(assets, annualIncome, targetSpend, homeId, options) {
    const o = options || {};
    const home = getComposite(homeId, o);
    if (!home) return [];
    const totalResources = assets + (annualIncome / data.retirementModel.safeWithdrawalRate);
    const model = data.retirementModel;

    return data.locations.map((loc) => {
      const dest = getComposite(loc.id, o);
      const spendMultiplier = home.composite / dest.composite;
      const requiredSpend = targetSpend * spendMultiplier;
      const annualBudget = assets * model.safeWithdrawalRate + annualIncome;
      const affordable = annualBudget >= requiredSpend * model.inflationBuffer;
      const runwayYears = requiredSpend > 0
        ? (assets + annualIncome * 10) / (requiredSpend * model.inflationBuffer)
        : 99;
      return {
        id: loc.id,
        label: loc.label,
        flag: data.countries[loc.country]?.flag || "",
        region: loc.region,
        requiredSpend,
        annualBudget,
        affordable,
        runwayYears: Math.min(99, runwayYears),
        spendMultiplier,
        isHome: loc.id === homeId,
      };
    }).sort((a, b) => {
      if (a.affordable !== b.affordable) return a.affordable ? -1 : 1;
      return b.runwayYears - a.runwayYears;
    });
  }

  function lookupPercentile(bands, value) {
    const band = bands.find((b) => value >= b.min && value < b.max);
    return band || bands[bands.length - 1];
  }

  function wealthPercentiles(netWorth, homeId, options) {
    const home = getLocation(homeId);
    const countryCode = home?.country || "USA";
    const localBands = data.wealthPercentileStubs.local[homeId]
      || data.wealthPercentileStubs.local.default;
    const nationalBands = data.wealthPercentileStubs.national[countryCode]
      || data.wealthPercentileStubs.national.default;
    const globalBands = data.wealthPercentileStubs.global;

    const local = lookupPercentile(localBands, netWorth);
    const national = lookupPercentile(nationalBands, netWorth);
    const global = lookupPercentile(globalBands, netWorth);

    const ppp = localPurchasingPower(netWorth, homeId, options);
    const pppAdjusted = ppp ? netWorth * (ppp.usaComposite / ppp.homeComposite) : netWorth;
    const pppGlobal = lookupPercentile(globalBands, pppAdjusted);

    return {
      local: { percentile: local.percentile, topPct: local.topPct, label: `top ${local.topPct}% locally` },
      national: { percentile: national.percentile, topPct: national.topPct, label: `top ${national.topPct}% nationally` },
      global: { percentile: global.percentile, topPct: global.topPct, label: `top ${global.topPct}% globally (nominal)` },
      pppGlobal: { percentile: pppGlobal.percentile, topPct: pppGlobal.topPct, label: `top ${pppGlobal.topPct}% globally (PPP-adjusted)` },
      pppAdjustedWealth: pppAdjusted,
      contrast: `top ${local.topPct}% locally / top ${national.topPct}% nationally / top ${pppGlobal.topPct}% globally (PPP-adjusted)`,
    };
  }

  function shareLineMode1(netWorth, homeId, rankings) {
    const home = getLocation(homeId);
    const top = rankings.find((r) => !r.isHome) || rankings[0];
    const homeShort = home?.label.split(",")[0] || "home";
    const destShort = top?.label.split(",")[0] || "abroad";
    return `Your ${formatMoney(netWorth)} in ${homeShort} ≈ top purchasing power in ${destShort} (${top.wpi.toFixed(1)}×)`;
  }

  function shareLineMode5(netWorth, homeId, options) {
    const p = wealthPercentiles(netWorth, homeId, options);
    const home = getLocation(homeId);
    const homeShort = home?.label.split(",")[0] || "home";
    return `${formatMoney(netWorth)} in ${homeShort}: ${p.contrast} — WealthMeter Purchasing Power`;
  }

  function categoryBreakdown(homeId, destId, options) {
    const home = getComposite(homeId, options);
    const dest = getComposite(destId, options);
    if (!home || !dest) return [];
    return CATS.map((cat) => ({
      category: cat,
      label: data.categoryLabels[cat],
      homeVal: home.pli[cat],
      destVal: dest.pli[cat],
      ratio: home.pli[cat] / dest.pli[cat],
    }));
  }

  return {
    data,
    formatMoney,
    getLocation,
    getLocationPli,
    getComposite,
    buildWeights,
    compositePli,
    wealthPowerMultiplier,
    rankDestinations,
    localPurchasingPower,
    lifestyleSpendAbroad,
    equivalentWealthAtDest,
    defaultMonthlySpend,
    retirementAffordability,
    wealthPercentiles,
    shareLineMode1,
    shareLineMode5,
    categoryBreakdown,
  };
})(PPW_DATA);

if (typeof window !== "undefined") {
  window.PPW_DATA = PPW_DATA;
  window.PPW_ENGINE = PPW_ENGINE;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PPW_DATA, PPW_ENGINE };
}
