import { useGetActiveOffersQuery } from '../store/ActionApi/offerApi';
import { useGetPublicCouponsQuery } from '../store/ActionApi/couponApi';
import { useGetDealProductsQuery } from '../store/ActionApi/productApi';

const asList = (resp) => {
  const raw = resp?.data || resp || [];
  return Array.isArray(raw) ? raw : [];
};

/**
 * Whether /offers has anything real to show: a live offer banner, a public coupon,
 * or a discounted product. The menu hides the "Offers" link until one exists.
 */
export const useHasOffers = () => {
  const offers = useGetActiveOffersQuery();
  const coupons = useGetPublicCouponsQuery();
  const deals = useGetDealProductsQuery();

  const offerList = asList(offers.data);
  const couponList = asList(coupons.data);
  const dealProducts = deals.data || [];

  return {
    offerList,
    couponList,
    dealProducts,
    offersLoading: offers.isFetching,
    loading: offers.isLoading || coupons.isLoading || deals.isLoading,
    hasOffers: offerList.length > 0 || couponList.length > 0 || dealProducts.length > 0,
  };
};
