import React from 'react';
import { FiEye, FiEdit2, FiCopy, FiTrash2, FiImage } from 'react-icons/fi';
import { displayTypeLabel, pageLabel, sectionLabel, getOfferStatus, statusMeta } from '../constants/offerConstants';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: 'numeric', minute: '2-digit' }) : '—';

const relative = (status, offer) => {
  const now = Date.now();
  const days = (ms) => Math.max(0, Math.ceil(ms / 86400000));
  if (status === 'scheduled') return `Starts in ${days(new Date(offer.validity.from) - now)}d`;
  if (status === 'expired') return `Ended ${days(now - new Date(offer.validity.to))}d ago`;
  if (offer.validity?.to) {
    const left = days(new Date(offer.validity.to) - now);
    return left <= 1 ? 'Ends today' : `${left}d left`;
  }
  return '';
};

/**
 * @param perf  this offer's analytics for the selected timeframe (views/clicks/orders), if any
 */
const OfferTableRow = ({ offer, perf, timeframeLabel, onPreview, onEdit, onDuplicate, onDelete, onToggleStatus, busy }) => {
  const status = getOfferStatus(offer);
  const meta = statusMeta[status];
  const thumb = offer.images?.[0]?.url || offer.images?.[0];
  const bg = /^#[0-9A-Fa-f]{6}$/.test(offer.styling?.bgColor) ? offer.styling.bgColor : '#FF6B35';
  const lifetime = offer.stats || {};
  const views = perf?.impressions ?? 0;
  const clicks = perf?.clicks ?? 0;
  const ctr = views ? ((clicks / views) * 100).toFixed(1) : '0.0';

  return (
    <tr className={`offer-row offer-row--${status}`}>
      <td>
        <div className="offer-name-cell">
          <button type="button" className="offer-thumb" style={{ background: bg }} onClick={() => onPreview(offer)} title="Preview">
            {thumb ? <img src={thumb} alt="" /> : <FiImage />}
            {offer.images?.length > 1 && <span className="offer-thumb__count">{offer.images.length}</span>}
          </button>
          <div className="offer-name-text">
            <div className="offer-name">{offer.title}</div>
            <div className="offer-type-tag">
              {offer.badgeText && <span className="badge badge-purple">{offer.badgeText}</span>}
              <span>{displayTypeLabel(offer.displayType)}</span>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className="cell-strong">{pageLabel(offer.placement?.page)}</div>
        <div className="cell-muted">
          {sectionLabel(offer.placement?.page, offer.placement?.section)} · #{offer.placement?.position ?? 1}
        </div>
      </td>
      <td>
        <div className="cell-strong">{fmtDate(offer.validity?.from)}</div>
        <div className="cell-muted">→ {fmtDate(offer.validity?.to)}</div>
        <div className={`cell-hint cell-hint--${status}`}>{relative(status, offer)}</div>
      </td>
      <td>
        <div className="perf-cell" title={`Lifetime: ${lifetime.impressions || 0} views · ${lifetime.clicks || 0} clicks`}>
          <div><strong>{views.toLocaleString('en-IN')}</strong> <span>views</span></div>
          <div><strong>{clicks.toLocaleString('en-IN')}</strong> <span>clicks · {ctr}%</span></div>
          <div><strong>{(perf?.orders ?? 0).toLocaleString('en-IN')}</strong> <span>orders</span></div>
        </div>
        <div className="cell-muted cell-muted--tiny">{timeframeLabel}</div>
      </td>
      <td>
        <div className="toggle-wrap">
          <button
            type="button"
            className={`toggle ${offer.isActive ? 'on' : ''}`}
            onClick={() => onToggleStatus(offer)}
            disabled={busy}
            aria-label={offer.isActive ? 'Pause offer' : 'Activate offer'}
            title={offer.isActive ? 'Pause offer' : 'Activate offer'}
          />
          <span className={`badge ${meta.className}`}>{meta.label}</span>
        </div>
      </td>
      <td>
        <div className="action-btns">
          <button type="button" className="icon-btn" onClick={() => onPreview(offer)} title="Preview" aria-label="Preview"><FiEye /></button>
          <button type="button" className="icon-btn" onClick={() => onEdit(offer)} title="Edit" aria-label="Edit"><FiEdit2 /></button>
          <button type="button" className="icon-btn" onClick={() => onDuplicate(offer)} title="Duplicate as draft" aria-label="Duplicate"><FiCopy /></button>
          <button type="button" className="icon-btn icon-btn--danger" onClick={() => onDelete(offer._id || offer.id)} title="Delete" aria-label="Delete"><FiTrash2 /></button>
        </div>
      </td>
    </tr>
  );
};

export default OfferTableRow;
