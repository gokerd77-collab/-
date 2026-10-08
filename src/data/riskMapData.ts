import { Continent, ContinentId, Territory } from '../types/game';

export const CONTINENTS: Record<ContinentId, Continent> = {
  north_america: {
    id: 'north_america',
    name: 'North America',
    nameAr: 'أمريكا الشمالية',
    bonus: 5,
    color: '#EAB308', // Amber/Gold
    territoryIds: [
      'alaska',
      'northwest_territory',
      'greenland',
      'alberta',
      'ontario',
      'quebec',
      'western_united_states',
      'eastern_united_states',
      'central_america'
    ]
  },
  south_america: {
    id: 'south_america',
    name: 'South America',
    nameAr: 'أمريكا الجنوبية',
    bonus: 2,
    color: '#10B981', // Emerald
    territoryIds: ['venezuela', 'peru', 'brazil', 'argentina']
  },
  europe: {
    id: 'europe',
    name: 'Europe',
    nameAr: 'أوروبا',
    bonus: 5,
    color: '#3B82F6', // Blue
    territoryIds: [
      'iceland',
      'great_britain',
      'western_europe',
      'northern_europe',
      'southern_europe',
      'scandinavia',
      'ukraine'
    ]
  },
  africa: {
    id: 'africa',
    name: 'Africa',
    nameAr: 'أفريقيا',
    bonus: 3,
    color: '#F97316', // Orange
    territoryIds: ['north_africa', 'egypt', 'east_africa', 'congo', 'south_africa', 'madagascar']
  },
  asia: {
    id: 'asia',
    name: 'Asia',
    nameAr: 'آسيا',
    bonus: 7,
    color: '#A855F7', // Purple
    territoryIds: [
      'ural',
      'siberia',
      'yakutsk',
      'kamchatka',
      'afghanistan',
      'china',
      'mongolia',
      'irkutsk',
      'middle_east',
      'india',
      'southeast_asia',
      'japan'
    ]
  },
  australia: {
    id: 'australia',
    name: 'Australia & Oceania',
    nameAr: 'أستراليا وأوقيانوسيا',
    bonus: 2,
    color: '#EC4899', // Pink/Rose
    territoryIds: ['indonesia', 'new_guinea', 'western_australia', 'eastern_australia']
  }
};

