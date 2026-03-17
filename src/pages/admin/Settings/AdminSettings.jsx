import { useState } from 'react';
import { FiSave, FiImage, FiDroplet } from 'react-icons/fi';
import { useTheme } from '../../../context/ThemeContext';
import './AdminSettings.scss';

const AdminSettings = () => {
  const { settings, updateSettings } = useTheme();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setForm(prev => ({ ...prev, logo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const colorFields = [
    { key: 'primaryColor', label: 'Primary Color' },
    { key: 'primaryLight', label: 'Primary Light' },
    { key: 'primaryDark', label: 'Primary Dark' },
    { key: 'secondaryColor', label: 'Secondary Color' },
    { key: 'secondaryLight', label: 'Secondary Light' },
    { key: 'secondaryDark', label: 'Secondary Dark' },
    { key: 'accentColor', label: 'Accent Color' },
  ];

  return (
    <div className="admin-settings">
      <div className="admin-settings__header">
        <h1>Settings ⚙️</h1>
        <button className="admin-btn admin-btn--primary" onClick={handleSave}>
          <FiSave /> {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {saved && <div className="admin-settings__toast">✅ Settings saved successfully! Changes applied to the user site.</div>}

      <div className="admin-settings__grid">
        {/* General Settings */}
        <div className="settings-card">
          <h2 className="settings-card__title">🏪 General</h2>
          <div className="admin-field">
            <label>Site Name</label>
            <input type="text" value={form.siteName} onChange={(e) => setForm(p => ({ ...p, siteName: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => setForm(p => ({ ...p, tagline: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={(e) => setForm(p => ({ ...p, contactEmail: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Contact Phone</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => setForm(p => ({ ...p, contactPhone: e.target.value }))} />
          </div>
        </div>

        {/* Logo */}
        <div className="settings-card">
          <h2 className="settings-card__title"><FiImage /> Logo</h2>
          <p className="settings-card__desc">Upload your store logo. This will appear in the header and footer.</p>
          <div className="logo-upload">
            {form.logo ? (
              <div className="logo-upload__preview">
                <img src={form.logo} alt="Logo preview" />
                <button className="logo-upload__remove" onClick={() => setForm(p => ({ ...p, logo: null }))}>Remove</button>
              </div>
            ) : (
              <div className="logo-upload__placeholder">
                <span>🧸</span>
                <p>No logo uploaded (using default)</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-upload" className="logo-upload__input" />
            <label htmlFor="logo-upload" className="admin-btn admin-btn--secondary">
              <FiImage /> {form.logo ? 'Change Logo' : 'Upload Logo'}
            </label>
          </div>
        </div>

        {/* Theme Colors */}
        <div className="settings-card settings-card--full">
          <h2 className="settings-card__title"><FiDroplet /> Theme Colors</h2>
          <p className="settings-card__desc">Customize your store's color scheme. Changes apply to the user-facing site in real-time.</p>
          <div className="colors-grid">
            {colorFields.map(({ key, label }) => (
              <div className="color-field" key={key}>
                <label>{label}</label>
                <div className="color-field__input">
                  <input type="color" value={form[key]} onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))} />
                  <input type="text" value={form[key]} onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              </div>
            ))}
          </div>
          {/* Color Preview */}
          <div className="color-preview">
            <h4>Preview</h4>
            <div className="color-preview__swatches">
              <div className="color-preview__swatch" style={{ background: form.primaryColor }}>Primary</div>
              <div className="color-preview__swatch" style={{ background: form.secondaryColor }}>Secondary</div>
              <div className="color-preview__swatch" style={{ background: form.accentColor, color: '#1A1D2E' }}>Accent</div>
            </div>
            <div className="color-preview__gradient" style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}>
              Gradient Preview
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
