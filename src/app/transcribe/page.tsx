import LogoutButton from './components/logout-button';
import UserView from './user';

export default function TranscribePage() {
  return (
    <div>
      <LogoutButton />
      <UserView />
      <h1>Transcribe</h1>
    </div>
  );
}
