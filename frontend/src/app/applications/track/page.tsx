'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, Mail, CheckCircle, Clock, XCircle, AlertCircle,
  Building, MapPin, Calendar, ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BRAND_CONFIG } from '@/shared/constants';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  status: string;
  createdAt: string;
  job: {
    title: string;
    company: string;
    location: string;
  };
}

export default function TrackApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/applications/track/${encodeURIComponent(email)}`);
      if (!response.ok) {
        if (response.status === 404) {
          setApplications([]);
          setSearched(true);
        } else {
          throw new Error('Failed to track applications');
        }
      } else {
        const data = await response.json();
        setApplications(data);
        setSearched(true);
      }
    } catch (error) {
      console.error('Error tracking applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to track applications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewing':
        return <AlertCircle className="h-4 w-4" />;
      case 'shortlisted':
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF5A5F] to-[#FF7A7F] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Track Your Applications</h1>
            <p className="text-lg opacity-90">
              Enter your email to view the status of all your job applications
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="container mx-auto px-4 -mt-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleTrack} className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
              >
                {loading ? (
                  <>Searching...</>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Applications
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {searched && (
          <>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any applications associated with {email}
                  </p>
                  <Button
                    onClick={() => router.push('/jobs')}
                    style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                  >
                    Browse Jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Your Applications</h2>
                  <p className="text-gray-600 mt-1">
                    Found {applications.length} application{applications.length > 1 ? 's' : ''} for {email}
                  </p>
                </div>

                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                              {application.job.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {application.job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.job.location}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge className={getStatusColor(application.status)}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </Badge>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Applied {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-2">Application ID</p>
                            <p className="font-mono text-xs">{application.id.substring(0, 8)}</p>
                          </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="mt-6 pt-6 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ['new', 'pending', 'reviewing', 'shortlisted', 'accepted', 'rejected'].includes(application.status.toLowerCase())
                                  ? 'bg-green-500 text-white' : 'bg-gray-200'
                              }`}>
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <span>Applied</span>
                            </div>
                            <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                ['reviewing', 'shortlisted', 'accepted'].includes(application.status.toLowerCase())
                                  ? 'bg-green-500 text-white' : 'bg-gray-200'
                              }`}>
                                <AlertCircle className="h-4 w-4" />
                              </div>
                              <span>Reviewing</span>
                            </div>
                            <div className="flex-1 h-0.5 bg-gray-200 mx-2"></div>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                application.status.toLowerCase() === 'accepted' ? 'bg-green-500 text-white' :
                                application.status.toLowerCase() === 'rejected' ? 'bg-red-500 text-white' :
                                'bg-gray-200'
                              }`}>
                                {application.status.toLowerCase() === 'rejected' ?
                                  <XCircle className="h-4 w-4" /> :
                                  <CheckCircle className="h-4 w-4" />
                                }
                              </div>
                              <span>Decision</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Help Section */}
      {!searched && (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Easy Tracking</h3>
                <p className="text-sm text-gray-600">
                  Track all your applications with just your email address
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Updates</h3>
                <p className="text-sm text-gray-600">
                  See the current status of each application instantly
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Stay Informed</h3>
                <p className="text-sm text-gray-600">
                  Know exactly where you stand in the hiring process
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}