import { describe, expect, it } from 'vitest';

import calculateCoordinatesAverage from './calculate-coordinates-average';

describe('calculateCoordinatesAverage', () => {
  it('should calculate the average coordinates for a single point', () => {
    const points: [number, number][] = [[10, 20]];
    const result = calculateCoordinatesAverage(points);
    expect(result).toEqual([10, 20]);
  });

  it('should calculate the average coordinates for multiple points', () => {
    const points: [number, number][] = [
      [10, 20],
      [30, 40],
      [50, 60],
    ];
    const result = calculateCoordinatesAverage(points);
    expect(result).toEqual([30, 40]);
  });

  it('should return [0, 0] for an empty array', () => {
    const points: [number, number][] = [];
    const result = calculateCoordinatesAverage(points);
    expect(result).toEqual([0, 0]);
  });

  it('should handle negative coordinates', () => {
    const points: [number, number][] = [
      [-10, -20],
      [-30, -40],
      [-50, -60],
    ];
    const result = calculateCoordinatesAverage(points);
    expect(result).toEqual([-30, -40]);
  });

  it('should handle a mix of positive and negative coordinates', () => {
    const points: [number, number][] = [
      [10, -20],
      [-30, 40],
      [50, -60],
    ];
    const result = calculateCoordinatesAverage(points);
    expect(result).toEqual([10, -13.333_333_333_333_334]);
  });
});
