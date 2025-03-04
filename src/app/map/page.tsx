import Link from 'next/link';

import getTablesMetadata from '@/shared/get-tables-metadata';

import MapWrapper from '../components/map-wrapper';

export default async function MapPage() {
  const tablesMetadata = await getTablesMetadata();
  const points = tablesMetadata.map((tableMetadata) => ({
    coordinates: tableMetadata.location,
    title: <Link href={`/${tableMetadata.id}/1`}>{tableMetadata.title}</Link>,
  }));
  return <MapWrapper open points={points} zoom={6} />;
}
