'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateJobRequest, JobBoard } from '../../../shared/types';
import { cn } from '@/lib/utils';
import { Button } from './ui/Button';
import { BRAND_CONFIG } from '../../../shared/constants';
import { CheckCircle, Building, MapPin, Mail, DollarSign, Briefcase } from 'lucide-react';

interface JobFormProps {
  boards: JobBoard[];
  onSubmit: (data: CreateJobRequest) => Promise<void>;
}

export default function JobForm({ boards, onSubmit }: JobFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(
    boards.map(b => b.id)
  );
  const [fieldLoading, setFieldLoading] = useState<Record<string, boolean>>({});
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateJobRequest>();
  
  const handleFormSubmit = async (data: CreateJobRequest) => {
    setLoading(true);
    // Add a slight delay for better UX perception
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await onSubmit({
        ...data,
        selected_boards: selectedBoards
      });
      reset();
    } finally {
      setLoading(false);
    }
  };
  
  const toggleBoard = (boardId: string) => {
    setSelectedBoards(prev =>
      prev.includes(boardId)
        ? prev.filter(id => id !== boardId)
        : [...prev, boardId]
    );
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Job Title */}
      <div className="transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="title" className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: BRAND_CONFIG.colors.textPrimary }}>
          <Briefcase size={16} />
          Job Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title', { required: 'Job title is required' })}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm transition-all",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            errors.title && "border-red-500"
          )}
          style={{
            borderColor: errors.title ? BRAND_CONFIG.colors.error : BRAND_CONFIG.colors.border,
            '--tw-ring-color': BRAND_CONFIG.colors.primary
          } as React.CSSProperties}
          placeholder="e.g. Senior Software Engineer"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>
      
      {/* Company */}
      <div className="transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="company" className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: BRAND_CONFIG.colors.textPrimary }}>
          <Building size={16} />
          Company Name *
        </label>
        <input
          type="text"
          id="company"
          {...register('company', { required: 'Company name is required' })}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
            errors.company && "border-red-500"
          )}
          placeholder="e.g. Acme Corp"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
        )}
      </div>
      
      {/* Location */}
      <div className="transition-all duration-200 hover:scale-[1.01]">
        <label htmlFor="location" className="block text-sm font-medium mb-1 flex items-center gap-2" style={{ color: BRAND_CONFIG.colors.textPrimary }}>
          <MapPin size={16} />
          Location *
        </label>
        <input
          type="text"
          id="location"
          {...register('location', { required: 'Location is required' })}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
            errors.location && "border-red-500"
          )}
          placeholder="e.g. San Francisco, CA / Remote"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>
      
      {/* Salary Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Salary (Optional)
          </label>
          <input
            type="number"
            id="salary_min"
            {...register('salary_min', { min: 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. 120000"
          />
        </div>
        <div>
          <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Salary (Optional)
          </label>
          <input
            type="number"
            id="salary_max"
            {...register('salary_max', { min: 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. 180000"
          />
        </div>
      </div>
      
      {/* Contact Email */}
      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Email *
        </label>
        <input
          type="email"
          id="contact_email"
          {...register('contact_email', {
            required: 'Contact email is required',
            pattern: {
              value: /^\S+@\S+$/i,
              message: 'Invalid email address'
            }
          })}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
            errors.contact_email && "border-red-500"
          )}
          placeholder="jobs@company.com"
        />
        {errors.contact_email && (
          <p className="mt-1 text-sm text-red-600">{errors.contact_email.message}</p>
        )}
      </div>
      
      {/* Job Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Job Description *
        </label>
        <textarea
          id="description"
          rows={6}
          {...register('description', { required: 'Job description is required' })}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
            errors.description && "border-red-500"
          )}
          placeholder="Describe the role, responsibilities, requirements..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      
      {/* Board Selection */}
      <div className="transition-all duration-200">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: BRAND_CONFIG.colors.textPrimary }}>
          <CheckCircle size={16} />
          Select Job Boards ({selectedBoards.length} selected)
        </h3>
        <div className="space-y-2">
          {boards.map((board) => (
            <label
              key={board.id}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
            >
              <input
                type="checkbox"
                checked={selectedBoards.includes(board.id)}
                onChange={() => toggleBoard(board.id)}
                className="h-4 w-4 border-gray-300 rounded transition-all duration-200"
                style={{ '--tw-text-opacity': 1, color: BRAND_CONFIG.colors.primary } as React.CSSProperties}
              />
              <span className="text-sm text-gray-700">{board.name}</span>
            </label>
          ))}
        </div>
        {selectedBoards.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Please select at least one job board</p>
        )}
      </div>
      
      {/* Submit Button */}
      <Button
        type="submit"
        loading={loading}
        disabled={selectedBoards.length === 0}
        size="lg"
        fullWidth
        icon={loading ? undefined : <DollarSign size={20} />}
      >
        {loading ? 'Processing Your Job Posting...' : `Post Job to ${selectedBoards.length} Board${selectedBoards.length !== 1 ? 's' : ''} - $2.99`}
      </Button>
    </form>
  );
}