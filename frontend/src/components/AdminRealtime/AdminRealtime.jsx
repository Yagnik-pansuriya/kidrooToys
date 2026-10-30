import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { baseApi } from '../../store/Api';
import { useLazyGetRealtimeTokenQuery } from '../../store/ActionApi/realtimeApi';
import { useToast } from '../../context/ToastContext';
import {
  unlockAdminAudio,
  isAdminAudioLocked,
  playNewOrderSound,
  playCartAddSound,
} from '../../utils/adminSounds';
import './AdminRealtime.scss';

const SOUND_KEY = 'kidroo_admin_sound';
const LAST_SOUND_KEY = 'kidroo_admin_sound_last';
const CART_SOUND_GAP_MS = 2000;
const MAX_RETRY_MS = 60000;

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// With several admin tabs open, only the first tab to see an update plays its sound
const claimSound = (eventId) => {
  if (!eventId) return true;
  try {
    if (localStorage.getItem(LAST_SOUND_KEY) === eventId) return false;
    localStorage.setItem(LAST_SOUND_KEY, eventId);
  } catch { /* storage blocked — just play */ }
  return true;
};

const showDesktopNotification = (title, body, onClick) => {
  if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, tag: title });
  n.onclick = () => { window.focus(); onClick(); n.close(); };
};

/**
 * Live admin alerts over Mercure: plays a sound and shows a toast for new
 * orders and add-to-cart events, and refreshes the affected admin lists.
 */
const AdminRealtime = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [fetchToken] = useLazyGetRealtimeTokenQuery();

  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
  });
  const [status, setStatus] = useState('connecting'); // connecting | live | off
  const [audioLocked, setAudioLocked] = useState(isAdminAudioLocked);

  // Latest values for the long-lived EventSource handlers
  const live = useRef({});
  live.current = { soundOn, toast, navigate };

  // Browsers block audio until the first interaction with the page
  useEffect(() => {
    const unlock = () => {
      unlockAdminAudio();
      setTimeout(() => setAudioLocked(isAdminAudioLocked()), 100);
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    let es = null;
    let retryTimer = null;
    let stopped = false;
    let attempt = 0;
    let hasConnected = false;
    let lastCartSound = 0;

    const scheduleRetry = () => {
      if (stopped) return;
      const delay = Math.min(MAX_RETRY_MS, 2000 * 2 ** attempt);
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    const onNewOrder = (e) => {
      const { order, customer } = JSON.parse(e.data);
      const { soundOn, toast, navigate } = live.current;
      if (soundOn && claimSound(e.lastEventId)) playNewOrderSound();

      const method = order.paymentMethod === 'cod' ? 'COD' : 'Paid online';
      toast.showSuccess(`🛍️ New order ${order.orderId} · ${formatINR(order.netAmount)} (${method}) · ${customer.name}`);
      showDesktopNotification(
        'New order received',
        `${order.orderId} · ${formatINR(order.netAmount)} · ${customer.name}`,
        () => navigate('/admin/orders'),
      );
      dispatch(baseApi.util.invalidateTags(['Orders']));
    };

    const onCartAdd = (e) => {
      const { customer, added, cartTotal } = JSON.parse(e.data);
      const { soundOn, toast, navigate } = live.current;
      const now = Date.now();
      if (soundOn && now - lastCartSound > CART_SOUND_GAP_MS && claimSound(e.lastEventId)) {
        lastCartSound = now;
        playCartAddSound();
      }

      const [first, ...rest] = added;
      const what = `${first.quantity}× ${first.name}${rest.length ? ` +${rest.length} more` : ''}`;
      toast.showInfo(`🛒 ${customer.name} added ${what} · cart ${formatINR(cartTotal)}`);
      showDesktopNotification(
        'Item added to cart',
        `${customer.name} added ${what}`,
        () => navigate(`/admin/carts/${customer._id}`),
      );
      dispatch(baseApi.util.invalidateTags(['AdminCarts']));
    };

    const connect = async () => {
      let config;
      try {
        const res = await fetchToken(undefined, false).unwrap();
        config = res?.data;
      } catch (err) {
        // 503 = hub not configured on the server, 401/403 = no access: don't retry
        if ([401, 403, 503].includes(err?.status)) { setStatus('off'); return; }
        setStatus('connecting');
        scheduleRetry();
        return;
      }
      if (stopped || !config?.hubUrl) return;

      const url = new URL(config.hubUrl, window.location.origin);
      config.topics.forEach((t) => url.searchParams.append('topic', t));
      url.searchParams.set('authorization', config.token);

      es = new EventSource(url.toString());
      es.addEventListener('new-order', onNewOrder);
      es.addEventListener('cart-add', onCartAdd);
      es.onopen = () => {
        attempt = 0;
        setStatus('live');
        // Catch up on anything missed while disconnected
        if (hasConnected) dispatch(baseApi.util.invalidateTags(['Orders', 'AdminCarts']));
        hasConnected = true;
      };
      // Reconnect with a fresh token (the old one may have expired)
      es.onerror = () => {
        es.close();
        setStatus('connecting');
        scheduleRetry();
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      es?.close();
    };
  }, [dispatch, fetchToken]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem(SOUND_KEY, next ? 'on' : 'off'); } catch { /* ignore */ }
    if (next) {
      unlockAdminAudio();
      setTimeout(() => {
        setAudioLocked(isAdminAudioLocked());
        playCartAddSound();
      }, 100);
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  };

  const statusLabel = {
    live: 'Live alerts connected',
    connecting: 'Connecting to live alerts…',
    off: 'Live alerts unavailable',
  }[status];
  const needsClick = soundOn && audioLocked && status !== 'off';

  return (
    <button
      type="button"
      className={`admin-realtime admin-realtime--${status} ${needsClick ? 'admin-realtime--locked' : ''}`}
      onClick={toggleSound}
      title={`${statusLabel} · Sound ${soundOn ? 'on' : 'off'}${needsClick ? ' (click to enable audio)' : ''}`}
      aria-label={`${soundOn ? 'Mute' : 'Unmute'} order alerts. ${statusLabel}`}
      aria-pressed={soundOn}
    >
      {soundOn ? <FiBell /> : <FiBellOff />}
      <span className="admin-realtime__dot" />
    </button>
  );
};

export default AdminRealtime;
