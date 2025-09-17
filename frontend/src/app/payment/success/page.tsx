'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, Download, ArrowRight, Loader2, Mail,
  FileText, Rocket, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BRAND_CONFIG } from '@/shared/constants';

interface PaymentDetails {
  status: string;
  amount: number;
  customerEmail: string;
  jobId: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
      triggerConfetti();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payment/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPaymentDetails(data);

      // Clear selected boards from localStorage
      if (data.jobId) {
        localStorage.removeItem(`selectedBoards_${data.jobId}`);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: [BRAND_CONFIG.colors.primary, BRAND_CONFIG.colors.secondary, '#FDB462']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: [BRAND_CONFIG.colors.primary, BRAND_CONFIG.colors.secondary, '#FDB462']
      });
    }, 250);
  };

  const handleDownloadInvoice = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/payment/invoice/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${sessionId.substring(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_CONFIG.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
               style={{ backgroundColor: BRAND_CONFIG.colors.primary + '20' }}>
            <CheckCircle className="h-10 w-10" style={{ color: BRAND_CONFIG.colors.primary }} />
          </div>
          <CardTitle className="text-3xl mb-2">Payment Successful!</CardTitle>
          <p className="text-gray-600">
            Your payment of ${((paymentDetails?.amount || 0) / 100).toFixed(2)} has been processed
          </p>
        </CardHeader>
        <CardContent>
          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">What happens next?</h3>
            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Rocket className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Job posting begins</p>
                  <p className="text-sm text-gray-600">
                    Your job is being posted to the selected career boards
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Email confirmation</p>
                  <p className="text-sm text-gray-600">
                    Check {paymentDetails?.customerEmail} for your receipt
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Track progress</p>
                  <p className="text-sm text-gray-600">
                    Monitor posting status in real-time from your dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push(`/job/${paymentDetails?.jobId}/posting-status`)}
              className="flex-1"
              style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
            >
              <Clock className="mr-2 h-4 w-4" />
              View Posting Status
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="flex-1"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          <Button
            onClick={handleDownloadInvoice}
            variant="ghost"
            className="mt-4 w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </Button>

          {/* Order ID */}
          <p className="text-sm text-gray-500 mt-6">
            Order ID: {sessionId?.substring(0, 20)}...
          </p>
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="font-medium">Need help?</p>
              <p className="text-sm text-gray-600">
                Contact our support team at support@postjob.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_CONFIG.colors.primary }} />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}