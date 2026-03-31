import { useState, useEffect } from 'react';
import { FiSave, FiImage, FiDroplet, FiLoader } from 'react-icons/fi';
import Loader from '../../../components/Loader/Loader';
import { useTheme } from '../../../context/ThemeContext';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../../store/ActionApi/settingsApi';
import { useToast } from '../../../context/ToastContext';
import './AdminSettings.scss';

const AdminSettings = () => {
  const { updateSettings } = useTheme();
  const { showSuccess, showError } = useToast();
  
  const { data: settingsData, isLoading } = useGetSettingsQuery();
  const [updateSettingsMutation, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  const [form, setForm] = useState({
    siteName: '',
    tagline: '',
    contactEmail: '',
    contactPhone: '',
    primaryColor: '#FF6B35',
    hoverColor: '#E55A25',
    headerColor: '#000000',
    footerColor: '#031268',
    logo: '',
    logoFile: null,
  });

  const [saved, setSaved] = useState(false);

  // Populate form when data fetches from API
  useEffect(() => {
    if (settingsData?.data) {
      const apiSettings = settingsData.data;
      const theme = apiSettings.themeColors || {};
      setForm({
        siteName:      apiSettings.siteName      || '',
        tagline:       apiSettings.tagline        || '',
        contactEmail:  apiSettings.contactEmail   || '',
        contactPhone:  apiSettings.contactPhone   || '',
        primaryColor:  theme.primary             || '#FF6B35',
        hoverColor:    theme.hover               || '#E55A25',
        headerColor:   theme.header              || '#000000',
        footerColor:   theme.footer              || '#031268',
        logo:          apiSettings.logo          || '',
        logoFile:      null,
      });
    }
  }, [settingsData]);

  const handleSave = async () => {
    try {
      // Construct API payload mapped from frontend local state
      const payload = {
        siteName: form.siteName,
        tagline: form.tagline,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        themeColors: {
          primary: form.primaryColor,
          hover: form.hoverColor,
          header: form.headerColor,
          footer: form.footerColor,
        },
        logo: form.logo,          // existing URL string (fallback)
        logoFile: form.logoFile,  // File object if newly uploaded
      };

      await updateSettingsMutation(payload).unwrap();

      // Ensure contexts know we saved successfully
      updateSettings({
        primaryColor: form.primaryColor,
        hoverColor: form.hoverColor,
        headerColor: form.headerColor,
        footerColor: form.footerColor,
        siteName: form.siteName,
        logo: form.logo,
      });

      setSaved(true);
      showSuccess('Settings saved successfully!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save settings');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({ 
          ...prev, 
          logo: reader.result, // Sets base64 for instant local preview
          logoFile: file       // Keeps raw File blob for form POST API
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const colorFields = [
    {
      key: 'primaryColor',
      label: 'Primary Color',
      description: 'Used for buttons, links, icons, and all main accents.',
    },
    {
      key: 'hoverColor',
      label: 'Hover Color',
      description: 'Shown when users hover over buttons and interactive elements.',
    },
    {
      key: 'headerColor',
      label: 'Header Color',
      description: 'Background color of the site header and admin sidebar.',
    },
    {
      key: 'footerColor',
      label: 'Footer Color',
      description: 'Background color of the site footer.',
    },
  ];

  if (isLoading) {
    return <Loader inline message="Loading Settings…" />;
  }

  return (
    <div className="admin-settings">
      <div className="admin-settings__header">
        <h1>Settings ⚙️</h1>
        <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? <><FiLoader className="spin" /> Saving...</> : <><FiSave /> {saved ? 'Saved!' : 'Save Changes'}</>}
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
                <button className="logo-upload__remove" onClick={() => setForm(p => ({ ...p, logo: null, logoFile: null }))}>Remove</button>
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
          <p className="settings-card__desc">
            Set the 4 core colors for your store. Changes apply instantly to both the admin panel and the user-facing site.
          </p>
          <div className="colors-grid">
            {colorFields.map(({ key, label, description }) => (
              <div className="color-field" key={key}>
                <label>{label}</label>
                <p className="color-field__desc">{description}</p>
                <div className="color-field__input">
                  <input
                    type="color"
                    value={form[key] || '#000000'}
                    onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                  />
                  <input
                    type="text"
                    value={form[key] || ''}
                    onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Live Preview */}
          <div className="color-preview">
            <h4>Live Preview</h4>
            <div className="color-preview__swatches">
              <div className="color-preview__swatch" style={{ background: form.primaryColor }}>
                <span>Primary</span>
                <small>{form.primaryColor}</small>
              </div>
              <div className="color-preview__swatch" style={{ background: form.hoverColor }}>
                <span>Hover</span>
                <small>{form.hoverColor}</small>
              </div>
              <div className="color-preview__swatch" style={{ background: form.headerColor }}>
                <span>Header</span>
                <small>{form.headerColor}</small>
              </div>
              <div className="color-preview__swatch" style={{ background: form.footerColor }}>
                <span>Footer</span>
                <small>{form.footerColor}</small>
              </div>
            </div>
            <div className="color-preview__demo">
              <button
                className="color-preview__demo-btn"
                style={{ background: form.primaryColor }}
                onMouseEnter={e => (e.currentTarget.style.background = form.hoverColor)}
                onMouseLeave={e => (e.currentTarget.style.background = form.primaryColor)}
              >
                Sample Button (hover me)
              </button>
              <div className="color-preview__demo-header" style={{ background: form.headerColor }}>
                Header Preview
              </div>
              <div className="color-preview__demo-footer" style={{ background: form.footerColor }}>
                Footer Preview
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
