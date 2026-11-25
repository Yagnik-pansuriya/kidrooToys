import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { useLoginMutation } from '../../../store/ActionApi/authApi';
import { useToast } from '../../../context/ToastContext';
import './AdminLogin.scss';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { showSuccess } = useToast();

  // RTK Query mutation — onQueryStarted in authApi auto-saves response to Redux
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Triggers POST /api/auth/login
      // onQueryStarted in authApi.js auto-dispatches setCredentials to Redux
      await login({ email, password }).unwrap();
      showSuccess('Login successful!');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <span className="admin-login__icon" aria-hidden="true">K</span>
          <h1>Sign in to Kidroo Admin</h1>
          <p>Manage products, orders and customers</p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          {error && <div className="admin-login__error">{error}</div>}

          <div className="admin-login__field">
            <label>Email</label>
            <div className="admin-login__input">
            <FiMail className="admin-login__input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@kidroo.in"
              required
            />
            </div>
          </div>

          <div className="admin-login__field">
            <label>Password</label>
            <div className="admin-login__input admin-login__password-input">
              <FiLock className="admin-login__input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="admin-login__toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-login__btn" disabled={isLoading}>
            {isLoading ? <span className="admin-login__spinner" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin ;
