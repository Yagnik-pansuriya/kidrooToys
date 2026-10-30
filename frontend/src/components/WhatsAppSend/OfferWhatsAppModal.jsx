import { useState, useEffect } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { RiWhatsappLine } from 'react-icons/ri';
import { useToast } from '../../context/ToastContext';
import {
  useGetOfferWhatsAppInfoQuery,
  useSendOfferOnWhatsAppMutation,
} from '../../store/ActionApi/whatsappApi';
import '../../pages/admin/Customers/AdminCustomers.scss';
import './WhatsAppSend.scss';

const AUDIENCES = [
  { key: 'all',        label: 'All customers' },
  { key: 'repeat',     label: 'Repeat buyers (2+ orders)' },
  { key: 'high_value', label: 'VIP customers (₹1,000+ spent)' },
  { key: 'new',        label: 'New this month' },
  { key: 'at_risk',    label: 'At-risk (no order in 90 days)' },
];

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

const errMessage = (err, fallback) => err?.data?.message || fallback;

/** "Send on WhatsApp" dialog for one offer (kidroo_offer_alert template). */
const OfferWhatsAppModal = ({ offer, onClose }) => {
  const { showSuccess, showError } = useToast();
  const offerId = offer._id || offer.id;

  const [targetGroup, setTargetGroup] = useState('all');
  const [testMobile, setTestMobile] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pollMs, setPollMs] = useState(0);

  const { data, isFetching } = useGetOfferWhatsAppInfoQuery(
    { id: offerId, targetGroup },
    { refetchOnMountOrArgChange: true, pollingInterval: pollMs }
  );
  const [sendOffer, { isLoading: isSending }] = useSendOfferOnWhatsAppMutation();

  const info = data?.data;
  const content = info?.content;
  const last = info?.lastCampaign;
  const audience = info?.audienceCount ?? 0;
  const inFlight = last?.status === 'sending';
  const alreadySent = last?.status === 'sent';

  // Keep refreshing while a send is running in the background
  useEffect(() => { setPollMs(inFlight ? 4000 : 0); }, [inFlight]);
  useEffect(() => { setConfirmed(false); }, [targetGroup]);

  const blocked = !info || !info.configured || info.problems.length > 0 || inFlight;

  const handleTest = async () => {
    try {
      const res = await sendOffer({ id: offerId, testMobile }).unwrap();
      showSuccess(res.message || 'Test message sent');
    } catch (err) {
      showError(errMessage(err, 'Test send failed'));
    }
  };

  const handleSend = async () => {
    try {
      const res = await sendOffer({ id: offerId, targetGroup, resend: alreadySent }).unwrap();
      showSuccess(res.message || 'Sending on WhatsApp…');
      onClose();
    } catch (err) {
      showError(errMessage(err, 'WhatsApp send failed'));
    }
  };

  return (
    <div className="sms-modal-overlay" onClick={onClose}>
      <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-modal__header">
          <div className="sms-modal__title-row">
            <RiWhatsappLine className="sms-modal__icon sms-modal__icon--wa" />
            <div>
              <h2>Send offer on WhatsApp</h2>
              <p>{offer.title}</p>
            </div>
          </div>
          <button className="sms-modal__close" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <div className="sms-modal__body">
          {info && !info.configured && (
            <span className="sms-modal__warn">
              <FiAlertCircle /> WhatsApp isn&apos;t configured on the server (MSG91 keys missing).
            </span>
          )}

          {info?.problems?.length > 0 && (
            <ul className="wa-send__problems">
              {info.problems.map((p) => <li key={p}>⚠️ {p}</li>)}
            </ul>
          )}

          {/* Preview — mirrors the kidroo_offer_alert template */}
          {content && (
            <div className="sms-modal__preview">
              <span className="sms-modal__preview-label">📱 WhatsApp preview</span>
              <div className="sms-modal__bubble">
                {content.imageUrl && <img className="wa-send__image" src={content.imageUrl} alt="" />}
                Hi <b>Customer</b>! 🎉 New offer at Kidroo:<br />
                <span className="wa-send__bubble-title">{content.title}</span><br /><br />
                {content.details}<br /><br />
                Tap below to shop now.
                <span className="wa-send__link">🔗 kidroo.in/{content.buttonPath}</span>
              </div>
            </div>
          )}

          <div className="sms-modal__field">
            <label htmlFor="wa-offer-audience">Send to</label>
            <select id="wa-offer-audience" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
              {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
            {info && (
              <span className="sms-modal__info">
                {isFetching ? 'Counting…' : `${audience.toLocaleString('en-IN')} customers with a mobile number`}
              </span>
            )}
          </div>

          {inFlight && (
            <span className="sms-modal__warn"><FiAlertCircle /> Sending to {last.sentCount} customers right now…</span>
          )}
          {alreadySent && (
            <span className="sms-modal__warn">
              <FiAlertCircle /> Already sent {fmtDateTime(last.sentAt)} to {last.targetLabel} ({last.deliveredCount} accepted, {last.failedCount} failed)
            </span>
          )}

          <div className="sms-modal__field">
            <label htmlFor="wa-offer-test">Send a test to your own number first</label>
            <div className="wa-send__test-row">
              <input
                id="wa-offer-test"
                inputMode="numeric"
                placeholder="10-digit mobile"
                value={testMobile}
                onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
              <button
                type="button"
                className="wa-send__test-btn"
                onClick={handleTest}
                disabled={blocked || testMobile.length !== 10 || isSending}
              >
                Send test
              </button>
            </div>
          </div>

          <label className="wa-send__confirm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={blocked} />
            <span>
              {alreadySent ? 'Send again: ' : ''}I understand this sends a WhatsApp message to{' '}
              <b>{audience.toLocaleString('en-IN')} customers</b> and can&apos;t be undone.
            </span>
          </label>
        </div>

        <div className="sms-modal__footer">
          <button className="sms-modal__btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="sms-modal__btn-send wa-send__btn"
            onClick={handleSend}
            disabled={blocked || !confirmed || !audience || isSending || isFetching}
          >
            {isSending ? 'Starting…' : <><RiWhatsappLine /> Send to {audience.toLocaleString('en-IN')}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferWhatsAppModal;
