import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useLoginMutation } from '../../../store/ActionApi/authApi';
import './AdminLogin.scss';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  // RTK Query mutation — onQueryStarted in authApi auto-saves response to Redux
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Triggers POST /api/auth/login
      // onQueryStarted in authApi.js auto-dispatches setCredentials to Redux
      const response = await login({ email, password }).unwrap();
      
      // Sync with Context & LocalStorage so ProtectedRoute knows we're logged in
      setAuthData(response.data || { email }); 
      
      toast.success('Login Successful!');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <span className="admin-login__icon">🧸</span>
          <h1>Kidroo Admin</h1>
          <p>Sign in to manage your toy store</p>
        </div>

        <form className="admin-login__form" onSubmit={handleSubmit}>
          {error && <div className="admin-login__error">{error}</div>}

          <div className="admin-login__field">
            <label><FiMail /> Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="admin-login__field">
            <label><FiLock /> Password</label>
            <div className="admin-login__password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="admin-login__password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
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

export default AdminLogin;
