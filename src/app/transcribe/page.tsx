import Link from 'next/link';

import ProjectsList from './components/projects-list';

export default function TranscribePage() {
  return (
    <div>
      <h1>Transcription projects</h1>
      <Link href="/transcribe/create">Create project</Link>
      <ProjectsList />
    </div>
  );
}
