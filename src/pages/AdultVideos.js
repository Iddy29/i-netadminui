import { useState, useEffect, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX, HiUpload, HiPlay, HiEye, HiEyeOff, HiLink, HiFilm } from 'react-icons/hi';

const emptyForm = {
  title: '',
  description: '',
  videoUrl: '',
  cloudinaryId: '',
  thumbnail: '',
  thumbnailCloudinaryId: '',
  category: 'Uncategorized',
  duration: '',
  isActive: true,
  sortOrder: 0,
  price: 0,
  isFree: true,
};

const CATEGORY_PRESETS = ['Uncategorized', 'Romantic', 'Erotic', 'Classic', 'Premium'];

export default function AdultVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  useEffect(() => { fetchVideos(); }, []);

  const fetchVideos = async () => {
    try {
      const { data } = await api.get('/admin/adult-videos');
      setVideos(data.data || []);
    } catch (err) {
      toast.error('Failed to load adult videos');
    } finally {
      setLoading(false);
    }
  };

  // Upload video file to Cloudinary via backend
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large (max 500MB). Use URL upload for bigger files.');
      return;
    }

    setUploading(true);
    setUploadProgress('Reading file...');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploadProgress('Uploading to cloud...');
        const { data } = await api.post('/admin/adult-videos/upload-video', {
          video: reader.result,
        }, {
          timeout: 300000, // 5 min timeout for large files
        });
        if (data.success) {
          setForm((prev) => ({
            ...prev,
            videoUrl: data.data.videoUrl,
            cloudinaryId: data.data.cloudinaryId,
            thumbnail: data.data.thumbnail || prev.thumbnail,
            duration: data.data.duration || prev.duration,
          }));
          toast.success('Video uploaded!');
        }
      } catch (err) {
        toast.error('Video upload failed: ' + (err.response?.data?.message || err.message));
      } finally {
        setUploading(false);
        setUploadProgress('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload video via URL
  const handleUrlUpload = async () => {
    if (!videoUrlInput.trim()) {
      toast.error('Please enter a video URL');
      return;
    }
    setUploading(true);
    setUploadProgress('Uploading from URL...');
    try {
      const { data } = await api.post('/admin/adult-videos/upload-video-url', {
        videoUrl: videoUrlInput.trim(),
      }, { timeout: 300000 });
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          videoUrl: data.data.videoUrl,
          cloudinaryId: data.data.cloudinaryId,
          thumbnail: data.data.thumbnail || prev.thumbnail,
          duration: data.data.duration || prev.duration,
        }));
        setVideoUrlInput('');
        toast.success('Video uploaded from URL!');
      }
    } catch (err) {
      toast.error('URL upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Upload custom thumbnail
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const { data } = await api.post('/admin/adult-videos/upload-thumbnail', {
          image: reader.result,
        });
        if (data.success) {
          setForm((prev) => ({
            ...prev,
            thumbnail: data.data.thumbnail,
            thumbnailCloudinaryId: data.data.thumbnailCloudinaryId || '',
          }));
          toast.success('Thumbnail uploaded!');
        }
      } catch (err) {
        toast.error('Thumbnail upload failed');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.videoUrl.trim()) return toast.error('Please upload a video first');

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/adult-videos/${editing}`, form);
        toast.success('Video updated');
      } else {
        await api.post('/admin/adult-videos', form);
        toast.success('Video added');
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditing(null);
      fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video? This will also remove it from cloud storage.')) return;
    try {
      await api.delete(`/admin/adult-videos/${id}`);
      toast.success('Video deleted');
      fetchVideos();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (video) => {
    try {
      await api.put(`/admin/adult-videos/${video._id}`, { isActive: !video.isActive });
      fetchVideos();
    } catch {
      toast.error('Update failed');
    }
  };

  const openEdit = (video) => {
    setEditing(video._id);
    setForm({
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl,
      cloudinaryId: video.cloudinaryId || '',
      thumbnail: video.thumbnail || '',
      thumbnailCloudinaryId: video.thumbnailCloudinaryId || '',
      category: video.category || 'Uncategorized',
      duration: video.duration || '',
      isActive: video.isActive,
      sortOrder: video.sortOrder || 0,
      price: video.price || 0,
      isFree: !(video.price > 0),
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setVideoUrlInput('');
    setUploadMode('file');
    setShowModal(true);
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page-content">
      <div className="page-title-row">
        <h1>🔞 Adult Videos</h1>
        <button className="btn-primary" onClick={openCreate}>
          <HiPlus /> Add Video
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Thumb</th>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Views</th>
              <th>Status</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No adult videos yet. Click "Add Video" to upload one.
                </td>
              </tr>
            )}
            {videos.map((v) => (
              <tr key={v._id}>
                <td>
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 6 }} />
                  ) : (
                    <div style={{ width: 80, height: 45, borderRadius: 6, backgroundColor: '#2a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HiFilm size={20} color="#666" />
                    </div>
                  )}
                </td>
                <td><strong>{v.title}</strong></td>
                <td><span className="category-badge">{v.category}</span></td>
                <td>
                  {!v.price || v.price <= 0 ? (
                    <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 12 }}>FREE</span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>TZS {(v.price).toLocaleString()}</span>
                  )}
                </td>
                <td>{v.duration || '—'}</td>
                <td>{v.views || 0}</td>
                <td>
                  <button
                    className={`status-toggle ${v.isActive ? 'active' : ''}`}
                    onClick={() => toggleActive(v)}
                    title={v.isActive ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {v.isActive ? <><HiEye /> Active</> : <><HiEyeOff /> Hidden</>}
                  </button>
                </td>
                <td>{v.sortOrder}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-icon" onClick={() => openEdit(v)} title="Edit">
                      <HiPencil />
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(v._id)} title="Delete">
                      <HiTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && !uploading && setShowModal(false)}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Video' : 'Add Adult Video'}</h2>
              <button className="btn-icon" onClick={() => !saving && !uploading && setShowModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Video Upload */}
              <div className="form-group">
                <label>Video *</label>
                {form.videoUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', backgroundColor: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
                    <HiPlay size={20} color="#16a34a" />
                    <span style={{ flex: 1, fontSize: 13, color: '#166534', wordBreak: 'break-all' }}>
                      {form.videoUrl.substring(0, 80)}...
                    </span>
                    <button type="button" className="btn-sm" onClick={() => setForm((prev) => ({ ...prev, videoUrl: '', cloudinaryId: '' }))}>
                      Replace
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Upload mode tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <button
                        type="button"
                        className={`chip-btn ${uploadMode === 'file' ? 'active' : ''}`}
                        onClick={() => setUploadMode('file')}
                      >
                        <HiUpload /> File Upload
                      </button>
                      <button
                        type="button"
                        className={`chip-btn ${uploadMode === 'url' ? 'active' : ''}`}
                        onClick={() => setUploadMode('url')}
                      >
                        <HiLink /> URL Upload
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <>
                        <input
                          type="file"
                          ref={videoInputRef}
                          accept="video/*"
                          onChange={handleVideoUpload}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn-upload"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? uploadProgress : <><HiUpload /> Choose Video File (max 500MB)</>}
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Paste video URL (mp4, webm, etc.)"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleUrlUpload}
                          disabled={uploading}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="form-group">
                <label>Thumbnail</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {form.thumbnail && (
                    <img src={form.thumbnail} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <div>
                    <input
                      type="file"
                      ref={thumbInputRef}
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => thumbInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <HiUpload /> {form.thumbnail ? 'Change' : 'Upload'} Thumbnail
                    </button>
                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                      Auto-generated from video if not set
                    </p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Video title"
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description"
                  rows={2}
                />
              </div>

              {/* Category chips */}
              <div className="form-group">
                <label>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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

              {/* Duration + Sort Order row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 12:34"
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div style={{ background: '#fef3c7', borderRadius: 10, padding: 16, marginTop: 4, border: '1px solid #f59e0b' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 10, color: '#92400e' }}>
                  <input
                    type="checkbox"
                    checked={!form.isFree}
                    onChange={(e) => {
                      const isPaid = e.target.checked;
                      setForm({ ...form, isFree: !isPaid, price: isPaid ? (form.price || 200) : 0 });
                    }}
                  />
                  💰 Paid Content (requires payment to access)
                </label>
                {!form.isFree && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 13, color: '#78350f' }}>Price (TZS)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 200"
                      style={{ fontWeight: 700, fontSize: 16 }}
                    />
                    <span style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>
                      Users must pay TZS {(form.price || 0).toLocaleString()} to watch this video
                    </span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active (visible to users)
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving || uploading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving || uploading}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
