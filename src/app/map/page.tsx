import type { Metadata } from 'next';

import getTablesMetadata from '@/shared/get-tables-metadata';

import MapWrapper from '../components/map-wrapper';
import combinePoints from '../helpers/combine-points';

export const metadata: Metadata = {
  title: 'Корені | Карта доступних даних',
};

export default async function MapPage() {
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
  return <MapWrapper open points={combinedPoints} zoom={6} />;
}
