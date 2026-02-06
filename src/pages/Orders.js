import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiX, HiEye, HiRefresh, HiExclamationCircle } from 'react-icons/hi';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#F59E0B' },
  { value: 'processing', label: 'Processing', color: '#F97316' },
  { value: 'active', label: 'Active', color: '#10B981' },
  { value: 'delivered', label: 'Delivered', color: '#06B6D4' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  { value: 'expired', label: 'Expired', color: '#64748B' },
];

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  processing: { bg: '#FFEDD5', text: '#9A3412' },
  active: { bg: '#D1FAE5', text: '#065F46' },
  delivered: { bg: '#CFFAFE', text: '#155E75' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  expired: { bg: '#F1F5F9', text: '#475569' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    adminNote: '',
    username: '',
    password: '',
    accountDetails: '',
  });

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    try {
      const query = filter !== 'all' ? `?status=${filter}` : '';
      const { data } = await api.get(`/admin/orders${query}`);
      if (data.success) setOrders(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openOrder = (order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      adminNote: order.adminNote || '',
      username: order.credentials?.username || '',
      password: order.credentials?.password || '',
      accountDetails: order.credentials?.accountDetails || '',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/orders/${selectedOrder._id}`, {
        status: editForm.status,
        adminNote: editForm.adminNote,
        credentials: {
          username: editForm.username,
          password: editForm.password,
          accountDetails: editForm.accountDetails,
        },
      });
      if (data.success) {
        toast.success('Order updated');
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const quickStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (err) { toast.error('Failed to update'); }
  };

  const formatPrice = (price, currency) => {
    if (currency === 'TZS') return `TZS ${Number(price).toLocaleString()}`;
    return `$${Number(price).toFixed(2)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage customer orders</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { setLoading(true); fetchOrders(); }}>
          <HiRefresh size={18} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            className={`filter-tab ${filter === s.value ? 'active' : ''}`}
            onClick={() => setFilter(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Price</th>
              <th>Phone</th>
              <th>Method</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="8" className="empty-state">No orders found</td></tr>
            ) : orders.map((order) => {
              const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              return (
                <tr key={order._id}>
                  <td>
                    <div className="customer-cell">
                      <span className="font-medium">{order.user?.fullName || '—'}</span>
                      <span className="customer-email">{order.user?.email || ''}</span>
                    </div>
                  </td>
                  <td>
                    <div className="service-cell">
                      <div className="color-dot" style={{ backgroundColor: order.serviceColor, width: 10, height: 10, borderRadius: 5 }} />
                      <span>{order.serviceName}</span>
                    </div>
                  </td>
                  <td className="font-medium">{formatPrice(order.servicePrice, order.serviceCurrency)}</td>
                  <td>{order.paymentPhone}</td>
                  <td>
                    <span className={`payment-method-badge ${order.paymentMethod === 'manual' ? 'manual' : 'mobile-money'}`}>
                      {order.paymentMethod === 'manual' ? 'Manual' : 'USSD'}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(order.createdAt)}</td>
                  <td>
                    <span className="order-status-badge" style={{ backgroundColor: sc.bg, color: sc.text }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn edit" onClick={() => openOrder(order)} title="View / Edit">
                        <HiEye size={16} />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => quickStatus(order._id, 'processing')}
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: 12, background: '#10B981' }}
                          onClick={() => quickStatus(order._id, 'active')}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="icon-btn" onClick={() => setSelectedOrder(null)}><HiX size={20} /></button>
            </div>

            {/* Order Info Summary */}
            <div className="order-summary-grid">
              <div className="order-summary-item">
                <span className="order-summary-label">Customer</span>
                <span className="order-summary-value">{selectedOrder.user?.fullName}</span>
                <span className="order-summary-sub">{selectedOrder.user?.email}</span>
              </div>
              <div className="order-summary-item">
                <span className="order-summary-label">Service</span>
                <span className="order-summary-value">{selectedOrder.serviceName}</span>
                <span className="order-summary-sub">{selectedOrder.serviceDuration}</span>
              </div>
              <div className="order-summary-item">
                <span className="order-summary-label">Price</span>
                <span className="order-summary-value">{formatPrice(selectedOrder.servicePrice, selectedOrder.serviceCurrency)}</span>
              </div>
              <div className="order-summary-item">
                <span className="order-summary-label">Payment Phone</span>
                <span className="order-summary-value">{selectedOrder.paymentPhone}</span>
              </div>
              <div className="order-summary-item">
                <span className="order-summary-label">Payment Method</span>
                <span className="order-summary-value">
                  <span className={`payment-method-badge ${selectedOrder.paymentMethod === 'manual' ? 'manual' : 'mobile-money'}`}>
                    {selectedOrder.paymentMethod === 'manual' ? 'Manual Payment' : 'USSD Push'}
                  </span>
                </span>
              </div>
              <div className="order-summary-item">
                <span className="order-summary-label">Payment Status</span>
                <span className="order-summary-value" style={{ textTransform: 'capitalize' }}>
                  {selectedOrder.paymentStatus === 'awaiting_verification' ? 'Awaiting Verification' : selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            {/* Manual Payment Proof */}
            {selectedOrder.paymentMethod === 'manual' && selectedOrder.manualPaymentProof && (
              <div className="payment-proof-section">
                <h4><HiExclamationCircle size={16} /> Payment Confirmation Message</h4>
                <div className="payment-proof-text">{selectedOrder.manualPaymentProof}</div>
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Order Status</label>
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Admin Note (visible to customer)</label>
                <textarea
                  rows={2}
                  value={editForm.adminNote}
                  onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                  placeholder="e.g. Your account will be ready within 2 hours"
                />
              </div>

              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 8, color: '#0F172A' }}>
                Access Credentials (shared with customer when Active)
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Username / Email</label>
                  <input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    placeholder="e.g. user@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="e.g. pass1234"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Additional Details</label>
                <textarea
                  rows={2}
                  value={editForm.accountDetails}
                  onChange={(e) => setEditForm({ ...editForm, accountDetails: e.target.value })}
                  placeholder="e.g. Check your email for activation link"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Update Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
