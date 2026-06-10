import knownLocations from '@/app/services/known-locations';

import CreatePageContent from './page-content';

export default function ProjectCreatePage() {
  return <CreatePageContent knownLocations={knownLocations} />;
}
