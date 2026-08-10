'use client';

import { useState } from 'react';
import { updateCustomerContactDetails } from '@/actions/customers';
import { Loader2, CheckCircle2 } from 'lucide-react';

type Props = {
  customerId: string;
};

export default function InlineContactEdit({ customerId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError('');
    
    if (!name.trim() || !phone.trim()) {
      setError('Name and Phone are required.');
      return;
    }

    setIsSaving(true);
    const res = await updateCustomerContactDetails(customerId, name, phone, email || null);
    
    if (res.error) {
      setError(res.error);
      setIsSaving(false);
    } else {
      setSuccess(true);
      // Wait a moment then close
      setTimeout(() => {
        setIsEditing(false);
      }, 1000);
    }
  };

  if (!isEditing) {
    return (
      <div className="pt-4 mt-4 border-t border-zinc-800/50">
        <button 
          onClick={() => setIsEditing(true)}
          className="text-sm text-brand hover:text-brand-hover font-medium underline underline-offset-4"
        >
          Add contact details
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 mt-4 border-t border-zinc-800/50 space-y-3 bg-zinc-900/30 p-4 rounded-xl">
      <h4 className="text-sm font-medium text-white">Verify Customer Identity</h4>
      
      {error && <div className="text-xs text-red-400">{error}</div>}
      
      {success ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium py-2">
          <CheckCircle2 className="w-4 h-4" /> Identity Verified!
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Full Name *</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              placeholder="John Doe"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Phone Number *</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              placeholder="07123456789"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              placeholder="john@example.com"
              disabled={isSaving}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 bg-brand text-black text-xs font-medium rounded-md hover:bg-brand-hover transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="px-4 py-1.5 bg-zinc-800 text-white text-xs font-medium rounded-md hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
