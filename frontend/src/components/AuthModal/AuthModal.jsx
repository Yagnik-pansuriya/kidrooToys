import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiX, FiPhone, FiLock, FiUser, FiMail, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiShield } from 'react-icons/fi';
import { useCustomerSignupMutation, useCustomerLoginMutation, useVerifyOTPMutation, useSendOTPMutation } from '../../store/ActionApi/customerAuthApi';
import { useToast } from '../../context/ToastContext';
import './AuthModal.scss';

const STEPS = {
  CHOICE: 'choice',       // Login or Signup
  LOGIN: 'login',         // Mobile + Password
  SIGNUP: 'signup',       // Name, mobile, password, email
  OTP: 'otp',             // Enter OTP
  SUCCESS: 'success',     // Welcome message
};

const AuthModal = ({ isOpen, onClose, onSuccess, message }) => {
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();

  // API hooks
  const [customerSignup, { isLoading: signingUp }] = useCustomerSignupMutation();
  const [customerLogin, { isLoading: loggingIn }] = useCustomerLoginMutation();
  const [verifyOTP, { isLoading: verifyingOTP }] = useVerifyOTPMutation();
  const [sendOTPApi, { isLoading: sendingOTP }] = useSendOTPMutation();

  // Local state
  const [step, setStep] = useState(STEPS.CHOICE);
  const [showPassword, setShowPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [signupData, setSignupData] = useState(null);

  // Form data
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    password: '',
    email: '',
    alternatePhone: '',
  });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(STEPS.CHOICE);
      setForm({ firstName: '', lastName: '', mobile: '', password: '', email: '', alternatePhone: '' });
      setOtpValues(['', '', '', '', '', '']);
      setShowPassword(false);
      setCountdown(0);
    }
  }, [isOpen]);

  // OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Handle OTP input ──────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newValues = [...otpValues];
    pasted.split('').forEach((char, i) => { newValues[i] = char; });
    setOtpValues(newValues);
  };

  // ── Signup ────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    const { firstName, lastName, mobile, password } = form;

    if (!firstName || !lastName || !mobile || !password) {
      showError('Please fill all required fields');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await customerSignup({
        firstName,
        lastName,
        mobile,
        password,
        email: form.email || undefined,
        alternatePhone: form.alternatePhone || undefined,
      }).unwrap();

      setSignupData({ mobile, otp: result?.data?.otp }); // OTP returned in dev mode
      setStep(STEPS.OTP);
      setCountdown(300); // 5 minutes
      showSuccess('OTP sent to your mobile number');

      // Auto-fill OTP in development
      if (result?.data?.otp) {
        const devOtp = result.data.otp.toString().split('');
        setOtpValues(devOtp);
      }
    } catch (err) {
      showError(err?.data?.message || 'Signup failed');
    }
  };

  // ── Login ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    const { mobile, password } = form;

    if (!mobile || !password) {
      showError('Please enter mobile number and password');
      return;
    }

    try {
      await customerLogin({ mobile, password }).unwrap();
      setStep(STEPS.SUCCESS);
      showSuccess('Welcome back!');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      showError(err?.data?.message || 'Login failed');
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');

    if (otp.length !== 6) {
      showError('Please enter the complete 6-digit OTP');
      return;
    }

    try {
      await verifyOTP({ mobile: signupData?.mobile || form.mobile, otp }).unwrap();
      setStep(STEPS.SUCCESS);
      showSuccess('Account verified! Welcome to Kidroo! 🎉');
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      showError(err?.data?.message || 'OTP verification failed');
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      const result = await sendOTPApi({ mobile: signupData?.mobile || form.mobile }).unwrap();
      setCountdown(300);
      showSuccess('OTP resent successfully');

      // Auto-fill in dev
      if (result?.data?.otp) {
        const devOtp = result.data.otp.toString().split('');
        setOtpValues(devOtp);
      }
    } catch (err) {
      showError(err?.data?.message || 'Failed to resend OTP');
    }
  };

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}>
          <FiX />
        </button>

        {/* ═══ STEP: CHOICE ═══ */}
        {step === STEPS.CHOICE && (
          <div className="auth-modal__step auth-modal__step--choice">
            <div className="auth-modal__logo">🧸</div>
            <h2>Welcome to Kidroo</h2>
            {message && <p className="auth-modal__message">{message}</p>}
            <p className="auth-modal__subtitle">Sign in to your account or create a new one</p>

            <div className="auth-modal__choice-btns">
              <button
                className="auth-modal__btn auth-modal__btn--primary"
                onClick={() => setStep(STEPS.LOGIN)}
              >
                <FiUser /> Login
              </button>
              <button
                className="auth-modal__btn auth-modal__btn--outline"
                onClick={() => setStep(STEPS.SIGNUP)}
              >
                <FiArrowRight /> Create Account
              </button>
            </div>

            <div className="auth-modal__divider">
              <span>secure & encrypted</span>
            </div>

            <div className="auth-modal__trust">
              <span><FiShield /> 100% Safe</span>
              <span><FiLock /> Data Protected</span>
            </div>
          </div>
        )}

        {/* ═══ STEP: LOGIN ═══ */}
        {step === STEPS.LOGIN && (
          <div className="auth-modal__step auth-modal__step--login">
            <h2>Welcome Back</h2>
            <p className="auth-modal__subtitle">Login with your mobile number</p>

            <form onSubmit={handleLogin}>
              <div className="auth-modal__field">
                <FiPhone className="auth-modal__field-icon" />
                <div className="auth-modal__field-prefix">+91</div>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={form.mobile}
                  onChange={handleChange}
                  maxLength={10}
                  autoFocus
                  required
                />
              </div>

              <div className="auth-modal__field">
                <FiLock className="auth-modal__field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-modal__field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <button
                type="submit"
                className="auth-modal__submit"
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <span className="auth-modal__spinner" />
                ) : (
                  <>Login <FiArrowRight /></>
                )}
              </button>
            </form>

            <p className="auth-modal__switch">
              Don't have an account?{' '}
              <button onClick={() => setStep(STEPS.SIGNUP)}>Sign Up</button>
            </p>
          </div>
        )}

        {/* ═══ STEP: SIGNUP ═══ */}
        {step === STEPS.SIGNUP && (
          <div className="auth-modal__step auth-modal__step--signup">
            <h2>Create Account</h2>
            <p className="auth-modal__subtitle">Join the Kidroo family today</p>

            <form onSubmit={handleSignup}>
              <div className="auth-modal__row">
                <div className="auth-modal__field">
                  <FiUser className="auth-modal__field-icon" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name *"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="auth-modal__field">
                  <FiUser className="auth-modal__field-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name *"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-modal__field">
                <FiPhone className="auth-modal__field-icon" />
                <div className="auth-modal__field-prefix">+91</div>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Mobile Number *"
                  value={form.mobile}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </div>

              <div className="auth-modal__field">
                <FiLock className="auth-modal__field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password * (min 6 chars)"
                  value={form.password}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="auth-modal__field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="auth-modal__field">
                <FiMail className="auth-modal__field-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-modal__field">
                <FiPhone className="auth-modal__field-icon" />
                <input
                  type="tel"
                  name="alternatePhone"
                  placeholder="Alternate Phone (optional)"
                  value={form.alternatePhone}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>

              <button
                type="submit"
                className="auth-modal__submit"
                disabled={signingUp}
              >
                {signingUp ? (
                  <span className="auth-modal__spinner" />
                ) : (
                  <>Create Account <FiArrowRight /></>
                )}
              </button>
            </form>

            <p className="auth-modal__switch">
              Already have an account?{' '}
              <button onClick={() => setStep(STEPS.LOGIN)}>Login</button>
            </p>
          </div>
        )}

        {/* ═══ STEP: OTP ═══ */}
        {step === STEPS.OTP && (
          <div className="auth-modal__step auth-modal__step--otp">
            <div className="auth-modal__otp-icon">📱</div>
            <h2>Verify Your Number</h2>
            <p className="auth-modal__subtitle">
              We've sent a 6-digit OTP to{' '}
              <strong>+91 {signupData?.mobile || form.mobile}</strong>
            </p>

            <form onSubmit={handleVerifyOTP}>
              <div className="auth-modal__otp-inputs" onPaste={handleOtpPaste}>
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    id={`otp-input-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                    className={val ? 'filled' : ''}
                  />
                ))}
              </div>

              {countdown > 0 && (
                <p className="auth-modal__otp-timer">
                  OTP expires in <strong>{formatTime(countdown)}</strong>
                </p>
              )}

              <button
                type="submit"
                className="auth-modal__submit"
                disabled={verifyingOTP || otpValues.join('').length !== 6}
              >
                {verifyingOTP ? (
                  <span className="auth-modal__spinner" />
                ) : (
                  <>Verify OTP <FiCheck /></>
                )}
              </button>
            </form>

            <p className="auth-modal__switch">
              Didn't receive OTP?{' '}
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0 || sendingOTP}
              >
                {sendingOTP ? 'Sending...' : countdown > 0 ? `Resend in ${formatTime(countdown)}` : 'Resend OTP'}
              </button>
            </p>
          </div>
        )}

        {/* ═══ STEP: SUCCESS ═══ */}
        {step === STEPS.SUCCESS && (
          <div className="auth-modal__step auth-modal__step--success">
            <div className="auth-modal__success-icon">🎉</div>
            <h2>Welcome to Kidroo!</h2>
            <p className="auth-modal__subtitle">Your account is ready. Happy shopping!</p>
            <div className="auth-modal__success-check">
              <FiCheck />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
