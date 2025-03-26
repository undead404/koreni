import type { Metadata } from 'next';
import Head from 'next/head';

import getTablesMetadata from '@/shared/get-tables-metadata';

import MapWrapper from '../components/map-wrapper';
import environment from '../environment';
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
    <>
      <Head>
        <link
          rel="canonical"
          href={`${environment.NEXT_PUBLIC_SITE}/map/`}
          key="canonical"
        />
      </Head>
      <h1 className="visually-hidden">Мапа доступних даних</h1>
      <MapWrapper points={combinedPoints} zoom={6} isFullScreen />
    </>
  );
}
