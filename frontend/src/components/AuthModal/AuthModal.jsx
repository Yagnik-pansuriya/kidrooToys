import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { FiX, FiPhone, FiLock, FiUser, FiMail, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiShield, FiArrowLeft } from 'react-icons/fi';
import { useCustomerSignupMutation, useCustomerLoginMutation, useVerifyOTPMutation, useSendOTPMutation } from '../../store/ActionApi/customerAuthApi';
import { useToast } from '../../context/ToastContext';
import './AuthModal.scss';

const STEPS = {
  CHOICE: 'choice',
  LOGIN: 'login',
  SIGNUP: 'signup',
  OTP: 'otp',
  SUCCESS: 'success',
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
  const [signupMobile, setSignupMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  // Form data
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    password: '',
    email: '',
  });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(STEPS.CHOICE);
      setForm({ firstName: '', lastName: '', mobile: '', password: '', email: '' });
      setOtpValues(['', '', '', '', '', '']);
      setShowPassword(false);
      setCountdown(0);
      setSignupMobile('');
      setSignupEmail('');
    }
  }, [isOpen]);

  // OTP countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── OTP input handlers ────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);

    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
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
    const { firstName, lastName, mobile, password, email } = form;

    if (!firstName || !lastName || !mobile || !password || !email) {
      showError('Please fill all required fields');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      await customerSignup({ firstName, lastName, mobile, password, email }).unwrap();
      setSignupMobile(mobile);
      setSignupEmail(email);
      setStep(STEPS.OTP);
      setCountdown(300);
      showSuccess('OTP sent to your email!');
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
      setTimeout(() => { onClose(); onSuccess?.(); }, 1500);
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
      await verifyOTP({ mobile: signupMobile || form.mobile, otp }).unwrap();
      setStep(STEPS.SUCCESS);
      showSuccess('Account verified! Welcome to Kidroo! 🎉');
      setTimeout(() => { onClose(); onSuccess?.(); }, 1500);
    } catch (err) {
      showError(err?.data?.message || 'OTP verification failed');
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    try {
      await sendOTPApi({ mobile: signupMobile || form.mobile, email: signupEmail }).unwrap();
      setCountdown(300);
      setOtpValues(['', '', '', '', '', '']);
      showSuccess('New OTP sent to your email');
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

  // Mask email for display
  const maskEmail = (email) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    return `${user[0]}${'•'.repeat(Math.max(user.length - 2, 2))}${user.slice(-1)}@${domain}`;
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose}><FiX /></button>

        {/* ═══ CHOICE ═══ */}
        {step === STEPS.CHOICE && (
          <div className="auth-step auth-step--choice">
            <div className="auth-step__brand">
              <span className="auth-step__emoji">🧸</span>
              <h2>Welcome to <span>Kidroo</span></h2>
            </div>
            {message && <div className="auth-step__alert">{message}</div>}
            <p className="auth-step__desc">Sign in to your account or create a new one to start shopping</p>

            <div className="auth-step__actions">
              <button className="auth-btn auth-btn--filled" onClick={() => setStep(STEPS.LOGIN)}>
                <FiUser /> Login to Account
              </button>
              <button className="auth-btn auth-btn--ghost" onClick={() => setStep(STEPS.SIGNUP)}>
                Create New Account <FiArrowRight />
              </button>
            </div>

            <div className="auth-step__footer">
              <span><FiShield /> 100% Secure</span>
              <span><FiLock /> Data Protected</span>
            </div>
          </div>
        )}

        {/* ═══ LOGIN ═══ */}
        {step === STEPS.LOGIN && (
          <div className="auth-step auth-step--form">
            <button className="auth-step__back" onClick={() => setStep(STEPS.CHOICE)}>
              <FiArrowLeft /> Back
            </button>
            <div className="auth-step__header">
              <div className="auth-step__icon-circle"><FiUser /></div>
              <h2>Welcome Back</h2>
              <p>Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <label className="auth-input">
                <span className="auth-input__label">Mobile Number</span>
                <div className="auth-input__wrap">
                  <span className="auth-input__prefix">+91</span>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter 10-digit number"
                    value={form.mobile}
                    onChange={handleChange}
                    maxLength={10}
                    autoFocus
                    required
                  />
                </div>
              </label>

              <label className="auth-input">
                <span className="auth-input__label">Password</span>
                <div className="auth-input__wrap">
                  <FiLock className="auth-input__icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" className="auth-input__eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <button type="submit" className="auth-submit" disabled={loggingIn}>
                {loggingIn ? <span className="auth-spinner" /> : <>Login <FiArrowRight /></>}
              </button>
            </form>

            <p className="auth-switch">
              Don't have an account? <button onClick={() => setStep(STEPS.SIGNUP)}>Sign Up</button>
            </p>
          </div>
        )}

        {/* ═══ SIGNUP ═══ */}
        {step === STEPS.SIGNUP && (
          <div className="auth-step auth-step--form">
            <button className="auth-step__back" onClick={() => setStep(STEPS.CHOICE)}>
              <FiArrowLeft /> Back
            </button>
            <div className="auth-step__header">
              <div className="auth-step__icon-circle auth-step__icon-circle--green"><FiArrowRight /></div>
              <h2>Create Account</h2>
              <p>Join the Kidroo family</p>
            </div>

            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-form__row">
                <label className="auth-input">
                  <span className="auth-input__label">First Name *</span>
                  <div className="auth-input__wrap">
                    <FiUser className="auth-input__icon" />
                    <input type="text" name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} required />
                  </div>
                </label>
                <label className="auth-input">
                  <span className="auth-input__label">Last Name *</span>
                  <div className="auth-input__wrap">
                    <FiUser className="auth-input__icon" />
                    <input type="text" name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} required />
                  </div>
                </label>
              </div>

              <label className="auth-input">
                <span className="auth-input__label">Mobile Number *</span>
                <div className="auth-input__wrap">
                  <span className="auth-input__prefix">+91</span>
                  <input type="tel" name="mobile" placeholder="10-digit mobile" value={form.mobile} onChange={handleChange} maxLength={10} required />
                </div>
              </label>

              <label className="auth-input">
                <span className="auth-input__label">Email Address *</span>
                <div className="auth-input__wrap">
                  <FiMail className="auth-input__icon" />
                  <input type="email" name="email" placeholder="your@email.com — OTP will be sent here" value={form.email} onChange={handleChange} required />
                </div>
                <span className="auth-input__hint">📧 Verification OTP will be sent to this email</span>
              </label>

              <label className="auth-input">
                <span className="auth-input__label">Password *</span>
                <div className="auth-input__wrap">
                  <FiLock className="auth-input__icon" />
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} minLength={6} required />
                  <button type="button" className="auth-input__eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <button type="submit" className="auth-submit" disabled={signingUp}>
                {signingUp ? <span className="auth-spinner" /> : <>Create Account <FiArrowRight /></>}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <button onClick={() => setStep(STEPS.LOGIN)}>Login</button>
            </p>
          </div>
        )}

        {/* ═══ OTP ═══ */}
        {step === STEPS.OTP && (
          <div className="auth-step auth-step--otp">
            <button className="auth-step__back" onClick={() => setStep(STEPS.SIGNUP)}>
              <FiArrowLeft /> Back
            </button>
            <div className="auth-step__header">
              <div className="auth-step__icon-circle auth-step__icon-circle--blue">📧</div>
              <h2>Check Your Email</h2>
              <p>
                We've sent a 6-digit code to<br />
                <strong>{maskEmail(signupEmail)}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="auth-form">
              <div className="auth-otp" onPaste={handleOtpPaste}>
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
                <p className="auth-otp__timer">
                  Code expires in <strong>{formatTime(countdown)}</strong>
                </p>
              )}

              <button type="submit" className="auth-submit" disabled={verifyingOTP || otpValues.join('').length !== 6}>
                {verifyingOTP ? <span className="auth-spinner" /> : <>Verify & Continue <FiCheck /></>}
              </button>
            </form>

            <p className="auth-switch">
              Didn't receive the code?{' '}
              <button onClick={handleResendOTP} disabled={countdown > 0 || sendingOTP}>
                {sendingOTP ? 'Sending...' : countdown > 0 ? `Wait ${formatTime(countdown)}` : 'Resend Code'}
              </button>
            </p>
          </div>
        )}

        {/* ═══ SUCCESS ═══ */}
        {step === STEPS.SUCCESS && (
          <div className="auth-step auth-step--success">
            <div className="auth-success__confetti">🎉</div>
            <h2>Welcome to Kidroo!</h2>
            <p className="auth-step__desc">Your account is ready. Happy shopping!</p>
            <div className="auth-success__check"><FiCheck /></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
