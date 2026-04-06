import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiX, FiLoader, FiUser, FiMail, FiLock } from 'react-icons/fi';
import Loader from '../../../components/Loader/Loader';
import {
  useGetUsersQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../../../store/ActionApi/userApi';
import {
  useGetAvailableRoutesQuery,
  useGetUserPermissionsQuery,
  useUpdatePermissionsMutation,
} from '../../../store/ActionApi/permissionApi';
import { useToast } from '../../../context/ToastContext';
import './AdminUsers.scss';

// ─── Empty user form ──────────────────────────────────────────────────────────
const emptyUser = {
  name: '',
  userName: '',
  email: '',
  password: '',
  role: 'moderator',
};

// ─── UserFormModal ────────────────────────────────────────────────────────────
const UserFormModal = ({ isOpen, onClose, onSubmit, editing, isSubmitting }) => {
  const [form, setForm] = useState(
    editing
      ? { name: editing.name, userName: editing.userName, email: editing.email, password: '', role: editing.role }
      : { ...emptyUser }
  );

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form };
    // Don't send empty password on edit
    if (editing && !body.password) delete body.password;
    onSubmit(body);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2>{editing ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} aria-label="Close modal"><FiX /></button>
        </div>
        <form className="admin-modal__form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label><FiUser /> Full Name *</label>
              <input type="text" placeholder="John Doe" required {...field('name')} />
            </div>
            <div className="admin-field">
              <label><FiUser /> Username *</label>
              <input type="text" placeholder="johndoe" required {...field('userName')} />
            </div>
            <div className="admin-field">
              <label><FiMail /> Email *</label>
              <input type="email" placeholder="john@example.com" required {...field('email')} />
            </div>
            <div className="admin-field">
              <label><FiLock /> Password {editing ? '(leave blank to keep)' : '*'}</label>
              <input
                type="password"
                placeholder={editing ? '••••••••' : 'Min 8 characters'}
                {...field('password')}
                required={!editing}
                minLength={editing ? undefined : 8}
              />
            </div>
            <div className="admin-field">
              <label>Role</label>
              <select {...field('role')}>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="admin-modal__actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>
              {isSubmitting ? <><FiLoader className="spin" /> Saving…</> : editing ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PermissionsModal ─────────────────────────────────────────────────────────
const PermissionsModal = ({ user, onClose }) => {
  const userId = user._id || user.id;
  const { showSuccess, showError } = useToast();

  const { data: routesData } = useGetAvailableRoutesQuery();
  const { data: permData, isLoading: loadingPerms } = useGetUserPermissionsQuery(userId);
  const [updatePermissions, { isLoading: saving }] = useUpdatePermissionsMutation();

  // Available routes from backend
  const availableRoutes = routesData?.data || routesData || [];
  // Current user permissions
  const currentPerms = permData?.data || permData || [];

  const [perms, setPerms] = useState(null);

  function buildPermissionMap(routes, existing) {
    return routes.map((r) => {
      const found = existing.find((p) => p.route === r.route);
      return {
        route: r.route,
        label: r.label,
        visible: found ? found.visible : false,
        enabled: found ? found.enabled : false,
      };
    });
  }

  // Initialize local state when API data arrives
  useEffect(() => {
    if (availableRoutes.length > 0 && !loadingPerms) {
      setPerms(buildPermissionMap(availableRoutes, currentPerms));
    }
  }, [availableRoutes, currentPerms, loadingPerms]);

  const toggleField = (index, field) => {
    const updated = [...(perms || [])];
    updated[index] = { ...updated[index], [field]: !updated[index][field] };
    setPerms(updated);
  };

  const handleSave = async () => {
    try {
      const toSave = (perms || []).filter((p) => p.visible || p.enabled);
      await updatePermissions({ userId, permissions: toSave }).unwrap();
      showSuccess('Permissions updated successfully');
      onClose();
    } catch (err) {
      showError(err?.data?.message || 'Failed to update permissions');
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal admin-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h2><FiShield /> Permissions — <em>{user.name}</em></h2>
          <button onClick={onClose} aria-label="Close modal"><FiX /></button>
        </div>

        <div className="admin-modal__form">
          {loadingPerms ? (
            <Loader inline message="Loading permissions…" />
          ) : (
            <>
              <p className="perm-modal__desc">
                Toggle <strong>Visible</strong> to show/hide sidebar items. Toggle <strong>Enabled</strong> to allow/deny API access.
              </p>

              <div className="perm-table-wrap">
                <table className="perm-table">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Label</th>
                      <th>Visible</th>
                      <th>Enabled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(perms || []).map((p, i) => (
                      <tr key={p.route}>
                        <td className="perm-table__route">{p.route}</td>
                        <td>{p.label}</td>
                        <td>
                          <label className="perm-toggle">
                            <input
                              type="checkbox"
                              checked={p.visible}
                              onChange={() => toggleField(i, 'visible')}
                            />
                            <span className="perm-toggle__slider" />
                          </label>
                        </td>
                        <td>
                          <label className="perm-toggle">
                            <input
                              type="checkbox"
                              checked={p.enabled}
                              onChange={() => toggleField(i, 'enabled')}
                            />
                            <span className="perm-toggle__slider" />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose}>Cancel</button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <><FiLoader className="spin" /> Saving…</> : 'Save Permissions'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── UserCard ─────────────────────────────────────────────────────────────────
const UserCard = ({ user, onEdit, onDelete, onPermissions, deleting }) => {
  const roleColors = {
    admin: '#ef4444',
    moderator: '#f59e0b',
    user: '#3b82f6',
  };

  return (
    <div className="user-card">
      <div className="user-card__avatar" style={{ background: roleColors[user.role] || '#6b7280' }}>
        {(user.name || 'U')[0].toUpperCase()}
      </div>
      <div className="user-card__info">
        <h3 className="user-card__name">{user.name}</h3>
        <p className="user-card__email">{user.email}</p>
        <div className="user-card__meta">
          <span className="user-card__username">@{user.userName}</span>
          <span className={`user-card__role user-card__role--${user.role}`}>{user.role}</span>
        </div>
      </div>
      <div className="user-card__actions">
        <button
          className="admin-action-btn admin-action-btn--edit"
          onClick={() => onPermissions(user)}
          title="Manage Permissions"
          aria-label={`Permissions for ${user.name}`}
        >
          <FiShield />
        </button>
        <button
          className="admin-action-btn admin-action-btn--edit"
          onClick={() => onEdit(user)}
          title="Edit User"
          aria-label={`Edit ${user.name}`}
        >
          <FiEdit2 />
        </button>
        <button
          className="admin-action-btn admin-action-btn--delete"
          onClick={() => onDelete(user)}
          disabled={deleting}
          title="Delete User"
          aria-label={`Delete ${user.name}`}
        >
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

// ─── AdminUsers (main page) ──────────────────────────────────────────────────
const AdminUsers = () => {
  const { showSuccess, showError } = useToast();

  const { data: usersResponse, isLoading } = useGetUsersQuery();
  const users = usersResponse?.data || usersResponse || [];

  const [addUser, { isLoading: adding }] = useAddUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [permUser, setPermUser] = useState(null);

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (user) => { setEditing(user); setShowModal(true); };

  const handleSubmit = async (body) => {
    try {
      if (editing) {
        await updateUser({ id: editing._id || editing.id, body }).unwrap();
        showSuccess('User updated successfully');
      } else {
        await addUser(body).unwrap();
        showSuccess('User created successfully');
      }
      setShowModal(false);
    } catch (err) {
      showError(err?.data?.message || err?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This will also delete their permissions.`)) return;
    try {
      await deleteUser(user._id || user.id).unwrap();
      showSuccess('User deleted successfully');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete user');
    }
  };

  const isSubmitting = adding || updating;

  return (
    <div className="admin-users">
      <div className="admin-users__header">
        <h1>Users & Permissions 👥</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add User
        </button>
      </div>

      {isLoading ? (
        <Loader inline message="Loading users…" />
      ) : (
        <div className="admin-users__grid">
          {(Array.isArray(users) ? users : []).map((user) => (
            <UserCard
              key={user._id || user.id}
              user={user}
              onEdit={openEdit}
              onDelete={handleDelete}
              onPermissions={setPermUser}
              deleting={deleting}
            />
          ))}
          {Array.isArray(users) && users.length === 0 && (
            <div className="admin-users__empty">
              <FiUser />
              <p>No users found. Create one to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <UserFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          editing={editing}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Permissions Modal */}
      {permUser && (
        <PermissionsModal
          user={permUser}
          onClose={() => setPermUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
