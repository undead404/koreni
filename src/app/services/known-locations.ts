import _ from 'lodash';

import combinedPoints from './map-points';

const knownLocations = _.uniqBy(
  combinedPoints.flatMap((point) =>
    point.linkedRecords.map((record) => ({
      coordinates: point.coordinates,
      title: record.title,
    })),
  ),
  (point) => point.coordinates.join(','),
);

export default knownLocations;
