'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateJobRequest, JobBoard } from '../../../shared/types';
import { cn } from '@/lib/utils';

interface JobFormProps {
  boards: JobBoard[];
  onSubmit: (data: CreateJobRequest) => Promise<void>;
}

export default function JobForm({ boards, onSubmit }: JobFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(
    boards.map(b => b.id)
  );
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateJobRequest>();
  
  const handleFormSubmit = async (data: CreateJobRequest) => {
    setLoading(true);
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
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Job Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title', { required: 'Job title is required' })}
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm",
            "focus:outline-none focus:ring-indigo-500 focus:border-indigo-500",
            errors.title && "border-red-500"
          )}
          placeholder="e.g. Senior Software Engineer"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>
      
      {/* Company */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
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
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
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
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Select Job Boards ({selectedBoards.length} selected)
        </h3>
        <div className="space-y-2">
          {boards.map((board) => (
            <label
              key={board.id}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={selectedBoards.includes(board.id)}
                onChange={() => toggleBoard(board.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
      <button
        type="submit"
        disabled={loading || selectedBoards.length === 0}
        className={cn(
          "w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white",
          "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
          "disabled:bg-gray-300 disabled:cursor-not-allowed",
          "transition-colors duration-200"
        )}
      >
        {loading ? 'Processing...' : `Post Job - $2.99`}
      </button>
    </form>
  );
}