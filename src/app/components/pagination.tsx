import styles from './pagination.module.css';

export default function Pagination({
  currentPage,
  totalPages,
  urlBuilder,
}: {
  currentPage: number;
  totalPages: number;
  urlBuilder: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav className={styles.nav}>
      <ul className={`no-disc ${styles.ul}`}>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <li key={page} className={styles.li}>
              {currentPage === page ? (
                <span className={styles.currentPage}>{page}</span>
              ) : (
                <a href={urlBuilder(page)} className={styles.link}>
                  {page}
                </a>
              )}
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
