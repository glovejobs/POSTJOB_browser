'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { Job, JobBoard } from '@/../../shared/types';
import { jobs, boards } from '@/lib/api';
import {
  ArrowLeft, Check, Edit, MapPin, Building, Clock,
  DollarSign, Send, Copy, Facebook, Twitter, Linkedin,
  Link as LinkIcon, Mail, MoreVertical, Plus, Download
} from 'lucide-react';

type TabType = 'details' | 'application' | 'screening' | 'hiring' | 'posting';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [loading, setLoading] = useState(true);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const { colors, typography } = BRAND_CONFIG;

  useEffect(() => {
    loadJobData();
  }, [params.id]);

  const loadJobData = async () => {
    try {
      // Load job details and available boards
      const [jobData, boardsData] = await Promise.all([
        jobs.get(params.id as string),
        boards.list()
      ]);
      
      setJob(jobData);
      setJobBoards(boardsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load job:', error);
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!job || selectedBoards.length === 0) return;
    
    setPublishing(true);
    try {
      // Create job posting with selected boards
      await jobs.publish(job.id, selectedBoards);
      router.push('/payment?jobId=' + job.id);
    } catch (error) {
      console.error('Failed to publish job:', error);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid"
             style={{ borderColor: `${colors.primary} transparent` }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Job not found</p>
      </div>
    );
  }

  const isOpen = job.status === 'completed' || job.status === 'posting';
  const isDraft = job.status === 'draft';
  const shareUrl = `${window.location.origin}/jobs/${job.id}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10" style={{ borderColor: colors.border }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} style={{ color: colors.textSecondary }} />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                  {job.title}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                  <span>{job.employmentType || 'Full time'}</span>
                  <span>•</span>
                  <span>{job.department || 'Remote'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {job.location || 'Remote'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Status:</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: isOpen ? `${colors.success}15` : isDraft ? `${colors.warning}15` : `${colors.lightGray}15`,
                    color: isOpen ? colors.success : isDraft ? colors.warning : colors.textSecondary
                  }}
                >
                  {isOpen ? 'Open' : isDraft ? 'Draft' : job.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Job boards:</span>
                <span style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>In review</span>
              </div>

              <button
                className="px-4 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: colors.secondary,
                  color: 'white',
                  fontFamily: typography.fontFamily.primary
                }}
              >
                View applications
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mt-6">
            {[
              { id: 'details', label: 'Job details', count: null },
              { id: 'application', label: 'Application form', count: null },
              { id: 'screening', label: 'Pre-screen applicants', count: null },
              { id: 'hiring', label: 'Hiring Stages', count: null },
              { id: 'posting', label: 'Save & publish', count: 5 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-current' : 'border-transparent'
                }`}
                style={{
                  color: activeTab === tab.id ? colors.textPrimary : colors.textSecondary,
                  fontFamily: typography.fontFamily.primary
                }}
              >
                {tab.id === 'details' && <Check size={16} style={{ color: colors.success }} />}
                {tab.label}
                {tab.count !== null && (
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: colors.textPrimary,
                      color: 'white'
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2">
            {activeTab === 'details' && (
              <JobDetailsTab job={job} colors={colors} typography={typography} />
            )}
            
            {activeTab === 'application' && (
              <ApplicationFormTab colors={colors} typography={typography} />
            )}
            
            {activeTab === 'screening' && (
              <PreScreenTab colors={colors} typography={typography} />
            )}
            
            {activeTab === 'hiring' && (
              <HiringStagesTab colors={colors} typography={typography} />
            )}
            
            {activeTab === 'posting' && (
              <PostingTab 
                jobBoards={jobBoards}
                selectedBoards={selectedBoards}
                setSelectedBoards={setSelectedBoards}
                onPublish={handlePublish}
                publishing={publishing}
                colors={colors} 
                typography={typography} 
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share */}
            <div className="bg-white rounded-lg p-6" style={{ borderColor: colors.border }}>
              <h3 className="font-medium mb-4" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                Share this job
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Careers page URL</p>
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: colors.border }}
                />
                <button className="p-2 border rounded-lg hover:bg-gray-50">
                  <Copy size={16} style={{ color: colors.textSecondary }} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg" style={{ backgroundColor: '#1DA1F2' }}>
                  <Twitter size={20} color="white" />
                </button>
                <button className="p-2 rounded-lg" style={{ backgroundColor: '#4267B2' }}>
                  <Facebook size={20} color="white" />
                </button>
                <button className="p-2 rounded-lg" style={{ backgroundColor: '#0077B5' }}>
                  <Linkedin size={20} color="white" />
                </button>
                <button className="p-2 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                  <LinkIcon size={20} color="white" />
                </button>
                <button className="p-2 rounded-lg" style={{ backgroundColor: colors.primary }}>
                  <Mail size={20} color="white" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6" style={{ borderColor: colors.border }}>
              <h3 className="font-medium mb-4" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                Quick actions
              </h3>
              <button
                className="w-full px-4 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: colors.error }}
              >
                Close this job
              </button>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg p-6" style={{ borderColor: colors.border }}>
              <h3 className="font-medium mb-4" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                Tips
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                    Why use screening questions?
                  </h4>
                  <p className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                    Your job post is targeted to people who match your requirements, and you'll be notified of applicants who pass your screening questions.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                    How will my job post reach candidates?
                  </h4>
                  <p className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
                    When you post a job, it will be visible to a wide pool of qualified candidates. Additionally, we will share your job post on other major job boards to maximize its reach and help you find the right talent.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Job Details Tab Component
function JobDetailsTab({ job, colors, typography }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(job.description);

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
          {job.title} • {job.company}
        </h2>
        <button onClick={() => setIsEditing(!isEditing)} className="text-sm" style={{ color: colors.secondary }}>
          <Edit size={16} className="inline mr-1" />
          Edit
        </button>
      </div>

      <div className="flex items-center gap-6 mb-6 text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
        <span className="flex items-center gap-1">
          <Building size={16} />
          {job.employmentType || 'Entry level'}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={16} />
          {job.department || 'Part time, Remote'}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={16} />
          {job.location || 'California, United States'}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-3" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>Description</h3>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 border rounded-lg min-h-[200px]"
              style={{ borderColor: colors.border, fontFamily: typography.fontFamily.primary }}
            />
          ) : (
            <div className="prose max-w-none">
              <p style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>{description}</p>
            </div>
          )}
        </div>

        {/* Additional sections would be added here */}
      </div>
    </div>
  );
}

