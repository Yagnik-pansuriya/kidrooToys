import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

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
import AdminProducts from './pages/admin/Products/AdminProducts';
import AdminOrders from './pages/admin/Orders/AdminOrders';
import AdminOffers from './pages/admin/Offers/AdminOffers';
import AdminSettings from './pages/admin/Settings/AdminSettings';

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

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/admin" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
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
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
