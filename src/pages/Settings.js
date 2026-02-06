import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { HiCreditCard, HiPhone, HiUser, HiDocumentText, HiCheck } from 'react-icons/hi';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    manualPaymentEnabled: true,
    manualPaymentPhone: '',
    manualPaymentName: '',
    manualPaymentInstructions: '',
    ussdPaymentEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings/payment');
      if (data.success) {
        setForm({
          manualPaymentEnabled: data.data.manualPaymentEnabled ?? true,
          manualPaymentPhone: data.data.manualPaymentPhone || '',
          manualPaymentName: data.data.manualPaymentName || '',
          manualPaymentInstructions: data.data.manualPaymentInstructions || '',
          ussdPaymentEnabled: data.data.ussdPaymentEnabled ?? true,
        });
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validate
    if (form.manualPaymentEnabled && (!form.manualPaymentPhone || !form.manualPaymentName)) {
      toast.error('Please fill in the payment phone number and name');
      return;
    }

    if (!form.manualPaymentEnabled && !form.ussdPaymentEnabled) {
      toast.error('At least one payment method must be enabled');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/admin/settings/payment', form);
      if (data.success) {
        toast.success('Payment settings saved');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payment Settings</h1>
          <p>Configure payment methods available to customers</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* USSD Push Payment Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon ussd">
              <HiCreditCard size={24} />
            </div>
            <div>
              <h3>USSD Push Payment (FastLipa)</h3>
              <p>Automatic payment via USSD push to customer's phone</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={form.ussdPaymentEnabled}
                onChange={(e) => setForm({ ...form, ussdPaymentEnabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {form.ussdPaymentEnabled && (
            <div className="settings-card-body">
              <p className="settings-info">
                USSD push payments are processed automatically via FastLipa API. 
                Configure the API key and URL in your server environment variables.
              </p>
            </div>
          )}
        </div>

        {/* Manual Payment Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon manual">
              <HiPhone size={24} />
            </div>
            <div>
              <h3>Manual Payment</h3>
              <p>Customer sends money manually and submits payment confirmation</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={form.manualPaymentEnabled}
                onChange={(e) => setForm({ ...form, manualPaymentEnabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {form.manualPaymentEnabled && (
            <div className="settings-card-body">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <HiPhone size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Payment Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.manualPaymentPhone}
                    onChange={(e) => setForm({ ...form, manualPaymentPhone: e.target.value })}
                    placeholder="e.g. 0712345678"
                    required
                  />
                  <span className="form-hint">This number will be shown to customers for sending payment</span>
                </div>
                <div className="form-group">
                  <label>
                    <HiUser size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={form.manualPaymentName}
                    onChange={(e) => setForm({ ...form, manualPaymentName: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                  />
                  <span className="form-hint">Name shown to customers so they can verify the recipient</span>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <HiDocumentText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={form.manualPaymentInstructions}
                  onChange={(e) => setForm({ ...form, manualPaymentInstructions: e.target.value })}
                  placeholder="Instructions shown to the customer for completing manual payment..."
                />
                <span className="form-hint">Explain the steps the customer should follow to complete the payment</span>
              </div>

              {/* Preview */}
              {form.manualPaymentPhone && form.manualPaymentName && (
                <div className="settings-preview">
                  <h4>Customer Preview</h4>
                  <div className="preview-card">
                    <div className="preview-label">Send Payment To:</div>
                    <div className="preview-phone">{form.manualPaymentPhone}</div>
                    <div className="preview-name">{form.manualPaymentName}</div>
                    {form.manualPaymentInstructions && (
                      <div className="preview-instructions">{form.manualPaymentInstructions}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            <HiCheck size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
