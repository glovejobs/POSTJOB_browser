'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '@/../../shared/constants';
import { boards, jobs, auth } from '@/lib/api';
import { Job, JobBoard } from '@/../../shared/types';
import MyJobs from '@/components/MyJobs';
import JobStats from '@/components/JobStats';
import PostJobForm from '@/components/PostJobForm';
import { useApi } from '@/hooks/useApi';
import { PageLoader } from '@/components/ui/Loader';
import {
  Briefcase, Plus, BarChart3, Clock, CheckCircle,
  AlertCircle, LogOut, User, Menu, X, Bell, Search as SearchIcon,
  TrendingUp, Users, FileText, ChevronRight, Home,
  Settings, HelpCircle, Calendar, Filter, Download
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'stats'>('dashboard');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [notifications, setNotifications] = useState(3);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { colors, typography, shadows, borderRadius } = BRAND_CONFIG;

  // Use our optimized hooks for data fetching
  const { data: userJobs, loading: jobsLoading } = useApi<Job[]>(
    isAuthenticated ? '/api/jobs' : null,
    { cache: true, cacheDuration: 60000 } // Cache for 1 minute
  );

  const { data: boardList, loading: boardsLoading } = useApi<JobBoard[]>(
    isAuthenticated ? '/api/boards' : null,
    { cache: true, cacheDuration: 300000 } // Cache for 5 minutes
  );

  const loading = jobsLoading || boardsLoading;

  useEffect(() => {
    const apiKey = localStorage.getItem('api_key');
    const email = localStorage.getItem('user_email') || '';
    const name = localStorage.getItem('user_name') || email.split('@')[0];

    if (!apiKey) {
      router.push('/login');
    } else {
      setUserEmail(email);
      setUserName(name);
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  const getStats = () => {
    // Handle null/undefined userJobs
    const jobs = userJobs || [];
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const pendingJobs = jobs.filter(job => job.status === 'pending' || job.status === 'posting').length;
    const failedJobs = jobs.filter(job => job.status === 'failed').length;
    const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
    const totalPostings = jobs.reduce((acc, job) => acc + (job.postings?.length || 0), 0);
    const recentJobs = jobs.slice(0, 5);

    return { totalJobs, completedJobs, pendingJobs, failedJobs, successRate, totalPostings, recentJobs };
  };

  // Check loading state before calling getStats
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid"
               style={{ borderColor: `${colors.primary} transparent` }} />
          <p className="mt-4" style={{ color: colors.gray, fontFamily: typography.fontFamily.primary }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Now safe to call getStats after loading check
  const stats = getStats();

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: colors.surface }}>
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: colors.background }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                   style={{
                     background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                     boxShadow: shadows.sm
                   }}>
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold block"
                      style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
                  {BRAND_CONFIG.name}
                </span>
                <span className="text-xs" style={{ color: colors.gray }}>
                  {BRAND_CONFIG.tagline}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: colors.gray }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            <div className="mb-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider"
                 style={{ color: colors.lightGray }}>Main</p>
            </div>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'dashboard' ? colors.primaryLight + '20' : 'transparent',
                color: activeTab === 'dashboard' ? colors.primary : colors.textPrimary,
              }}
            >
              <Home size={20} />
              <span style={{ fontFamily: typography.fontFamily.primary }}>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'jobs' ? colors.primaryLight + '20' : 'transparent',
                color: activeTab === 'jobs' ? colors.primary : colors.textPrimary,
              }}
            >
              <Briefcase size={20} />
              <span style={{ fontFamily: typography.fontFamily.primary }}>My Jobs</span>
              {stats.totalJobs > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full"
                      style={{ backgroundColor: colors.surface, color: colors.textSecondary }}>
                  {stats.totalJobs}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200`}
              style={{
                backgroundColor: activeTab === 'stats' ? colors.primaryLight + '20' : 'transparent',
                color: activeTab === 'stats' ? colors.primary : colors.textPrimary,
              }}
            >
              <TrendingUp size={20} />
              <span style={{ fontFamily: typography.fontFamily.primary }}>Statistics</span>
            </button>

            <div className="my-4 border-t" style={{ borderColor: colors.border }} />

            <div className="mb-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider"
                 style={{ color: colors.lightGray }}>Support</p>
            </div>

            <button
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-50"
              style={{ color: colors.textPrimary }}
            >
              <Settings size={20} />
              <span style={{ fontFamily: typography.fontFamily.primary }}>Settings</span>
            </button>

            <button
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gray-50"
              style={{ color: colors.textPrimary }}
            >
              <HelpCircle size={20} />
              <span style={{ fontFamily: typography.fontFamily.primary }}>Help</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t" style={{ borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: colors.surface }}>
                  <User size={20} style={{ color: colors.gray }} />
                </div>
                <div>
                  <p className="text-sm font-medium" 
                     style={{ color: colors.dark, fontFamily: typography.fontFamily.primary }}>
                    {userName}
                  </p>
                  <p className="text-xs" style={{ color: colors.gray }}>
                    {userEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push('/profile')}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                  style={{ color: colors.gray }}
                  title="Profile Settings"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  style={{ color: colors.gray }}
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b px-6 py-4"
                style={{ borderColor: colors.border, backgroundColor: colors.background }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ color: colors.textPrimary }}
              >
                <Menu size={20} />
              </button>

              <h1 className="text-2xl font-semibold"
                  style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'jobs' && 'My Jobs'}
                {activeTab === 'stats' && 'Statistics'}
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              {/* Search Bar */}
              <button
                onClick={() => router.push('/search')}
                className="hidden md:flex items-center px-4 py-2 rounded-lg transition-colors hover:opacity-80"
                style={{ backgroundColor: colors.surface, minWidth: '250px' }}
              >
                <SearchIcon size={18} style={{ color: colors.gray }} />
                <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
                  Search jobs...
                </span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Bell size={20} style={{ color: colors.textPrimary }} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                        style={{ backgroundColor: colors.error }}>
                    {notifications}
                  </span>
                )}
              </button>

              {/* Quick Post Button - Only show on My Jobs tab */}
              {activeTab === 'jobs' && (
                <button
                  onClick={() => router.push('/job/new')}
                  className="flex items-center px-4 py-2 rounded-lg text-white transition-all transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: shadows.sm
                  }}
                >
                  <Plus size={18} className="mr-2" />
                  <span className="text-sm font-medium">Post Job</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6" style={{ backgroundColor: colors.surface }}>
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Jobs Card */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg"
                         style={{ backgroundColor: colors.primaryLight + '20' }}>
                      <Briefcase size={24} style={{ color: colors.primary }} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded"
                          style={{ backgroundColor: colors.success + '20', color: colors.success }}>
                      +12%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {stats.totalJobs}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Total Jobs Posted
                  </p>
                </div>

                {/* Active Jobs Card */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg"
                         style={{ backgroundColor: colors.secondaryLight + '20' }}>
                      <Clock size={24} style={{ color: colors.secondary }} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded"
                          style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>
                      Active
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {stats.pendingJobs}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Currently Posting
                  </p>
                </div>

                {/* Success Rate Card */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg"
                         style={{ backgroundColor: colors.success + '20' }}>
                      <TrendingUp size={24} style={{ color: colors.success }} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded"
                          style={{ backgroundColor: colors.success + '20', color: colors.success }}>
                      Good
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {stats.successRate}%
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Success Rate
                  </p>
                </div>

                {/* Total Postings Card */}
                <div className="p-6 rounded-xl" style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg"
                         style={{ backgroundColor: colors.info + '20' }}>
                      <Users size={24} style={{ color: colors.info }} />
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded"
                          style={{ backgroundColor: colors.secondary + '20', color: colors.secondary }}>
                      +8%
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {stats.totalPostings}
                  </h3>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Board Postings
                  </p>
                </div>
              </div>

              {/* Charts and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart */}
                <div className="lg:col-span-2 p-6 rounded-xl"
                     style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      Posting Activity
                    </h3>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-1 rounded-lg border text-sm outline-none"
                      style={{
                        borderColor: colors.border,
                        color: colors.textPrimary,
                        backgroundColor: colors.background
                      }}
                    >
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="h-64 flex items-center justify-center rounded-lg"
                       style={{ backgroundColor: colors.surface }}>
                    <div className="text-center">
                      <BarChart3 size={48} style={{ color: colors.lightGray }} className="mx-auto mb-3" />
                      <p style={{ color: colors.textSecondary }}>
                        Activity chart will appear here
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Jobs */}
                <div className="p-6 rounded-xl"
                     style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                      Recent Jobs
                    </h3>
                    <button
                      onClick={() => setActiveTab('jobs')}
                      className="text-sm font-medium flex items-center hover:underline"
                      style={{ color: colors.primary }}
                    >
                      View All
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stats.recentJobs.map((job, idx) => (
                      <div
                        key={job.id}
                        className="p-4 rounded-lg cursor-pointer hover:shadow-md transition-all"
                        style={{
                          backgroundColor: colors.surface,
                          borderLeft: `3px solid ${
                            job.status === 'completed' ? colors.success :
                            job.status === 'posting' ? colors.warning :
                            job.status === 'failed' ? colors.error : colors.gray
                          }`
                        }}
                        onClick={() => router.push(`/job/${job.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium" style={{ color: colors.textPrimary }}>
                            {job.title}
                          </h4>
                          <div className="flex items-center">
                            {job.status === 'completed' && <CheckCircle size={16} style={{ color: colors.success }} />}
                            {job.status === 'posting' && <Clock size={16} style={{ color: colors.warning }} />}
                            {job.status === 'failed' && <AlertCircle size={16} style={{ color: colors.error }} />}
                          </div>
                        </div>
                        <p className="text-sm mb-2" style={{ color: colors.textSecondary }}>
                          {job.company} • {job.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: colors.textMuted }}>
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs" style={{ color: colors.textSecondary }}>
                            {job.postings?.filter((p: any) => p.status === 'success').length || 0}/{job.postings?.length || 0} boards
                          </span>
                        </div>
                      </div>
                    ))}

                    {stats.recentJobs.length === 0 && (
                      <div className="text-center py-8">
                        <FileText size={48} style={{ color: colors.lightGray }} className="mx-auto mb-3" />
                        <p style={{ color: colors.textSecondary }}>
                          No jobs posted yet
                        </p>
                        <button
                          onClick={() => router.push('/job/new')}
                          className="mt-4 px-4 py-2 rounded-lg text-white"
                          style={{
                            backgroundColor: colors.primary,
                            boxShadow: shadows.sm
                          }}
                        >
                          Post Your First Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-xl" style={{ backgroundColor: colors.background, boxShadow: shadows.sm }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.textPrimary }}>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push('/job/new')}
                    className="flex items-center p-4 rounded-lg border-2 border-dashed transition-all hover:shadow-md"
                    style={{
                      borderColor: colors.primary,
                      backgroundColor: colors.primaryLight + '10'
                    }}
                  >
                    <Plus size={32} style={{ color: colors.primary }} className="mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium" style={{ color: colors.textPrimary }}>
                        Post New Job
                      </h4>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Start posting to multiple boards
                      </p>
                    </div>
                  </button>

                  <button
                    className="flex items-center p-4 rounded-lg border-2 border-dashed transition-all hover:shadow-md"
                    style={{
                      borderColor: colors.secondary,
                      backgroundColor: colors.secondaryLight + '10'
                    }}
                  >
                    <FileText size={32} style={{ color: colors.secondary }} className="mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium" style={{ color: colors.textPrimary }}>
                        Use Template
                      </h4>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Quick start with templates
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/analytics')}
                    className="flex items-center p-4 rounded-lg border-2 border-dashed transition-all hover:shadow-md"
                    style={{
                      borderColor: colors.info,
                      backgroundColor: colors.info + '10'
                    }}
                  >
                    <BarChart3 size={32} style={{ color: colors.info }} className="mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium" style={{ color: colors.textPrimary }}>
                        View Analytics
                      </h4>
                      <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Track your performance
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <MyJobs
              initialJobs={userJobs || []}
              onJobClick={(job) => router.push(`/job/${job.id}`)}
              onPostNewJob={() => router.push('/job/new')}
            />
          )}

          {activeTab === 'stats' && (
            <JobStats jobs={userJobs || []} />
          )}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}