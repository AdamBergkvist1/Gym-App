import { describe, expect, it } from 'vitest';
import { epley1RM, volumeKg } from './oneRepMax';

describe('9.3 e1RM enligt Epley', () => {
  it('räknar kända värden rätt', () => {
    // 100 × (1 + 5/30) = 116,67
    expect(epley1RM(100, 5)).toBe(116.7);
    // 80 × (1 + 8/30) = 101,33
    expect(epley1RM(80, 8)).toBe(101.3);
    // 90 × (1 + 3/30) = 99
    expect(epley1RM(90, 3)).toBe(99);
  });

  it('gör set jämförbara över rep-intervall', () => {
    // Hela poängen: 80×8 är en starkare prestation än 90×3, vilket inte syns
    // direkt i loggen.
    expect(epley1RM(80, 8)!).toBeGreaterThan(epley1RM(90, 3)!);
  });

  it('behandlar ett singel som sitt eget max', () => {
    expect(epley1RM(120, 1)).toBe(120);
  });

  it('ger null i stället för brus vid för många reps', () => {
    expect(epley1RM(40, 16)).toBeNull();
    expect(epley1RM(40, 30)).toBeNull();
  });

  it('ger null för orimlig indata i stället för att hitta på', () => {
    expect(epley1RM(0, 5)).toBeNull();
    expect(epley1RM(-10, 5)).toBeNull();
    expect(epley1RM(100, 0)).toBeNull();
    expect(epley1RM(NaN, 5)).toBeNull();
    expect(epley1RM(100, Infinity)).toBeNull();
  });

  it('växer monotont med både vikt och reps', () => {
    expect(epley1RM(100, 5)!).toBeGreaterThan(epley1RM(95, 5)!);
    expect(epley1RM(100, 6)!).toBeGreaterThan(epley1RM(100, 5)!);
  });
});

describe('volym', () => {
  it('är vikt gånger reps', () => {
    expect(volumeKg(90, 5)).toBe(450);
    expect(volumeKg(92.5, 8)).toBe(740);
  });

  it('ger noll för orimlig indata', () => {
    expect(volumeKg(-1, 5)).toBe(0);
    expect(volumeKg(90, 0)).toBe(0);
    expect(volumeKg(NaN, 5)).toBe(0);
  });
});
