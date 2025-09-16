'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { cn } from '@/lib/utils';

// Check if we have a valid Stripe key or are in development mode
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const isDevelopment = !stripeKey || stripeKey.includes('pk_test_123');
const stripePromise = isDevelopment ? null : loadStripe(stripeKey!);

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      '::placeholder': {
        color: '#9CA3AF',
      },
    },
  },
};

// Mock payment form for development mode
function MockPaymentForm({ clientSecret, onSuccess, onError }: StripePaymentProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    // Simulate payment processing delay
    setTimeout(() => {
      const mockPaymentIntentId = clientSecret.split('_')[2]; // Extract job ID
      onSuccess(`mock_pi_${mockPaymentIntentId}`);
      setLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
        <p className="text-sm text-gray-600">Complete your purchase to post your job</p>
        <p className="text-2xl font-bold text-indigo-600 mt-2">$2.99</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
        <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Development Mode</p>
        <p className="text-xs text-yellow-700">
          Stripe is not configured. Using mock payment for testing.
          Click the button below to simulate a successful payment.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
          "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
          "disabled:bg-gray-300 disabled:cursor-not-allowed",
          "transition-colors duration-200"
        )}
      >
        {loading ? 'Processing Mock Payment...' : 'Complete Mock Payment'}
      </button>
    </form>
  );
}

// Real Stripe payment form
function PaymentForm({ clientSecret, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setCardError(null);

    const card = elements.getElement(CardElement);

    if (!card) {
      setLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: card,
        }
      }
    );

    if (error) {
      setCardError(error.message || 'Payment failed');
      onError(error.message || 'Payment failed');
    } else if (paymentIntent) {
      onSuccess(paymentIntent.id);
    }

    setLoading(false);
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
        <p className="text-sm text-gray-600">Complete your purchase to post your job</p>
        <p className="text-2xl font-bold text-indigo-600 mt-2">$2.99</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md shadow-sm">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <p className="mt-1 text-sm text-red-600">{cardError}</p>
        )}
      </div>

      {/* Test Card Notice */}
      <div className="bg-blue-50 p-3 rounded-md">
        <p className="text-xs text-blue-700">
          <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242, any future expiry date, and any 3-digit CVC.
        </p>
      </div>
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className={cn(
          "w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
          "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
          "disabled:bg-gray-300 disabled:cursor-not-allowed",
          "transition-colors duration-200"
        )}
      >
        {loading ? 'Processing Payment...' : 'Complete Payment'}
      </button>
    </form>
  );
}

export default function StripePayment({ clientSecret, onSuccess, onError }: StripePaymentProps) {
  const isMockPayment = clientSecret.startsWith('mock_');

  // For mock payments, use the mock payment form
  if (isMockPayment) {
    return (
      <MockPaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}