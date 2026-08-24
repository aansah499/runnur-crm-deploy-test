'use client';

import { useState } from 'react';
import { Download, Mail, Trash2, Shield, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { exportCustomerData, sendDataReport, eraseCustomerData } from '@/actions/privacy';

type Props = {
  customerId: string;
  customerName: string | null;
  privacyStatus: string;
};

export default function PrivacyDataSection({ customerId, customerName, privacyStatus }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  
  const [emailSuccess, setEmailSuccess] = useState(false);
  
  const [showErasureConfirm, setShowErasureConfirm] = useState(false);
  const [erasureConfirmText, setErasureConfirmText] = useState('');
  const [erasureError, setErasureError] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportCustomerData(customerId);
      if (res.success && res.data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `customer_${customerId}_export.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } else {
        alert(res.error || 'Failed to export data');
      }
    } catch {
      alert('Error exporting data');
    }
    setIsExporting(false);
  };

  const handleEmailReport = async () => {
    setIsEmailing(true);
    setEmailSuccess(false);
    try {
      const res = await sendDataReport(customerId);
      if (res.success) {
        setEmailSuccess(true);
        setTimeout(() => setEmailSuccess(false), 3000);
      } else {
        alert(res.error || 'Failed to send data report');
      }
    } catch {
      alert('Error sending data report');
    }
    setIsEmailing(false);
  };

  const handleErase = async () => {
    setErasureError('');
    if (!customerName) {
      // If no name, just allow generic confirm string or 'erase'
      if (erasureConfirmText.toLowerCase() !== 'erase') {
        setErasureError('Please type "erase" to confirm.');
        return;
      }
    } else {
      if (erasureConfirmText.toLowerCase() !== customerName.toLowerCase()) {
        setErasureError(`Please type "${customerName}" to confirm.`);
        return;
      }
    }

    setIsErasing(true);
    try {
      const res = await eraseCustomerData(customerId);
      if (res.success) {
        setShowErasureConfirm(false);
        // Page will revalidate and show erased state
      } else {
        setErasureError(res.error || 'Failed to erase data');
      }
    } catch {
      setErasureError('Error erasing data');
    }
    setIsErasing(false);
  };

  if (privacyStatus === 'erased') {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-400">Customer Erased (GDPR)</h3>
            <p className="text-xs text-zinc-400 mt-1">This customer&apos;s personally identifiable information has been permanently removed in accordance with data protection regulations. Transaction history remains for auditing purposes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4 border border-zinc-800/50">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-brand" />
        <h3 className="text-lg font-medium text-white">Privacy & Data</h3>
      </div>
      
      <p className="text-sm text-zinc-400 pb-2">Manage data subject requests and retention policies.</p>

      <div className="space-y-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white group-hover:text-brand transition-colors">Export Customer Data</div>
              <div className="text-xs text-zinc-500">Download a JSON file of all data held</div>
            </div>
          </div>
          {isExporting ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : null}
        </button>

        <button
          onClick={handleEmailReport}
          disabled={isEmailing}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              {emailSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Mail className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Send Data Report</div>
              <div className="text-xs text-zinc-500">Email a formatted summary to the customer</div>
            </div>
          </div>
          {isEmailing ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" /> : null}
        </button>

        {!showErasureConfirm ? (
          <button
            onClick={() => setShowErasureConfirm(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">Erase Customer Data</div>
                <div className="text-xs text-zinc-500">Permanently anonymize personal information</div>
              </div>
            </div>
          </button>
        ) : (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3">
            <div className="flex items-start gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong className="block mb-1">Destructive Action</strong>
                This will permanently erase the customer&apos;s name and contact details. Journey history will be kept for auditing but anonymized.
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-xs text-zinc-400 block">
                Type <strong>{customerName || 'erase'}</strong> to confirm:
              </label>
              <input
                type="text"
                value={erasureConfirmText}
                onChange={(e) => setErasureConfirmText(e.target.value)}
                placeholder={customerName || 'erase'}
                className="w-full bg-zinc-900 border border-red-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              {erasureError && <div className="text-xs text-red-400">{erasureError}</div>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleErase}
                disabled={isErasing}
                className="flex-1 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isErasing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Erasure'}
              </button>
              <button
                onClick={() => {
                  setShowErasureConfirm(false);
                  setErasureConfirmText('');
                  setErasureError('');
                }}
                disabled={isErasing}
                className="flex-1 py-2 bg-zinc-800 text-white hover:bg-zinc-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
