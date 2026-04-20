import { useState, useCallback } from 'react';
import { FiStar, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { MdRateReview } from 'react-icons/md';
import {
  useGetAllReviewsQuery,
  useDeleteReviewMutation,
  useToggleReviewApprovalMutation,
} from '../../../store/ActionApi/reviewApi';
import { useToast } from '../../../context/ToastContext';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';
import Pagination from '../../../components/Pagination/Pagination';
import Loader from '../../../components/Loader/Loader';
import './AdminReviews.scss';

const REVIEWS_PER_PAGE = 20;

const AdminReviews = () => {
  const [page, setPage] = useState(1);
  const { data: reviewsResp, isLoading } = useGetAllReviewsQuery({ page, limit: REVIEWS_PER_PAGE });
  const [deleteReview] = useDeleteReviewMutation();
  const [toggleApproval] = useToggleReviewApprovalMutation();
  const { showSuccess, showError } = useToast();
  const [toDelete, setToDelete] = useState(null);

  // The API returns { data: { reviews, total, page, limit, pages } }
  const reviewData = reviewsResp?.data || {};
  const reviews = reviewData?.reviews || [];
  const totalPages = reviewData?.pages || 1;
  const totalItems = reviewData?.total || 0;

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteReview(toDelete._id || toDelete.id).unwrap();
      showSuccess('Review deleted');
    } catch (err) {
      showError(err?.data?.message || 'Delete failed');
    } finally {
      setToDelete(null);
    }
  };

  const handleToggle = async (review) => {
    try {
      await toggleApproval(review._id || review.id).unwrap();
      showSuccess(review.isApproved ? 'Review hidden' : 'Review approved');
    } catch (err) {
      showError(err?.data?.message || 'Toggle failed');
    }
  };

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="admin-reviews">
      <div className="admin-reviews__header">
        <h1><MdRateReview /> Reviews</h1>
        <span className="admin-reviews__count">{totalItems} reviews</span>
      </div>

      {isLoading ? (
        <Loader inline message="Loading reviews…" />
      ) : (
        <div className="admin-reviews__table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table__empty">No reviews found.</td>
                </tr>
              ) : (
                reviews.map((review, idx) => (
                  <tr key={review._id || review.id}>
                    <td>{(page - 1) * REVIEWS_PER_PAGE + idx + 1}</td>
                    <td className="td-bold">{review.product?.productName || '—'}</td>
                    <td>{review.user?.name || review.name || '—'}</td>
                    <td>
                      <span className="admin-reviews__rating">
                        <FiStar /> {review.rating}
                      </span>
                    </td>
                    <td>{review.title}</td>
                    <td>
                      <span className={`status ${review.isApproved ? 'status--delivered' : 'status--cancelled'}`}>
                        {review.isApproved ? 'Approved' : 'Hidden'}
                      </span>
                    </td>
                    <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className={`admin-action-btn ${review.isApproved ? 'admin-action-btn--warning' : 'admin-action-btn--success'}`}
                          onClick={() => handleToggle(review)}
                          title={review.isApproved ? 'Hide review' : 'Approve review'}
                        >
                          {review.isApproved ? <FiXCircle /> : <FiCheckCircle />}
                        </button>
                        <button
                          className="admin-action-btn admin-action-btn--delete"
                          onClick={() => setToDelete(review)}
                          title="Delete review"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── Pagination ── */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={REVIEWS_PER_PAGE}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        itemName={toDelete?.title}
        title="Delete Review?"
      />
    </div>
  );
};

export default AdminReviews;
