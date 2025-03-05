export interface MapPoint {
  coordinates: [number, number];
  linkedRecords: {
    link?: string;
    title: string;
  }[];
}

function calculatePointKey(point: MapPoint) {
  return point.coordinates.join(';');
}

export default function combinePoints(points: MapPoint[]): MapPoint[] {
  const map = new Map<string, MapPoint>();
  for (const point of points) {
    const key = calculatePointKey(point);
    const knownValue = map.get(key);
    if (knownValue) {
      map.set(key, {
        ...knownValue,
        linkedRecords: [...knownValue.linkedRecords, ...point.linkedRecords],
      });
    } else {
      map.set(key, point);
    }
  }
  return [...map.values()];
}
