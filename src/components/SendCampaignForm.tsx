'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send, Loader2, AlertCircle, Info } from 'lucide-react';
import { TAG_LABELS } from '@/lib/constants';
import { getSegmentStats, sendTestEmail, sendCampaignEmail } from '@/actions/email';

interface SendCampaignFormProps {
  initialSegment?: string;
}

export default function SendCampaignForm({ initialSegment = '' }: SendCampaignFormProps) {
  const router = useRouter();
  const [segment, setSegment] = useState(initialSegment);
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const [stats, setStats] = useState({ total: 0, eligible: 0, skipped: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!segment) {
        setStats({ total: 0, eligible: 0, skipped: 0 });
        return;
      }
      setLoadingStats(true);
      const data = await getSegmentStats(segment);
      setStats(data);
      setLoadingStats(false);
    }
    fetchStats();
  }, [segment]);

  const handleSendTest = async () => {
    if (!testEmail || !subject || !message) {
      setStatusMessage({ type: 'error', text: 'Please fill out Test Email, Subject, and Message.' });
      return;
    }
    setIsSendingTest(true);
    setStatusMessage(null);
    const result = await sendTestEmail(testEmail, subject, message);
    setIsSendingTest(false);

    if (result.success) {
      setStatusMessage({ type: 'success', text: `Test email sent to ${testEmail}` });
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to send test email.' });
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignName || !segment || !subject || !message) {
      setStatusMessage({ type: 'error', text: 'Please fill out all required fields.' });
      return;
    }
    if (stats.eligible === 0) {
      setStatusMessage({ type: 'error', text: 'No eligible customers to send to.' });
      return;
    }

    const confirmSend = window.confirm(`Are you sure you want to send this campaign to ${stats.eligible} customers?`);
    if (!confirmSend) return;

    setIsSendingCampaign(true);
    setStatusMessage(null);
    const result = await sendCampaignEmail(campaignName, segment, subject, message);
    setIsSendingCampaign(false);

    if (result.success) {
      alert(`Success! Campaign sent to ${result.sentCount} customers.`);
      router.push('/campaigns');
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Failed to send campaign.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats / Summary */}
      {segment && (
        <div className="glass-panel p-6 rounded-2xl bg-zinc-900/50 flex flex-col sm:flex-row gap-6 items-center">
          <div className="p-4 bg-zinc-800 rounded-xl">
            <Info className="w-8 h-8 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">Audience Summary</h3>
            {loadingStats ? (
              <p className="text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Calculating audience size...
              </p>
            ) : (
              <p className="text-zinc-300 leading-relaxed">
                <strong className="text-white">{stats.total}</strong> customers in this segment. <br/>
                <strong className="text-emerald-400">{stats.eligible}</strong> have opted in and a valid email and will actually receive this. <br/>
                <strong className="text-red-400">{stats.skipped}</strong> will be skipped due to no consent or missing email.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Summer Promo 2026"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Target Segment</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="" disabled>Select a segment</option>
                {Object.entries(TAG_LABELS).map(([tag, label]) => (
                  <option key={tag} value={tag}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Don't miss out on these exclusive deals!"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email Message (Plain Text or HTML)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi there,&#10;&#10;We have a special offer for you..."
              rows={8}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${statusMessage.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <AlertCircle className="w-5 h-5" />
            <p>{statusMessage.text}</p>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test email address"
              className="bg-transparent border-none text-white px-3 py-2 sm:py-0 focus:outline-none placeholder-zinc-500 text-sm w-full"
            />
            <button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-md hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Test
            </button>
          </div>

          <button
            onClick={handleSendCampaign}
            disabled={isSendingCampaign || !segment || stats.eligible === 0}
            className="w-full md:w-auto px-8 py-3 bg-brand text-black font-semibold rounded-lg hover:bg-brand-hover transition-colors shadow-lg shadow-brand/10 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSendingCampaign ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Campaign to {stats.eligible} Customers
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