// Application Form Tab Component
function ApplicationFormTab({ colors, typography }: any) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
        Customize application form
      </h2>
      
      <div className="space-y-4">
        <p className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
          Build your application form to collect the information you need from candidates.
        </p>
        
        {/* Form builder would go here */}
      </div>
    </div>
  );
}

// Pre-screen Tab Component
function PreScreenTab({ colors, typography }: any) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
        Pre-screen applicants
      </h2>
      
      <div className="space-y-4">
        <p className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
          Add screening questions to filter candidates before they apply.
        </p>
        
        {/* Screening questions builder would go here */}
      </div>
    </div>
  );
}

// Hiring Stages Tab Component
function HiringStagesTab({ colors, typography }: any) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
        Customize hiring stages
      </h2>
      
      <div className="space-y-4">
        <p className="text-sm" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>
          Define your hiring pipeline stages.
        </p>
        
        {/* Hiring stages builder would go here */}
      </div>
    </div>
  );
}

// Posting Tab Component
function PostingTab({ jobBoards, selectedBoards, setSelectedBoards, onPublish, publishing, colors, typography }: any) {
  const premiumBoards = ['LinkedIn', 'Indeed', 'Glassdoor', 'Recooty', 'Twitter'];
  const freeBoards = ['Talent.com', 'ZipRecruiter', 'Monster', 'Google for Jobs', 'SimplyHired', 'Adzuna', 'CareerJet', 'Neuvoo'];

  const toggleBoard = (boardId: string) => {
    setSelectedBoards((prev: string[]) =>
      prev.includes(boardId)
        ? prev.filter((id: string) => id !== boardId)
        : [...prev, boardId]
    );
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6" style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
        Post your job to Top job boards
      </h2>

      <div className="space-y-6">
        {/* Premium boards */}
        <div>
          <h3 className="text-sm font-medium mb-4" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Premium job boards</h3>
          <div className="flex flex-wrap gap-4">
            {premiumBoards.map(board => (
              <button
                key={board}
                onClick={() => toggleBoard(board)}
                className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                  selectedBoards.includes(board) ? 'border-current' : ''
                }`}
                style={{
                  borderColor: selectedBoards.includes(board) ? colors.primary : colors.border,
                  backgroundColor: selectedBoards.includes(board) ? `${colors.primary}10` : 'white',
                  color: selectedBoards.includes(board) ? colors.primary : colors.textSecondary,
                  fontFamily: typography.fontFamily.primary
                }}
              >
                {board}
              </button>
            ))}
          </div>
        </div>

        {/* Free boards */}
        <div>
          <h3 className="text-sm font-medium mb-4" style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.primary }}>Free job boards</h3>
          <div className="flex flex-wrap gap-4">
            {freeBoards.map(board => (
              <button
                key={board}
                onClick={() => toggleBoard(board)}
                className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                  selectedBoards.includes(board) ? 'border-current' : ''
                }`}
                style={{
                  borderColor: selectedBoards.includes(board) ? colors.primary : colors.border,
                  backgroundColor: selectedBoards.includes(board) ? `${colors.primary}10` : 'white',
                  color: selectedBoards.includes(board) ? colors.primary : colors.textSecondary,
                  fontFamily: typography.fontFamily.primary
                }}
              >
                {board}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: colors.border }}>
          <button
            className="px-6 py-2 rounded-lg"
            style={{
              backgroundColor: colors.surface,
              color: colors.dark,
              fontFamily: typography.fontFamily.primary
            }}
          >
            Save as draft
          </button>
          
          <button
            onClick={onPublish}
            disabled={selectedBoards.length === 0 || publishing}
            className="px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            style={{
              backgroundColor: colors.secondary,
              color: 'white',
              fontFamily: typography.fontFamily.primary
            }}
          >
            {publishing ? 'Publishing...' : `Publish to ${selectedBoards.length} boards`}
          </button>
        </div>
      </div>
    </div>
  );
}