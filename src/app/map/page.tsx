import type { Metadata } from 'next';
import { Suspense } from 'react';

import getTablesMetadata from '@/shared/get-tables-metadata';

import MapWrapperBound from '../components/map-wrapper';
import combinePoints from '../helpers/combine-points';

export const metadata: Metadata = {
  title: 'Корені | Мапа доступних даних',
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

  return (
    <Suspense fallback={<p>Завантаження...</p>}>
      <MapWrapperBound points={combinedPoints} zoom={6} isFullScreen />
    </Suspense>
  );
}
