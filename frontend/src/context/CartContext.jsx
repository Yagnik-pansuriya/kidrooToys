import { createContext, useContext, useState, useCallback } from 'react';

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

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('kidroo_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  const saveCart = (items) => {
    localStorage.setItem('kidroo_cart', JSON.stringify(items));
  };

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
