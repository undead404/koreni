import Link from 'next/link';
import { notFound } from 'next/navigation';

import environment from '@/app/environment';

import ProjectsList from './components/projects-list';

export default function TranscribeDashboardPage() {
  if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) {
    notFound();
  }

  return (
    <div>
      <h1>Transcription projects</h1>
      <Link href="/account/transcribe/create">Create project</Link>
      <ProjectsList />
    </div>
  );
}
