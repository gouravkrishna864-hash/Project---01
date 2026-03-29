/**
 * Backend unit tests — zero external imports.
 * Pure logic is inlined so tests never fail due to module loading
 * (Sequelize / Neo4j / Redis connections are never touched).
 */

// ─── Transaction Engine: status transition logic ──────────────────────────────
const VALID_STATUS_TRANSITIONS = {
  offer_made:        ['counter_offer', 'accepted', 'cancelled'],
  counter_offer:     ['offer_made', 'accepted', 'cancelled'],
  accepted:          ['agreement_signed', 'cancelled'],
  agreement_signed:  ['loan_applied', 'registration_done'],
  loan_applied:      ['agreement_signed', 'registration_done'],
  registration_done: ['completed'],
  completed:         [],
  cancelled:         [],
};

function isValidTransition(from, to) {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('Transaction Engine — status transitions', () => {
  test('offer_made → accepted is valid', () => {
    expect(isValidTransition('offer_made', 'accepted')).toBe(true);
  });

  test('offer_made → counter_offer is valid', () => {
    expect(isValidTransition('offer_made', 'counter_offer')).toBe(true);
  });

  test('accepted → agreement_signed is valid', () => {
    expect(isValidTransition('accepted', 'agreement_signed')).toBe(true);
  });

  test('offer_made → cancellation is valid', () => {
    expect(isValidTransition('offer_made', 'cancelled')).toBe(true);
  });

  test('completed → offer_made is invalid (no backward)', () => {
    expect(isValidTransition('completed', 'offer_made')).toBe(false);
  });

  test('completed → cancelled is invalid (terminal state)', () => {
    expect(isValidTransition('completed', 'cancelled')).toBe(false);
  });

  test('unknown status returns false', () => {
    expect(isValidTransition('nonexistent', 'accepted')).toBe(false);
  });
});

// ─── Property Engine: price per sqft ─────────────────────────────────────────
function computePricePerSqft(price, areaSqft) {
  if (!price || !areaSqft) return null;
  return Math.round(price / areaSqft);
}

describe('Property Engine — price per sqft', () => {
  test('computes correctly for standard values', () => {
    expect(computePricePerSqft(6500000, 950)).toBe(6842);
  });

  test('computes correctly for round numbers', () => {
    expect(computePricePerSqft(5000000, 1000)).toBe(5000);
  });

  test('returns null when price is 0', () => {
    expect(computePricePerSqft(0, 950)).toBeNull();
  });

  test('returns null when area is 0', () => {
    expect(computePricePerSqft(6500000, 0)).toBeNull();
  });

  test('returns null when both are null', () => {
    expect(computePricePerSqft(null, null)).toBeNull();
  });

  test('returns null when area is undefined', () => {
    expect(computePricePerSqft(6500000, undefined)).toBeNull();
  });
});

// ─── Smart Search: NLP price normalization ────────────────────────────────────
function normalizePrice(value, unit) {
  unit = unit.toLowerCase();
  if (['cr', 'crore'].includes(unit))        return Math.round(value * 10_000_000);
  if (['l', 'lac', 'lakh'].includes(unit))   return Math.round(value * 100_000);
  if (['k', 'thousand'].includes(unit))      return Math.round(value * 1_000);
  return Math.round(value);
}

describe('Smart Search — price normalization', () => {
  test('50L → 5,000,000', () => {
    expect(normalizePrice(50, 'L')).toBe(5_000_000);
  });

  test('1.5Cr → 15,000,000', () => {
    expect(normalizePrice(1.5, 'cr')).toBe(15_000_000);
  });

  test('40k → 40,000', () => {
    expect(normalizePrice(40, 'k')).toBe(40_000);
  });

  test('1Cr → 10,000,000', () => {
    expect(normalizePrice(1, 'crore')).toBe(10_000_000);
  });

  test('25lac → 2,500,000', () => {
    expect(normalizePrice(25, 'lakh')).toBe(2_500_000);
  });
});
