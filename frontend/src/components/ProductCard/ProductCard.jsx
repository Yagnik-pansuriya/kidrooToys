import { FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './ProductCard.scss';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <div className="product-card">
      {product.discount > 0 && (
        <span className="product-card__badge">-{product.discount}%</span>
      )}
      {product.newArrival && (
        <span className="product-card__badge product-card__badge--new">NEW</span>
      )}
      <div className="product-card__image-wrap">
        <img src={product.image} alt={product.name} className="product-card__image" loading="lazy" />
        <div className="product-card__overlay">
          <button
            className="product-card__add-btn"
            onClick={() => addToCart(product)}
          >
            <FiShoppingCart /> Add to Cart
          </button>
        </div>
      </div>
      <div className="product-card__info">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__rating">
          <FiStar className="product-card__star" />
          <span>{product.rating}</span>
          <span className="product-card__reviews">({product.reviews})</span>
        </div>
        <div className="product-card__pricing">
          <span className="product-card__price">₹{product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="product-card__original">₹{product.originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
