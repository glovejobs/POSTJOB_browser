'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../../shared/constants';
import { Job } from '../../../../../shared/types';
import { jobs } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft, Save, X, Briefcase, Building, MapPin,
  Mail, DollarSign, Users, FileText
} from 'lucide-react';
import Link from 'next/link';

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salaryMin: '',
    salaryMax: '',
    contactEmail: '',
    employmentType: 'full-time',
    department: ''
  });

  const { colors, typography, shadows } = BRAND_CONFIG;
  const jobId = params.id as string;

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const jobData = await jobs.get(jobId);
      setJob(jobData);

      // Populate form with existing data
      setFormData({
        title: jobData.title || '',
        company: jobData.company || '',
        location: jobData.location || '',
        description: jobData.description || '',
        salaryMin: jobData.salaryMin?.toString() || '',
        salaryMax: jobData.salaryMax?.toString() || '',
        contactEmail: jobData.contactEmail || '',
        employmentType: jobData.employmentType || 'full-time',
        department: jobData.department || ''
      });
    } catch (error) {
      console.error('Failed to load job:', error);
      addToast({
        type: 'error',
        title: 'Failed to load job',
        message: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Prepare update data
      const updateData = {
        ...formData,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
      };

      // Update job via API
      await jobs.update(jobId, updateData);

      addToast({
        type: 'success',
        title: 'Job updated successfully',
        message: 'Your changes have been saved'
      });

      // Redirect back to job detail page
      router.push(`/job/${jobId}`);
    } catch (error) {
      console.error('Failed to update job:', error);
      addToast({
        type: 'error',
        title: 'Failed to update job',
        message: 'Please try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/job/${jobId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid mx-auto"
               style={{ borderColor: `${colors.primary} transparent` }} />
          <p className="mt-4" style={{ color: colors.textSecondary }}>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: colors.error }}>Job not found</p>
          <Link href="/my-jobs">
            <Button variant="primary">Back to My Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4"
              style={{ borderColor: colors.border, backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: colors.textPrimary }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
              Edit Job
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              icon={<X size={20} />}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Save size={20} />}
              loading={saving}
              onClick={handleSubmit}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg p-6" style={{ boxShadow: shadows.sm }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                icon={<Briefcase size={18} />}
                required
                placeholder="e.g. Senior Software Engineer"
              />

              <Input
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                icon={<Building size={18} />}
                required
                placeholder="e.g. Acme Corp"
              />

              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                icon={<MapPin size={18} />}
                required
                placeholder="e.g. San Francisco, CA"
              />

              <Input
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                icon={<Mail size={18} />}
                required
                placeholder="hr@company.com"
              />

              <Input
                label="Minimum Salary (Optional)"
                name="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={handleChange}
                icon={<DollarSign size={18} />}
                placeholder="60000"
              />

              <Input
                label="Maximum Salary (Optional)"
                name="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={handleChange}
                icon={<DollarSign size={18} />}
                placeholder="80000"
              />

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                  <Users size={16} className="inline mr-2" />
                  Employment Type
                </label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border,
                    '--tw-ring-color': colors.primary
                  } as React.CSSProperties}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              <Input
                label="Department (Optional)"
                name="department"
                value={formData.department}
                onChange={handleChange}
                icon={<FileText size={18} />}
                placeholder="e.g. Engineering"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6" style={{ boxShadow: shadows.sm }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Job Description
            </h2>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.border,
                  '--tw-ring-color': colors.primary,
                  fontFamily: typography.fontFamily.primary
                } as React.CSSProperties}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>
          </div>

          {/* Action Buttons (Mobile) */}
          <div className="flex gap-3 md:hidden">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}