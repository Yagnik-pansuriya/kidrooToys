import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import './AdminLogin.scss';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    setTimeout(() => {
      const result = login(username, password);
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 800);
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
            <label><FiUser /> Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="admin-login__field">
            <label><FiLock /> Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="admin-login__btn" disabled={loading}>
            {loading ? <span className="admin-login__spinner" /> : 'Sign In'}
          </button>
          <p className="admin-login__hint">Demo: admin / admin123</p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
