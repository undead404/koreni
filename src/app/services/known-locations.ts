import { uniqBy } from 'es-toolkit';

import combinedPoints from './map-points';

const knownLocations = uniqBy(
  combinedPoints.flatMap((point) =>
    point.linkedRecords.map((record) => ({
      coordinates: point.coordinates,
      title: record.title,
    })),
  ),
  (point) => point.coordinates.join(','),
);

export default knownLocations;
