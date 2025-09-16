'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { jobs } from '@/lib/api';
import StripePayment from '@/components/StripePayment';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { colors, typography } = BRAND_CONFIG;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!jobId) {
      router.push('/dashboard');
      return;
    }

    fetchPaymentDetails();
  }, [jobId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);

      // Get job details
      const job = await jobs.get(jobId!);
      setJobDetails(job);

      // Get or create payment intent
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/payment-intent`, {
        method: 'GET',
        headers: {
          'x-api-key': localStorage.getItem('api_key') || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get payment details');
      }

      const data = await response.json();
      setPaymentIntent(data.paymentIntent);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setProcessing(true);
    try {
      // Confirm payment on backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('api_key') || ''
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id
        })
      });

      // Redirect to status page
      router.push(`/job/${jobId}/status`);
    } catch (err) {
      setError('Payment confirmed but job posting failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeTrial = async () => {
    setProcessing(true);
    try {
      // For development/demo - skip payment
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': localStorage.getItem('api_key') || ''
        },
        body: JSON.stringify({
          payment_intent_id: `mock_${jobId}_${Date.now()}`,
          skip_payment: true
        })
      });

      router.push(`/job/${jobId}/status`);
    } catch (err) {
      setError('Failed to process. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: colors.primary }} />
          <p className="mt-4" style={{ color: colors.gray }}>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto" style={{ color: colors.error }} />
          <h2 className="text-2xl font-bold mt-4" style={{ color: colors.dark }}>Payment Error</h2>
          <p className="mt-2" style={{ color: colors.gray }}>{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: colors.primary }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
            Complete Your Payment
          </h1>
          <p className="mt-2" style={{ color: colors.gray }}>
            Your job will be posted to selected boards immediately after payment
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.dark }}>
              Order Summary
            </h2>

            {jobDetails && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm" style={{ color: colors.gray }}>Job Title</p>
                  <p className="font-medium" style={{ color: colors.dark }}>{jobDetails.title}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.gray }}>Company</p>
                  <p className="font-medium" style={{ color: colors.dark }}>{jobDetails.company}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: colors.gray }}>Location</p>
                  <p className="font-medium" style={{ color: colors.dark }}>{jobDetails.location}</p>
                </div>

                <div className="border-t pt-4" style={{ borderColor: colors.border }}>
                  <div className="flex justify-between items-center">
                    <p className="text-sm" style={{ color: colors.gray }}>Selected Job Boards</p>
                    <p className="font-medium" style={{ color: colors.dark }}>
                      {jobDetails.postings?.length || 0} boards
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4" style={{ borderColor: colors.border }}>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold" style={{ color: colors.dark }}>Total</p>
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>$2.99</p>
                  </div>
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="mt-6 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: colors.success }} />
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Post to multiple job boards instantly
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: colors.success }} />
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Track applications in real-time
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5" style={{ color: colors.success }} />
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  30-day active listing
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: colors.dark }}>
              Payment Method
            </h2>

            {paymentIntent && paymentIntent.client_secret ? (
              <StripePayment
                clientSecret={paymentIntent.client_secret}
                onSuccess={handlePaymentSuccess}
                onError={(error) => console.error('Payment error:', error)}
              />
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Development Mode: Stripe is not configured. Use the test payment button below.
                  </p>
                </div>

                <button
                  onClick={handleFreeTrial}
                  disabled={processing}
                  className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: processing ? colors.gray : colors.secondary,
                    fontFamily: typography.fontFamily.primary
                  }}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Continue with Free Trial'
                  )}
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: colors.gray }}>
                By completing this payment, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push(`/job/${jobId}`)}
            className="text-sm underline"
            style={{ color: colors.textSecondary }}
          >
            Cancel and return to job details
          </button>
        </div>
      </div>
    </div>
  );
}