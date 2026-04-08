import { useState } from 'react';
import { FiMail, FiTrash2, FiUsers, FiUserCheck, FiUserX } from 'react-icons/fi';
import {
  useGetSubscribersQuery,
  useGetNewsletterStatsQuery,
  useRemoveSubscriberMutation,
} from '../../../store/ActionApi/newsletterApi';
import { useToast } from '../../../context/ToastContext';
import ConfirmDeleteModal from '../../../components/ConfirmModal/ConfirmDeleteModal';
import Loader from '../../../components/Loader/Loader';
import './AdminNewsletter.scss';

const AdminNewsletter = () => {
  const { data: subscribersResp, isLoading } = useGetSubscribersQuery();
  const { data: statsResp } = useGetNewsletterStatsQuery();
  const [removeSubscriber] = useRemoveSubscriberMutation();
  const { showSuccess, showError } = useToast();
  const [toDelete, setToDelete] = useState(null);

  const subscribers = subscribersResp?.data || subscribersResp || [];
  const stats = statsResp?.data || statsResp || { total: 0, active: 0, inactive: 0 };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await removeSubscriber(toDelete._id || toDelete.id).unwrap();
      showSuccess('Subscriber removed');
    } catch (err) {
      showError(err?.data?.message || 'Failed to remove');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="admin-newsletter">
      <div className="admin-newsletter__header">
        <h1><FiMail /> Newsletter Subscribers</h1>
      </div>

      {/* Stats */}
      <div className="admin-newsletter__stats">
        <div className="admin-newsletter__stat">
          <FiUsers className="admin-newsletter__stat-icon" />
          <div>
            <span className="admin-newsletter__stat-num">{stats.total}</span>
            <span className="admin-newsletter__stat-label">Total</span>
          </div>
        </div>
        <div className="admin-newsletter__stat admin-newsletter__stat--active">
          <FiUserCheck className="admin-newsletter__stat-icon" />
          <div>
            <span className="admin-newsletter__stat-num">{stats.active}</span>
            <span className="admin-newsletter__stat-label">Active</span>
          </div>
        </div>
        <div className="admin-newsletter__stat admin-newsletter__stat--inactive">
          <FiUserX className="admin-newsletter__stat-icon" />
          <div>
            <span className="admin-newsletter__stat-num">{stats.inactive}</span>
            <span className="admin-newsletter__stat-label">Inactive</span>
          </div>
        </div>
      </div>

      {/* Subscriber Table */}
      {isLoading ? (
        <Loader inline message="Loading subscribers…" />
      ) : (
        <div className="admin-newsletter__table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Status</th>
                <th>Subscribed On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No subscribers yet.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub, idx) => (
                  <tr key={sub._id || sub.id}>
                    <td>{idx + 1}</td>
                    <td className="td-bold">{sub.email}</td>
                    <td>
                      <span className={`status ${sub.isActive ? 'status--delivered' : 'status--cancelled'}`}>
                        {sub.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(sub.subscribedAt || sub.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => setToDelete(sub)}
                        title="Remove subscriber"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        itemName={toDelete?.email}
        title="Remove Subscriber?"
      />
    </div>
  );
};

export default AdminNewsletter;
