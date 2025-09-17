'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Download, TrendingUp, TrendingDown, Users,
  Briefcase, Target, Award, Calendar, BarChart2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useApi from '@/hooks/use-api';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BRAND_CONFIG } from '@/shared/constants';
import { format } from 'date-fns';

interface OverviewData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    recentApplications: number;
    conversionRate: number;
  };
  jobsByStatus: Record<string, number>;
  applicationsByStatus: Record<string, number>;
}

interface TrendData {
  period: string;
  jobTrends: Array<{
    date: string;
    total: number;
    byStatus: Record<string, number>;
  }>;
  applicationTrends: Array<{
    date: string;
    total: number;
    byStatus: Record<string, number>;
  }>;
}

interface BoardPerformance {
  id: string;
  name: string;
  stats: {
    totalPostings: number;
    successfulPostings: number;
    successRate: number;
    totalApplications: number;
    avgApplicationsPerJob: number;
  };
}

const COLORS = [
  BRAND_CONFIG.colors.primary,
  BRAND_CONFIG.colors.secondary,
  '#FDB462',
  '#80B1D3',
  '#B3DE69',
  '#FCCDE5'
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [boardPerformance, setBoardPerformance] = useState<BoardPerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewData, trendsData, boardsData] = await Promise.all([
        fetch('/api/analytics/overview', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch(`/api/analytics/trends?period=${selectedPeriod}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        fetch('/api/analytics/boards', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json())
      ]);

      setOverview(overviewData);
      setTrends(trendsData);
      setBoardPerformance(boardsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?format=${exportFormat}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.${exportFormat === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export analytics',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statusChartData = overview ? Object.entries(overview.applicationsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  })) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button
        onClick={() => router.push('/dashboard')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-gray-600">Track your job posting performance and applicant metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview.totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.overview.activeJobs || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.overview.recentApplications || 0} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Applications to hires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Applications/Job</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.overview.totalJobs ?
                (overview.overview.totalApplications / overview.overview.totalJobs).toFixed(1) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Per active job</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Application Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends?.applicationTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, 'MMM d');
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={BRAND_CONFIG.colors.primary}
                  strokeWidth={2}
                  name="Applications"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Application Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Job Board Performance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Job Board Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={boardPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stats.successRate" fill={BRAND_CONFIG.colors.primary} name="Success Rate %" />
              <Bar dataKey="stats.avgApplicationsPerJob" fill={BRAND_CONFIG.colors.secondary} name="Avg Apps/Job" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Board Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Board Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Board Name</th>
                  <th className="text-right p-2">Total Posts</th>
                  <th className="text-right p-2">Successful</th>
                  <th className="text-right p-2">Success Rate</th>
                  <th className="text-right p-2">Total Applications</th>
                  <th className="text-right p-2">Avg Apps/Job</th>
                </tr>
              </thead>
              <tbody>
                {boardPerformance.map(board => (
                  <tr key={board.id} className="border-b">
                    <td className="p-2 font-medium">{board.name}</td>
                    <td className="text-right p-2">{board.stats.totalPostings}</td>
                    <td className="text-right p-2">{board.stats.successfulPostings}</td>
                    <td className="text-right p-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        board.stats.successRate >= 80 ? 'bg-green-100 text-green-800' :
                        board.stats.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {board.stats.successRate}%
                      </span>
                    </td>
                    <td className="text-right p-2">{board.stats.totalApplications}</td>
                    <td className="text-right p-2">{board.stats.avgApplicationsPerJob}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}