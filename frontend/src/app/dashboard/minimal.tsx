'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { BRAND_CONFIG } from '@/../../shared/constants';

interface JobSummary {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  createdAt: string;
  applicationCount: number;
}

interface Stats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  successRate: number;
}

export default function MinimalDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    successRate: 0,
  });
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/analytics/stats', { headers }),
        fetch('/api/jobs?limit=5', { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setRecentJobs(jobsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="h-3.5 w-3.5 text-green-600" />;
      case 'pending':
        return <ClockIcon className="h-3.5 w-3.5 text-amber-600" />;
      case 'failed':
        return <XCircleIcon className="h-3.5 w-3.5 text-red-600" />;
      default:
        return <ClockIcon className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const sidebarItems = [
    { icon: HomeIcon, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: BriefcaseIcon, label: 'Jobs', href: '/my-jobs', active: false },
    { icon: ChartBarIcon, label: 'Analytics', href: '/analytics', active: false },
    { icon: CreditCardIcon, label: 'Billing', href: '/payment/history', active: false },
    { icon: Cog6ToothIcon, label: 'Settings', href: '/profile', active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <h1 className="text-base font-semibold" style={{ color: BRAND_CONFIG.colors.primary }}>
            PostJob
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-3">
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    item.active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-56">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 px-6">
          <div className="h-full flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md flex-1">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="pl-8 pr-3 py-1.5 w-full text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/post-job')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors"
                style={{ backgroundColor: BRAND_CONFIG.colors.primary }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New Job
              </button>

              <button className="relative p-1.5 text-gray-600 hover:text-gray-900">
                {notifications > 0 ? (
                  <>
                    <BellSolidIcon className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xxs text-white">{notifications}</span>
                    </span>
                  </>
                ) : (
                  <BellIcon className="h-4 w-4" />
                )}
              </button>

              <button className="p-1.5 text-gray-600 hover:text-gray-900">
                <UserCircleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {/* Page title */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            <p className="text-xs text-gray-500 mt-0.5">Welcome back! Here's an overview of your job postings.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Total Jobs</span>
                <BriefcaseIcon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-xl font-semibold text-gray-900">{stats.totalJobs}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />
                <span className="text-xxs text-green-600">+12% from last month</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Active Jobs</span>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-xl font-semibold text-gray-900">{stats.activeJobs}</div>
              <div className="text-xxs text-gray-500 mt-1">Currently posting</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Applications</span>
                <DocumentTextIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-xl font-semibold text-gray-900">{stats.totalApplications}</div>
              <div className="text-xxs text-gray-500 mt-1">Total received</div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Success Rate</span>
                <ChartBarIcon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="text-xl font-semibold text-gray-900">{stats.successRate}%</div>
              <div className="text-xxs text-gray-500 mt-1">Posted successfully</div>
            </div>
          </div>

          {/* Recent jobs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Recent Jobs</h3>
              <Link href="/my-jobs" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all
                <ChevronRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentJobs.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <BriefcaseIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No jobs posted yet</p>
                  <button
                    onClick={() => router.push('/post-job')}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-white rounded-md"
                    style={{ backgroundColor: BRAND_CONFIG.colors.secondary }}
                  >
                    Post your first job
                  </button>
                </div>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <h4 className="text-xs font-medium text-gray-900">{job.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xxs text-gray-500">
                            <BuildingOfficeIcon className="h-3 w-3" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1 text-xxs text-gray-500">
                            <MapPinIcon className="h-3 w-3" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1 text-xxs text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.applicationCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xxs font-medium rounded">
                            {job.applicationCount} applications
                          </span>
                        )}
                        <Link
                          href={`/job/${job.id}`}
                          className="text-xxs text-gray-400 hover:text-gray-600"
                        >
                          <ChevronRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}