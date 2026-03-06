import type { ContributeFormProperties } from '../contribute/types';

import Stepper from './stepper';

import styles from './contribute-form.module.css';

// eslint-disable-next-line no-empty-pattern
export default function ContributeForm2({}: ContributeFormProperties) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Нова таблиця</h1>
        <p className={styles.description}>
          Пройдіть стежкою вниз, аби завантажити, оформити та опублікувати свої
          дані.
        </p>
      </div>

      <Stepper />
    </div>
  );
}
