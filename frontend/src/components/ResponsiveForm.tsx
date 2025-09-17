'use client';

import { useState, useRef, useEffect } from 'react';
import { BRAND_CONFIG } from '@/shared/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
}

interface ResponsiveFormProps {
  steps: FormStep[];
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  submitLabel?: string;
  className?: string;
}

export default function ResponsiveForm({
  steps,
  onSubmit,
  initialData = {},
  submitLabel = 'Submit',
  className = ''
}: ResponsiveFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { colors } = BRAND_CONFIG;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }
    if (field.validation) {
      return field.validation(value);
    }
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }
    if (field.type === 'tel' && value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return 'Invalid phone number';
      }
    }
    return null;
  };

  const handleFieldChange = (field: FormField, value: any) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));

    // Clear error on change
    if (errors[field.name]) {
      setErrors(prev => ({ ...prev, [field.name]: '' }));
    }
  };

  const handleFieldBlur = (field: FormField) => {
    setTouched(prev => ({ ...prev, [field.name]: true }));
    const error = validateField(field, formData[field.name]);
    if (error) {
      setErrors(prev => ({ ...prev, [field.name]: error }));
    }
  };

  const validateStep = (step: FormStep): boolean => {
    const stepErrors: Record<string, string> = {};
    let isValid = true;

    step.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        stepErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return isValid;
  };

  const handleNext = () => {
    const currentStepData = steps[currentStep];
    if (validateStep(currentStepData)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      // Scroll to top on mobile
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps
    let isValid = true;
    for (const step of steps) {
      if (!validateStep(step)) {
        isValid = false;
      }
    }

    if (!isValid) {
      // Find first step with errors
      for (let i = 0; i < steps.length; i++) {
        const hasErrors = steps[i].fields.some(field => errors[field.name]);
        if (hasErrors) {
          setCurrentStep(i);
          break;
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const error = touched[field.name] && errors[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="mb-2 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              name={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              className={`w-full ${error ? 'border-red-500' : ''} ${isMobile ? 'min-h-[120px]' : ''}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="mb-2 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[field.name] || ''}
              onValueChange={(value) => handleFieldChange(field, value)}
            >
              <SelectTrigger className={`w-full ${error ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div key={field.name} className="mb-4">
            <Label className="mb-2 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className={`space-y-2 ${isMobile ? 'space-y-3' : ''}`}>
              {field.options?.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={formData[field.name] === option.value}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className="w-4 h-4"
                    style={{ accentColor: colors.primary }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name={field.name}
                checked={formData[field.name] || false}
                onChange={(e) => handleFieldChange(field, e.target.checked)}
                className="w-4 h-4 mt-1"
                style={{ accentColor: colors.primary }}
              />
              <div>
                <span>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </span>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
            </label>
          </div>
        );

      default:
        return (
          <div key={field.name} className="mb-4">
            <Label htmlFor={field.name} className="mb-2 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              onBlur={() => handleFieldBlur(field)}
              className={`w-full ${error ? 'border-red-500' : ''}`}
              inputMode={
                field.type === 'email' ? 'email' :
                field.type === 'tel' ? 'tel' :
                field.type === 'number' ? 'numeric' : 'text'
              }
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        );
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <form onSubmit={handleSubmit} ref={formRef} className={className}>
      {/* Progress Indicator */}
      <div className="mb-6">
        {isMobile ? (
          // Mobile: Dots indicator
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-8' : 'w-2'
                }`}
                style={{
                  backgroundColor: index <= currentStep ? colors.primary : colors.lightGray
                }}
              />
            ))}
          </div>
        ) : (
          // Desktop: Step labels
          <div className="flex justify-between relative">
            <div
              className="absolute top-5 left-0 h-1 bg-gray-200"
              style={{ width: '100%', zIndex: 0 }}
            />
            <div
              className="absolute top-5 left-0 h-1 transition-all"
              style={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
                backgroundColor: colors.primary,
                zIndex: 1
              }}
            />
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center relative z-10"
                style={{ flex: 1 }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium transition-all ${
                    index <= currentStep ? 'scale-110' : ''
                  }`}
                  style={{
                    backgroundColor: index <= currentStep ? colors.primary : colors.lightGray
                  }}
                >
                  {index < currentStep ? <Check size={20} /> : index + 1}
                </div>
                <span className={`mt-2 text-xs ${isMobile ? 'hidden' : ''}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Content */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStepData.fields.map(renderField)}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className={`flex ${isFirstStep ? 'justify-end' : 'justify-between'} gap-3 mt-6`}>
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className={isMobile ? 'flex-1' : ''}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}

            {isLastStep ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={isMobile ? 'flex-1' : ''}
                style={{ backgroundColor: colors.primary }}
              >
                {isSubmitting ? 'Submitting...' : submitLabel}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className={isMobile ? 'flex-1' : ''}
                style={{ backgroundColor: colors.primary }}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}