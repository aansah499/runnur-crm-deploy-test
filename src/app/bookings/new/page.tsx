'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { addBooking } from '@/actions/bookings';
import { AlertCircle, CheckCircle, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const initialState = {
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-black font-medium rounded-lg transition-colors shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending ? (
        <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      ) : (
        <>
          <PlusCircle className="w-5 h-5" />
          Add Booking
        </>
      )}
    </button>
  );
}

export default function AddBookingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction] = useFormState(addBooking as any, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success) {
    // Reset form on success (or we can just show success state and a back button)
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="glass-panel p-12 rounded-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 relative z-10" />
          <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Booking Added</h3>
          <p className="text-zinc-400 relative z-10 mb-8">The customer and journey have been successfully recorded.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <button
              onClick={() => {
                formRef.current?.reset();
                window.location.reload(); // Simple way to reset state for this demo
              }}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
            >
              Add Another
            </button>
            <Link href="/" className="px-6 py-2 bg-brand hover:bg-brand-hover text-black font-medium rounded-lg transition-colors shadow-lg shadow-brand/20 flex items-center justify-center">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">New Booking</h2>
        <p className="text-zinc-400">Manually record a new journey for a customer.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl relative">
        {state?.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{state.error}</p>
          </div>
        )}

        <form action={formAction} ref={formRef} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Customer Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-zinc-400">Full Name *</label>
                <input required type="text" id="name" name="name" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-zinc-400">Phone Number *</label>
                <input required type="tel" id="phone" name="phone" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-400">Email Address (Optional)</label>
              <input type="email" id="email" name="email" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="john@example.com" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sms_consent" className="text-sm font-medium text-zinc-400">SMS Consent</label>
                <select id="sms_consent" name="sms_consent" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none">
                  <option value="unknown">Unknown</option>
                  <option value="opted_in">Opted In</option>
                  <option value="opted_out">Opted Out</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="email_consent" className="text-sm font-medium text-zinc-400">Email Consent</label>
                <select id="email_consent" name="email_consent" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none">
                  <option value="unknown">Unknown</option>
                  <option value="opted_in">Opted In</option>
                  <option value="opted_out">Opted Out</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium text-white border-b border-zinc-800 pb-2">Journey Details</h3>
            
            <div className="space-y-1.5">
              <label htmlFor="pickup" className="text-sm font-medium text-zinc-400">Pickup Address *</label>
              <input required type="text" id="pickup" name="pickup" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="123 Start St" />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="dropoff" className="text-sm font-medium text-zinc-400">Dropoff Address *</label>
              <input required type="text" id="dropoff" name="dropoff" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="456 End Ave" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="bookingDate" className="text-sm font-medium text-zinc-400">Booking Date *</label>
                <input required type="date" id="bookingDate" name="bookingDate" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="fare" className="text-sm font-medium text-zinc-400">Fare (£) *</label>
                <input required type="number" step="0.01" min="0" id="fare" name="fare" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50" placeholder="25.00" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="status" className="text-sm font-medium text-zinc-400">Status *</label>
                <select required id="status" name="status" className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none">
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/50">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
