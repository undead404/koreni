import ContributeForm from '../components/contribute/contribute-form';
import knownLocations from '../services/known-locations';

export default function ContributePage() {
  return <ContributeForm knownLocations={knownLocations} />;
}
