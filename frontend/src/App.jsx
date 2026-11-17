import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';

// User Layout
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import CartDrawer from './components/CartDrawer/CartDrawer';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

// User Pages — Home ships in the main bundle; every other page loads on demand
import Home from './pages/user/Home/Home';
const Offers = lazy(() => import('./pages/user/Offers/Offers'));
const AboutUs = lazy(() => import('./pages/user/AboutUs/AboutUs'));
const UserProfile = lazy(() => import('./pages/user/UserProfile/UserProfile'));
const Cart = lazy(() => import('./pages/user/Cart/Cart'));
const ProductDetail = lazy(() => import('./pages/user/ProductDetail/ProductDetail'));
const Shop = lazy(() => import('./pages/user/Shop/Shop'));
const Wishlist = lazy(() => import('./pages/user/Wishlist/Wishlist'));
const Checkout = lazy(() => import('./pages/user/Checkout/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/user/OrderConfirmation/OrderConfirmation'));

// Admin Pages — never downloaded by shoppers
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard/Dashboard'));
const AdminCategories = lazy(() => import('./pages/admin/Categories/AdminCategories'));
const AdminProducts = lazy(() => import('./pages/admin/Products/AdminProducts'));
const AdminOffers = lazy(() => import('./pages/admin/Offers/AdminOffers'));
const AdminSettings = lazy(() => import('./pages/admin/Settings/AdminSettings'));
const AdminUsers = lazy(() => import('./pages/admin/Users/AdminUsers'));
const AdminNewsletter = lazy(() => import('./pages/admin/Newsletter/AdminNewsletter'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews/AdminReviews'));
const AdminBanners = lazy(() => import('./pages/admin/Banners/AdminBanners'));
const AdminSkills = lazy(() => import('./pages/admin/Skills/AdminSkills'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/Customers/AdminCustomerDetail'));
const AdminOrders = lazy(() => import('./pages/admin/Orders/AdminOrders'));
const AdminCarts = lazy(() => import('./pages/admin/Carts/AdminCarts'));
const AdminCartDetail = lazy(() => import('./pages/admin/Carts/AdminCartDetail'));

// User Layout Wrapper
const UserLayout = ({ children }) => (
  <>
    <Header />
    <CartDrawer />
    <main>
      {/* Keeps header/footer in place while a page chunk downloads */}
      <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>{children}</Suspense>
    </main>
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
// adminOnly = true means ONLY admin role can access (no permission override)
const PermissionRoute = ({ permRoute, adminOnly, children }) => {
  const { user, permissions } = useSelector((state) => state.auth);

  // Admin role has full access
  if (user?.role === 'admin') return children;

  // adminOnly routes block all non-admin roles
  if (adminOnly) return <Navigate to="/admin/dashboard" replace />;

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
            <CustomerAuthProvider>
              <Router>
                <ScrollToTop />
                <Suspense fallback={null}>
                <Routes>
                  {/* User Routes */}
                <Route path="/" element={<UserLayout><Home /></UserLayout>} />
                <Route path="/shop" element={<UserLayout><Shop /></UserLayout>} />
                <Route path="/category/:slug" element={<UserLayout><Shop /></UserLayout>} />
                <Route path="/offers" element={<UserLayout><Offers /></UserLayout>} />
                <Route path="/about" element={<UserLayout><AboutUs /></UserLayout>} />
                <Route path="/profile" element={<UserLayout><UserProfile /></UserLayout>} />
                <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />
                <Route path="/product/:slug" element={<UserLayout><ProductDetail /></UserLayout>} />
                <Route path="/wishlist" element={<UserLayout><Wishlist /></UserLayout>} />
                <Route path="/checkout" element={<UserLayout><Checkout /></UserLayout>} />
                <Route path="/order-confirmation/:orderId" element={<UserLayout><OrderConfirmation /></UserLayout>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="categories" element={<PermissionRoute permRoute="/categories"><AdminCategories /></PermissionRoute>} />
                  <Route path="products" element={<PermissionRoute permRoute="/products"><AdminProducts /></PermissionRoute>} />
                  <Route path="orders" element={<PermissionRoute><AdminOrders /></PermissionRoute>} />
                  <Route path="offers" element={<PermissionRoute permRoute="/offers"><AdminOffers /></PermissionRoute>} />
                  <Route path="newsletter" element={<PermissionRoute permRoute="/newsletter"><AdminNewsletter /></PermissionRoute>} />
                  <Route path="reviews" element={<PermissionRoute permRoute="/reviews"><AdminReviews /></PermissionRoute>} />
                  <Route path="banners" element={<PermissionRoute permRoute="/banners"><AdminBanners /></PermissionRoute>} />
                  <Route path="skills" element={<PermissionRoute permRoute="/skills"><AdminSkills /></PermissionRoute>} />
                  <Route path="settings" element={<PermissionRoute permRoute="/site-settings"><AdminSettings /></PermissionRoute>} />
                  <Route path="users" element={<PermissionRoute permRoute="/users" adminOnly><AdminUsers /></PermissionRoute>} />
                  <Route path="customers" element={<PermissionRoute adminOnly><AdminCustomers /></PermissionRoute>} />
                  <Route path="customers/:id" element={<PermissionRoute adminOnly><AdminCustomerDetail /></PermissionRoute>} />
                  <Route path="carts" element={<PermissionRoute adminOnly><AdminCarts /></PermissionRoute>} />
                  <Route path="carts/:customerId" element={<PermissionRoute adminOnly><AdminCartDetail /></PermissionRoute>} />
                </Route>
              </Routes>
                </Suspense>
            </Router>
            </CustomerAuthProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;

