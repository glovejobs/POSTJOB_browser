'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import JobForm from '@/components/JobForm';
import StripePayment from '@/components/StripePayment';
import { boards, jobs, auth } from '@/lib/api';
import { CreateJobRequest, JobBoard } from '../types';
import { Briefcase, CheckCircle, Clock, DollarSign } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [boardList, setBoardList] = useState<JobBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    jobId: string;
    clientSecret: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if user has API key
    const apiKey = localStorage.getItem('api_key');
    if (!apiKey) {
      // For MVP, auto-register user
      handleAutoRegister();
    } else {
      loadBoards();
    }
  }, []);
  
  const handleAutoRegister = async () => {
    try {
      // Generate a random email for MVP
      const email = `user-${Date.now()}@example.com`;
      const result = await auth.register(email);
      
      // Store API key
      localStorage.setItem('api_key', result.apiKey);
      
      // Load boards
      await loadBoards();
    } catch (err) {
      setError('Failed to initialize. Please refresh the page.');
      console.error(err);
    }
  };
  
  const loadBoards = async () => {
    try {
      const data = await boards.list();
      setBoardList(data);
    } catch (err) {
      setError('Failed to load job boards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleJobSubmit = async (jobData: CreateJobRequest) => {
    try {
      setError(null);
      
      // Create job and get payment intent
      const result = await jobs.create(jobData);
      
      setPaymentInfo({
        jobId: result.jobId,
        clientSecret: result.paymentIntent.client_secret
      });
      setShowPayment(true);
    } catch (err) {
      setError('Failed to create job. Please try again.');
      console.error(err);
    }
  };
  
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!paymentInfo) return;
    
    try {
      // Confirm payment with backend
      await jobs.confirmPayment(paymentInfo.jobId, paymentIntentId);
      
      // Redirect to status page
      router.push(`/status/${paymentInfo.jobId}`);
    } catch (err) {
      setError('Payment confirmed but failed to start job posting. Please contact support.');
      console.error(err);
    }
  };
  
  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPayment(false);
    setPaymentInfo(null);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-indigo-600" />
              <span>Job Multi-Post</span>
            </h1>
            <div className="text-sm text-gray-600">
              Post to {boardList.length} University Job Boards
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      {!showPayment && (
        <div className="bg-indigo-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">
                Post Your Job to Top University Career Sites
              </h2>
              <p className="text-xl text-indigo-200 mb-8">
                One form, multiple universities. Save time and reach top talent.
              </p>
              
              <div className="flex justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>5 Top Universities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Under 5 Minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Only $2.99</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {!showPayment ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Post Your Job Opening
            </h3>
            <JobForm boards={boardList} onSubmit={handleJobSubmit} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => {
                setShowPayment(false);
                setPaymentInfo(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← Back to form
            </button>
            
            {paymentInfo && (
              <StripePayment
                clientSecret={paymentInfo.clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
