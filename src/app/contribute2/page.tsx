import Comments from '../components/comments/comments';
import ContributeForm2 from '../components/contribute2/contribute-form';
import knownLocations from '../services/known-locations';

export default function ContributePage2() {
  return (
    <>
      <ContributeForm2 knownLocations={knownLocations} />
      <Comments />
    </>
  );
}
