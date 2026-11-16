// CSV downloads for admin reports. The BOM makes Excel open UTF-8 (₹, names) correctly.

export const downloadCsv = (filename, rows) => {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** dd-mm-yyyy in IST — sorts and reads cleanly in Excel / accounting tools */
export const csvDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-') : '');

export const csvDateTime = (d) => (d
  ? new Date(d).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }).replace(/\//g, '-').replace(',', '')
  : '');

/** "2026-11-16" — for file names */
export const fileStamp = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

/** "-from-2026-11-01-to-2026-11-15" (or "") — appended to file names when a date range is set */
export const rangeSuffix = (from, to) => `${from ? `-from-${from}` : ''}${to ? `-to-${to}` : ''}`;
