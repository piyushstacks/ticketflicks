// Predefined seat layout templates for theatres
export const SEAT_LAYOUTS = {
  // Small screens (50-100 seats)
  SMALL_1: {
    key: 'SMALL_1',
    name: "Compact (8x7)",
    rows: 8,
    seatsPerRow: 7,
    totalSeats: 56,
    layout: [
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S']
    ]
  },
  SMALL_2: {
    key: 'SMALL_2',
    name: "Mini (6x8)",
    rows: 6,
    seatsPerRow: 8,
    totalSeats: 48,
    layout: [
      ['S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S']
    ]
  },

  // Medium screens (100-200 seats)
  MEDIUM_1: {
    key: 'MEDIUM_1',
    name: "Standard (12x10)",
    rows: 12,
    seatsPerRow: 10,
    totalSeats: 120,
    layout: [
      ['S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S'],
      ['D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D'],
      ['P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P']
    ]
  },
  MEDIUM_2: {
    key: 'MEDIUM_2',
    name: "Classic (14x12)",
    rows: 14,
    seatsPerRow: 12,
    totalSeats: 168,
    layout: [
      ['S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S'],
      ['D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D'],
      ['P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P']
    ]
  },

  // Large screens (200-300 seats)
  LARGE_1: {
    key: 'LARGE_1',
    name: "Premium (16x14)",
    rows: 16,
    seatsPerRow: 14,
    totalSeats: 224,
    layout: [
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R']
    ]
  },
  LARGE_2: {
    key: 'LARGE_2',
    name: "Mega (18x16)",
    rows: 18,
    seatsPerRow: 16,
    totalSeats: 288,
    layout: [
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['S','S','S','S','S','S','S','S','S','S','S','S','S','S','S','S'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['P','P','P','P','P','P','P','P','P','P','P','P','P','P','P','P'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','R','R','R']
    ]
  },

  // Special layouts - single tier only
  COUPLE_FRIENDLY: {
    key: 'COUPLE_FRIENDLY',
    name: "Couple Friendly (10x8)",
    rows: 10,
    seatsPerRow: 8,
    totalSeats: 80,
    layout: [
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C'],
      ['C','C','C','C','C','C','C','C']
    ]
  },

  // VIP/Luxury layout - single tier only
  VIP: {
    key: 'VIP',
    name: "VIP Luxury (8x6)",
    rows: 8,
    seatsPerRow: 6,
    totalSeats: 48,
    layout: [
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R'],
      ['R','R','R','R','R','R']
    ]
  }
};

// Seat tier definitions
export const SEAT_TIERS = {
  S: { name: 'Standard', color: '#94a3b8', basePrice: 150 },
  D: { name: 'Deluxe', color: '#3b82f6', basePrice: 200 },
  P: { name: 'Premium', color: '#8b5cf6', basePrice: 250 },
  R: { name: 'Recliner', color: '#ef4444', basePrice: 350 },
  C: { name: 'Couple', color: '#ec4899', basePrice: 500 }
};

// Helper functions
export const getLayoutByKey = (key) => SEAT_LAYOUTS[key] || null;

export const calculateTotalSeats = (layout) => {
  if (!layout || !layout.layout) return 0;
  return layout.layout.flat().filter(seat => seat !== '').length;
};

export const getSeatCountByTier = (layout) => {
  if (!layout || !layout.layout) return {};
  
  const counts = {};
  layout.layout.flat().forEach(seat => {
    if (seat !== '') {
      counts[seat] = (counts[seat] || 0) + 1;
    }
  });
  return counts;
};

export const validatePricing = (tiers) => {
  const errors = [];
  
  Object.entries(tiers).forEach(([tier, config]) => {
    if (!config.price || config.price <= 0) {
      errors.push(`${SEAT_TIERS[tier]?.name || tier} price must be greater than 0`);
    }
    if (config.price > 10000) {
      errors.push(`${SEAT_TIERS[tier]?.name || tier} price seems too high`);
    }
  });
  
  return errors;
};
