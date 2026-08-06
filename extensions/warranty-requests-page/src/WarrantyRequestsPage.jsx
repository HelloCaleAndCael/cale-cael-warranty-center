// @ts-nocheck
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';
 
// Dev tunnel URL — this changes every time you restart `shopify app dev`,
// so you'll need to update this line again when that happens.
const API_BASE_URL = 'https://preparing-beliefs-necessarily-bid.trycloudflare.com';
 
export default async () => {
  render(<WarrantyRequestsPage />, document.body);
};
 
const WARRANTY_TYPES = [
  {value: 'replacement', label: 'Replacement'},
  {value: 'repair', label: 'Repair'},
  {value: 'refurbishment', label: 'Refurbishment'},
  {value: 'other', label: 'Other'},
];
 
const STATUS_LABELS = {
  pending: {label: 'Pending', tone: 'warning'},
  approved: {label: 'Approved', tone: 'success'},
  in_progress: {label: 'In progress', tone: 'info'},
  rejected: {label: 'Rejected', tone: 'critical'},
  completed: {label: 'Completed', tone: 'success'},
};
 
function WarrantyRequestsPage() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    orderNumber: '',
    warrantyType: 'replacement',
    description: '',
  });
  const [photos, setPhotos] = useState([]);
 
  async function authorizedFetch(path, options = {}) {
    // sessionToken.get() returns a signed JWT that identifies the logged-in
    // customer. Your backend must verify this token before reading/writing
    // anything in Supabase. Always request it right before use — it expires
    // after a few minutes.
    const token = await shopify.sessionToken.get();
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }
 
  async function fetchRequests() {
    setLoading(true);
    setError(null);
    try {
      const res = await authorizedFetch('/api/warranty-requests');
      if (!res.ok) throw new Error('Could not load your warranty requests');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 
  useEffect(() => {
    fetchRequests();
  }, []);
 
  function updateField(field, value) {
    setForm((prev) => ({...prev, [field]: value}));
  }
 
  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Upload photos to Cloudinary through your backend
      //    (your backend keeps the upload preset secret; the extension never sees it)
      const uploadedUrls = [];
      for (const file of photos) {
        const base64 = await fileToBase64(file);
        let uploadRes;
        try {
          uploadRes = await authorizedFetch('/api/warranty-requests/upload-photo', {
            method: 'POST',
            body: JSON.stringify({fileName: file.name, base64}),
          });
        } catch (networkErr) {
          throw new Error(`Network error while uploading photo: ${networkErr.message}`);
        }
        if (!uploadRes.ok) throw new Error(`Photo upload failed (status ${uploadRes.status})`);
        const {url} = await uploadRes.json();
        uploadedUrls.push(url);
      }
 
      // 2. Create the warranty case
      let res;
      try {
        res = await authorizedFetch('/api/warranty-requests', {
          method: 'POST',
          body: JSON.stringify({
            productName: form.productName,
            orderNumber: form.orderNumber,
            warrantyType: form.warrantyType,
            description: form.description,
            photoUrls: uploadedUrls,
          }),
        });
      } catch (networkErr) {
        throw new Error(`Network error while creating request: ${networkErr.message}`);
      }
      if (!res.ok) throw new Error(`Could not create the warranty request (status ${res.status})`);
 
      // 3. Go back to the list, now refreshed
      setForm({productName: '', orderNumber: '', warrantyType: 'replacement', description: ''});
      setPhotos([]);
      setView('list');
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
 
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
 
  if (view === 'form') {
    return (
      <s-page heading="New warranty request">
        <s-button slot="primary-action" onClick={() => setView('list')}>
          Cancel
        </s-button>
 
        <s-section>
          <s-stack direction="block" gap="base">
            {error && <s-banner tone="critical">{error}</s-banner>}
 
            <s-text-field
              label="Product"
              value={form.productName}
              onChange={(e) => updateField('productName', e.target.value)}
            />
 
            <s-text-field
              label="Order number (if you have it)"
              value={form.orderNumber}
              onChange={(e) => updateField('orderNumber', e.target.value)}
            />
 
            <s-select
              label="Warranty type"
              value={form.warrantyType}
              onChange={(e) => updateField('warrantyType', e.target.value)}
            >
              {WARRANTY_TYPES.map((t) => (
                <s-option key={t.value} value={t.value}>
                  {t.label}
                </s-option>
              ))}
            </s-select>
 
            <s-text-area
              label="Tell us what happened with your product"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
            />
 
            <s-text color="subdued">
              Attach the photos or videos needed to show the damage to your product.
            </s-text>
 
            <s-drop-zone
              label="Photos or videos"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.currentTarget.files || []))}
            />
            {photos.length > 0 && (
              <s-text color="subdued">
                {photos.length} file{photos.length > 1 ? 's' : ''} selected:{' '}
                {photos.map((f) => f.name).join(', ')}
              </s-text>
            )}
 
            <s-button
              variant="primary"
              loading={submitting}
              onClick={handleSubmit}
              disabled={!form.productName || !form.description}
            >
              Submit request
            </s-button>
          </s-stack>
        </s-section>
      </s-page>
    );
  }
 
  return (
    <s-page heading="My warranty requests">
      <s-button slot="primary-action" variant="primary" onClick={() => setView('form')}>
        Create request
      </s-button>
 
      <s-section>
        {loading && <s-text>Loading your requests…</s-text>}
        {error && <s-banner tone="critical">{error}</s-banner>}
 
        {!loading && requests.length === 0 && (
          <s-stack direction="block" gap="base">
            <s-text>You don't have any warranty requests yet.</s-text>
          </s-stack>
        )}
 
        {!loading &&
          requests.map((r) => {
            const status = STATUS_LABELS[r.status] || {label: r.status, tone: 'neutral'};
            return (
              <s-section key={r.id}>
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  <s-stack direction="block" gap="small-400">
                    <s-text type="strong">{r.product_name}</s-text>
                    <s-text color="subdued">
                      Order: {r.order_number || 'N/A'} · {r.warranty_type}
                    </s-text>
                  </s-stack>
                  <s-badge tone={status.tone}>{status.label}</s-badge>
                </s-stack>
              </s-section>
            );
          })}
      </s-section>
    </s-page>
  );
}