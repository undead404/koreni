import getTablesMetadata from '@/shared/get-tables-metadata';

import combinePoints from '../helpers/combine-points';

const tablesMetadata = await getTablesMetadata();

const points = tablesMetadata.map((tableMetadata) => ({
  coordinates: tableMetadata.location,
  linkedRecords: [
    {
      link: `/${tableMetadata.id}/1`,
      title: tableMetadata.title,
    },
  ],
}));
const combinedPoints = combinePoints(points);

export default combinedPoints;
