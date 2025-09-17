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
  FunnelIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
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

export default function Dashboard() {
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const apiKey = localStorage.getItem('api_key');
      if (!apiKey) {
        router.push('/login');
        return;
      }

      const headers = { 'x-api-key': apiKey };

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
    localStorage.removeItem('api_key');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-amber-600 bg-amber-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const sidebarItems = [
    { icon: HomeIcon, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: BriefcaseIcon, label: 'My Jobs', href: '/my-jobs', active: false },
    { icon: DocumentTextIcon, label: 'Applications', href: '/applications', active: false },
    { icon: ChartBarIcon, label: 'Analytics', href: '/analytics', active: false },
    { icon: CreditCardIcon, label: 'Billing', href: '/payment/history', active: false },
    { icon: Cog6ToothIcon, label: 'Settings', href: '/profile', active: false },
  ];

  const quickStats = [
    {
      label: 'Total Jobs',
      value: stats.totalJobs,
      change: '+12%',
      trend: 'up',
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Jobs',
      value: stats.activeJobs,
      change: stats.totalJobs > 0 ? `${Math.round((stats.activeJobs / stats.totalJobs) * 100)}%` : '0%',
      trend: 'neutral',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Applications',
      value: stats.totalApplications,
      change: '+25%',
      trend: 'up',
      icon: DocumentTextIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      change: '+5%',
      trend: 'up',
      icon: ChartBarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 animate-spin mx-auto" style={{ borderRadius: BRAND_CONFIG.borderRadius.full }}></div>
          <p className="text-xs text-gray-500 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-100">
          {!sidebarCollapsed && (
            <h1 className="text-sm font-semibold text-gray-900">PostJob</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
          >
            <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-all ${
                    item.active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                >
                  <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2.5 py-1.5 w-full text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all"
            style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
          >
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-12 bg-white border-b border-gray-200">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, or locations..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 focus:bg-white transition-colors"
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.input }}
                />
              </div>
              <button className="p-1.5 text-gray-500 hover:text-gray-700">
                <FunnelIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/post-job')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Post Job
              </button>

              <button className="relative p-1.5 text-gray-500 hover:text-gray-700">
                {notifications > 0 ? (
                  <>
                    <BellSolidIcon className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 flex items-center justify-center" style={{ borderRadius: BRAND_CONFIG.borderRadius.full }}>
                      <span className="text-xxs text-white font-medium">{notifications}</span>
                    </span>
                  </>
                ) : (
                  <BellIcon className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={() => router.push('/profile')}
                className="p-1.5 text-gray-500 hover:text-gray-700"
              >
                <UserCircleIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4">
          {/* Page header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Dashboard Overview</h1>
                <p className="text-xs text-gray-500 mt-0.5">Track your job postings and application metrics</p>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-xs px-2.5 py-1 bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
                style={{ borderRadius: BRAND_CONFIG.borderRadius.input }}>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
                <button className="p-1.5 text-gray-500 hover:text-gray-700">
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {quickStats.map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 p-3"
                style={{ borderRadius: BRAND_CONFIG.borderRadius.card }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center gap-1 mt-1">
                        {stat.trend === 'up' && (
                          <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />
                        )}
                        <span className={`text-xxs ${stat.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>
                          {stat.change} from last period
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`p-1.5 ${stat.bgColor}`}
                    style={{ borderRadius: BRAND_CONFIG.borderRadius.sm }}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Recent Jobs - 2 columns */}
            <div className="col-span-2 bg-white border border-gray-200"
              style={{ borderRadius: BRAND_CONFIG.borderRadius.card }}>
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Recent Jobs</h2>
                <Link
                  href="/my-jobs"
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View all
                  <ChevronRightIcon className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {recentJobs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BriefcaseIcon className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-3">No jobs posted yet</p>
                    <button
                      onClick={() => router.push('/post-job')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                      style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                    >
                      Post your first job
                    </button>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/job/${job.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-medium text-gray-900">{job.title}</h3>
                              <span className={`px-1.5 py-0.5 text-xxs font-medium rounded ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
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
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {job.applicationCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xxs font-medium rounded">
                                {job.applicationCount} apps
                              </span>
                            )}
                            <button className="p-0.5 text-gray-400 hover:text-gray-600">
                              <EllipsisHorizontalIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200"
              style={{ borderRadius: BRAND_CONFIG.borderRadius.card }}>
              <div className="px-4 py-2.5 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-3 space-y-2">
                <button
                  onClick={() => router.push('/post-job')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Post a new job
                </button>
                <button
                  onClick={() => router.push('/jobs')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                >
                  <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                  Browse job board
                </button>
                <button
                  onClick={() => router.push('/applications/track')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                >
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                  Track applications
                </button>
                <button
                  onClick={() => router.push('/analytics')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                >
                  <ChartBarIcon className="h-3.5 w-3.5" />
                  View analytics
                </button>
                <button
                  onClick={() => router.push('/payment/history')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  style={{ borderRadius: BRAND_CONFIG.borderRadius.button }}
                >
                  <CreditCardIcon className="h-3.5 w-3.5" />
                  Payment history
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}