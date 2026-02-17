export default function calculateCoordinatesAverage(
  points: [number, number][],
): [number, number] {
  if (points.length === 0) {
    return [0, 0];
  }
  let sumX = 0;
  let sumY = 0;
  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
  }
  return [sumX / points.length, sumY / points.length];
}
