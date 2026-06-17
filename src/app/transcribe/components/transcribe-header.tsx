import LogoutButton from './logout-button';
import UserView from './user';

import styles from './transcribe-header.module.css';

export default function TranscribeHeader() {
  return (
    <div className={styles.root}>
      <p>Transcribe</p>
      <UserView />
      <LogoutButton />
    </div>
  );
}
