import { describe, expect, it } from 'vitest';

import combinePoints, { type MapPoint } from './combine-points';

describe('combinePoints', () => {
  it('should combine points with the same coordinates', () => {
    const points: MapPoint[] = [
      {
        coordinates: [1, 2],
        linkedRecords: [{ title: 'A' }],
      },
      {
        coordinates: [1, 2],
        linkedRecords: [{ title: 'B' }],
      },
    ];

    const result = combinePoints(points);

    expect(result).toHaveLength(1);
    expect(result[0].coordinates).toEqual([1, 2]);
    expect(result[0].linkedRecords).toEqual([{ title: 'A' }, { title: 'B' }]);
  });

  it('should not combine points with different coordinates', () => {
    const points: MapPoint[] = [
      {
        coordinates: [1, 2],
        linkedRecords: [{ title: 'A' }],
      },
      {
        coordinates: [3, 4],
        linkedRecords: [{ title: 'B' }],
      },
    ];

    const result = combinePoints(points);

    expect(result).toHaveLength(2);
    expect(result[0].coordinates).toEqual([1, 2]);
    expect(result[0].linkedRecords).toEqual([{ title: 'A' }]);
    expect(result[1].coordinates).toEqual([3, 4]);
    expect(result[1].linkedRecords).toEqual([{ title: 'B' }]);
  });

  it('should combine linked records correctly', () => {
    const points: MapPoint[] = [
      {
        coordinates: [1, 2],
        linkedRecords: [{ title: 'A', link: 'linkA' }],
      },
      {
        coordinates: [1, 2],
        linkedRecords: [{ title: 'B', link: 'linkB' }],
      },
    ];

    const result = combinePoints(points);

    expect(result).toHaveLength(1);
    expect(result[0].coordinates).toEqual([1, 2]);
    expect(result[0].linkedRecords).toEqual([
      { title: 'A', link: 'linkA' },
      { title: 'B', link: 'linkB' },
    ]);
  });

  it('should handle empty input', () => {
    const points: MapPoint[] = [];

    const result = combinePoints(points);

    expect(result).toHaveLength(0);
  });

  it('should handle single point input', () => {
    const points: MapPoint[] = [
      {
        coordinates: [1, 2],
        linkedRecords: [{ title: 'A', link: 'linkA' }],
      },
    ];

    const result = combinePoints(points);

    expect(result).toHaveLength(1);
    expect(result[0].coordinates).toEqual([1, 2]);
    expect(result[0].linkedRecords).toEqual([{ title: 'A', link: 'linkA' }]);
  });
});
