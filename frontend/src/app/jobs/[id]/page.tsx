'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Building, MapPin, Clock, DollarSign, Users, Briefcase,
  CheckCircle, ArrowLeft, Send, Upload, FileText, Mail,
  Phone, Linkedin, Globe, Calendar
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { BRAND_CONFIG } from '@/shared/constants';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  salary?: string;
  department?: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  createdAt: string;
  applicationCount: number;
}

export default function PublicJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    portfolio: '',
    coverLetter: '',
    resume: null as File | null
  });

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/public/${jobId}`);
      if (!response.ok) throw new Error('Job not found');
      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setApplicationData({ ...applicationData, resume: file });
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplying(true);

    try {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('name', applicationData.name);
      formData.append('email', applicationData.email);
      formData.append('phone', applicationData.phone);
      formData.append('linkedin', applicationData.linkedin);
      formData.append('portfolio', applicationData.portfolio);
      formData.append('coverLetter', applicationData.coverLetter);
      if (applicationData.resume) {
        formData.append('resume', applicationData.resume);
      }

      const response = await fetch('/api/applications/submit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to submit application');

      toast({
        title: 'Success!',
        description: 'Your application has been submitted successfully',
      });

      setShowApplicationForm(false);
      // Update application count
      if (job) {
        setJob({ ...job, applicationCount: job.applicationCount + 1 });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <Button onClick={() => router.push('/jobs')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/jobs')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>

      {/* Job Details */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{job.title}</h1>

                <div className="flex flex-wrap gap-4 mb-6 text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {job.type}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge>{job.level}</Badge>
                  {job.department && <Badge variant="outline">{job.department}</Badge>}
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {job.applicationCount} applicants
                  </Badge>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-3">About the Role</h3>
                  <p className="text-gray-600 whitespace-pre-wrap mb-6">{job.description}</p>

                  {job.requirements && job.requirements.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                      <ul className="space-y-2 mb-6">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {job.benefits && job.benefits.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                      <ul className="space-y-2">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Form */}
            {showApplicationForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Your Application</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitApplication} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Full Name *
                        </label>
                        <Input
                          required
                          value={applicationData.name}
                          onChange={(e) => setApplicationData({ ...applicationData, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email *
                        </label>
                        <Input
                          required
                          type="email"
                          value={applicationData.email}
                          onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Phone
                        </label>
                        <Input
                          value={applicationData.phone}
                          onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          LinkedIn Profile
                        </label>
                        <Input
                          value={applicationData.linkedin}
                          onChange={(e) => setApplicationData({ ...applicationData, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/johndoe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Portfolio/Website
                      </label>
                      <Input
                        value={applicationData.portfolio}
                        onChange={(e) => setApplicationData({ ...applicationData, portfolio: e.target.value })}
                        placeholder="https://johndoe.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Cover Letter *
                      </label>
                      <Textarea
                        required
                        rows={6}
                        value={applicationData.coverLetter}
                        onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                        placeholder="Tell us why you're interested in this position..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Resume/CV * (PDF, DOC, DOCX - Max 5MB)
                      </label>
                      <div className="flex items-center gap-4">
                        <Input
                          required
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="flex-1"
                        />
                        {applicationData.resume && (
                          <Badge variant="secondary">
                            <FileText className="h-3 w-3 mr-1" />
                            {applicationData.resume.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={applying}
                        style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                        className="flex-1"
                      >
                        {applying ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Application
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowApplicationForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                {!showApplicationForm ? (
                  <>
                    <Button
                      onClick={() => setShowApplicationForm(true)}
                      style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
                      className="w-full mb-4"
                      size="lg"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Apply Now
                    </Button>
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Join {job.applicationCount} other applicants
                    </p>
                  </>
                ) : (
                  <div className="text-center text-sm text-gray-600 mb-4">
                    Fill out the form to submit your application
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Posted</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Deadline</span>
                    <span className="font-medium">
                      {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Employment</span>
                    <span className="font-medium">{job.type}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-medium">{job.level}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Share this job</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Globe className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}