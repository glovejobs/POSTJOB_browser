'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BRAND_CONFIG } from '../../../shared/constants';
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showNewJobButton?: boolean;
}

export default function DashboardLayout({ children, title, showNewJobButton = false }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { colors, typography, borderRadius } = BRAND_CONFIG;

  const handleLogout = () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  const sidebarItems = [
    { icon: HomeIcon, label: 'Dashboard', href: '/dashboard' },
    { icon: BriefcaseIcon, label: 'My Jobs', href: '/my-jobs' },
    { icon: DocumentTextIcon, label: 'Applications', href: '/applications' },
    { icon: ChartBarIcon, label: 'Analytics', href: '/analytics' },
    { icon: CreditCardIcon, label: 'Billing', href: '/payment/history' },
    { icon: BeakerIcon, label: 'Test Posting', href: '/test-posting' },
    { icon: Cog6ToothIcon, label: 'Settings', href: '/profile' },
  ];

  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Only access localStorage after component mounts (client-side)
    const email = localStorage.getItem('user_email') || 'user@example.com';
    const name = localStorage.getItem('user_name') || 'User';
    setUserEmail(email);
    setUserName(name);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Sidebar - Fixed Position */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 fixed h-full z-20`}>
        {/* Logo */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-gray-100">
          {!sidebarCollapsed && (
            <h1 className="text-sm font-semibold text-gray-900">PostJob</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-gray-100 text-gray-500"
            style={{ borderRadius: borderRadius.sm }}
          >
            <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Navigation - Scrollable if content overflows */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => {
              // Special case: Make "My Jobs" active for job creation routes
              const isActive = pathname === item.href ||
                            (item.href === '/my-jobs' && (pathname.startsWith('/job/new') || pathname.startsWith('/job/') && pathname.includes('/boards'))) ||
                            (item.href !== '/dashboard' && item.href !== '/my-jobs' && pathname.startsWith(item.href));

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    style={{ borderRadius: borderRadius.button }}
                  >
                    <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-gray-100">
          <div className={`flex items-center gap-2 px-2 py-1.5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <UserCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            style={{ borderRadius: borderRadius.button }}
          >
            <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content - Adjusted for fixed sidebar */}
      <div className={`flex-1 flex flex-col ${sidebarCollapsed ? 'ml-16' : 'ml-52'} transition-all duration-200 h-screen`}>
        {/* Top Header Bar - Fixed Position */}
        <header className={`bg-white border-b border-gray-200 h-12 fixed top-0 right-0 z-10 transition-all duration-200 ${sidebarCollapsed ? 'left-16' : 'left-52'}`}>
          <div className="h-full px-4 flex items-center justify-between">
            {/* Left side - Title and Search */}
            <div className="flex items-center gap-4 flex-1">
              {title && (
                <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
              )}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-gray-300"
                    style={{ borderRadius: borderRadius.input }}
                  />
                </div>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {showNewJobButton && (
                <Link
                  href="/job/new"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white"
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.button
                  }}
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  <span>New Job</span>
                </Link>
              )}
              <button
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 relative"
                style={{ borderRadius: borderRadius.button }}
              >
                <BellIcon className="h-4 w-4" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <UserCircleIcon className="h-6 w-6 text-gray-400" />
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-gray-700">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userEmail.split('@')[0] || 'user'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Add padding for fixed header */}
        <main className="flex-1 overflow-y-auto bg-gray-50 pt-12">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}