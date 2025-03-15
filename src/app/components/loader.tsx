import styles from './loader.module.css';

// TODO make it more attractive
export function Loader() {
  return <p className={styles.loading}>Завантаження...</p>;
}

export default Loader;
