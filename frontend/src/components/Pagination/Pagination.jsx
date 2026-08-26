import styles from "./Pagination.module.css";

/**
 * Previous / next controls bound to GET /api/analytics/videos.
 * Changing page only updates React state; Dashboard's effect refetches.
 * @param {{
 *   pagination: { page: number, limit: number, total: number, totalPages: number },
 *   onPageChange: (page: number) => void
 * }} props
 */
export default function Pagination({ pagination, onPageChange }) {
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className={styles.footer}>
      <p className={styles.pageMeta}>
        Showing {start}–{end} of {pagination.total} videos
      </p>
      <div className={styles.pager}>
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
