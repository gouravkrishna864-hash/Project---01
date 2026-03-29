/**
 * Backend unit tests — pure logic, no DB or external services required.
 * External deps (neo4j, redis, sequelize) are mocked in setup.js.
 */

describe('Transaction Engine — status transitions', () => {
  let transactionEngine;

  beforeAll(() => {
    ({ transactionEngine } = require('../engines/transactionEngine'));
  });

  test('valid forward: offer_made → accepted', () => {
    expect(transactionEngine.isValidTransition('offer_made', 'accepted')).toBe(true);
  });

  test('valid forward: accepted → agreement_signed', () => {
    expect(transactionEngine.isValidTransition('accepted', 'agreement_signed')).toBe(true);
  });

  test('invalid backward: completed → offer_made', () => {
    expect(transactionEngine.isValidTransition('completed', 'offer_made')).toBe(false);
  });

  test('no transitions from completed', () => {
    expect(transactionEngine.isValidTransition('completed', 'cancelled')).toBe(false);
  });

  test('cancellation allowed from offer_made', () => {
    expect(transactionEngine.isValidTransition('offer_made', 'cancelled')).toBe(true);
  });

  test('cancellation allowed from accepted', () => {
    expect(transactionEngine.isValidTransition('accepted', 'cancelled')).toBe(true);
  });
});

describe('Property Engine — price per sqft', () => {
  let propertyEngine;

  beforeAll(() => {
    ({ propertyEngine } = require('../engines/propertyEngine'));
  });

  test('computes correctly', () => {
    expect(propertyEngine.computePricePerSqft(6500000, 950)).toBe(6842);
  });

  test('returns null when price is 0', () => {
    expect(propertyEngine.computePricePerSqft(0, 950)).toBe(null);
  });

  test('returns null when area is 0', () => {
    expect(propertyEngine.computePricePerSqft(6500000, 0)).toBe(null);
  });

  test('returns null when both are null', () => {
    expect(propertyEngine.computePricePerSqft(null, null)).toBe(null);
  });
});
