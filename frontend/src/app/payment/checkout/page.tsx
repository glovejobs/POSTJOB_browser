'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle,
  Building, MapPin, Users, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRAND_CONFIG } from '@/shared/constants';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy');

interface JobDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  boardCount: number;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const jobId = searchParams.get('jobId');
  const boardCount = parseInt(searchParams.get('boards') || '0');

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);

  const PRICE_PER_BOARD = 2.99;
  const totalAmount = boardCount * PRICE_PER_BOARD;

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchSelectedBoards();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setJobDetails({
        id: data.id,
        title: data.title,
        company: data.company,
        location: data.location,
        boardCount
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedBoards = () => {
    // Get selected boards from localStorage
    const boards = localStorage.getItem(`selectedBoards_${jobId}`);
    if (boards) {
      setSelectedBoards(JSON.parse(boards));
    }
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId,
          boardIds: selectedBoards
        })
      });

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_CONFIG.colors.primary }} />
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Job not found</h2>
        <Button onClick={() => router.push('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        onClick={() => router.push(`/job/${jobId}`)}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Job Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">{jobDetails.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {jobDetails.company}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {jobDetails.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Posting to {boardCount} career board{boardCount > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span>Job Posting ({boardCount} board{boardCount > 1 ? 's' : ''})</span>
                  <span>${PRICE_PER_BOARD.toFixed(2)} each</span>
                </div>
                <div className="flex justify-between py-2 border-t">
                  <span className="font-semibold">Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Processing Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t text-lg font-bold">
                  <span>Total</span>
                  <span style={{ color: BRAND_CONFIG.colors.primary }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Automated posting to all selected boards
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time status tracking
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Application management dashboard
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  30-day job listing guarantee
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Security Badge */}
              <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Secure payment powered by Stripe
                </span>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full mb-4"
                size="lg"
                style={{
                  backgroundColor: processing ? '#ccc' : BRAND_CONFIG.colors.primary
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${totalAmount.toFixed(2)}
                  </>
                )}
              </Button>

              {/* Payment Methods */}
              <div className="text-center text-sm text-gray-600 mb-4">
                We accept
              </div>
              <div className="flex justify-center gap-2 mb-6">
                <Badge variant="outline">Visa</Badge>
                <Badge variant="outline">Mastercard</Badge>
                <Badge variant="outline">Amex</Badge>
              </div>

              {/* Terms */}
              <p className="text-xs text-gray-500 text-center">
                By completing this purchase, you agree to our{' '}
                <a href="/terms" className="underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="underline">Privacy Policy</a>
              </p>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span>SSL encrypted payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span>PCI compliant</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_CONFIG.colors.primary }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}