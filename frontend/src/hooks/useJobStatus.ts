import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { jobs } from '@/lib/api';
import { JobStatusResponse, JobStatusUpdate } from '../../../shared/types';
import { WEBSOCKET_EVENTS } from '../../../shared/constants';

export const useJobStatus = (jobId: string) => {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { emit, on, off } = useWebSocket({
    onConnect: () => {
      // Subscribe to job updates when connected
      emit(WEBSOCKET_EVENTS.SUBSCRIBE_JOB, jobId);
    },
    onDisconnect: () => {
      setError('Connection lost. Reconnecting...');
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  useEffect(() => {
    // Fetch initial status
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const data = await jobs.getStatus(jobId);
        setStatus(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Listen for status updates
    const handleStatusUpdate = (update: JobStatusUpdate) => {
      if (update.job_id === jobId) {
        setStatus((prev: JobStatusResponse | null) => {
          if (!prev) return null;

          // Update the specific posting status
          const updatedPostings = prev.postings.map((posting: any) => {
            if (posting.board_id === update.board_id) {
              return {
                ...posting,
                status: update.status,
                external_url: update.external_url,
                error_message: update.error_message
              };
            }
            return posting;
          });

          // Determine overall status
          const allCompleted = updatedPostings.every(
            (p: any) => p.status === 'success' || p.status === 'failed'
          );
          const anyFailed = updatedPostings.some((p: any) => p.status === 'failed');
          const anyPosting = updatedPostings.some((p: any) => p.status === 'posting');

          let overallStatus: JobStatusResponse['overall_status'] = 'pending';
          if (allCompleted) {
            overallStatus = anyFailed ? 'failed' : 'completed';
          } else if (anyPosting) {
            overallStatus = 'posting';
          }

          return {
            ...prev,
            overall_status: overallStatus,
            postings: updatedPostings
          };
        });
      }
    };

    on(WEBSOCKET_EVENTS.JOB_STATUS, handleStatusUpdate);

    return () => {
      // Unsubscribe when component unmounts
      emit(WEBSOCKET_EVENTS.UNSUBSCRIBE_JOB, jobId);
      off(WEBSOCKET_EVENTS.JOB_STATUS, handleStatusUpdate);
    };
  }, [jobId, emit, on, off]);

  const refresh = async () => {
    try {
      const data = await jobs.getStatus(jobId);
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh status');
    }
  };

  return {
    status,
    loading,
    error,
    refresh
  };
};