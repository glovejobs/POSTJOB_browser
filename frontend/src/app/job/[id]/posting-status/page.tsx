'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock,
  AlertCircle, ExternalLink, Download, Image, Play,
  Loader2, BarChart, FileText, Eye, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BRAND_CONFIG } from '@/shared/constants';
import io, { Socket } from 'socket.io-client';

interface PostingStatus {
  id: string;
  boardName: string;
  status: 'pending' | 'posting' | 'success' | 'failed';
  externalUrl?: string;
  errorMessage?: string;
  postedAt?: string;
  updatedAt: string;
}

interface JobStatus {
  job: {
    id: string;
    title: string;
    status: string;
    company: string;
  };
  stats: {
    total: number;
    pending: number;
    posting: number;
    success: number;
    failed: number;
  };
  postings: PostingStatus[];
}

export default function PostingStatusPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { toast } = useToast();

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedPosting, setSelectedPosting] = useState<PostingStatus | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>([]);

  useEffect(() => {
    if (jobId) {
      fetchStatus();
      connectSocket();
      fetchLogs();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [jobId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/posting/status/${jobId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch posting status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/posting/logs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const connectSocket = () => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to posting updates');
      newSocket.emit('subscribe-job', jobId);
    });

    newSocket.on('job-update', (data: any) => {
      if (data.job_id === jobId) {
        fetchStatus(); // Refresh status

        // Add to logs
        setLogs(prev => [...prev, {
          timestamp: new Date().toISOString(),
          level: data.status === 'success' ? 'success' : data.status === 'failed' ? 'error' : 'info',
          message: `${data.board_name}: ${data.status}`
        }]);
      }
    });

    newSocket.on('job-complete', (data: any) => {
      if (data.job_id === jobId) {
        fetchStatus();
        toast({
          title: 'Posting Complete',
          description: `Successfully posted to ${data.success_count} of ${data.total_count} boards`,
        });
      }
    });

    newSocket.on('job-error', (data: any) => {
      if (data.job_id === jobId) {
        toast({
          title: 'Posting Error',
          description: data.error_message,
          variant: 'destructive',
        });
      }
    });

    setSocket(newSocket);
  };

  const handleRetry = async (postingId: string) => {
    try {
      const response = await fetch(`/api/posting/retry/${postingId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Retry initiated',
        });
        fetchStatus();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry posting',
        variant: 'destructive',
      });
    }
  };

  const handleStartPosting = async () => {
    try {
      const boardIds = status?.postings.map(p => p.id) || [];
      const response = await fetch('/api/posting/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId, boardIds })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Job posting started',
        });
        fetchStatus();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start posting',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'posting':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'posting':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = status
    ? ((status.stats.success + status.stats.failed) / status.stats.total) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: BRAND_CONFIG.colors.primary }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button
        onClick={() => router.push(`/job/${jobId}`)}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Job
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Posting Status</h1>
        <p className="text-gray-600">{status?.job.title} • {status?.job.company}</p>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercentage} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{status?.stats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{status?.stats.posting}</p>
              <p className="text-sm text-gray-600">Posting</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{status?.stats.success}</p>
              <p className="text-sm text-gray-600">Success</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{status?.stats.failed}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>

          {status?.job.status === 'draft' && (
            <Button
              onClick={handleStartPosting}
              className="w-full mt-4"
              style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Posting
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Board Status List */}
        <Card>
          <CardHeader>
            <CardTitle>Board Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status?.postings.map((posting) => (
                <div
                  key={posting.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPosting?.id === posting.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPosting(posting)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(posting.status)}
                      <div>
                        <p className="font-medium">{posting.boardName}</p>
                        <p className="text-sm text-gray-600">
                          Updated {new Date(posting.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(posting.status)}>
                      {posting.status}
                    </Badge>
                  </div>

                  {posting.errorMessage && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      {posting.errorMessage}
                    </div>
                  )}

                  {posting.externalUrl && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(posting.externalUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  )}

                  {posting.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(posting.id);
                      }}
                      className="mt-2"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Retry
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details & Logs */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Activity Log</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLogs}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    log.level === 'error' ? 'bg-red-50 text-red-700' :
                    log.level === 'success' ? 'bg-green-50 text-green-700' :
                    log.level === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="ml-2">{log.message}</span>
                </div>
              ))}
            </div>

            {selectedPosting && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{selectedPosting.boardName}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedPosting.status)}`}>
                      {selectedPosting.status}
                    </Badge>
                  </div>
                  {selectedPosting.postedAt && (
                    <div>
                      <span className="text-gray-600">Posted:</span>
                      <span className="ml-2">
                        {new Date(selectedPosting.postedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedPosting.externalUrl && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedPosting.externalUrl, '_blank')}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View Posting
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowScreenshot(true)}
                      >
                        <Image className="mr-1 h-3 w-3" />
                        Screenshot
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Screenshot Modal */}
      {showScreenshot && selectedPosting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Screenshot - {selectedPosting.boardName}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowScreenshot(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <img
                src={`/api/posting/screenshot/${selectedPosting.id}`}
                alt="Posting screenshot"
                className="w-full rounded-lg"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}