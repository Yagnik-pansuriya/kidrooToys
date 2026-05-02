import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { useGetWishlistQuery, useToggleWishlistMutation, useClearWishlistMutation } from '../../../store/ActionApi/customerApi';
import { useCustomerAuth } from '../../../context/CustomerAuthContext';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { toggleWishlistId, setWishlistIds } from '../../../store/ReducerApi/customerAuthSlice';
import Loader from '../../../components/Loader/Loader';
import './Wishlist.scss';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { isCustomerAuthenticated, openAuthModal } = useCustomerAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const { data: wishlistResp, isLoading } = useGetWishlistQuery(undefined, {
    skip: !isCustomerAuthenticated,
  });
  const [toggleWishlist] = useToggleWishlistMutation();
  const [clearWishlistApi] = useClearWishlistMutation();

  const wishlistItems = wishlistResp?.data || wishlistResp || [];

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId).unwrap();
      dispatch(toggleWishlistId(productId));
      showSuccess('Removed from wishlist');
    } catch (err) {
      showError('Failed to remove item');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearWishlistApi().unwrap();
      dispatch(setWishlistIds([]));
      showSuccess('Wishlist cleared');
    } catch (err) {
      showError('Failed to clear wishlist');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showSuccess(`${product.productName || product.name} added to cart!`);
  };

  // Not logged in
  if (!isCustomerAuthenticated) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page__hero">
          <h1>My Wishlist</h1>
        </div>
        <div className="wishlist-page__container">
          <div className="wishlist-page__empty">
            <div className="wishlist-page__empty-icon">💝</div>
            <h3>Login to View Your Wishlist</h3>
            <p>Save your favorite toys and come back to them anytime</p>
            <button className="wishlist-page__empty-btn" onClick={() => openAuthModal('Login to view your wishlist')}>
              Login / Sign Up <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader message="Loading your wishlist..." />;

  return (
    <div className="wishlist-page">
      <div className="wishlist-page__hero">
        <h1>My <span className="wishlist-page__accent">Wishlist</span></h1>
        <p>{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved</p>
      </div>

      <div className="wishlist-page__container">
        {wishlistItems.length === 0 ? (
          <div className="wishlist-page__empty">
            <div className="wishlist-page__empty-icon">💝</div>
            <h3>Your Wishlist is Empty</h3>
            <p>Start adding your favorite toys!</p>
            <Link to="/shop" className="wishlist-page__empty-btn">
              Browse Shop <FiArrowRight />
            </Link>
          </div>
        ) : (
          <>
            <div className="wishlist-page__header">
              <span>{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</span>
              <button className="wishlist-page__clear-btn" onClick={handleClearAll}>
                <FiTrash2 /> Clear All
              </button>
            </div>

            <div className="wishlist-page__grid">
              {wishlistItems.map((product) => {
                const name = product.productName || product.name || 'Product';
                const imgSrc = Array.isArray(product.images) ? product.images[0] : product.image;
                const price = Number(product.price || 0);
                const originalPrice = Number(product.originalPrice || 0);
                const discount = product.discountPercentage || (originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0);
                const productId = product._id || product.id;
                const inStock = product.stock > 0;

                return (
                  <div className="wishlist-card" key={productId}>
                    {discount > 0 && (
                      <span className="wishlist-card__badge">-{discount}%</span>
                    )}
                    <button
                      className="wishlist-card__remove"
                      onClick={() => handleRemove(productId)}
                      title="Remove from wishlist"
                    >
                      <FiTrash2 />
                    </button>

                    <Link to={`/product/${productId}`} className="wishlist-card__img-wrap">
                      {imgSrc ? (
                        <img src={imgSrc} alt={name} loading="lazy" />
                      ) : (
                        <div className="wishlist-card__placeholder">📦</div>
                      )}
                    </Link>

                    <div className="wishlist-card__info">
                      <Link to={`/product/${productId}`} className="wishlist-card__name">
                        {name}
                      </Link>

                      <div className="wishlist-card__pricing">
                        <span className="wishlist-card__price">₹{price.toFixed(0)}</span>
                        {originalPrice > price && (
                          <span className="wishlist-card__original">₹{originalPrice.toFixed(0)}</span>
                        )}
                      </div>

                      <span className={`wishlist-card__stock ${inStock ? '' : 'wishlist-card__stock--out'}`}>
                        {inStock ? '✓ In Stock' : '✕ Out of Stock'}
                      </span>

                      <button
                        className="wishlist-card__cart-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={!inStock}
                      >
                        <FiShoppingCart /> {inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
