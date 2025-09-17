'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  MapPin,
  DollarSign,
  FileText,
  Users,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Mail,
  Building,
  Calendar,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  Award
} from 'lucide-react';
import { BRAND_CONFIG } from '../../../shared/constants';
import { CreateJobRequest, JobBoard } from '../../../shared/types';
import { jobs, boards } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface StepperFormProps {
  onSuccess?: (jobId: string) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Briefcase, description: 'Job title and company details' },
  { id: 2, title: 'Job Details', icon: FileText, description: 'Description and requirements' },
  { id: 3, title: 'Location & Type', icon: MapPin, description: 'Work location and employment type' },
  { id: 4, title: 'Compensation', icon: DollarSign, description: 'Salary and benefits' },
  { id: 5, title: 'Target Boards', icon: Target, description: 'Select university job boards' },
  { id: 6, title: 'Review', icon: CheckCircle, description: 'Review and submit' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-Time', icon: '💼' },
  { value: 'part-time', label: 'Part-Time', icon: '⏰' },
  { value: 'contract', label: 'Contract', icon: '📝' },
  { value: 'internship', label: 'Internship', icon: '🎓' },
  { value: 'temporary', label: 'Temporary', icon: '📅' },
  { value: 'volunteer', label: 'Volunteer', icon: '🤝' },
];

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Product',
  'Design',
  'Customer Success',
  'Legal',
  'Other'
];

