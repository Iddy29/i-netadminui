import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX } from 'react-icons/hi';

const ICON_OPTIONS = [
  { value: 'play-circle-outline', label: 'Streaming' },
  { value: 'brain', label: 'AI / Brain' },
  { value: 'chart-line', label: 'Trading / Chart' },
  { value: 'wifi', label: 'Internet / WiFi' },
  { value: 'controller-classic-outline', label: 'Gaming' },
  { value: 'school-outline', label: 'Education' },
  { value: 'shield-check-outline', label: 'Security' },
  { value: 'cart-outline', label: 'Shopping' },
  { value: 'cloud-outline', label: 'Cloud' },
  { value: 'phone-outline', label: 'Phone' },
];

const emptyForm = { name: '', icon: 'play-circle-outline', color: '#06B6D4', sortOrder: 0 };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      if (data.success) setCategories(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, sortOrder: cat.sortOrder || 0 });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/admin/categories/${editing._id}`, form);
        if (data.success) { toast.success('Category updated'); }
      } else {
        const { data } = await api.post('/admin/categories', form);
        if (data.success) { toast.success('Category created'); }
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      const { data } = await api.delete(`/admin/categories/${cat._id}`);
      if (data.success) { toast.success('Category deleted'); fetchCategories(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleActive = async (cat) => {
    try {
      await api.put(`/admin/categories/${cat._id}`, { isActive: !cat.isActive });
      toast.success(cat.isActive ? 'Category disabled' : 'Category enabled');
      fetchCategories();
    } catch (err) { toast.error('Failed to update'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Manage service categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <HiPlus size={18} /> Add Category
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Color</th>
              <th>Name</th>
              <th>Icon</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan="6" className="empty-state">No categories yet. Create one to get started.</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat._id}>
                <td><div className="color-dot" style={{ backgroundColor: cat.color }} /></td>
                <td className="font-medium">{cat.name}</td>
                <td><code className="icon-code">{cat.icon}</code></td>
                <td>{cat.sortOrder}</td>
                <td>
                  <button
                    className={`status-badge ${cat.isActive ? 'active' : 'inactive'}`}
                    onClick={() => toggleActive(cat)}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="icon-btn edit" onClick={() => openEdit(cat)} title="Edit"><HiPencil size={16} /></button>
                    <button className="icon-btn delete" onClick={() => handleDelete(cat)} title="Delete"><HiTrash size={16} /></button>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Category' : 'New Category'}</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><HiX size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Streaming"
                  required
                />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-input-group">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                    <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="#06B6D4" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
