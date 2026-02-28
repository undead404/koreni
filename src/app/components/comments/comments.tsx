import environment from '../../environment';

import Remark42 from './remark42';

import styles from './comments.module.css';

export default function Comments() {
  if (!environment.NEXT_PUBLIC_REMARK42_HOST) {
    return null;
  }
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Обговорення та запитання</h2>
      <Remark42 host={environment.NEXT_PUBLIC_REMARK42_HOST} siteId="koreni" />
    </div>
  );
}
