'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND_CONFIG } from '../../../../shared/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { auth } from '@/lib/api';
import {
  ArrowLeft, User, Mail, Lock, Bell, Shield, Trash2,
  Save, Camera, Edit2, CheckCircle, AlertTriangle,
  CreditCard, Calendar, Globe, Key
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  website?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  emailPreferences: {
    jobUpdates: boolean;
    weeklyDigest: boolean;
    marketing: boolean;
    applications: boolean;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'billing' | 'danger'>('profile');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [emailPreferences, setEmailPreferences] = useState({
    jobUpdates: true,
    weeklyDigest: true,
    marketing: false,
    applications: true
  });

  const { colors, typography, shadows } = BRAND_CONFIG;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Get user data from localStorage for now
      const email = localStorage.getItem('user_email') || '';
      const name = localStorage.getItem('user_name') || email.split('@')[0];

      // In production, this would fetch from API
      const mockProfile: UserProfile = {
        id: '1',
        email,
        name,
        company: '',
        phone: '',
        website: '',
        bio: '',
        createdAt: new Date().toISOString(),
        emailPreferences: {
          jobUpdates: true,
          weeklyDigest: true,
          marketing: false,
          applications: true
        }
      };

      setProfile(mockProfile);
      setFormData({
        name: mockProfile.name,
        email: mockProfile.email,
        company: mockProfile.company || '',
        phone: mockProfile.phone || '',
        website: mockProfile.website || '',
        bio: mockProfile.bio || ''
      });
      setEmailPreferences(mockProfile.emailPreferences);
    } catch (error) {
      console.error('Failed to load profile:', error);
      addToast({
        type: 'error',
        title: 'Failed to load profile',
        message: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Update localStorage for now
      localStorage.setItem('user_name', formData.name);
      localStorage.setItem('user_email', formData.email);

      addToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your changes have been saved'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to update profile',
        message: 'Please try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Passwords do not match',
        message: 'Please ensure both passwords are the same'
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      addToast({
        type: 'error',
        title: 'Password too short',
        message: 'Password must be at least 8 characters'
      });
      return;
    }

    try {
      setSaving(true);
      // API call would go here

      addToast({
        type: 'success',
        title: 'Password changed',
        message: 'Your password has been updated successfully'
      });

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to change password',
        message: 'Please check your current password and try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailPreferencesUpdate = async () => {
    try {
      setSaving(true);
      // API call would go here

      addToast({
        type: 'success',
        title: 'Preferences updated',
        message: 'Your email preferences have been saved'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to update preferences',
        message: 'Please try again'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your jobs and data. Are you absolutely sure?')) {
      return;
    }

    try {
      // API call would go here
      localStorage.clear();
      router.push('/login');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to delete account',
        message: 'Please try again or contact support'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid mx-auto"
               style={{ borderColor: `${colors.primary} transparent` }} />
          <p className="mt-4" style={{ color: colors.textSecondary }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'danger', label: 'Danger Zone', icon: Shield },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4"
              style={{ borderColor: colors.border, backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: colors.textPrimary }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.primary }}>
              Account Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              {/* Profile Avatar */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                    }}
                  >
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
                    style={{ borderColor: colors.border }}
                  >
                    <Camera size={16} style={{ color: colors.textSecondary }} />
                  </button>
                </div>
                <h2 className="mt-4 font-semibold text-lg" style={{ color: colors.textPrimary }}>
                  {formData.name}
                </h2>
                <p className="text-sm" style={{ color: colors.textSecondary }}>
                  {formData.email}
                </p>
                <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                  Member since {new Date(profile?.createdAt || '').toLocaleDateString()}
                </p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                        transition-all duration-200 text-left
                        ${isActive ? 'shadow-sm' : 'hover:bg-gray-50'}
                      `}
                      style={{
                        backgroundColor: isActive ? colors.primary + '10' : 'transparent',
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontFamily: typography.fontFamily.primary
                      }}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                  Profile Information
                </h2>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      icon={<User size={18} />}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      icon={<Mail size={18} />}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />

                    <Input
                      label="Company"
                      icon={<Building size={18} />}
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your company name"
                    />

                    <Input
                      label="Phone Number"
                      type="tel"
                      icon={<Phone size={18} />}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />

                    <Input
                      label="Website"
                      type="url"
                      icon={<Globe size={18} />}
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Bio
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: colors.border,
                        '--tw-ring-color': colors.primary
                      } as React.CSSProperties}
                      rows={4}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => loadProfile()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={saving}
                      icon={<Save size={18} />}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                  Change Password
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    icon={<Lock size={18} />}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />

                  <Input
                    label="New Password"
                    type="password"
                    icon={<Key size={18} />}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    helperText="Must be at least 8 characters"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    icon={<Key size={18} />}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    error={
                      passwordData.confirmPassword &&
                      passwordData.newPassword !== passwordData.confirmPassword
                        ? 'Passwords do not match'
                        : undefined
                    }
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={saving}
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                  Email Notifications
                </h2>

                <div className="space-y-6">
                  {[
                    {
                      id: 'jobUpdates',
                      title: 'Job Posting Updates',
                      description: 'Get notified when your job postings are approved, rejected, or updated'
                    },
                    {
                      id: 'applications',
                      title: 'New Applications',
                      description: 'Receive emails when candidates apply to your job postings'
                    },
                    {
                      id: 'weeklyDigest',
                      title: 'Weekly Summary',
                      description: 'Get a weekly digest of your job posting performance'
                    },
                    {
                      id: 'marketing',
                      title: 'Product Updates & Tips',
                      description: 'Receive updates about new features and tips to improve your job postings'
                    }
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium" style={{ color: colors.textPrimary }}>
                          {pref.title}
                        </h3>
                        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                          {pref.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={emailPreferences[pref.id as keyof typeof emailPreferences]}
                          onChange={(e) => setEmailPreferences({
                            ...emailPreferences,
                            [pref.id]: e.target.checked
                          })}
                        />
                        <div
                          className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: emailPreferences[pref.id as keyof typeof emailPreferences]
                              ? colors.primary
                              : '#e5e7eb'
                          }}
                        />
                      </label>
                    </div>
                  ))}

                  <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                    <Button
                      onClick={handleEmailPreferencesUpdate}
                      variant="primary"
                      loading={saving}
                    >
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6" style={{ color: colors.textPrimary }}>
                  Billing & Payment
                </h2>

                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2" style={{ color: colors.textPrimary }}>
                      Payment Method
                    </h3>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                      No payment method on file
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      icon={<CreditCard size={16} />}
                    >
                      Add Payment Method
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3" style={{ color: colors.textPrimary }}>
                      Billing History
                    </h3>
                    <div className="text-center py-8 text-sm" style={{ color: colors.textSecondary }}>
                      No billing history available
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <Card className="p-6" variant="outlined">
                <h2 className="text-xl font-semibold mb-6" style={{ color: colors.error }}>
                  Danger Zone
                </h2>

                <div className="space-y-6">
                  <div className="p-4 border rounded-lg" style={{ borderColor: colors.error + '40' }}>
                    <div className="flex items-start gap-4">
                      <AlertTriangle size={24} style={{ color: colors.error }} />
                      <div className="flex-1">
                        <h3 className="font-medium" style={{ color: colors.textPrimary }}>
                          Delete Account
                        </h3>
                        <p className="text-sm mt-1 mb-4" style={{ color: colors.textSecondary }}>
                          Once you delete your account, there is no going back. All your jobs, data, and settings will be permanently removed.
                        </p>
                        <Button
                          variant="danger"
                          icon={<Trash2 size={18} />}
                          onClick={handleDeleteAccount}
                        >
                          Delete My Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing imports
import { Building, Phone } from 'lucide-react';