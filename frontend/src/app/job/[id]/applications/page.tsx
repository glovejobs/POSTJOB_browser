'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, Send, Star, Mail, Phone, Globe, Linkedin, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useApi from '@/hooks/use-api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BRAND_CONFIG } from '@/shared/constants';

interface Application {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  portfolio?: string;
  linkedIn?: string;
  status: string;
  score?: number;
  notes?: string;
  appliedAt: string;
  communications?: Array<{
    id: string;
    subject: string;
    message: string;
    direction: string;
    sentAt: string;
  }>;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
}

export default function ApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { toast } = useToast();
  const { applications } = useApi();
  const { jobs } = useApi();

  const [job, setJob] = useState<Job | null>(null);
  const [applicationList, setApplicationList] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCommunication, setShowCommunication] = useState(false);
  const [communicationForm, setCommunicationForm] = useState({
    subject: '',
    message: ''
  });

  useEffect(() => {
    if (jobId) {
      fetchJobAndApplications();
    }
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      // Fetch job details
      const jobData = await jobs.get(jobId);
      setJob(jobData);

      // Fetch applications
      const apps = await applications.getByJob(jobId);
      setApplicationList(apps);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await applications.updateStatus(applicationId, { status: newStatus });
      toast({
        title: 'Success',
        description: 'Application status updated',
      });
      fetchJobAndApplications();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleScoreChange = async (applicationId: string, score: number) => {
    try {
      await applications.updateScore(applicationId, score);
      toast({
        title: 'Success',
        description: 'Application score updated',
      });
      fetchJobAndApplications();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update score',
        variant: 'destructive',
      });
    }
  };

  const handleSendCommunication = async () => {
    if (!selectedApplication || !communicationForm.subject || !communicationForm.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await applications.communicate(selectedApplication.id, communicationForm);
      toast({
        title: 'Success',
        description: 'Message sent to applicant',
      });
      setCommunicationForm({ subject: '', message: '' });
      setShowCommunication(false);
      fetchJobAndApplications();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const filteredApplications = applicationList.filter(app => {
    const matchesSearch = app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner />;
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
        <h1 className="text-3xl font-bold mb-2">Applications for {job?.title}</h1>
        <p className="text-gray-600">{job?.company} • {job?.location}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            Applicants ({filteredApplications.length})
          </h2>
          {filteredApplications.map((app) => (
            <Card
              key={app.id}
              className={`cursor-pointer transition-colors ${
                selectedApplication?.id === app.id ? 'border-primary' : ''
              }`}
              onClick={() => setSelectedApplication(app)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{app.candidateName}</h3>
                    <p className="text-sm text-gray-600">{app.candidateEmail}</p>
                  </div>
                  <Badge className={getStatusColor(app.status)}>
                    {app.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  {app.candidatePhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {app.candidatePhone}
                    </div>
                  )}
                  {app.score && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {app.score}/100
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Applied {new Date(app.appliedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Application Details */}
        <div>
          {selectedApplication ? (
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedApplication.candidateName}</h3>
                  <p className="text-gray-600">{selectedApplication.candidateEmail}</p>
                  {selectedApplication.candidatePhone && (
                    <p className="text-gray-600">{selectedApplication.candidatePhone}</p>
                  )}
                </div>

                {/* Status Management */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={selectedApplication.status}
                    onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="screening">Screening</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Score */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Score (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedApplication.score || ''}
                    onChange={(e) => handleScoreChange(selectedApplication.id, parseInt(e.target.value))}
                    placeholder="Rate this application"
                  />
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.resumeUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedApplication.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Resume
                      </a>
                    </Button>
                  )}
                  {selectedApplication.portfolio && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedApplication.portfolio} target="_blank" rel="noopener noreferrer">
                        <Globe className="mr-2 h-4 w-4" />
                        Portfolio
                      </a>
                    </Button>
                  )}
                  {selectedApplication.linkedIn && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedApplication.linkedIn} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                </div>

                {/* Cover Letter */}
                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="font-medium mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}

                {/* Communication */}
                <div>
                  <Button
                    onClick={() => setShowCommunication(!showCommunication)}
                    style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                    className="text-white"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>

                  {showCommunication && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <Input
                        placeholder="Subject"
                        value={communicationForm.subject}
                        onChange={(e) => setCommunicationForm({ ...communicationForm, subject: e.target.value })}
                      />
                      <Textarea
                        placeholder="Message to applicant..."
                        value={communicationForm.message}
                        onChange={(e) => setCommunicationForm({ ...communicationForm, message: e.target.value })}
                        rows={4}
                      />
                      <Button
                        onClick={handleSendCommunication}
                        style={{ backgroundColor: BRAND_CONFIG.colors.secondary }}
                        className="text-white"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  )}
                </div>

                {/* Communication History */}
                {selectedApplication.communications && selectedApplication.communications.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Communication History</h4>
                    <div className="space-y-2">
                      {selectedApplication.communications.map((comm) => (
                        <div key={comm.id} className="bg-gray-50 p-3 rounded">
                          <p className="text-sm font-medium">{comm.subject}</p>
                          <p className="text-sm text-gray-600">{comm.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comm.sentAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select an application to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}