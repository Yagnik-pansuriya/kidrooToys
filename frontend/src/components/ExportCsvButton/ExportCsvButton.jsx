import { useState } from 'react';
import { FiDownload, FiLoader } from 'react-icons/fi';
import './ExportCsvButton.scss';

/**
 * "Export CSV" button for admin lists, with an optional From / To date range.
 * `onExport({ from, to })` does the fetch + download; dates are YYYY-MM-DD or ''.
 */
// eslint-disable-next-line react/prop-types
const ExportCsvButton = ({ onExport, withRange = false, rangeTitle = 'Date range', label = 'Export CSV' }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const invalid = from && to && from > to;

  const run = async () => {
    if (busy || invalid) return;
    setBusy(true);
    try {
      await onExport({ from, to });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="export-csv">
      {withRange && (
        <div className="export-csv__range" title={rangeTitle}>
          <input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
          <span>to</span>
          <input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}
      <button type="button" className="export-csv__btn" onClick={run} disabled={busy || invalid}>
        {busy ? <FiLoader className="export-csv__spin" /> : <FiDownload />} {busy ? 'Preparing…' : label}
      </button>
    </div>
  );
};

export default ExportCsvButton;
