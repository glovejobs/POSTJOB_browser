'use client';

import React, { useState } from 'react';
import { useAIStream } from '@/hooks/use-ai-stream';
import { api } from '@/lib/api';
import { Sparkles, StopCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { BRAND_CONFIG } from '@/../../shared/constants';

interface AIDescriptionGeneratorProps {
  jobData: {
    title: string;
    company: string;
    location: string;
    employmentType?: string;
    department?: string;
    salaryMin?: number;
    salaryMax?: number;
  };
  onGenerated: (description: string) => void;
}

export function AIDescriptionGenerator({ jobData, onGenerated }: AIDescriptionGeneratorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [tone, setTone] = useState<'professional' | 'casual' | 'friendly' | 'corporate'>('professional');
  const [currentReq, setCurrentReq] = useState('');
  const [currentResp, setCurrentResp] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  const { colors } = BRAND_CONFIG;

  const {
    streamedContent,
    isStreaming,
    error,
    startStream,
    stopStream,
    clearContent
  } = useAIStream({
    onComplete: (content) => {
      onGenerated(content);
    }
  });

  // Check AI availability on mount
  React.useEffect(() => {
    api.get('/api/ai/status')
      .then(res => setAiAvailable(res.data.available))
      .catch(() => setAiAvailable(false));
  }, []);

  const handleGenerate = async () => {
    if (!jobData.title || !jobData.company || !jobData.location) {
      alert('Please fill in the required fields: Job Title, Company, and Location');
      return;
    }

    // Check if user is authenticated
    const apiKey = localStorage.getItem('api_key');
    const sessionStr = localStorage.getItem('supabase_session');

    if (!apiKey && !sessionStr) {
      alert('Please log in to use AI features');
      return;
    }

    const params = {
      ...jobData,
      requirements,
      responsibilities,
      benefits,
      tone
    };

    clearContent();

    try {
      await startStream('/api/ai/generate-description-stream', params);
    } catch (error: any) {
      console.error('Failed to generate description:', error);
      // Error will be displayed by the hook
    }
  };

  const handleImprove = async (feedback: string) => {
    if (!streamedContent) return;

    clearContent();
    await startStream('/api/ai/improve-description', {
      description: streamedContent,
      feedback
    });
  };

  const addItem = (type: 'req' | 'resp' | 'benefit') => {
    if (type === 'req' && currentReq.trim()) {
      setRequirements([...requirements, currentReq.trim()]);
      setCurrentReq('');
    } else if (type === 'resp' && currentResp.trim()) {
      setResponsibilities([...responsibilities, currentResp.trim()]);
      setCurrentResp('');
    } else if (type === 'benefit' && currentBenefit.trim()) {
      setBenefits([...benefits, currentBenefit.trim()]);
      setCurrentBenefit('');
    }
  };

  const removeItem = (type: 'req' | 'resp' | 'benefit', index: number) => {
    if (type === 'req') {
      setRequirements(requirements.filter((_, i) => i !== index));
    } else if (type === 'resp') {
      setResponsibilities(responsibilities.filter((_, i) => i !== index));
    } else if (type === 'benefit') {
      setBenefits(benefits.filter((_, i) => i !== index));
    }
  };

  if (aiAvailable === false) {
    return (
      <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <p style={{ color: colors.gray }}>AI features are not available. Please configure OpenRouter API key.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Generation Controls */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: colors.primary }} />
            <h3 className="text-lg font-semibold" style={{ color: colors.dark }}>
              AI Description Generator
            </h3>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm"
            style={{ color: colors.primary }}
          >
            Advanced Options
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            {/* Tone Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                Writing Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg"
                style={{ borderColor: colors.border }}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                Key Requirements
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentReq}
                  onChange={(e) => setCurrentReq(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('req')}
                  placeholder="Add a requirement..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  style={{ borderColor: colors.border }}
                />
                <button
                  onClick={() => addItem('req')}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: colors.surface }}>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>• {req}</span>
                    <button
                      onClick={() => removeItem('req', i)}
                      className="text-xs"
                      style={{ color: colors.error }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                Main Responsibilities
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentResp}
                  onChange={(e) => setCurrentResp(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('resp')}
                  placeholder="Add a responsibility..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  style={{ borderColor: colors.border }}
                />
                <button
                  onClick={() => addItem('resp')}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {responsibilities.map((resp, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: colors.surface }}>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>• {resp}</span>
                    <button
                      onClick={() => removeItem('resp', i)}
                      className="text-xs"
                      style={{ color: colors.error }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.dark }}>
                Benefits & Perks
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentBenefit}
                  onChange={(e) => setCurrentBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addItem('benefit')}
                  placeholder="Add a benefit..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                  style={{ borderColor: colors.border }}
                />
                <button
                  onClick={() => addItem('benefit')}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: colors.primary, color: 'white' }}
                >
                  Add
                </button>
              </div>
              <div className="space-y-1">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: colors.surface }}>
                    <span className="text-sm" style={{ color: colors.textSecondary }}>• {benefit}</span>
                    <button
                      onClick={() => removeItem('benefit', i)}
                      className="text-xs"
                      style={{ color: colors.error }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <button
              onClick={handleGenerate}
              disabled={!jobData.title || !jobData.company || !jobData.location}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                opacity: (!jobData.title || !jobData.company || !jobData.location) ? 0.5 : 1
              }}
            >
              <Sparkles className="h-4 w-4" />
              Generate Description
            </button>
          ) : (
            <button
              onClick={stopStream}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.error, color: 'white' }}
            >
              <StopCircle className="h-4 w-4" />
              Stop Generating
            </button>
          )}

          {streamedContent && !isStreaming && (
            <button
              onClick={() => {
                clearContent();
                handleGenerate();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${colors.error}15`, color: colors.error }}>
            <div className="font-medium mb-1">Error:</div>
            <div className="text-sm">
              {error === 'AI service is not available'
                ? 'The AI service is currently unavailable. This might be due to rate limiting on the free tier. Please try again in a few moments.'
                : error}
            </div>
          </div>
        )}
      </div>

      {/* Generated Content */}
      {streamedContent && (
        <div className="p-6 rounded-lg border" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold" style={{ color: colors.dark }}>
              Generated Description
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => onGenerated(streamedContent)}
                className="px-3 py-1 text-sm rounded"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                Use This Description
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(streamedContent);
                }}
                className="px-3 py-1 text-sm rounded border"
                style={{ borderColor: colors.border, color: colors.textSecondary }}
              >
                Copy
              </button>
            </div>
          </div>
          <div
            className="prose max-w-none whitespace-pre-wrap"
            style={{ color: colors.textPrimary }}
          >
            {streamedContent}
          </div>

          {/* Improvement Section */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
            <details className="group">
              <summary className="cursor-pointer font-medium" style={{ color: colors.dark }}>
                Want to improve this description?
              </summary>
              <div className="mt-3 space-y-2">
                <textarea
                  placeholder="Describe what you'd like to change..."
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ borderColor: colors.border }}
                  rows={3}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.shiftKey === false) {
                      e.preventDefault();
                      handleImprove((e.target as HTMLTextAreaElement).value);
                      (e.target as HTMLTextAreaElement).value = '';
                    }
                  }}
                />
                <p className="text-xs" style={{ color: colors.gray }}>
                  Press Enter to apply improvements
                </p>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}