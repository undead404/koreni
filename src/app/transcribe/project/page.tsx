import knownLocations from '@/app/services/known-locations';

import ProjectPageContent from './page-content';

export default function ProjectDetailsPage() {
  return <ProjectPageContent knownLocations={knownLocations} />;
}
