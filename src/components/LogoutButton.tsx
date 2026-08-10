'use client';

import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { logout } from '@/app/login/actions';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className="p-2 text-zinc-400 hover:text-brand hover:bg-zinc-800/50 rounded-lg transition-colors disabled:opacity-50"
      title="Log out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
