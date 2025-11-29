import type { Metadata } from 'next';
import Head from 'next/head';

import MapWrapper from '../components/map-wrapper';
import environment from '../environment';
import combinedPoints from '../services/map-points';

export const metadata: Metadata = {
  title: 'Корені | Мапа доступних даних',
};

export default function MapPage() {
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
