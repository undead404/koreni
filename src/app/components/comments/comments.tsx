import environment from '../../environment';

import Remark42 from './remark42';

import styles from './comments.module.css';

export interface CommentsProperties {
  context?: 'indexation';
}

export default function Comments({ context }: CommentsProperties) {
  if (!environment.NEXT_PUBLIC_REMARK42_HOST) {
    return null;
  }
  return (
    <section className={styles.container} aria-labelledby="comments-title">
      <h2 id="comments-title" className={styles.title}>
        Обговорення та запитання
      </h2>
      {context === 'indexation' && (
        <p className={styles.disclosure}>
          Коментарі — насамперед нотатки для майбутніх дослідників та інших
          відвідувачів. Автор може їх не побачити й не відповісти; коментарі не
          є гарантованим способом зв’язатися з автором.
        </p>
      )}
      <Remark42 host={environment.NEXT_PUBLIC_REMARK42_HOST} siteId="koreni" />
    </section>
  );
}
