import { useState, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiLoader, FiZap } from 'react-icons/fi';
import { useGetSkillsQuery, useAddSkillMutation, useUpdateSkillMutation, useDeleteSkillMutation } from '../../../store/ActionApi/skillApi';
import { useToast } from '../../../context/ToastContext';
import './AdminSkills.scss';

const AdminSkills = () => {
  // ── API ───────────────────────────────────────────────────────
  const { data: skillsResp, isLoading } = useGetSkillsQuery();
  const [addSkill, { isLoading: adding }] = useAddSkillMutation();
  const [updateSkill, { isLoading: updating }] = useUpdateSkillMutation();
  const [deleteSkill] = useDeleteSkillMutation();

  const skills = skillsResp?.data || skillsResp || [];
  const skillList = Array.isArray(skills) ? skills : [];

  // ── Local state ───────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', image: null, previewUrl: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileRef = useRef(null);
  const { showSuccess, showError } = useToast();
  const isBusy = adding || updating;

  // ── Helpers ───────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', image: null, previewUrl: '' });
    setShowModal(true);
  };

  const openEdit = (skill) => {
    setEditing(skill);
    setForm({
      name: skill.name || '',
      description: skill.description || '',
      image: null,
      previewUrl: skill.image || '',
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      setForm((p) => ({ ...p, image: file, previewUrl: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    if (form.image) fd.append('image', form.image);

    try {
      if (editing) {
        await updateSkill({ id: editing._id || editing.id, formData: fd }).unwrap();
        showSuccess('Skill updated successfully');
      } else {
        await addSkill(fd).unwrap();
        showSuccess('Skill added successfully');
      }
      closeModal();
    } catch (err) {
      showError(err?.data?.message || 'Something went wrong');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSkill(deleteTarget._id || deleteTarget.id).unwrap();
      showSuccess('Skill deleted');
    } catch (err) {
      showError(err?.data?.message || 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="admin-loading">Loading skills…</div>;
  }

  return (
    <div className="admin-skills">
      {/* Header */}
      <div className="admin-skills__header">
        <h1><FiZap /> Skills</h1>
        <button className="admin-btn admin-btn--primary" onClick={openAdd}>
          <FiPlus /> Add Skill
        </button>
      </div>

      {/* Grid */}
      {skillList.length === 0 ? (
        <div className="admin-skills__empty">
          <FiZap />
          <p>No skills yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="admin-skills__grid">
          {skillList.map((skill) => (
            <div key={skill._id || skill.id} className="skill-card">
              <div className="skill-card__img">
                {skill.image ? (
                  <img src={skill.image} alt={skill.name} loading="lazy" />
                ) : (
                  <div className="skill-card__placeholder"><FiImage /></div>
                )}
              </div>
              <div className="skill-card__body">
                <h3>{skill.name}</h3>
                <p>{skill.description}</p>
              </div>
              <div className="skill-card__actions">
                <button className="admin-action-btn admin-action-btn--edit" onClick={() => openEdit(skill)} title="Edit">
                  <FiEdit2 />
                </button>
                <button className="admin-action-btn admin-action-btn--delete" onClick={() => setDeleteTarget(skill)} title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Add/Edit Modal ═══ */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editing ? 'Edit Skill' : 'Add New Skill'}</h2>
              <button onClick={closeModal}><FiX /></button>
            </div>
            <form className="admin-modal__form" onSubmit={handleSubmit} noValidate>
              <div className="admin-form-grid">
                <div className="admin-field admin-field--full">
                  <label>Skill Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Problem Solving"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div className="admin-field admin-field--full">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe what this skill develops…"
                    required
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="admin-field admin-field--full">
                  <label><FiImage /> Skill Image *</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  {form.previewUrl ? (
                    <div className="skill-preview">
                      <img src={form.previewUrl} alt="Preview" />
                      <button
                        type="button"
                        className="skill-preview__change"
                        onClick={() => fileRef.current?.click()}
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="admin-image-slot admin-image-slot--add"
                      onClick={() => fileRef.current?.click()}
                      style={{ width: '100%', height: 120 }}
                    >
                      <FiPlus />
                      <span>Upload Image</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={isBusy}>
                  {isBusy
                    ? <><FiLoader className="spin" /> Saving…</>
                    : <>{editing ? 'Update' : 'Add'} Skill</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation ═══ */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-modal__header">
              <h2>Delete Skill</h2>
              <button onClick={() => setDeleteTarget(null)}><FiX /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
              <div className="admin-modal__actions" style={{ borderTop: 'none', marginTop: '1rem', paddingTop: 0 }}>
                <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" style={{ background: '#EF4444' }} onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkills;
