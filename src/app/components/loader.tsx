import styles from './loader.module.css';

export function Loader() {
  return (
    <p role="status" className={styles.loading}>
      Завантаження...
    </p>
  );
}

export default Loader;
