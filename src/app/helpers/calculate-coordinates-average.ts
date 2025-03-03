export default function calculateCoordinatesAverage(
  points: [number, number][]
): [number, number] {
  const sum = points.reduce(
    ([sumX, sumY], [x, y]) => [sumX + x, sumY + y],
    [0, 0]
  );
  return [sum[0] / points.length, sum[1] / points.length];
}
