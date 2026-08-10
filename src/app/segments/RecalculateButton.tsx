'use client';

import { RefreshCw } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { recalculateAllCustomers } from '@/actions/tags';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20 border border-zinc-700/50"
    >
      <RefreshCw className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`} />
      {pending ? 'Recalculating...' : 'Recalculate All Tags'}
    </button>
  );
}

export default function RecalculateButton() {
  return (
    <form action={recalculateAllCustomers}>
      <SubmitButton />
    </form>
  );
}
