import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineTicket } from 'react-icons/hi';

// ─── Plan form defaults ───
const emptyPlan = { name: '', description: '', durationType: 'monthly', price: 0, isActive: true, sortOrder: 0 };

// ─── Promo form defaults ───
const emptyPromo = {
  code: '', description: '', type: 'discount', discountPercent: 0, fixedAmount: 0, freeAccessDays: 7,
  maxUses: 0, maxUsesPerUser: 1, validFrom: '', validUntil: '', isActive: true,
};

export default function Subscriptions() {
  const [tab, setTab] = useState('plans'); // 'plans' | 'promos'

  // Plans
  const [plans, setPlans] = useState([]);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  // Promos
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [editingPromo, setEditingPromo] = useState(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({ activeSubscriptions: 0, totalRevenue: 0 });

  // ─── Fetch data ───
  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/subscriptions/plans');
      setPlans(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchPromos = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/promo-codes');
      setPromos(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/subscriptions/stats');
      setStats(data.data || { activeSubscriptions: 0, totalRevenue: 0 });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchPromos();
    fetchStats();
  }, [fetchPlans, fetchPromos, fetchStats]);

  // ═══════════════════
  // ── Plan handlers ──
  // ═══════════════════
  const openPlanCreate = () => {
    setPlanForm(emptyPlan);
    setEditingPlan(null);
    setShowPlanModal(true);
  };
  const openPlanEdit = (plan) => {
    setPlanForm({
      name: plan.name, description: plan.description || '', durationType: plan.durationType,
      price: plan.price, isActive: plan.isActive, sortOrder: plan.sortOrder || 0,
    });
    setEditingPlan(plan._id);
    setShowPlanModal(true);
  };
  const savePlan = async () => {
    if (!planForm.name || !planForm.durationType) return toast.error('Name and duration type are required');
    setPlanLoading(true);
    try {
      if (editingPlan) {
        await api.put(`/admin/subscriptions/plans/${editingPlan}`, planForm);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/subscriptions/plans', planForm);
        toast.success('Plan created');
      }
      setShowPlanModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    } finally {
      setPlanLoading(false);
    }
  };
  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/admin/subscriptions/plans/${id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // ════════════════════
  // ── Promo handlers ──
  // ════════════════════
  const openPromoCreate = () => {
    setPromoForm(emptyPromo);
    setEditingPromo(null);
    setShowPromoModal(true);
  };
  const openPromoEdit = (promo) => {
    setPromoForm({
      code: promo.code, description: promo.description || '', type: promo.type,
      discountPercent: promo.discountPercent || 0, fixedAmount: promo.fixedAmount || 0,
      freeAccessDays: promo.freeAccessDays || 7, maxUses: promo.maxUses || 0,
      maxUsesPerUser: promo.maxUsesPerUser || 1,
      validFrom: promo.validFrom ? promo.validFrom.slice(0, 10) : '',
      validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : '',
      isActive: promo.isActive,
    });
    setEditingPromo(promo._id);
    setShowPromoModal(true);
  };
  const savePromo = async () => {
    if (!promoForm.code || !promoForm.type) return toast.error('Code and type are required');
    setPromoLoading(true);
    try {
      if (editingPromo) {
        await api.put(`/admin/promo-codes/${editingPromo}`, promoForm);
        toast.success('Promo code updated');
      } else {
        await api.post('/admin/promo-codes', promoForm);
        toast.success('Promo code created');
      }
      setShowPromoModal(false);
      fetchPromos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save promo code');
    } finally {
      setPromoLoading(false);
    }
  };
  const deletePromo = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      toast.success('Promo code deleted');
      fetchPromos();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // ═══════════════
  // ── Duration label helper ──
  const durLabel = (t) => ({ weekly: 'Weekly (7 days)', monthly: 'Monthly (30 days)', yearly: 'Yearly (365 days)' }[t] || t);
  const promoTypeLabel = (t) => ({ discount: 'Percentage Discount', fixed: 'Fixed Amount Off', free_access: 'Free Access' }[t] || t);

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #06B6D4, #0891B2)', borderRadius: 12, padding: '20px 24px', color: '#fff' }}>
          <div style={{ fontSize: 14, opacity: 0.85 }}>Active Subscriptions</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats.activeSubscriptions}</div>
        </div>
        <div style={{ flex: 1, background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', borderRadius: 12, padding: '20px 24px', color: '#fff' }}>
          <div style={{ fontSize: 14, opacity: 0.85 }}>Total Revenue (TZS)</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{(stats.totalRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
        {['plans', 'promos'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15,
              background: 'transparent', color: tab === t ? '#06B6D4' : '#64748b',
              borderBottom: tab === t ? '3px solid #06B6D4' : '3px solid transparent',
              marginBottom: -2, transition: 'all .2s',
            }}
          >
            {t === 'plans' ? 'Subscription Plans' : 'Promo Codes'}
          </button>
        ))}
      </div>

      {/* ═══ PLANS TAB ═══ */}
      {tab === 'plans' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Subscription Plans</h2>
            <button className="btn btn-primary" onClick={openPlanCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlinePlus /> Add Plan
            </button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Duration</th>
                  <th>Price (TZS)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No subscription plans yet</td></tr>
                ) : plans.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong>{p.description && <><br/><small style={{ color: '#94a3b8' }}>{p.description}</small></>}</td>
                    <td>{durLabel(p.durationType)}</td>
                    <td style={{ fontWeight: 700, color: '#06B6D4' }}>TZS {(p.price || 0).toLocaleString()}</td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: p.isActive ? '#d1fae522' : '#fee2e222', color: p.isActive ? '#22c55e' : '#ef4444' }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => openPlanEdit(p)} title="Edit"><HiOutlinePencil /></button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => deletePlan(p._id)} title="Delete"><HiOutlineTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══ PROMOS TAB ═══ */}
      {tab === 'promos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Promo Codes</h2>
            <button className="btn btn-primary" onClick={openPromoCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineTicket /> Add Promo Code
            </button>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Usage</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No promo codes yet</td></tr>
                ) : promos.map((p) => (
                  <tr key={p._id}>
                    <td><code style={{ background: '#0f172a', color: '#06B6D4', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 13 }}>{p.code}</code></td>
                    <td style={{ fontSize: 13 }}>{promoTypeLabel(p.type)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {p.type === 'discount' && `${p.discountPercent}%`}
                      {p.type === 'fixed' && `TZS ${(p.fixedAmount || 0).toLocaleString()}`}
                      {p.type === 'free_access' && `${p.freeAccessDays} days`}
                    </td>
                    <td>{p.usedCount} / {p.maxUses || '∞'}</td>
                    <td style={{ fontSize: 13 }}>{p.validUntil ? new Date(p.validUntil).toLocaleDateString() : 'No expiry'}</td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: p.isActive ? '#d1fae522' : '#fee2e222', color: p.isActive ? '#22c55e' : '#ef4444' }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => openPromoEdit(p)} title="Edit"><HiOutlinePencil /></button>{' '}
                      <button className="btn btn-sm btn-danger" onClick={() => deletePromo(p._id)} title="Delete"><HiOutlineTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══ PLAN MODAL ═══ */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ margin: '0 0 20px' }}>{editingPlan ? 'Edit Plan' : 'New Subscription Plan'}</h3>

            <div className="form-group">
              <label>Plan Name *</label>
              <input type="text" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Monthly Premium" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="form-group">
              <label>Duration Type *</label>
              <select value={planForm.durationType} onChange={(e) => setPlanForm({ ...planForm, durationType: e.target.value })}>
                <option value="weekly">Weekly (7 days)</option>
                <option value="monthly">Monthly (30 days)</option>
                <option value="yearly">Yearly (365 days)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price (TZS) *</label>
              <input type="number" min="0" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })} id="plan-active" />
              <label htmlFor="plan-active" style={{ margin: 0, cursor: 'pointer' }}>Active</label>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowPlanModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePlan} disabled={planLoading}>
                {planLoading ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROMO MODAL ═══ */}
      {showPromoModal && (
        <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h3 style={{ margin: '0 0 20px' }}>{editingPromo ? 'Edit Promo Code' : 'New Promo Code'}</h3>

            <div className="form-group">
              <label>Code *</label>
              <input type="text" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE50" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} placeholder="Internal description" />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select value={promoForm.type} onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}>
                <option value="discount">Percentage Discount</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="free_access">Free Access (time-based)</option>
              </select>
            </div>

            {promoForm.type === 'discount' && (
              <div className="form-group">
                <label>Discount Percent (%)</label>
                <input type="number" min="0" max="100" value={promoForm.discountPercent} onChange={(e) => setPromoForm({ ...promoForm, discountPercent: parseInt(e.target.value) || 0 })} />
              </div>
            )}
            {promoForm.type === 'fixed' && (
              <div className="form-group">
                <label>Fixed Amount (TZS)</label>
                <input type="number" min="0" value={promoForm.fixedAmount} onChange={(e) => setPromoForm({ ...promoForm, fixedAmount: parseInt(e.target.value) || 0 })} />
              </div>
            )}
            {promoForm.type === 'free_access' && (
              <div className="form-group">
                <label>Free Access Days</label>
                <input type="number" min="1" value={promoForm.freeAccessDays} onChange={(e) => setPromoForm({ ...promoForm, freeAccessDays: parseInt(e.target.value) || 1 })} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Max Uses (0 = unlimited)</label>
                <input type="number" min="0" value={promoForm.maxUses} onChange={(e) => setPromoForm({ ...promoForm, maxUses: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-group">
                <label>Max Uses per User</label>
                <input type="number" min="1" value={promoForm.maxUsesPerUser} onChange={(e) => setPromoForm({ ...promoForm, maxUsesPerUser: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Valid From</label>
                <input type="date" value={promoForm.validFrom} onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Valid Until (optional)</label>
                <input type="date" value={promoForm.validUntil} onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={promoForm.isActive} onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })} id="promo-active" />
              <label htmlFor="promo-active" style={{ margin: 0, cursor: 'pointer' }}>Active</label>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowPromoModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePromo} disabled={promoLoading}>
                {promoLoading ? 'Saving...' : editingPromo ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
