import PaginationButton from './pagination-button';

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

  if (totalPages <= 7) {
    return (
      <nav className={styles.nav} aria-labelledby="table-pagination">
        <h3 id="table-pagination" className="visually-hidden">
          Пагінація
        </h3>
        <ul className={`no-disc ${styles.ul}`}>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <li>
                <PaginationButton
                  key={page}
                  page={page}
                  isCurrent={currentPage === page}
                  urlBuilder={urlBuilder}
                />
              </li>
            ),
          )}
        </ul>
      </nav>
    );
  }

  const isStarting = currentPage <= 4;
  const isEnding = currentPage >= totalPages - 3;

  return (
    <nav className={styles.nav} aria-labelledby="table-pagination">
      <h3 id="table-pagination" className="visually-hidden">
        Пагінація
      </h3>
      <ul className={`no-disc ${styles.ul}`}>
        <li>
          <PaginationButton
            page={1}
            isCurrent={currentPage === 1}
            urlBuilder={urlBuilder}
          />
        </li>

        {isStarting ? (
          <li>
            <PaginationButton
              page={2}
              isCurrent={currentPage === 2}
              urlBuilder={urlBuilder}
            />
          </li>
        ) : (
          <li>
            <span className={styles.rest}>...</span>
          </li>
        )}

        <li>
          <PaginationButton
            page={isStarting ? 3 : isEnding ? totalPages - 4 : currentPage - 1}
            isCurrent={currentPage === 3}
            urlBuilder={urlBuilder}
          />
        </li>
        <li>
          <PaginationButton
            page={isStarting ? 4 : isEnding ? totalPages - 3 : currentPage}
            isCurrent={
              isStarting
                ? currentPage === 4
                : isEnding
                  ? currentPage === totalPages - 3
                  : true
            }
            urlBuilder={urlBuilder}
          />
        </li>
        <li>
          <PaginationButton
            page={isStarting ? 5 : isEnding ? totalPages - 2 : currentPage + 1}
            isCurrent={currentPage === totalPages - 2}
            urlBuilder={urlBuilder}
          />
        </li>

        {isEnding ? (
          <li>
            <PaginationButton
              page={totalPages - 1}
              isCurrent={currentPage === totalPages - 1}
              urlBuilder={urlBuilder}
            />
          </li>
        ) : (
          <li>
            <span className={styles.rest}>...</span>
          </li>
        )}

        <li>
          <PaginationButton
            page={totalPages}
            isCurrent={currentPage === totalPages}
            urlBuilder={urlBuilder}
          />
        </li>
      </ul>
    </nav>
  );
}
