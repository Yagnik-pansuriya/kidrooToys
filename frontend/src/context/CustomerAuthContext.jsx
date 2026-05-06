import { createContext, useContext, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { customerLogout } from '../store/ReducerApi/customerAuthSlice';
import AuthModal from '../components/AuthModal/AuthModal';

const CustomerAuthContext = createContext();

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
};

export const CustomerAuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { customer, isCustomerAuthenticated, wishlistIds } = useSelector(
    (state) => state.customerAuth
  );

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  /**
   * Check if user is authenticated. If not, show auth modal.
   * Returns true if authenticated, false otherwise.
   * 
   * Usage:
   *   const { requireAuth } = useCustomerAuth();
   *   const handleAction = () => {
   *     if (!requireAuth('Please login to add reviews')) return;
   *     // ... do protected action
   *   };
   */
  const requireAuth = useCallback((message = 'Please login to continue', callback = null) => {
    if (isCustomerAuthenticated) return true;

    setAuthMessage(message);
    setPendingAction(() => callback);
    setIsAuthModalOpen(true);
    return false;
  }, [isCustomerAuthenticated]);

  /**
   * Open auth modal explicitly.
   */
  const openAuthModal = useCallback((message = '') => {
    setAuthMessage(message);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthMessage('');
    setPendingAction(null);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const handleLogout = useCallback(() => {
    dispatch(customerLogout());
  }, [dispatch]);

  /**
   * Check if a product is in the wishlist
   */
  const isInWishlist = useCallback((productId) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isCustomerAuthenticated,
        wishlistIds,
        requireAuth,
        openAuthModal,
        closeAuthModal,
        handleLogout,
        isInWishlist,
      }}
    >
      {children}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={handleAuthSuccess}
        message={authMessage}
      />
    </CustomerAuthContext.Provider>
  );
};

export default CustomerAuthContext;
