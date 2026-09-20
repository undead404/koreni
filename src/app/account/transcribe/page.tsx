import Link from 'next/link';
import { notFound } from 'next/navigation';

import environment from '@/app/environment';

import ProjectsList from './components/projects-list';

import styles from './page.module.css';

export default function TranscribeDashboardPage() {
  if (!environment.NEXT_PUBLIC_ENABLE_TRANSCRIBE) {
    notFound();
  }

  return (
    <main className={styles.root}>
      <div className={styles.introduction}>
        <h1>Transcription projects</h1>
        <Link href="/account/transcribe/create">Create project</Link>
      </div>
      <ProjectsList />
    </main>
  );
}
