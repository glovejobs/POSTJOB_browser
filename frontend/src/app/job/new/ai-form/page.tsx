'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Edit3, Save } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../../../shared/constants';
import { jobs } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { AIDescriptionGenerator } from '@/components/job/AIDescriptionGenerator';

export default function AIJobFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || '';
  const { colors, typography, shadows, borderRadius } = BRAND_CONFIG;

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: initialTitle,
    company: '',
    location: '',
    salaryMin: undefined as number | undefined,
    salaryMax: undefined as number | undefined,
    employmentType: 'Full-time',
    department: '',
    description: '',
    contact_email: 'contact@example.com'
  });

  // Set contact email after component mounts (client-side only)
  useEffect(() => {
    const userEmail = localStorage.getItem('user_email');
    if (userEmail) {
      setFormData(prev => ({ ...prev, contact_email: userEmail }));
    }
  }, []);

  const [step, setStep] = useState<'form' | 'review'>('form');

  const handleSave = async () => {
    setLoading(true);

    try {
      const job = await jobs.create({
        title: formData.title,
        company: formData.company,
        location: formData.location,
        salary_min: formData.salaryMin,
        salary_max: formData.salaryMax,
        employment_type: formData.employmentType,
        department: formData.department,
        description: formData.description,
        contact_email: formData.contact_email,
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
    const { name, value } = e.target;

    if (name === 'salaryMin' || name === 'salaryMax') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value) : undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAIGenerated = (description: string) => {
    setFormData(prev => ({
      ...prev,
      description
    }));
    setStep('review');
  };

  if (step === 'review') {
    return (
      <DashboardLayout title="Review AI-Generated Job Post">
        <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: typography.fontFamily.primary }}>
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header with Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setStep('form')}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      style={{ color: colors.textSecondary }}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                        Review Your Job Post
                      </h1>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Review and edit your AI-generated job listing
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50 flex items-center gap-2"
                    style={{
                      borderColor: editMode ? colors.primary : colors.border,
                      color: editMode ? colors.primary : colors.textSecondary,
                      backgroundColor: editMode ? colors.primaryLight + '10' : 'white',
                      borderRadius: borderRadius.button
                    }}
                  >
                    <Edit3 size={18} />
                    {editMode ? 'Preview' : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Generated Content */}
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* Job Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Job Title
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Company
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.company}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Location
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="input-field"
                      />
                    ) : (
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Salary Range
                    </label>
                    {editMode ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          name="salaryMin"
                          value={formData.salaryMin || ''}
                          onChange={handleChange}
                          placeholder="Min"
                          className="input-field flex-1"
                        />
                        <span style={{ color: colors.textSecondary }}>-</span>
                        <input
                          type="number"
                          name="salaryMax"
                          value={formData.salaryMax || ''}
                          onChange={handleChange}
                          placeholder="Max"
                          className="input-field flex-1"
                        />
                      </div>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                        {formData.salaryMin && formData.salaryMax
                          ? `$${formData.salaryMin.toLocaleString()} - $${formData.salaryMax.toLocaleString()}`
                          : 'Not specified'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                    Job Description
                  </label>
                  {editMode ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={12}
                      className="input-field"
                    />
                  ) : (
                    <div className="p-4 rounded-lg whitespace-pre-wrap" style={{ backgroundColor: colors.surface }}>
                      {formData.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Buttons */}
          <div className="sticky bottom-0 bg-white border-t shadow-lg" style={{ borderColor: colors.border }}>
            <div className="max-w-4xl mx-auto p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-3 border font-medium transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: colors.border,
                    color: colors.textSecondary,
                    borderRadius: borderRadius.button
                  }}
                >
                  Back
                </button>

                <button
                  onClick={handleSave}
                  disabled={loading || !formData.description}
                  className="px-6 py-3 font-medium text-white transition-all transform hover:scale-105 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    opacity: (loading || !formData.description) ? 0.7 : 1,
                    borderRadius: borderRadius.button
                  }}
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Continue to Board Selection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI Job Post Generator">
      <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: typography.fontFamily.primary }}>
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  AI Job Post Generator
                </h1>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  Provide basic details and let AI create a compelling job description
                </p>
              </div>
            </div>

            {/* Basic Information Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: colors.primaryLight + '20' }}>
                  <Sparkles size={24} style={{ color: colors.primary }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                    Basic Job Information
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Tell us about the position you're hiring for
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior Software Engineer"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g., Acme Corp"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., San Francisco, CA or Remote"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Employment Type
                    </label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Engineering, Marketing"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                    Salary Range (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      name="salaryMin"
                      value={formData.salaryMin || ''}
                      onChange={handleChange}
                      placeholder="Minimum (e.g., 100000)"
                      className="input-field"
                    />
                    <input
                      type="number"
                      name="salaryMax"
                      value={formData.salaryMax || ''}
                      onChange={handleChange}
                      placeholder="Maximum (e.g., 150000)"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Description Generator Component */}
            <AIDescriptionGenerator
              jobData={{
                title: formData.title,
                company: formData.company,
                location: formData.location,
                employmentType: formData.employmentType,
                department: formData.department,
                salaryMin: formData.salaryMin,
                salaryMax: formData.salaryMax
              }}
              onGenerated={handleAIGenerated}
            />
          </div>
        </div>

        {/* Sticky Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t shadow-lg" style={{ borderColor: colors.border }}>
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/job/new')}
                className="px-6 py-3 border font-medium transition-colors hover:bg-gray-50"
                style={{
                  borderColor: colors.border,
                  color: colors.textSecondary,
                  borderRadius: borderRadius.button
                }}
              >
                Cancel
              </button>

              {formData.description && (
                <button
                  onClick={() => setStep('review')}
                  className="px-6 py-3 font-medium text-white transition-all transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    borderRadius: borderRadius.button
                  }}
                >
                  Review Generated Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}