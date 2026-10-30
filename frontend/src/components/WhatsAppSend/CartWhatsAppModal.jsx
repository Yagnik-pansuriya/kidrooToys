import { useState } from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { RiWhatsappLine } from 'react-icons/ri';
import { useToast } from '../../context/ToastContext';
import {
  useGetCartWhatsAppInfoQuery,
  useSendCartReminderOnWhatsAppMutation,
} from '../../store/ActionApi/whatsappApi';
import '../../pages/admin/Customers/AdminCustomers.scss';
import './WhatsAppSend.scss';

const MAX_CHARS = 700;

const fmtINR = (n) => `₹${Math.round(Number(n || 0)).toLocaleString('en-IN')}`;
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';

/** Starting text listing the cart products; the admin edits it before sending. */
const defaultMessage = (items, subtotal) => {
  const available = items.filter((i) => !i.unavailable);
  const names = available.slice(0, 4).map((i) => `${i.name}${i.variantName ? ` (${i.variantName})` : ''} x${i.quantity}`);
  const more = available.length > 4 ? ` and ${available.length - 4} more` : '';
  return `you left ${names.join(', ')}${more} in your cart worth ${fmtINR(subtotal)}. Complete your order today — we'll pack it with care!`;
};

/** Send a custom WhatsApp message about this customer's cart (kidroo_cart_reminder template). */
const CartWhatsAppModal = ({ customer, items, subtotal, onClose }) => {
  const { showSuccess, showError } = useToast();
  const [message, setMessage] = useState(() => defaultMessage(items, subtotal));

  const { data } = useGetCartWhatsAppInfoQuery(customer._id, { refetchOnMountOrArgChange: true });
  const [sendReminder, { isLoading }] = useSendCartReminderOnWhatsAppMutation();

  const info = data?.data;
  const last = info?.lastMessage;
  const tooLong = message.length > MAX_CHARS;

  const handleSend = async () => {
    try {
      const res = await sendReminder({ customerId: customer._id, message: message.trim() }).unwrap();
      showSuccess(res.message || 'WhatsApp sent');
      onClose();
    } catch (err) {
      showError(err?.data?.message || 'WhatsApp send failed');
    }
  };

  return (
    <div className="sms-modal-overlay" onClick={onClose}>
      <div className="sms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sms-modal__header">
          <div className="sms-modal__title-row">
            <RiWhatsappLine className="sms-modal__icon sms-modal__icon--wa" />
            <div>
              <h2>WhatsApp {customer.firstName}</h2>
              <p>+91 {customer.mobile} · about their cart</p>
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
          {last && (
            <span className="sms-modal__warn">
              <FiAlertCircle /> Last cart message {last.status === 'failed' ? 'failed' : 'sent'} {fmtDateTime(last.sentAt || last.createdAt)}
            </span>
          )}

          <div className="sms-modal__field">
            <label htmlFor="wa-cart-message">
              Your message
              <span className={`sms-modal__char ${tooLong ? 'sms-modal__char--over' : ''}`}>
                {message.length}/{MAX_CHARS}
              </span>
            </label>
            <textarea
              id="wa-cart-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. your Teddy Bear is waiting! Use code CART10 for 10% off today."
            />
            <span className="sms-modal__info">
              Line breaks become “ · ” (WhatsApp templates don&apos;t allow them inside variables).
            </span>
          </div>

          {/* Preview — mirrors the kidroo_cart_reminder template */}
          <div className="sms-modal__preview">
            <span className="sms-modal__preview-label">📱 WhatsApp preview</span>
            <div className="sms-modal__bubble">
              Hi <b>{customer.firstName}</b>, {message.replace(/\s*\n+\s*/g, ' · ')}<br /><br />
              Your cart is saved at Kidroo — tap below to complete your order.
              <span className="wa-send__link">🔗 kidroo.in/cart</span>
            </div>
          </div>
        </div>

        <div className="sms-modal__footer">
          <button className="sms-modal__btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="sms-modal__btn-send wa-send__btn"
            onClick={handleSend}
            disabled={!info?.configured || !message.trim() || tooLong || isLoading}
          >
            {isLoading ? 'Sending…' : <><RiWhatsappLine /> Send WhatsApp</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartWhatsAppModal;
