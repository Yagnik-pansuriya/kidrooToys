import OfferRenderer from '../../../components/OfferRenderer/OfferRenderer';
import { offers } from '../../../mock/offers';
import './Offers.scss';

const Offers = () => {
  const activeOffers = offers.filter(o => o.active);

  return (
    <div className="offers-page">
      <div className="offers-page__hero">
        <div className="container">
          <h1 className="offers-page__title">🔥 Hot Offers & Deals</h1>
          <p className="offers-page__subtitle">Don't miss out on these amazing deals!</p>
        </div>
      </div>
      <div className="container">
        <div className="offers-page__grid">
          {activeOffers.map(offer => (
            <div className="offers-page__item" key={offer.id}>
              <OfferRenderer offer={offer} />
            </div>
          ))}
        </div>
        {activeOffers.length === 0 && (
          <div className="offers-page__empty">
            <span>😢</span>
            <h3>No active offers right now</h3>
            <p>Check back soon for amazing deals!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
