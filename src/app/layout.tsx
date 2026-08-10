import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { LayoutDashboard, FileUp, PlusCircle, PieChart, Archive, TrendingUp, Building, Calendar, Megaphone } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { createClient } from '@/utils/supabase/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Runnur CRM',
  description: 'A modern CRM for managing journeys and customers.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex h-screen overflow-hidden`}>
        {/* Sidebar */}
        {user && (
          <aside className="w-64 glass-panel border-r border-zinc-800/50 flex flex-col h-full z-10 shrink-0">
            <div className="p-6">
            <h1 className="text-2xl font-bold text-brand">
              Runnur CRM
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link href="/summary" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <Calendar className="w-5 h-5" />
              <span>Summary</span>
            </Link>
            <Link href="/bookings/new" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <PlusCircle className="w-5 h-5" />
              <span>Add Booking</span>
            </Link>
            <Link href="/import" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <FileUp className="w-5 h-5" />
              <span>Import CSV</span>
            </Link>
            <Link href="/import-historical" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <Archive className="w-5 h-5" />
              <span>Import Historical</span>
            </Link>
            <Link href="/segments" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <PieChart className="w-5 h-5" />
              <span>Segments</span>
            </Link>
            <Link href="/insights" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>Insights</span>
            </Link>
            <Link href="/businesses" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <Building className="w-5 h-5" />
              <span>Businesses</span>
            </Link>
            <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-colors">
              <Megaphone className="w-5 h-5" />
              <span>Campaigns</span>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-zinc-800/50">
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
        )}

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
          
          <div className="p-8 max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