// 42 Official Classic Risk Territories with authentic neighbor connections and map coordinates
export const TERRITORIES: Territory[] = [
  // --- NORTH AMERICA ---
  {
    id: 'alaska',
    name: 'Alaska',
    nameAr: 'ألاسكا',
    continentId: 'north_america',
    neighbors: ['northwest_territory', 'alberta', 'kamchatka'],
    x: 75,
    y: 110
  },
  {
    id: 'northwest_territory',
    name: 'Northwest Territory',
    nameAr: 'الإقليم الشمالي الغربي',
    continentId: 'north_america',
    neighbors: ['alaska', 'alberta', 'ontario', 'greenland'],
    x: 165,
    y: 115
  },
  {
    id: 'greenland',
    name: 'Greenland',
    nameAr: 'جرينلاند',
    continentId: 'north_america',
    neighbors: ['northwest_territory', 'quebec', 'ontario', 'iceland'],
    x: 350,
    y: 85
  },
  {
    id: 'alberta',
    name: 'Alberta',
    nameAr: 'ألبرتا',
    continentId: 'north_america',
    neighbors: ['alaska', 'northwest_territory', 'ontario', 'western_united_states'],
    x: 155,
    y: 175
  },
  {
    id: 'ontario',
    name: 'Ontario',
    nameAr: 'أونتاريو',
    continentId: 'north_america',
    neighbors: ['northwest_territory', 'alberta', 'quebec', 'western_united_states', 'eastern_united_states', 'greenland'],
    x: 230,
    y: 185
  },
  {
    id: 'quebec',
    name: 'Quebec',
    nameAr: 'كيبيك',
    continentId: 'north_america',
    neighbors: ['greenland', 'ontario', 'eastern_united_states'],
    x: 300,
    y: 180
  },
  {
    id: 'western_united_states',
    name: 'Western United States',
    nameAr: 'غرب أمريكا',
    continentId: 'north_america',
    neighbors: ['alberta', 'ontario', 'eastern_united_states', 'central_america'],
    x: 160,
    y: 250
  },
  {
    id: 'eastern_united_states',
    name: 'Eastern United States',
    nameAr: 'شرق أمريكا',
    continentId: 'north_america',
    neighbors: ['quebec', 'ontario', 'western_united_states', 'central_america'],
    x: 245,
    y: 260
  },
  {
    id: 'central_america',
    name: 'Central America',
    nameAr: 'أمريكا الوسطى',
    continentId: 'north_america',
    neighbors: ['western_united_states', 'eastern_united_states', 'venezuela'],
    x: 185,
    y: 345
  },

  // --- SOUTH AMERICA ---
  {
    id: 'venezuela',
    name: 'Venezuela',
    nameAr: 'فنزويلا',
    continentId: 'south_america',
    neighbors: ['central_america', 'peru', 'brazil'],
    x: 265,
    y: 405
  },
  {
    id: 'peru',
    name: 'Peru',
    nameAr: 'بيرو',
    continentId: 'south_america',
    neighbors: ['venezuela', 'brazil', 'argentina'],
    x: 255,
    y: 490
  },
  {
    id: 'brazil',
    name: 'Brazil',
    nameAr: 'البرازيل',
    continentId: 'south_america',
    neighbors: ['venezuela', 'peru', 'argentina', 'north_africa'],
    x: 340,
    y: 475
  },
  {
    id: 'argentina',
    name: 'Argentina',
    nameAr: 'الأرجنتين',
    continentId: 'south_america',
    neighbors: ['peru', 'brazil'],
    x: 275,
    y: 585
  },

  // --- EUROPE ---
  {
    id: 'iceland',
    name: 'Iceland',
    nameAr: 'آيسلندا',
    continentId: 'europe',
    neighbors: ['greenland', 'great_britain', 'scandinavia'],
    x: 435,
    y: 125
  },
  {
    id: 'scandinavia',
    name: 'Scandinavia',
    nameAr: 'إسكندنافيا',
    continentId: 'europe',
    neighbors: ['iceland', 'great_britain', 'northern_europe', 'ukraine'],
    x: 520,
    y: 135
  },
  {
    id: 'great_britain',
    name: 'Great Britain',
    nameAr: 'بريطانيا العظمى',
    continentId: 'europe',
    neighbors: ['iceland', 'scandinavia', 'northern_europe', 'western_europe'],
    x: 440,
    y: 200
  },
  {
    id: 'northern_europe',
    name: 'Northern Europe',
    nameAr: 'شمال أوروبا',
    continentId: 'europe',
    neighbors: ['great_britain', 'scandinavia', 'ukraine', 'western_europe', 'southern_europe'],
    x: 515,
    y: 215
  },
  {
    id: 'western_europe',
    name: 'Western Europe',
    nameAr: 'غرب أوروبا',
    continentId: 'europe',
    neighbors: ['great_britain', 'northern_europe', 'southern_europe', 'north_africa'],
    x: 445,
    y: 285
  },
  {
    id: 'southern_europe',
    name: 'Southern Europe',
    nameAr: 'جنوب أوروبا',
    continentId: 'europe',
    neighbors: ['western_europe', 'northern_europe', 'ukraine', 'north_africa', 'egypt', 'middle_east'],
    x: 525,
    y: 280
  },
  {
    id: 'ukraine',
    name: 'Ukraine',
    nameAr: 'أوكرانيا وروسيا الغربية',
    continentId: 'europe',
    neighbors: ['scandinavia', 'northern_europe', 'southern_europe', 'ural', 'afghanistan', 'middle_east'],
    x: 605,
    y: 185
  },

  // --- AFRICA ---
  {
    id: 'north_africa',
    name: 'North Africa',
    nameAr: 'شمال أفريقيا',
    continentId: 'africa',
    neighbors: ['western_europe', 'southern_europe', 'brazil', 'egypt', 'east_africa', 'congo'],
    x: 465,
    y: 380
  },
  {
    id: 'egypt',
    name: 'Egypt',
    nameAr: 'مصر',
    continentId: 'africa',
    neighbors: ['north_africa', 'southern_europe', 'middle_east', 'east_africa'],
    x: 545,
    y: 360
  },
  {
    id: 'east_africa',
    name: 'East Africa',
    nameAr: 'شرق أفريقيا',
    continentId: 'africa',
    neighbors: ['egypt', 'north_africa', 'congo', 'south_africa', 'madagascar', 'middle_east'],
    x: 585,
    y: 445
  },
  {
    id: 'congo',
    name: 'Congo',
    nameAr: 'الكونغو',
    continentId: 'africa',
    neighbors: ['north_africa', 'east_africa', 'south_africa'],
    x: 535,
    y: 475
  },
  {
    id: 'south_africa',
    name: 'South Africa',
    nameAr: 'جنوب أفريقيا',
    continentId: 'africa',
    neighbors: ['congo', 'east_africa', 'madagascar'],
    x: 540,
    y: 565
  },
  {
    id: 'madagascar',
    name: 'Madagascar',
    nameAr: 'مدغشقر',
    continentId: 'africa',
    neighbors: ['east_africa', 'south_africa'],
    x: 635,
    y: 560
  },

  // --- ASIA ---
  {
    id: 'ural',
    name: 'Ural',
    nameAr: 'جبال الأورال',
    continentId: 'asia',
    neighbors: ['ukraine', 'siberia', 'china', 'afghanistan'],
    x: 690,
    y: 145
  },
  {
    id: 'siberia',
    name: 'Siberia',
    nameAr: 'سيبيريا',
    continentId: 'asia',
    neighbors: ['ural', 'yakutsk', 'irkutsk', 'mongolia', 'china'],
    x: 755,
    y: 115
  },
  {
    id: 'yakutsk',
    name: 'Yakutsk',
    nameAr: 'ياكوتسك',
    continentId: 'asia',
    neighbors: ['siberia', 'irkutsk', 'kamchatka'],
    x: 835,
    y: 95
  },
  {
    id: 'kamchatka',
    name: 'Kamchatka',
    nameAr: 'كامتشاتكا',
    continentId: 'asia',
    neighbors: ['yakutsk', 'irkutsk', 'mongolia', 'japan', 'alaska'],
    x: 915,
    y: 105
  },
  {
    id: 'afghanistan',
    name: 'Afghanistan',
    nameAr: 'أفغانستان',
    continentId: 'asia',
    neighbors: ['ukraine', 'ural', 'china', 'india', 'middle_east'],
    x: 675,
    y: 240
  },
  {
    id: 'china',
    name: 'China',
    nameAr: 'الصين',
    continentId: 'asia',
    neighbors: ['afghanistan', 'ural', 'siberia', 'mongolia', 'southeast_asia', 'india'],
    x: 775,
    y: 275
  },
  {
    id: 'mongolia',
    name: 'Mongolia',
    nameAr: 'منغوليا',
    continentId: 'asia',
    neighbors: ['siberia', 'irkutsk', 'kamchatka', 'japan', 'china'],
    x: 825,
    y: 205
  },
  {
    id: 'irkutsk',
    name: 'Irkutsk',
    nameAr: 'إيركوتسك',
    continentId: 'asia',
    neighbors: ['siberia', 'yakutsk', 'kamchatka', 'mongolia'],
    x: 810,
    y: 155
  },
  {
    id: 'japan',
    name: 'Japan',
    nameAr: 'اليابان',
    continentId: 'asia',
    neighbors: ['kamchatka', 'mongolia'],
    x: 910,
    y: 215
  },
  {
    id: 'middle_east',
    name: 'Middle East',
    nameAr: 'الشرق الأوسط',
    continentId: 'asia',
    neighbors: ['southern_europe', 'ukraine', 'afghanistan', 'india', 'egypt', 'east_africa'],
    x: 615,
    y: 315
  },
  {
    id: 'india',
    name: 'India',
    nameAr: 'الهند',
    continentId: 'asia',
    neighbors: ['middle_east', 'afghanistan', 'china', 'southeast_asia'],
    x: 720,
    y: 345
  },
  {
    id: 'southeast_asia',
    name: 'Southeast Asia',
    nameAr: 'جنوب شرق آسيا',
    continentId: 'asia',
    neighbors: ['india', 'china', 'indonesia'],
    x: 805,
    y: 365
  },

  // --- AUSTRALIA & OCEANIA ---
  {
    id: 'indonesia',
    name: 'Indonesia',
    nameAr: 'إندونيسيا',
    continentId: 'australia',
    neighbors: ['southeast_asia', 'new_guinea', 'western_australia'],
    x: 820,
    y: 470
  },
  {
    id: 'new_guinea',
    name: 'New Guinea',
    nameAr: 'غينيا الجديدة',
    continentId: 'australia',
    neighbors: ['indonesia', 'eastern_australia'],
    x: 915,
    y: 450
  },
  {
    id: 'western_australia',
    name: 'Western Australia',
    nameAr: 'غرب أستراليا',
    continentId: 'australia',
    neighbors: ['indonesia', 'eastern_australia', 'new_guinea'],
    x: 855,
    y: 565
  },
  {
    id: 'eastern_australia',
    name: 'Eastern Australia',
    nameAr: 'شرق أستراليا',
    continentId: 'australia',
    neighbors: ['western_australia', 'new_guinea'],
    x: 935,
    y: 550
  }
];

