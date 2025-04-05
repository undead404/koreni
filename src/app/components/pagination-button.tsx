import styles from './pagination-button.module.css';

export default function PaginationButton({
  page,
  urlBuilder,
  isCurrent,
}: {
  page: number;
  urlBuilder: (page: number) => string;
  isCurrent?: boolean;
}) {
  return isCurrent ? (
    <span className={styles.currentPage}>{page}</span>
  ) : (
    <a href={urlBuilder(page)} className={styles.link}>
      {page}
    </a>
  );
}
