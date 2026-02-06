import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX, HiUpload, HiPhotograph } from 'react-icons/hi';

const ICON_OPTIONS = [
  'netflix', 'chatgpt', 'spotify', 'tradingview', 'data-bundle', 'disney',
  'midjourney', 'data-bundle-large', 'streaming', 'ai', 'trading', 'internet',
];

const emptyForm = {
  name: '', category: '', description: '', price: '',
  currency: 'TZS', duration: '1-Month', features: '',
  iconType: 'internet', iconImage: '', color: '#06B6D4', sortOrder: 0,
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [iconMode, setIconMode] = useState('preset'); // 'preset' or 'custom'
  const fileInputRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/categories'),
      ]);
      if (sRes.data.success) setServices(sRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatPrice = (price, currency) => {
    if (currency === 'TZS') return `TZS ${Number(price).toLocaleString()}`;
    return `$${Number(price).toFixed(2)}`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category: categories[0]?._id || '' });
    setIconMode('preset');
    setShowModal(true);
  };

  const openEdit = (svc) => {
    setEditing(svc);
    setForm({
      name: svc.name,
      category: svc.category?._id || svc.category,
      description: svc.description,
      price: svc.price,
      currency: svc.currency || 'TZS',
      duration: svc.duration,
      features: (svc.features || []).join('\n'),
      iconType: svc.iconType || 'internet',
      iconImage: svc.iconImage || '',
      color: svc.color,
      sortOrder: svc.sortOrder || 0,
    });
    setIconMode(svc.iconImage ? 'custom' : 'preset');
    setShowModal(true);
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      // Upload to imgBB via backend
      const { data } = await api.post('/admin/services/upload-icon', {
        image: base64,
      });

      if (data.success) {
        setForm((prev) => ({ ...prev, iconImage: data.data.url }));
        toast.success('Icon uploaded');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Failed to upload icon');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveIcon = () => {
    setForm((prev) => ({ ...prev, iconImage: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
      // If using custom icon, keep iconImage; if preset, clear iconImage
      iconImage: iconMode === 'custom' ? form.iconImage : '',
      iconType: form.iconType || 'internet',
    };
    try {
      if (editing) {
        const { data } = await api.put(`/admin/services/${editing._id}`, payload);
        if (data.success) toast.success('Service updated');
      } else {
        const { data } = await api.post('/admin/services', payload);
        if (data.success) toast.success('Service created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (svc) => {
    if (!window.confirm(`Delete service "${svc.name}"?`)) return;
    try {
      const { data } = await api.delete(`/admin/services/${svc._id}`);
      if (data.success) { toast.success('Service deleted'); fetchAll(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleActive = async (svc) => {
    try {
      await api.put(`/admin/services/${svc._id}`, { isActive: !svc.isActive });
      toast.success(svc.isActive ? 'Service disabled' : 'Service enabled');
      fetchAll();
    } catch (err) { toast.error('Failed to update'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Services</h1>
          <p>Manage services and pricing (TZS)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <HiPlus size={18} /> Add Service
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">No services yet. Create one to get started.</td></tr>
            ) : services.map((svc) => (
              <tr key={svc._id}>
                <td>
                  {svc.iconImage ? (
                    <img src={svc.iconImage} alt={svc.name} className="svc-icon-img" />
                  ) : (
                    <div className="color-dot" style={{ backgroundColor: svc.color }} />
                  )}
                </td>
                <td className="font-medium">{svc.name}</td>
                <td>{svc.category?.name || '—'}</td>
                <td className="font-medium">{formatPrice(svc.price, svc.currency)}</td>
                <td>{svc.duration}</td>
                <td>
                  <button
                    className={`status-badge ${svc.isActive ? 'active' : 'inactive'}`}
                    onClick={() => toggleActive(svc)}
                  >
                    {svc.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => openEdit(svc)} title="Edit"><HiPencil size={16} /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(svc)} title="Delete"><HiTrash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Service' : 'New Service'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><HiX size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Service Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Netflix Premium" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. 4K UHD, 4 Screens" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (TZS)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 25000" min="0" required />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    <option value="TZS">TZS (Tanzania Shillings)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 1-Month" required />
                </div>
              </div>

              <div className="form-group">
                <label>Features (one per line)</label>
                <textarea
                  rows={4}
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder={"4K Ultra HD\n4 Screens Simultaneously\nDownload Content\nNo Ads"}
                />
              </div>

              {/* Icon Section */}
              <div className="form-group">
                <label>Service Icon</label>
                <div className="icon-mode-tabs">
                  <button
                    type="button"
                    className={`icon-mode-tab ${iconMode === 'preset' ? 'active' : ''}`}
                    onClick={() => setIconMode('preset')}
                  >
                    Preset Icons
                  </button>
                  <button
                    type="button"
                    className={`icon-mode-tab ${iconMode === 'custom' ? 'active' : ''}`}
                    onClick={() => setIconMode('custom')}
                  >
                    <HiPhotograph size={14} /> Custom Image
                  </button>
                </div>

                {iconMode === 'preset' ? (
                  <div className="icon-grid">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        type="button"
                        key={icon}
                        className={`icon-grid-item ${form.iconType === icon ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, iconType: icon })}
                        style={form.iconType === icon ? { borderColor: form.color, backgroundColor: form.color + '15' } : {}}
                      >
                        <span className="icon-grid-label">{icon}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="custom-icon-section">
                    {form.iconImage ? (
                      <div className="custom-icon-preview">
                        <img src={form.iconImage} alt="Custom icon" className="custom-icon-img" />
                        <div className="custom-icon-actions">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                            <HiUpload size={14} /> Change
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={handleRemoveIcon}>
                            <HiTrash size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="custom-icon-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <div className="spinner-small" />
                        ) : (
                          <>
                            <HiUpload size={28} />
                            <p>Click to upload an icon image</p>
                            <span>PNG, JPG, SVG up to 5MB</span>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIconUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Accent Color</label>
                  <div className="color-input-group">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                    <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