export const TERRITORY_LOOKUP = new Map<string, Territory>(
  TERRITORIES.map((t) => [t.id, t])
);

// Default Pre-Configured Teams
export const DEFAULT_TEAMS_CONFIG = [
  {
    id: 'team_crimson',
    name: 'الفيلق الأحمر',
    nameAr: 'الفيلق الأحمر',
    color: '#EF4444', // Red 500
    secondaryColor: '#991B1B',
    icon: 'Sword'
  },
  {
    id: 'team_azure',
    name: 'الدرع الأزرق',
    nameAr: 'الدرع الأزرق',
    color: '#3B82F6', // Blue 500
    secondaryColor: '#1E40AF',
    icon: 'Shield'
  },
  {
    id: 'team_emerald',
    name: 'الفرقة الخضراء',
    nameAr: 'الفرقة الخضراء',
    color: '#10B981', // Emerald 500
    secondaryColor: '#065F46',
    icon: 'Crown'
  },
  {
    id: 'team_amber',
    name: 'العاصفة الصفراء',
    nameAr: 'العاصفة الصفراء',
    color: '#F59E0B', // Amber 500
    secondaryColor: '#92400E',
    icon: 'Zap'
  },
  {
    id: 'team_violet',
    name: 'النسر البنفسجي',
    nameAr: 'النسر البنفسجي',
    color: '#8B5CF6', // Purple 500
    secondaryColor: '#5B21B6',
    icon: 'Compass'
  },
  {
    id: 'team_cyan',
    name: 'الصقر السماوي',
    nameAr: 'الصقر السماوي',
    color: '#06B6D4', // Cyan 500
    secondaryColor: '#0E7490',
    icon: 'Anchor'
  }
];

// Calculate reinforcements based on authentic Risk rules
export function calculateReinforcements(
  territoryCount: number,
  continentsHeld: ContinentId[]
): { base: number; continentBonus: number; total: number } {
  // Base rule: 1 reinforcement per 3 territories owned, minimum 3
  const base = Math.max(3, Math.floor(territoryCount / 3));

  let continentBonus = 0;
  for (const cid of continentsHeld) {
    continentBonus += CONTINENTS[cid]?.bonus || 0;
  }

  return {
    base,
    continentBonus,
    total: base + continentBonus
  };
}

// Check which continents a team holds fully
export function getContinentsHeldByTeam(
  teamId: string,
  territories: Record<string, { teamId: string }>
): ContinentId[] {
  const held: ContinentId[] = [];
  for (const continent of Object.values(CONTINENTS)) {
    const ownsAll = continent.territoryIds.every(
      (tid) => territories[tid] && territories[tid].teamId === teamId
    );
    if (ownsAll) {
      held.push(continent.id);
    }
  }
  return held;
}
