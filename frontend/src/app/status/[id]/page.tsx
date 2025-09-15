'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import StatusDashboard from '@/components/StatusDashboard';
import { ArrowLeft } from 'lucide-react';

export default function StatusPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Job Posting Status
            </h1>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StatusDashboard jobId={jobId} />
        
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Post Another Job
          </button>
        </div>
      </main>
    </div>
  );
}