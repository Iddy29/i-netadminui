import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX, HiUpload, HiPlay, HiEye, HiEyeOff } from 'react-icons/hi';

const emptyForm = {
  name: '',
  description: '',
  streamUrl: '',
  thumbnail: '',
  category: 'General',
  isActive: true,
  sortOrder: 0,
};

const CATEGORY_PRESETS = ['General', 'Sports', 'News', 'Entertainment', 'Movies', 'Music', 'Kids', 'Documentary'];

export default function VideoChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchChannels(); }, []);

  const fetchChannels = async () => {
    try {
      const res = await api.get('/admin/videos');
      if (res.data.success) setChannels(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (channel) => {
    setEditing(channel);
    setForm({
      name: channel.name,
      description: channel.description || '',
      streamUrl: channel.streamUrl,
      thumbnail: channel.thumbnail || '',
      category: channel.category || 'General',
      isActive: channel.isActive,
      sortOrder: channel.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await api.post('/admin/videos/upload-thumbnail', { image: base64 });
        if (res.data.success) {
          setForm((f) => ({ ...f, thumbnail: res.data.data.url }));
          toast.success('Thumbnail uploaded');
        } else {
          toast.error(res.data.message || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.streamUrl.trim()) {
      toast.error('Name and Stream URL are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0,
      };

      let res;
      if (editing) {
        res = await api.put(`/admin/videos/${editing._id}`, payload);
      } else {
        res = await api.post('/admin/videos', payload);
      }

      if (res.data.success) {
        toast.success(editing ? 'Channel updated' : 'Channel created');
        setShowModal(false);
        fetchChannels();
      } else {
        toast.error(res.data.message || 'Failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video channel?')) return;
    try {
      const res = await api.delete(`/admin/videos/${id}`);
      if (res.data.success) {
        toast.success('Channel deleted');
        fetchChannels();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (channel) => {
    try {
      const res = await api.put(`/admin/videos/${channel._id}`, {
        isActive: !channel.isActive,
      });
      if (res.data.success) {
        toast.success(channel.isActive ? 'Channel hidden' : 'Channel visible');
        fetchChannels();
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="page-loading">Loading video channels...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Video Channels</h1>
          <p className="page-subtitle">{channels.length} channel{channels.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <HiPlus size={18} /> Add Channel
        </button>
      </div>

      {/* Channels table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Category</th>
              <th>Stream URL</th>
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  No video channels yet. Click "Add Channel" to create one.
                </td>
              </tr>
            ) : (
              channels.map((ch) => (
                <tr key={ch._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {ch.thumbnail ? (
                        <img
                          src={ch.thumbnail}
                          alt={ch.name}
                          style={{
                            width: 48, height: 36, borderRadius: 6,
                            objectFit: 'cover', border: '1px solid #E2E8F0',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 48, height: 36, borderRadius: 6,
                          background: 'linear-gradient(135deg, #06B6D4, #1E3A8A)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <HiPlay size={18} color="#fff" />
                        </div>
                      )}
                      <div>
                        <strong style={{ fontSize: 14 }}>{ch.name}</strong>
                        {ch.description && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                            {ch.description.length > 50 ? ch.description.slice(0, 50) + '...' : ch.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{ch.category}</span>
                  </td>
                  <td>
                    <code style={{
                      fontSize: 11, background: '#F1F5F9', padding: '3px 6px',
                      borderRadius: 4, wordBreak: 'break-all', maxWidth: 200,
                      display: 'inline-block',
                    }}>
                      {ch.streamUrl.length > 50 ? ch.streamUrl.slice(0, 50) + '...' : ch.streamUrl}
                    </code>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(ch)}
                      className={`status-toggle ${ch.isActive ? 'active' : 'inactive'}`}
                      title={ch.isActive ? 'Click to hide' : 'Click to show'}
                    >
                      {ch.isActive ? <><HiEye size={14} /> Active</> : <><HiEyeOff size={14} /> Hidden</>}
                    </button>
                  </td>
                  <td style={{ textAlign: 'center' }}>{ch.sortOrder}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-icon edit" onClick={() => openEdit(ch)} title="Edit">
                        <HiPencil size={16} />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(ch._id)} title="Delete">
                        <HiTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Channel' : 'Add Video Channel'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              {/* Name */}
              <div className="form-group">
                <label>Channel Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sports HD"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the channel"
                  rows={2}
                />
              </div>

              {/* Stream URL */}
              <div className="form-group">
                <label>Stream URL (.m3u8) *</label>
                <input
                  type="url"
                  value={form.streamUrl}
                  onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
                  placeholder="http://example.com/live/stream.m3u8"
                  required
                />
                <small style={{ color: '#64748B', fontSize: 12 }}>
                  Supports .m3u8 (HLS) stream URLs
                </small>
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORY_PRESETS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`chip-btn ${form.category === cat ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, category: cat })}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Or type custom category"
                  style={{ marginTop: 8 }}
                />
              </div>

              {/* Thumbnail */}
              <div className="form-group">
                <label>Thumbnail Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {form.thumbnail ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={form.thumbnail}
                        alt="Thumbnail"
                        style={{ width: 100, height: 60, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, thumbnail: '' })}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 20, height: 20, borderRadius: '50%',
                          background: '#EF4444', color: '#fff', border: 'none',
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: 100, height: 60, borderRadius: 8,
                        border: '2px dashed #CBD5E1', display: 'flex',
                        flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer',
                        color: '#64748B', fontSize: 11, gap: 2,
                      }}
                    >
                      {uploading ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <HiUpload size={16} />
                          <span>Upload</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Sort Order + Active */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    min="0"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status</label>
                  <select
                    value={form.isActive ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Channel' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
