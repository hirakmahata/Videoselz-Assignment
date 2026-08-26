/**
 * Merchant dashboard page.
 *
 * Data:
 *   GET /api/analytics/videos — table rows + storewide KPI totals
 *   GET /api/videos           — catalog for Simulate Traffic
 *
 * Conversion rate is addToCart / views and is calculated in the browser
 * (assignment requirement), both for KPIs and for each table row.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createEvent, fetchVideoAnalytics, fetchVideos } from '../services/api.js';
import {
  conversionRate,
  eventLabel,
  formatNumber,
  formatRate,
  pickRandomEventType,
  pickRandomItem,
} from '../services/metrics.js';
import styles from './Dashboard.module.css';

const PAGE_SIZE = 10;

/** Storefront video performance for the current merchant catalog. */
export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState([]);
  // Full catalog (id + title) so simulate can hit a video not on this page.
  const [catalog, setCatalog] = useState([]);
  const [totals, setTotals] = useState({ views: 0, clicks: 0, addToCart: 0 });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  /**
   * @param {number} nextPage
   */
  const loadAnalytics = useCallback(async (nextPage) => {
    setLoading(true);
    setError('');

    try {
      const result = await fetchVideoAnalytics(nextPage, PAGE_SIZE);
      setVideos(result.data);
      setTotals(result.totals);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(page);
  }, [loadAnalytics, page]);

  useEffect(() => {
    fetchVideos()
      .then((result) => setCatalog(result.data))
      .catch(() => {
        // The table still works if the catalog request fails; simulate will
        // fall back to the current page of videos.
      });
  }, []);

  const storeRate = useMemo(
    () => conversionRate(totals.addToCart, totals.views),
    [totals]
  );

  /** Posts one weighted random event, then reloads the current page. */
  async function handleSimulateTraffic() {
    const pool = catalog.length > 0 ? catalog : videos;
    if (pool.length === 0) {
      setError('No videos are available to simulate traffic against.');
      return;
    }

    const video = pickRandomItem(pool);
    const eventType = pickRandomEventType();

    setSimulating(true);
    setError('');
    setNotice('');

    try {
      await createEvent({
        videoId: video.id,
        eventType,
      });
      setNotice(
        `Recorded a ${eventLabel(eventType)} on “${video.title}”. Metrics refreshed.`
      );
      await loadAnalytics(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.wordmark}>Videoselz</span>
          <span className={styles.brandMeta}>Merchant analytics</span>
        </div>
        <span className={styles.brandMeta}>Shoppable video performance</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>See which videos actually sell the product.</h1>
          <p>
            Views, clicks, and add-to-carts for every shoppable video on the
            storefront — plus the conversion rate calculated in the browser.
          </p>
        </div>
      </section>

      <section className={styles.kpis} aria-label="Storewide totals">
        <article className={styles.kpi}>
          <p className={styles.kpiLabel}>Views</p>
          <p className={styles.kpiValue}>{formatNumber(totals.views)}</p>
        </article>
        <article className={styles.kpi}>
          <p className={styles.kpiLabel}>Clicks</p>
          <p className={styles.kpiValue}>{formatNumber(totals.clicks)}</p>
        </article>
        <article className={styles.kpi}>
          <p className={styles.kpiLabel}>Add to carts</p>
          <p className={styles.kpiValue}>{formatNumber(totals.addToCart)}</p>
        </article>
        <article className={styles.kpi}>
          <p className={styles.kpiLabel}>Conversion rate</p>
          <p className={styles.kpiValue}>{formatRate(storeRate)}</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Video performance</h2>
            <p>Conversion rate is add-to-carts divided by views.</p>
          </div>
        </div>

        {notice && (
          <p className={`${styles.banner} ${styles.bannerSuccess}`} role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
