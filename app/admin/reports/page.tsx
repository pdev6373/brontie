'use client';

import { useState, useEffect } from 'react';

interface Merchant {
  _id: string;
  name: string;
  status: string;
  isActive: boolean;
}

export default function AdminReportsPage() {
  const [merchantId, setMerchantId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);

  // Fetch merchants on component mount
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const response = await fetch('/api/admin/merchants');
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Filter only approved and active merchants
          const approvedMerchants = data.data.filter((merchant: Merchant) => 
            merchant.status === 'approved' && merchant.isActive
          );
          setMerchants(approvedMerchants);
        } else {
          console.error('Failed to fetch merchants:', data.error);
        }
      } catch (err) {
        console.error('Error fetching merchants:', err);
      } finally {
        setLoadingMerchants(false);
      }
    };

    fetchMerchants();
  }, []);

  const sendTestReport = async () => {
    if (!merchantId.trim()) {
      setError('Please enter a merchant ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/reports/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchantId: merchantId.trim(),
          testEmail: testEmail.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to send test report');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendAllReports = async () => {
    if (!confirm('Are you sure you want to send reports to ALL active merchants? This should only be done on Wednesdays.')) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/reports/send-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to send reports');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Café Reports Management</h1>

          <div className="space-y-8">
            {/* Test Single Report */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Test Single Report</h2>
              <p className="text-gray-600 mb-4">
                Send a test report to a specific merchant to verify the system is working correctly.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant *
                  </label>
                  <select
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={loadingMerchants}
                  >
                    <option value="">
                      {loadingMerchants ? 'Loading merchants...' : 'Select a merchant'}
                    </option>
                    {merchants.map((merchant) => (
                      <option key={merchant._id} value={merchant._id}>
                        {merchant.name}
                      </option>
                    ))}
                  </select>
                  {loadingMerchants && (
                    <p className="text-xs text-gray-500 mt-1">Loading merchants from database...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Email (optional)
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Override recipient email for testing"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If empty, will use the merchant&apos;s registered email
                  </p>
                </div>

                <button
                  onClick={sendTestReport}
                  disabled={loading || !merchantId.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Test Report'}
                </button>
              </div>
            </div>

            {/* Send All Reports */}
            <div className="border border-red-200 rounded-lg p-6 bg-red-50">
              <h2 className="text-xl font-semibold text-red-900 mb-4">⚠️ Send All Reports</h2>
              <p className="text-red-700 mb-4">
                Send weekly reports to ALL active merchants. This should only be done on Wednesdays as part of the automated weekly process.
              </p>
              
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Important Notes:</h3>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• This will send emails to ALL active merchants</li>
                  <li>• Should only be run on Wednesdays (2 days before Friday payouts)</li>
                  <li>• The process may take several minutes depending on the number of merchants</li>
                  <li>• Failed sends will be logged but won&apos;t stop the process</li>
                </ul>
              </div>

              <button
                onClick={sendAllReports}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending to All Merchants...' : 'Send All Reports'}
              </button>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Success</h3>
                <pre className="text-green-700 text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