export default function JobCreationStepper({ onSuccess, onCancel }: StepperFormProps) {
  const router = useRouter();
  const { colors, typography, shadows, borderRadius } = BRAND_CONFIG;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableBoards, setAvailableBoards] = useState<JobBoard[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form data state
  const [formData, setFormData] = useState<CreateJobRequest>({
    title: '',
    company: '',
    description: '',
    location: '',
    contact_email: '',
    employment_type: 'full-time',
    department: '',
    salary_min: undefined,
    salary_max: undefined,
    selected_boards: []
  });

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const boardsData = await boards.list();
      setAvailableBoards(boardsData.filter((b: JobBoard) => b.enabled));
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const updateFormData = (field: keyof CreateJobRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Job title is required';
        if (!formData.company.trim()) newErrors.company = 'Company name is required';
        if (!formData.contact_email.trim()) {
          newErrors.contact_email = 'Contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
          newErrors.contact_email = 'Please enter a valid email';
        }
        break;

      case 2:
        if (!formData.description.trim()) newErrors.description = 'Job description is required';
        if (formData.description.trim().length < 100) {
          newErrors.description = 'Description should be at least 100 characters';
        }
        break;

      case 3:
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.employment_type) newErrors.employment_type = 'Employment type is required';
        if (!formData.department) newErrors.department = 'Department is required';
        break;

      case 4:
        // Salary is optional, but if provided, validate range
        if (formData.salary_min && formData.salary_max) {
          if (formData.salary_min >= formData.salary_max) {
            newErrors.salary = 'Maximum salary must be greater than minimum';
          }
        }
        break;

      case 5:
        if (!formData.selected_boards || formData.selected_boards.length === 0) {
          newErrors.boards = 'Please select at least one job board';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    try {
      const response = await jobs.create(formData);

      if (response.id) {
        // Successfully created job
        if (onSuccess) {
          onSuccess(response.id);
        } else {
          // Redirect to job details page where user can proceed to payment
          router.push(`/job/${response.id}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to create job:', error);
      setErrors({ submit: error.message || 'Failed to create job. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBoard = (boardId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_boards: prev.selected_boards?.includes(boardId)
        ? prev.selected_boards.filter(id => id !== boardId)
        : [...(prev.selected_boards || []), boardId]
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className={`w-full px-4 py-3 border transition-all ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2`}
                style={{
                  borderColor: errors.title ? colors.error : colors.border,
                  backgroundColor: colors.background,
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.base,
                  borderRadius: borderRadius.input,
                  ...(errors.title ? {} : { borderColor: colors.border })
                }}
                onFocus={(e) => e.target.style.borderColor = colors.primary}
                onBlur={(e) => e.target.style.borderColor = errors.title ? colors.error : colors.border}
              />
              {errors.title && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Company Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5" size={20} style={{ color: colors.gray }} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  placeholder="e.g., TechCorp Inc."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all ${
                    errors.company ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2`}
                  style={{
                    borderColor: errors.company ? colors.error : colors.border,
                    backgroundColor: colors.background,
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.base,
                    borderRadius: borderRadius.input
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = errors.company ? colors.error : colors.border}
                />
              </div>
              {errors.company && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.company}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Contact Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5" size={20} style={{ color: colors.gray }} />
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => updateFormData('contact_email', e.target.value)}
                  placeholder="careers@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all ${
                    errors.contact_email ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2`}
                  style={{
                    borderColor: errors.contact_email ? colors.error : colors.border,
                    backgroundColor: colors.background,
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.base
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = errors.contact_email ? colors.error : colors.border}
                />
              </div>
              {errors.contact_email && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.contact_email}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Job Description *
              </label>
              <div className="relative">
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe the role, responsibilities, requirements, and benefits..."
                  rows={12}
                  className={`w-full px-4 py-3 rounded-lg border transition-all resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2`}
                  style={{
                    borderColor: errors.description ? colors.error : colors.border,
                    backgroundColor: colors.background,
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.base
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = errors.description ? colors.error : colors.border}
                />
                <div className="absolute bottom-3 right-3 text-xs" style={{ color: colors.gray }}>
                  {formData.description.length} characters
                </div>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.primaryLight + '10', borderLeft: `3px solid ${colors.primary}` }}>
                <p className="text-sm font-medium mb-1" style={{ color: colors.primary }}>💡 Pro Tip</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Include key responsibilities, required qualifications, and what makes this role unique.
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.secondaryLight + '10', borderLeft: `3px solid ${colors.secondary}` }}>
                <p className="text-sm font-medium mb-1" style={{ color: colors.secondary }}>📝 Format Tip</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  Use bullet points and clear sections for better readability.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Job Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5" size={20} style={{ color: colors.gray }} />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="e.g., Boston, MA or Remote"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2`}
                  style={{
                    borderColor: errors.location ? colors.error : colors.border,
                    backgroundColor: colors.background,
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize.base
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = errors.location ? colors.error : colors.border}
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.location}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: colors.textPrimary }}>
                Employment Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EMPLOYMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('employment_type', type.value)}
                    className={`p-3 rounded-lg border-2 transition-all transform hover:scale-105 ${
                      formData.employment_type === type.value ? 'ring-2' : ''
                    }`}
                    style={{
                      borderColor: formData.employment_type === type.value ? colors.primary : colors.border,
                      backgroundColor: formData.employment_type === type.value ? colors.primaryLight + '10' : colors.background,
                      boxShadow: formData.employment_type === type.value ? shadows.sm : 'none'
                    }}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {type.label}
                    </p>
                  </button>
                ))}
              </div>
              {errors.employment_type && (
                <p className="mt-2 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.employment_type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => updateFormData('department', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-all ${
                  errors.department ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2`}
                style={{
                  borderColor: errors.department ? colors.error : colors.border,
                  backgroundColor: colors.background,
                  fontFamily: typography.fontFamily.primary,
                  fontSize: typography.fontSize.base
                }}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.department}
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Salary Range (Optional)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: colors.gray }}>
                    Minimum
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5" size={18} style={{ color: colors.gray }} />
                    <input
                      type="number"
                      value={formData.salary_min || ''}
                      onChange={(e) => updateFormData('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="60,000"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        fontFamily: typography.fontFamily.primary,
                        fontSize: typography.fontSize.base
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary}
                      onBlur={(e) => e.target.style.borderColor = colors.border}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: colors.gray }}>
                    Maximum
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5" size={18} style={{ color: colors.gray }} />
                    <input
                      type="number"
                      value={formData.salary_max || ''}
                      onChange={(e) => updateFormData('salary_max', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="100,000"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
                      style={{
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        fontFamily: typography.fontFamily.primary,
                        fontSize: typography.fontSize.base
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary}
                      onBlur={(e) => e.target.style.borderColor = colors.border}
                    />
                  </div>
                </div>
              </div>
              {errors.salary && (
                <p className="mt-1 text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={14} className="mr-1" />
                  {errors.salary}
                </p>
              )}
            </div>

            <div className="p-6 rounded-xl" style={{ backgroundColor: colors.surface }}>
              <div className="flex items-center mb-3">
                <Award size={24} style={{ color: colors.primary }} className="mr-3" />
                <h4 className="font-medium" style={{ color: colors.textPrimary }}>
                  Salary Preview
                </h4>
              </div>
              {formData.salary_min || formData.salary_max ? (
                <div className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {formData.salary_min && formData.salary_max ? (
                    `${formatCurrency(formData.salary_min)} - ${formatCurrency(formData.salary_max)}`
                  ) : formData.salary_min ? (
                    `${formatCurrency(formData.salary_min)}+`
                  ) : (
                    `Up to ${formatCurrency(formData.salary_max!)}`
                  )}
                  <span className="text-sm font-normal ml-2" style={{ color: colors.gray }}>
                    per year
                  </span>
                </div>
              ) : (
                <p style={{ color: colors.gray }}>
                  Salary not specified
                </p>
              )}
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.info + '10', borderLeft: `3px solid ${colors.info}` }}>
              <p className="text-sm" style={{ color: colors.textPrimary }}>
                <strong>Note:</strong> Including salary information can increase application rates by up to 30%
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Select University Job Boards *
              </label>
              <p className="text-sm mb-4" style={{ color: colors.gray }}>
                Choose where to post your job listing. Each board reaches thousands of students and alumni.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => toggleBoard(board.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                    formData.selected_boards?.includes(board.id) ? 'ring-2' : ''
                  }`}
                  style={{
                    borderColor: formData.selected_boards?.includes(board.id) ? colors.primary : colors.border,
                    backgroundColor: formData.selected_boards?.includes(board.id) ? colors.primaryLight + '10' : colors.background,
                    boxShadow: formData.selected_boards?.includes(board.id) ? shadows.sm : 'none'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1" style={{ color: colors.textPrimary }}>
                        {board.name}
                      </h4>
                      <p className="text-xs" style={{ color: colors.gray }}>
                        Reach top talent from {board.name}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.selected_boards?.includes(board.id) ? 'border-transparent' : ''
                    }`}
                         style={{
                           borderColor: formData.selected_boards?.includes(board.id) ? 'transparent' : colors.border,
                           backgroundColor: formData.selected_boards?.includes(board.id) ? colors.primary : 'transparent'
                         }}>
                      {formData.selected_boards?.includes(board.id) && (
                        <CheckCircle size={16} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.boards && (
              <p className="mt-2 text-sm flex items-center" style={{ color: colors.error }}>
                <AlertCircle size={14} className="mr-1" />
                {errors.boards}
              </p>
            )}

            <div className="p-4 rounded-lg flex items-center" style={{ backgroundColor: colors.success + '10' }}>
              <Target size={20} style={{ color: colors.success }} className="mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {formData.selected_boards?.length || 0} board{formData.selected_boards?.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs" style={{ color: colors.gray }}>
                  ${(formData.selected_boards?.length || 0) * 2.99} total cost
                </p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles size={48} style={{ color: colors.primary }} className="mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.textPrimary }}>
                Review Your Job Posting
              </h3>
              <p className="text-sm" style={{ color: colors.gray }}>
                Please review all details before submitting
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.gray }}>
                  Basic Information
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Title:</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Company:</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Contact:</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.contact_email}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.gray }}>
                  Job Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Location:</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Type:</span>
                    <span className="text-sm font-medium capitalize" style={{ color: colors.textPrimary }}>
                      {formData.employment_type?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Department:</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{formData.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: colors.gray }}>Salary:</span>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      {formData.salary_min || formData.salary_max ? (
                        formData.salary_min && formData.salary_max ?
                          `${formatCurrency(formData.salary_min)} - ${formatCurrency(formData.salary_max)}` :
                          formData.salary_min ?
                            `${formatCurrency(formData.salary_min)}+` :
                            `Up to ${formatCurrency(formData.salary_max!)}`
                      ) : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.gray }}>
                  Selected Job Boards ({formData.selected_boards?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.selected_boards?.map((boardId) => {
                    const board = availableBoards.find(b => b.id === boardId);
                    return board ? (
                      <span
                        key={boardId}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: colors.primaryLight + '20', color: colors.primary }}
                      >
                        {board.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.success + '10', border: `1px solid ${colors.success}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                      Total Cost
                    </p>
                    <p className="text-xs" style={{ color: colors.gray }}>
                      {formData.selected_boards?.length || 0} boards × $2.99
                    </p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: colors.success }}>
                    ${((formData.selected_boards?.length || 0) * 2.99).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.error + '10', border: `1px solid ${colors.error}` }}>
                <p className="text-sm flex items-center" style={{ color: colors.error }}>
                  <AlertCircle size={16} className="mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex-1 relative">
                {index > 0 && (
                  <div
                    className="absolute left-0 top-6 w-full h-0.5 -translate-x-1/2"
                    style={{
                      backgroundColor: isCompleted ? colors.primary : colors.border,
                      transition: 'background-color 0.3s ease'
                    }}
                  />
                )}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? colors.primary : isCompleted ? colors.success : colors.background,
                      border: `2px solid ${isActive || isCompleted ? 'transparent' : colors.border}`,
                      boxShadow: isActive ? shadows.md : 'none'
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle size={20} className="text-white" />
                    ) : (
                      <Icon size={20} style={{ color: isActive ? 'white' : colors.gray }} />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${isActive ? 'block' : 'hidden sm:block'}`}
                       style={{ color: isActive ? colors.primary : colors.textPrimary }}>
                      {step.title}
                    </p>
                    {isActive && (
                      <p className="text-xs mt-0.5 hidden sm:block" style={{ color: colors.gray }}>
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-lg p-8" style={{ boxShadow: shadows.lg }}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
            {STEPS[currentStep - 1].title}
          </h2>
          <p className="text-sm" style={{ color: colors.gray }}>
            Step {currentStep} of {STEPS.length}
          </p>
        </div>

        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            className="flex items-center px-6 py-3 rounded-lg transition-all hover:bg-gray-50"
            style={{
              color: colors.textPrimary,
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`
            }}
          >
            <ChevronLeft size={20} className="mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          <div className="flex items-center space-x-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === step.id ? 'w-8' : ''
                }`}
                style={{
                  backgroundColor: currentStep === step.id ? colors.primary :
                                 currentStep > step.id ? colors.success : colors.border
                }}
              />
            ))}
          </div>

          {currentStep < STEPS.length ? (
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-3 rounded-lg text-white transition-all transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: shadows.sm
              }}
            >
              Next
              <ChevronRight size={20} className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center px-6 py-3 rounded-lg text-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: submitting ? colors.gray : `linear-gradient(135deg, ${colors.success} 0%, ${colors.secondary} 100%)`,
                boxShadow: shadows.sm
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Creating Job...
                </>
              ) : (
                <>
                  <CheckCircle size={20} className="mr-2" />
                  Create Job & Continue to Payment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}