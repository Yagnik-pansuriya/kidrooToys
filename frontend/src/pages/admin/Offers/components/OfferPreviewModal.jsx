import React from 'react';
import { FiX, FiEdit2, FiExternalLink } from 'react-icons/fi';
import { OfferSlotPreview } from '../../../../components/OfferSlot/OfferSlot';
import { pageLabel, sectionLabel, getOfferStatus, statusMeta, displayTypeLabel } from '../constants/offerConstants';

const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const OfferPreviewModal = ({ preview, onClose, onEdit }) => {
  if (!preview) return null;
  const status = getOfferStatus(preview);
  const stats = preview.stats || {};
  const ctr = stats.impressions ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0.0';

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div className="offer-modal premium-modal offer-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="modal-header-icon">👀</div>
            <div>
              <h2>{preview.title}</h2>
              <p>Exactly how shoppers see it in {pageLabel(preview.placement?.page)} → {sectionLabel(preview.placement?.page, preview.placement?.section)}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <div className="modal-body">
          <div className="storefront-preview">
            <OfferSlotPreview offers={[preview]} section={preview.placement?.section} />
          </div>

          <div className="preview-meta-grid">
            <div><span>Status</span><strong className={`badge ${statusMeta[status].className}`}>{statusMeta[status].label}</strong></div>
            <div><span>Format</span><strong>{displayTypeLabel(preview.displayType)} · {preview.images?.length || 0} image(s)</strong></div>
            <div><span>Starts</span><strong>{fmt(preview.validity?.from)}</strong></div>
            <div><span>Ends</span><strong>{fmt(preview.validity?.to)}</strong></div>
            <div><span>Display order</span><strong>#{preview.placement?.position ?? 1}</strong></div>
            <div>
              <span>Link</span>
              <strong>
                {preview.targetUrl
                  ? <a href={preview.targetUrl} target="_blank" rel="noopener noreferrer">{preview.targetUrl} <FiExternalLink /></a>
                  : '/offers (default)'}
              </strong>
            </div>
            <div><span>Lifetime views</span><strong>{(stats.impressions || 0).toLocaleString('en-IN')}</strong></div>
            <div><span>Lifetime clicks</span><strong>{(stats.clicks || 0).toLocaleString('en-IN')} ({ctr}% CTR)</strong></div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-pills" type="button" onClick={() => { onClose(); onEdit(preview); }}>
            <FiEdit2 /> Edit Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;
