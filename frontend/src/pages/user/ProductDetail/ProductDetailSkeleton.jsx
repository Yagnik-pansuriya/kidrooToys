import './pdp-skeleton.css';

/**
 * Placeholder shown while a product loads. Reuses the real .pdp grid classes so
 * the page keeps its shape (header, breadcrumb, gallery, info) and nothing jumps
 * when the product arrives.
 */
const ProductDetailSkeleton = () => (
  <div className="pdp pdp-skel" role="status" aria-busy="true" aria-label="Loading product">
    <div className="pdp__breadcrumb">
      <span className="pdp-skel__block" style={{ width: 44, height: 12 }} />
      <span className="pdp-skel__block" style={{ width: 70, height: 12 }} />
      <span className="pdp-skel__block" style={{ width: 160, height: 12 }} />
    </div>

    <section className="pdp__main">
      <div className="pdp__gallery">
        <div className="pdp-skel__block pdp-skel__image">
          <span className="pdp-skel__toy" aria-hidden="true">🧸</span>
        </div>
        <div className="pdp-skel__thumbs">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="pdp-skel__block pdp-skel__thumb" style={{ '--i': i }} />
          ))}
        </div>
      </div>

      <div className="pdp__info pdp-skel__info">
        <span className="pdp-skel__block pdp-skel__line pdp-skel__line--title" />
        <span className="pdp-skel__block pdp-skel__line pdp-skel__line--title-short" />
        <span className="pdp-skel__block pdp-skel__pill" />

        <div className="pdp-skel__row">
          <span className="pdp-skel__block pdp-skel__price" />
          <span className="pdp-skel__block pdp-skel__mrp" />
          <span className="pdp-skel__block pdp-skel__tag" />
        </div>

        <div className="pdp-skel__para">
          {[100, 96, 92, 64].map((w, i) => (
            <span key={i} className="pdp-skel__block pdp-skel__line" style={{ width: `${w}%` }} />
          ))}
        </div>

        <div className="pdp-skel__row">
          {[0, 1, 2].map((i) => (
            <span key={i} className="pdp-skel__block pdp-skel__chip" />
          ))}
        </div>

        <span className="pdp-skel__block pdp-skel__field" />

        <div className="pdp-skel__row pdp-skel__actions">
          <span className="pdp-skel__block pdp-skel__qty" />
          <span className="pdp-skel__block pdp-skel__btn" />
          <span className="pdp-skel__block pdp-skel__btn pdp-skel__btn--primary" />
        </div>
      </div>
    </section>

    <span className="pdp-skel__sr">Loading product…</span>
  </div>
);

export default ProductDetailSkeleton;
