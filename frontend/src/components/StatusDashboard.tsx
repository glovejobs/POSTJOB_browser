'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { JobStatusResponse, JobStatusUpdate } from '../types';
import { jobs } from '@/lib/api';
import { JobSocketClient } from '@/lib/socket';
import { cn } from '@/lib/utils';

interface StatusDashboardProps {
  jobId: string;
}

export default function StatusDashboard({ jobId }: StatusDashboardProps) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket] = useState(() => new JobSocketClient());
  
  useEffect(() => {
    // Initial fetch
    fetchStatus();
    
    // Connect to WebSocket
    socket.connect();
    socket.subscribeToJob(jobId);
    
    // Listen for updates
    socket.onJobUpdate((update: JobStatusUpdate) => {
      setStatus(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          postings: prev.postings.map(p =>
            p.board_id === update.board_id
              ? {
                  ...p,
                  status: update.status,
                  external_url: update.external_url,
                  error_message: update.error_message
                }
              : p
          )
        };
      });
    });
    
    socket.onJobComplete((data) => {
      setStatus(prev => {
        if (!prev) return null;
        return {
          ...prev,
          overall_status: data.overall_status as any
        };
      });
    });
    
    // Cleanup
    return () => {
      socket.unsubscribeFromJob(jobId);
      socket.disconnect();
    };
  }, [jobId]);
  
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await jobs.getStatus(jobId);
      setStatus(data);
    } catch (err) {
      setError('Failed to fetch job status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  if (error || !status) {
    return (
      <div className="text-center p-12">
        <p className="text-red-600">{error || 'Failed to load status'}</p>
        <button
          onClick={fetchStatus}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Try again
        </button>
      </div>
    );
  }
  
  const successCount = status.postings.filter(p => p.status === 'success').length;
  const totalCount = status.postings.length;
  const progressPercentage = (successCount / totalCount) * 100;
  
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Posting Progress
        </h2>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{successCount} of {totalCount} boards completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className={cn(
          "text-sm font-medium",
          status.overall_status === 'completed' && "text-green-600",
          status.overall_status === 'failed' && "text-red-600",
          status.overall_status === 'posting' && "text-indigo-600",
          status.overall_status === 'pending' && "text-gray-600"
        )}>
          Status: {status.overall_status.charAt(0).toUpperCase() + status.overall_status.slice(1)}
        </div>
      </div>
      
      {/* Individual Board Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Job Board Status
        </h3>
        
        <div className="space-y-3">
          {status.postings.map((posting) => (
            <div
              key={posting.board_id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {posting.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {posting.status === 'failed' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {posting.status === 'posting' && (
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                )}
                {posting.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
                
                <div>
                  <p className="font-medium text-gray-900">{posting.board_name}</p>
                  {posting.error_message && (
                    <p className="text-sm text-red-600 mt-1">{posting.error_message}</p>
                  )}
                </div>
              </div>
              
              {posting.external_url && (
                <a
                  href={posting.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-500"
                >
                  <span className="text-sm">View</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary */}
      {status.overall_status === 'completed' && (
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Posting Complete!
          </h3>
          <p className="text-green-700">
            Your job has been successfully posted to {successCount} out of {totalCount} boards.
          </p>
          {successCount < totalCount && (
            <p className="text-sm text-green-600 mt-2">
              Some boards failed to post. Check the individual statuses above for details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}