'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { type User } from '@supabase/supabase-js';
import { LayoutDashboard, FileUp, PlusCircle, PieChart, Archive, TrendingUp, Building, Calendar, Megaphone, Menu, X, Shield, Copy } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default function Sidebar({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  const closeSidebar = () => setIsOpen(false);

  const navLinks = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/summary', icon: Calendar, label: 'Summary' },
    { href: '/bookings/new', icon: PlusCircle, label: 'Add Booking' },
    { href: '/import', icon: FileUp, label: 'Import CSV' },
    { href: '/import-historical', icon: Archive, label: 'Import Historical' },
    { href: '/segments', icon: PieChart, label: 'Segments' },
    { href: '/insights', icon: TrendingUp, label: 'Insights' },
    { href: '/businesses', icon: Building, label: 'Businesses' },
    { href: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { href: '/customers/duplicates', icon: Copy, label: 'Duplicates' },
    { href: '/settings/audit', icon: Shield, label: 'Audit Log' },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-zinc-800/50 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-brand">Runnur CRM</h1>
        <button onClick={() => setIsOpen(true)} className="p-2 text-zinc-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 glass-panel border-r border-zinc-800/50 flex flex-col h-full z-40 shrink-0 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand">Runnur CRM</h1>
          <button onClick={closeSidebar} className="md:hidden p-1 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-brand bg-zinc-800/50' 
                    : 'text-zinc-400 hover:text-brand hover:bg-zinc-900'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm font-bold text-black shadow-sm">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Admin</span>
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  Online
                </span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
