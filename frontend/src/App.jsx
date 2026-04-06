import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// User Layout
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import CartDrawer from './components/CartDrawer/CartDrawer';

// User Pages
import Home from './pages/user/Home/Home';
import Offers from './pages/user/Offers/Offers';
import AboutUs from './pages/user/AboutUs/AboutUs';
import UserProfile from './pages/user/UserProfile/UserProfile';
import Cart from './pages/user/Cart/Cart';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout/AdminLayout';
import Dashboard from './pages/admin/Dashboard/Dashboard';
import AdminCategories from './pages/admin/Categories/AdminCategories';
import AdminProducts from './pages/admin/Products/AdminProducts';
import AdminOrders from './pages/admin/Orders/AdminOrders';
import AdminOffers from './pages/admin/Offers/AdminOffers';
import AdminSettings from './pages/admin/Settings/AdminSettings';
import AdminUsers from './pages/admin/Users/AdminUsers';

// User Layout Wrapper
const UserLayout = ({ children }) => (
  <>
    <Header />
    <CartDrawer />
    <main>{children}</main>
    <Footer />
  </>
);

import { useSelector } from 'react-redux';

// Protected Route — checks auth
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/admin" replace />;
  return children;
};

// Permission Route — checks if user has access to a permission route
// Admin role always has access; other roles check permissions.enabled
const PermissionRoute = ({ permRoute, children }) => {
  const { user, permissions } = useSelector((state) => state.auth);

  // Admin role has full access
  if (user?.role === 'admin') return children;

  // No permRoute means always accessible (Dashboard, Orders)
  if (!permRoute) return children;

  // Check if user has this route enabled
  const perm = permissions.find((p) => p.route === permRoute);
  if (perm?.enabled) return children;

  // Not allowed — redirect to dashboard
  return <Navigate to="/admin/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <Routes>
                {/* User Routes */}
              <Route path="/" element={<UserLayout><Home /></UserLayout>} />
              <Route path="/offers" element={<UserLayout><Offers /></UserLayout>} />
              <Route path="/about" element={<UserLayout><AboutUs /></UserLayout>} />
              <Route path="/profile" element={<UserLayout><UserProfile /></UserLayout>} />
              <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="categories" element={<PermissionRoute permRoute="/categories"><AdminCategories /></PermissionRoute>} />
                <Route path="products" element={<PermissionRoute permRoute="/products"><AdminProducts /></PermissionRoute>} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="offers" element={<PermissionRoute permRoute="/offers"><AdminOffers /></PermissionRoute>} />
                <Route path="settings" element={<PermissionRoute permRoute="/site-settings"><AdminSettings /></PermissionRoute>} />
                <Route path="users" element={<PermissionRoute permRoute="/users"><AdminUsers /></PermissionRoute>} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
  );
}

export default App;
