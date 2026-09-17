import { describe, expect, it } from '@jest/globals';
import { resolveGreetingKey, selectGreeting } from './greeting.util';

describe('resolveGreetingKey', () => {
  it('maps the late-night hours to night', () => {
    expect(resolveGreetingKey(0)).toBe('night');
    expect(resolveGreetingKey(4)).toBe('night');
  });

  it('maps the early hours to dawn', () => {
    expect(resolveGreetingKey(5)).toBe('dawn');
    expect(resolveGreetingKey(7)).toBe('dawn');
  });

  it('maps the late morning to morning', () => {
    expect(resolveGreetingKey(8)).toBe('morning');
    expect(resolveGreetingKey(11)).toBe('morning');
  });

  it('maps midday to afternoon', () => {
    expect(resolveGreetingKey(12)).toBe('afternoon');
    expect(resolveGreetingKey(17)).toBe('afternoon');
  });

  it('maps the late day to evening', () => {
    expect(resolveGreetingKey(18)).toBe('evening');
    expect(resolveGreetingKey(23)).toBe('evening');
  });
});

describe('selectGreeting', () => {
  const pool = ['a', 'b', 'c'];

  it('picks a phrase by seed modulo pool length', () => {
    expect(selectGreeting(pool, 0)).toBe('a');
    expect(selectGreeting(pool, 1)).toBe('b');
    expect(selectGreeting(pool, 2)).toBe('c');
    expect(selectGreeting(pool, 4)).toBe('b');
  });

  it('truncates non-integer seeds and handles negatives', () => {
    expect(selectGreeting(pool, 2.9)).toBe('c');
    expect(selectGreeting(pool, -1)).toBe('b');
  });

  it('handles large clock-derived seeds', () => {
    const seed = 1_726_000_000_000;
    expect(selectGreeting(pool, seed)).toBe(pool[seed % pool.length]);
  });

  it('returns an empty string for an empty pool', () => {
    expect(selectGreeting([], 3)).toBe('');
  });
});
