import Image from 'next/image';

import happyKremlin from '../assets/happykremlin.webp';

import styles from './page.module.css';

export default function NotWelcomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>You are not welcome here</h1>
      <Image className={styles.image} src={happyKremlin} alt="happy kremlin" />
    </div>
  );
}
