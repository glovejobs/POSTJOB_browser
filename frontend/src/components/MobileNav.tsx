'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BRAND_CONFIG } from '@/shared/constants';
import {
  Menu, X, Home, Briefcase, BarChart3, Search, User,
  Settings, LogOut, Plus, Bell, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavProps {
  isAuthenticated: boolean;
  userEmail?: string;
  userName?: string;
  onLogout?: () => void;
}

export default function MobileNav({ isAuthenticated, userEmail, userName, onLogout }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const { colors } = BRAND_CONFIG;

  useEffect(() => {
    // Close menu on route change
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'My Jobs', path: '/jobs' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <h1 className="font-bold text-xl" style={{ color: colors.primary }}>
            PostJob
          </h1>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto"
              style={{ boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}
            >
              {/* User Info */}
              {isAuthenticated && (
                <div className="p-4 border-b" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                      <span className="text-white font-semibold text-lg">
                        {userName ? userName[0].toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{userName || 'User'}</p>
                      <p className="text-sm text-gray-500">{userEmail}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      router.push('/post-job');
                      setIsOpen(false);
                    }}
                    className="w-full py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Plus size={20} />
                    Post New Job
                  </button>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="p-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors ${
                        active ? 'bg-opacity-10' : 'hover:bg-gray-100'
                      }`}
                      style={{
                        backgroundColor: active ? colors.primary + '15' : 'transparent',
                        color: active ? colors.primary : colors.textPrimary
                      }}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                      {active && <ChevronRight size={16} className="ml-auto" />}
                    </button>
                  );
                })}
              </nav>

              {/* Logout Button */}
              {isAuthenticated && (
                <div className="p-4 border-t" style={{ borderColor: colors.border }}>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30" style={{ borderColor: colors.border }}>
        <div className="grid grid-cols-4 gap-1 p-2">
          {menuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors"
                style={{
                  color: active ? colors.primary : colors.gray
                }}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}