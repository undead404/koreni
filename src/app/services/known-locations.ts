import combinedPoints from './map-points';

const knownLocations = combinedPoints.flatMap((point) =>
  point.linkedRecords.map((record) => ({
    coordinates: point.coordinates,
    title: record.title,
  })),
);

export default knownLocations;
