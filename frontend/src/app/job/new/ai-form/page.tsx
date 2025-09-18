'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Edit3, Save } from 'lucide-react';
import { BRAND_CONFIG } from '../../../../../../shared/constants';
import { jobs } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function AIJobFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || '';
  const { colors, typography, shadows, borderRadius } = BRAND_CONFIG;

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
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

  const [companyContext, setCompanyContext] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    additionalContext: ''
  });

  const [step, setStep] = useState<'context' | 'generated'>('context');

  const generateJobPost = async () => {
    setGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        company: companyContext.companyName,
        description: `We are seeking a talented ${initialTitle} to join our ${companyContext.industry} team. This role offers an exciting opportunity to work on cutting-edge projects and make a significant impact on our products and services.\n\nAs a ${initialTitle}, you will be responsible for designing, developing, and maintaining high-quality software solutions that meet our business needs and exceed customer expectations.`,
        requirements: `• Bachelor's degree in Computer Science or related field\n• 5+ years of experience in software development\n• Strong proficiency in modern programming languages\n• Experience with cloud technologies and microservices architecture\n• Excellent problem-solving and communication skills\n• Ability to work collaboratively in an agile environment`,
        benefits: `• Competitive salary and equity compensation\n• Comprehensive health, dental, and vision insurance\n• Flexible work arrangements and remote options\n• Professional development budget\n• Generous PTO and parental leave policies\n• Modern office with daily catered meals`,
        location: 'San Francisco, CA / Remote',
        salary: '$150,000 - $200,000',
        department: 'Engineering'
      }));
      setStep('generated');
      setGenerating(false);
    }, 2000);
  };

  const handleSave = async () => {
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

  const handleContextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanyContext(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (step === 'context') {
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
                    Tell us about your company and role
                  </p>
                </div>
              </div>

              {/* Content Form */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: colors.primaryLight + '20' }}>
                    <Sparkles size={24} style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      Let's create your job post for: {initialTitle}
                    </h2>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Tell us about your company to generate a tailored job description
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={companyContext.companyName}
                      onChange={handleContextChange}
                      placeholder="e.g., Acme Corp"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Industry *
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={companyContext.industry}
                      onChange={handleContextChange}
                      placeholder="e.g., Technology, Healthcare, Finance"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Company Size
                    </label>
                    <select
                      name="companySize"
                      value={companyContext.companySize}
                      onChange={(e) => handleContextChange(e as any)}
                      className="input-field"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                      Additional Context
                    </label>
                    <textarea
                      name="additionalContext"
                      value={companyContext.additionalContext}
                      onChange={handleContextChange}
                      rows={4}
                      placeholder="Tell us more about your company culture, values, and what makes this role special..."
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
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

                <button
                  onClick={generateJobPost}
                  disabled={!companyContext.companyName || !companyContext.industry || generating}
                  className="px-6 py-3 font-medium text-white transition-all transform hover:scale-105 flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    opacity: (!companyContext.companyName || !companyContext.industry || generating) ? 0.5 : 1,
                    borderRadius: borderRadius.button
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Job Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="AI-Generated Job Post">
      <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: typography.fontFamily.primary }}>
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header with Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStep('context')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>
                      AI-Generated Job Post
                    </h1>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      Review and edit your generated job listing
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => generateJobPost()}
                    className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50 flex items-center gap-2"
                    style={{
                      borderColor: colors.border,
                      color: colors.textSecondary,
                      borderRadius: borderRadius.button
                    }}
                  >
                    <RefreshCw size={18} />
                    Regenerate
                  </button>

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
                    <input
                      type="text"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="input-field"
                    />
                  ) : (
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.salary}</p>
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
                    rows={6}
                    className="input-field"
                  />
                ) : (
                  <div className="p-3 rounded-lg whitespace-pre-line" style={{ backgroundColor: colors.surface }}>
                    {formData.description}
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                  Requirements
                </label>
                {editMode ? (
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={6}
                    className="input-field"
                  />
                ) : (
                  <div className="p-3 rounded-lg whitespace-pre-line" style={{ backgroundColor: colors.surface }}>
                    {formData.requirements}
                  </div>
                )}
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: colors.textPrimary }}>
                  Benefits
                </label>
                {editMode ? (
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    rows={4}
                    className="input-field"
                  />
                ) : (
                  <div className="p-3 rounded-lg whitespace-pre-line" style={{ backgroundColor: colors.surface }}>
                    {formData.benefits}
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
                onClick={() => setStep('context')}
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
                disabled={loading}
                className="px-6 py-3 font-medium text-white transition-all transform hover:scale-105 flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  opacity: loading ? 0.7 : 1,
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