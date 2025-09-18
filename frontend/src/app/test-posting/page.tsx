'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { jobsApi } from '../../lib/api';
import { BRAND_CONFIG } from '../../shared/constants';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
}

interface TestResult {
  success: boolean;
  boardName: string;
  externalUrl?: string;
  errorMessage?: string;
  message: string;
  previewMode: boolean;
}

export default function TestPostingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('Harvard University');
  const [enablePreview, setEnablePreview] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string>('');

  const boards = [
    'Harvard University',
    'MIT',
    'Stanford University',
    'Yale University',
    'Princeton University'
  ];

  const { colors, typography } = BRAND_CONFIG;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await jobsApi.getJobs();
      setJobs(response.data);
      if (response.data.length > 0) {
        setSelectedJobId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setError('Failed to load jobs');
    }
  };

  const handleTestPosting = async () => {
    if (!selectedJobId) {
      setError('Please select a job to test');
      return;
    }

    setIsLoading(true);
    setError('');
    setTestResult(null);

    try {
      console.log('🧪 Starting test posting...');
      console.log(`📋 Job ID: ${selectedJobId}`);
      console.log(`🏫 Board: ${selectedBoard}`);
      console.log(`🖥️ Preview Mode: ${enablePreview}`);

      const response = await fetch('/api/posting/test-posting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          boardName: selectedBoard,
          enablePreview
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Test posting failed');
      }

      setTestResult(result);
      console.log('✅ Test posting completed:', result);
    } catch (error: any) {
      console.error('❌ Test posting error:', error);
      setError(error.message || 'Test posting failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Test Job Posting">
      <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: typography.fontFamily.primary }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.primary}15` }}>
                <svg className="w-6 h-6" style={{ color: colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.dark }}>
                  Test Job Posting
                </h1>
                <p className="text-gray-600 text-sm">
                  Test actual job posting with browser preview
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Job Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Job to Test
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: colors.primary }}
                  disabled={isLoading}
                >
                  <option value="">Select a job...</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company} ({job.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Board Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select University Board
                </label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: colors.primary }}
                  disabled={isLoading}
                >
                  {boards.map((board) => (
                    <option key={board} value={board}>
                      {board}
                    </option>
                  ))}
                </select>
              </div>

              {/* Browser Preview Toggle */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={enablePreview}
                    onChange={(e) => setEnablePreview(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: colors.primary }}
                    disabled={isLoading}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Enable Browser Preview
                    </span>
                    <p className="text-xs text-gray-500">
                      Show browser window during automation (useful for debugging)
                    </p>
                  </div>
                </label>
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestPosting}
                disabled={isLoading || !selectedJobId}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.primary }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Testing Job Posting...
                  </div>
                ) : (
                  'Start Test Posting'
                )}
              </button>

              {/* Test Result */}
              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-medium ${
                      testResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>

                  <p className={`${testResult.success ? 'text-green-700' : 'text-red-700'} mb-2`}>
                    {testResult.message}
                  </p>

                  {testResult.externalUrl && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">Job URL:</span>
                      <a
                        href={testResult.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {testResult.externalUrl}
                      </a>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-600">
                    Board: {testResult.boardName} | Preview Mode: {testResult.previewMode ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select a job that you want to test posting</li>
                  <li>• Choose a university board to test with</li>
                  <li>• Enable browser preview to see the automation in action</li>
                  <li>• Click "Start Test Posting" to begin the test</li>
                  <li>• Watch the console logs for detailed progress information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}