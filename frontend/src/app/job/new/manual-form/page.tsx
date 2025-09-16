'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../../../shared/constants';
import { jobs } from '@/lib/api';

export default function ManualJobFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || '';
  const { colors, typography, shadows } = BRAND_CONFIG;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialTitle,
    company: '',
    location: '',
    salary: '',
    employmentType: 'full_time',
    department: '',
    description: '',
    requirements: '',
    benefits: '',
    applicationDeadline: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const job = await jobs.create({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        salary_min: formData.salary ? parseInt(formData.salary.split('-')[0].replace(/[^0-9]/g, '')) : undefined,
        salary_max: formData.salary ? parseInt(formData.salary.split('-')[1]?.replace(/[^0-9]/g, '') || formData.salary.split('-')[0].replace(/[^0-9]/g, '')) : undefined,
        employment_type: formData.employmentType,
        department: formData.department,
        description: formData.description,
        contact_email: localStorage.getItem('user_email') || 'contact@example.com',
        selected_boards: []
      });

      router.push(`/job/${job.id}/boards`);
    } catch (error) {
      console.error('Failed to create job:', error);
      alert('Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface, fontFamily: typography.fontFamily.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4"
              style={{ borderColor: colors.border }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/job/new')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: colors.textSecondary }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                Create Job Post
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Fill in the details for your job posting
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50 flex items-center gap-2"
            style={{ borderColor: colors.border, color: colors.textSecondary }}
          >
            <Eye size={18} />
            Preview
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g. Tech Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Employment Type *
                </label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Salary Range
                </label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. $120k - $180k"
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
              Job Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Job Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input-field"
                  placeholder="Describe the role, responsibilities, and what makes it unique..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Requirements *
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="input-field"
                  placeholder="List the required skills, experience, and qualifications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Benefits
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe the benefits and perks offered..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/job/new')}
              className="px-6 py-3 rounded-lg border font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              Cancel
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                className="px-6 py-3 rounded-lg border font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: colors.border, color: colors.textPrimary }}
              >
                Save as Draft
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all transform hover:scale-105 flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  opacity: loading ? 0.7 : 1
                }}
              >
                <Save size={18} />
                {loading ? 'Creating...' : 'Continue to Board Selection'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}