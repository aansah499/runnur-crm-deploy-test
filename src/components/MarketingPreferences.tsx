'use client';

import { useState } from 'react';
import { updateMarketingConsent } from '@/actions/customers';
import { CheckCircle2, Loader2, MessageSquare, Mail } from 'lucide-react';

type Props = {
  customerId: string;
  initialSms: string;
  initialEmail: string;
};

export default function MarketingPreferences({ customerId, initialSms, initialEmail }: Props) {
  const [smsConsent, setSmsConsent] = useState(initialSms || 'unknown');
  const [emailConsent, setEmailConsent] = useState(initialEmail || 'unknown');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleUpdate = async (field: 'sms_consent' | 'email_consent', value: string) => {
    setIsUpdating(true);
    setStatusMsg('');
    
    if (field === 'sms_consent') setSmsConsent(value);
    if (field === 'email_consent') setEmailConsent(value);

    const res = await updateMarketingConsent(customerId, field, value);
    
    if (res.error) {
      setStatusMsg('Failed to update.');
    } else {
      setStatusMsg('Saved!');
      setTimeout(() => setStatusMsg(''), 2000);
    }
    setIsUpdating(false);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2 mb-4">
        <h3 className="text-lg font-medium text-white">Marketing Preferences</h3>
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand" />
        ) : statusMsg === 'Saved!' ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" /> {statusMsg}
          </span>
        ) : (
          <span className="text-xs text-red-400">{statusMsg}</span>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-300">
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            SMS Marketing
          </div>
          <select 
            value={smsConsent}
            onChange={(e) => handleUpdate('sms_consent', e.target.value)}
            disabled={isUpdating}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="opted_in">Opted In</option>
            <option value="opted_out">Opted Out</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-300">
            <Mail className="w-4 h-4 text-zinc-500" />
            Email Marketing
          </div>
          <select 
            value={emailConsent}
            onChange={(e) => handleUpdate('email_consent', e.target.value)}
            disabled={isUpdating}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="opted_in">Opted In</option>
            <option value="opted_out">Opted Out</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>
    </div>
  );
}
