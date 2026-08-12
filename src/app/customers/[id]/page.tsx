import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Phone, Mail, Calendar, DollarSign, MapPin, Navigation, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import LTVBadge from '@/components/LTVBadge';
import MarketingPreferences from '@/components/MarketingPreferences';
import CustomerNameDisplay from '@/components/CustomerNameDisplay';
import InlineContactEdit from '@/components/InlineContactEdit';

export const revalidate = 0;

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError || !customer) {
    notFound();
  }

  const { data: journeys } = await supabase
    .from('journeys')
    .select('*')
    .eq('customer_id', id)
    .order('booking_date', { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="text-3xl font-bold tracking-tight text-white">
            <CustomerNameDisplay name={customer.name} addressKey={customer.address_key} />
          </div>
          <LTVBadge band={customer.lifetime_value_band} />
        </div>
        <p className="text-zinc-400">Customer Profile & Journey History</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-xl font-bold shadow-lg text-black">
                {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <div className="text-xl font-semibold text-white">
                  <CustomerNameDisplay name={customer.name} addressKey={customer.address_key} showBadge={false} />
                </div>
                <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium mt-1">
                  Active Customer
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Phone className="w-5 h-5 text-zinc-500" />
                <span>{customer.phone || <span className="text-zinc-500 italic">No phone number</span>}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="w-5 h-5 text-zinc-500" />
                <span>{customer.email || <span className="text-zinc-500 italic">No email address</span>}</span>
              </div>
            </div>

            {(!customer.name || !customer.phone) && (
              <InlineContactEdit customerId={id} />
            )}

            {customer.tags && customer.tags.length > 0 && (
              <div className="pt-6 mt-6 border-t border-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Customer Segments</h4>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map((tag: string) => {
                    const TAG_LABELS: Record<string, string> = {
                      new_customer: 'New Customer',
                      repeat_customer: 'Repeat Customer',
                      frequent_customer: 'Frequent Customer',
                      high_spend: 'High Spend (£200+)',
                      inactive_30: 'Inactive (30-59 Days)',
                      inactive_60: 'Inactive (60-89 Days)',
                      inactive_90: 'Inactive (90+ Days)',
                      airport_traveller: 'Airport Traveller',
                      station_traveller: 'Station Traveller',
                    };
                    return (
                      <span key={tag} className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-black text-brand border border-brand text-xs font-medium shadow-sm shadow-brand/10">
                        {TAG_LABELS[tag] || tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-medium text-white border-b border-zinc-800/50 pb-2">Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-zinc-500 flex items-center gap-1.5"><Navigation className="w-4 h-4" /> Bookings</span>
                <p className="text-2xl font-semibold text-white">{customer.total_bookings}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-zinc-500 flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Total Spend</span>
                <p className="text-2xl font-semibold text-white">£{Number(customer.total_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-sm text-zinc-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> First Booking</span>
                <p className="text-base text-zinc-300">{customer.first_booking_at ? new Date(customer.first_booking_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-sm text-zinc-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Last Booking</span>
                <p className="text-base text-zinc-300">{customer.last_booking_at ? new Date(customer.last_booking_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              {customer.favourite_pickup && (
                <div className="space-y-1 col-span-2">
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5"><Star className="w-4 h-4 text-brand" /> Favourite Pickup</span>
                  <p className="text-base text-zinc-300 truncate" title={customer.favourite_pickup}>{customer.favourite_pickup}</p>
                </div>
              )}
              {customer.favourite_dropoff && (
                <div className="space-y-1 col-span-2">
                  <span className="text-sm text-zinc-500 flex items-center gap-1.5"><Star className="w-4 h-4 text-emerald-400" /> Favourite Dropoff</span>
                  <p className="text-base text-zinc-300 truncate" title={customer.favourite_dropoff}>{customer.favourite_dropoff}</p>
                </div>
              )}
            </div>
          </div>

          <MarketingPreferences 
            customerId={id}
            initialSms={customer.sms_consent}
            initialEmail={customer.email_consent}
          />
        </div>

        {/* Journeys History */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand" /> Journey History
                </h3>
                <p className="text-sm text-zinc-400 mt-1">All recorded trips for this customer.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                    <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Route</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Fare</th>
                    <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 text-right whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {journeys?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500">No journeys recorded yet.</td>
                    </tr>
                  ) : (
                    journeys?.map((journey) => (
                      <tr key={journey.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-zinc-300">
                          {new Date(journey.booking_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
                          <div className="flex flex-col gap-2 relative">
                            {/* Visual connecting line */}
                            <div className="absolute left-[7px] top-[14px] bottom-[14px] w-0.5 bg-zinc-800"></div>
                            
                            <div className="flex items-start gap-3 relative z-10">
                              <div className="w-4 h-4 rounded-full border-2 border-brand bg-zinc-900 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-zinc-300 truncate max-w-[150px] sm:max-w-[200px]" title={journey.pickup_address}>{journey.pickup_address}</span>
                            </div>
                            <div className="flex items-start gap-3 relative z-10">
                              <div className="w-4 h-4 rounded-full border-2 border-emerald-400 bg-zinc-900 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-zinc-300 truncate max-w-[150px] sm:max-w-[200px]" title={journey.dropoff_address}>{journey.dropoff_address}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 md:py-4 md:px-6 text-zinc-300 font-medium whitespace-nowrap">
                          £{Number(journey.fare).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 md:py-4 md:px-6 text-right whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            journey.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}>
                            {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
