import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLazyGetCustomerCartQuery, useSyncCustomerCartMutation } from '../store/ActionApi/cartApi';

const CartContext = createContext();

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

/**
 * Normalize a product into a consistent cart item shape.
 * Handles both API products (_id, productName, images[]) and
 * pre-normalized products (id, name, image).
 */
const normalizeCartItem = (product, quantity = 1) => {
  const variant = product.selectedVariant;
  // Build a unique cart key: productId + optional variantId
  const productId = product._id || product.id;
  const variantId = variant?._id || product.variantId || null;
  const cartId = variantId ? `${productId}_${variantId}` : productId;

  return {
    id: cartId,                                // unique key for the cart
    productId,                                 // actual MongoDB product _id
    variantId,                                 // variant _id if any
    name: product.productName || product.name || 'Product',
    image: variant?.images?.[0]
      || (Array.isArray(product.images) ? product.images[0] : null)
      || product.image || '',
    price: variant?.price ?? product.price ?? 0,
    originalPrice: variant?.originalPrice ?? product.originalPrice ?? 0,
    variantName: variant
      ? Object.values(variant.attributes || {}).join(' / ') || variant.sku || ''
      : (product.variantName || ''),
    category: typeof product.category === 'object'
      ? (product.category?.catagoryName || product.category?.name || '')
      : (product.category || ''),
    quantity,
  };
};

/**
 * Merge the server cart into the local cart (used on login / page load).
 * Items present in both keep the larger quantity so repeated syncs never double up.
 */
const mergeCarts = (localItems, serverItems) => {
  const merged = localItems.map((item) => {
    const match = serverItems.find((s) => s.id === item.id);
    return match ? { ...item, quantity: Math.max(item.quantity, match.quantity) } : item;
  });
  serverItems.forEach((s) => {
    if (!merged.some((item) => item.id === s.id)) merged.push(s);
  });
  return merged;
};

const toSyncPayload = (items) =>
  items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity }));

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('kidroo_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const saveCart = (items) => {
    localStorage.setItem('kidroo_cart', JSON.stringify(items));
  };

  // ── Server sync (logged-in customers only) ──────────────────
  const { isCustomerAuthenticated } = useSelector((state) => state.customerAuth);
  const [fetchServerCart] = useLazyGetCustomerCartQuery();
  const [syncServerCart] = useSyncCustomerCartMutation();
  const [isServerSynced, setIsServerSynced] = useState(false);
  const wasAuthenticated = useRef(isCustomerAuthenticated);
  const lastSyncedPayload = useRef(null);

  // On login (or page load while logged in) pull the saved cart and merge it in.
  useEffect(() => {
    if (!isCustomerAuthenticated) {
      setIsServerSynced(false);
      lastSyncedPayload.current = null;
      // The cart now lives on the account, so don't leave it on this device after logout
      if (wasAuthenticated.current) {
        setCartItems([]);
        localStorage.removeItem('kidroo_cart');
      }
      wasAuthenticated.current = false;
      return;
    }

    wasAuthenticated.current = true;
    let cancelled = false;

    fetchServerCart(undefined, false)
      .unwrap()
      .then((res) => {
        if (cancelled) return;
        const serverItems = res?.data?.items || [];
        setCartItems((prev) => {
          const merged = mergeCarts(prev, serverItems);
          saveCart(merged);
          return merged;
        });
        // Only start pushing once we know the server state, so a failed fetch
        // can never overwrite the saved cart with a stale local one.
        setIsServerSynced(true);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [isCustomerAuthenticated, fetchServerCart]);

  // Push local changes to the server (debounced).
  useEffect(() => {
    if (!isCustomerAuthenticated || !isServerSynced) return;

    const payload = toSyncPayload(cartItems);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSyncedPayload.current) return;

    const timer = setTimeout(() => {
      syncServerCart(payload)
        .unwrap()
        .then(() => { lastSyncedPayload.current = serialized; })
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [cartItems, isCustomerAuthenticated, isServerSynced, syncServerCart]);

  const addToCart = useCallback((product, quantity = 1) => {
    const normalized = normalizeCartItem(product, quantity);
    setCartItems(prev => {
      const existing = prev.find(item => item.id === normalized.id);
      let updated;
      if (existing) {
        updated = prev.map(item =>
          item.id === normalized.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, normalized];
      }
      saveCart(updated);
      return updated;
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      saveCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      saveCart(updated);
      return updated;
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('kidroo_cart');
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
