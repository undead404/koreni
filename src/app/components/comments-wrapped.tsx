'use client';
import dynamic from 'next/dynamic';

import Loader from './loader';

const CommentsWrapped = dynamic(() => import('./comments'), {
  ssr: false,
  loading: () => <Loader />,
});
export default CommentsWrapped;
