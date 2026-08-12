import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import GlobalSearch from '@/components/GlobalSearch';
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
      <body className={`${inter.className} flex flex-col md:flex-row h-screen overflow-hidden`}>
        {/* Sidebar */}
        <Sidebar user={user} />

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand/5 to-transparent pointer-events-none" />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10 flex flex-col min-h-full">
            {user && (
              <div className="mb-6 w-full">
                <GlobalSearch />
              </div>
            )}
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
