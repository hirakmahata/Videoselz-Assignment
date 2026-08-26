/**
 * Paginated video metrics table.
 *
 * Views / clicks / conversions come from the API. Conversion rate is
 * derived here so the column stays a frontend concern.
 */
import {
  conversionRate,
  formatCents,
  formatNumber,
  formatRate,
} from "../../services/metrics";
import styles from "./AnalyticsTable.module.css";

/**
 * @param {{ addToCart: number, views: number }} props
 */
function RateCell({ addToCart, views }) {
  const rate = conversionRate(addToCart, views);
  const width = rate === null ? 0 : Math.min(rate, 100);
  let fillClass = styles.barFill;

  // Visual hint only — 8%+ reads healthy, under 4% reads weak for this demo.
  if (rate !== null && rate >= 8) {
    fillClass = `${styles.barFill} ${styles.barFillGood}`;
  } else if (rate !== null && rate < 4) {
    fillClass = `${styles.barFill} ${styles.barFillWarn}`;
  }

  return (
    <div className={styles.rate}>
      <span className={styles.rateValue}>{formatRate(rate)}</span>
      <div className={styles.bar} aria-hidden="true">
        <div className={fillClass} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

/**
 * @param {{ videos: Array<{
 *   id: number,
 *   title: string,
 *   productName: string,
 *   productPriceCents: number,
 *   views: number,
 *   clicks: number,
 *   addToCart: number
 * }> }} props
 */
export default function AnalyticsTable({ videos }) {
  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Video</th>
            <th>Product</th>
            <th className={styles.numeric}>Views</th>
            <th className={styles.numeric}>Clicks</th>
            <th className={styles.numeric}>Conversions</th>
            <th className={styles.numeric}>Conversion rate</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id}>
              <td>
                <span className={styles.title}>{video.title}</span>
              </td>
              <td>
                {video.productName}
                <span className={styles.product}>
                  {formatCents(video.productPriceCents)}
                </span>
              </td>
              <td className={styles.numeric}>{formatNumber(video.views)}</td>
              <td className={styles.numeric}>{formatNumber(video.clicks)}</td>
              <td className={styles.numeric}>
                {formatNumber(video.addToCart)}
              </td>
              <td className={styles.numeric}>
                <RateCell addToCart={video.addToCart} views={video.views} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
