import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Users,
  FileText,
  Shield,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';
import type { SystemStats, Report } from '../types';

const fraudTrendsData = [
  { month: 'Jan', detected: 45, false_positives: 8, claims: 320 },
  { month: 'Feb', detected: 52, false_positives: 12, claims: 290 },
  { month: 'Mar', detected: 38, false_positives: 6, claims: 340 },
  { month: 'Apr', detected: 61, false_positives: 15, claims: 380 },
  { month: 'May', detected: 49, false_positives: 9, claims: 350 },
  { month: 'Jun', detected: 67, false_positives: 18, claims: 420 }
];

const claimTypesData = [
  { name: 'Marine', value: 35, count: 145, color: '#3B82F6' },
  { name: 'Property', value: 28, count: 118, color: '#10B981' },
  { name: 'Casualty', value: 22, count: 92, color: '#F59E0B' },
  { name: 'Auto', value: 15, count: 63, color: '#EF4444' }
];

const processingTimeData = [
  { day: 'Mon', avg_time: 2.4, claims: 45 },
  { day: 'Tue', avg_time: 1.8, claims: 52 },
  { day: 'Wed', avg_time: 2.1, claims: 38 },
  { day: 'Thu', avg_time: 2.7, claims: 49 },
  { day: 'Fri', avg_time: 3.2, claims: 61 },
  { day: 'Sat', avg_time: 1.9, claims: 28 },
  { day: 'Sun', avg_time: 1.5, claims: 22 }
];

const riskScoreDistribution = [
  { range: '0-20', count: 180, color: '#10B981' },
  { range: '21-40', count: 120, color: '#84CC16' },
  { range: '41-60', count: 85, color: '#F59E0B' },
  { range: '61-80', count: 45, color: '#F97316' },
  { range: '81-100', count: 28, color: '#EF4444' }
];

export function Analytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    
    // Listen for refresh events from pipeline completion
    const handleRefreshData = () => {
      fetchData();
    };
    
    window.addEventListener('refreshData', handleRefreshData);
    
    return () => {
      window.removeEventListener('refreshData', handleRefreshData);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [statsResponse, reportsResponse] = await Promise.all([
        apiService.getStats(),
        apiService.getReports()
      ]);
      
      if (statsResponse.status === 'success' && statsResponse.data) {
        setStats(statsResponse.data);
      }
      
      if (reportsResponse.status === 'success' && reportsResponse.data) {
        setReports(reportsResponse.data);
      }
    } catch (error) {
      setError('Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate chart data from real reports
  const generateChartData = () => {
    if (!reports.length) return { fraudTrendsData: [], claimTypesData: [], processingTimeData: [], riskScoreDistribution: [] };

    // Group reports by month for trends
    const monthlyData = reports.reduce((acc, report) => {
      const date = new Date(report.timestamp);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, detected: 0, false_positives: 0, claims: 0 };
      }
      
      acc[monthKey].claims += 1;
      if (report.classification === 'POTENTIALLY FRAUDULENT') {
        acc[monthKey].detected += 1;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const fraudTrendsData = Object.values(monthlyData);

    // Group by claim type
    const claimTypeGroups = reports.reduce((acc, report) => {
      const type = report.claim_type || 'Unknown';
      if (!acc[type]) {
        acc[type] = { name: type, count: 0, value: 0, fraudulent: 0 };
      }
      acc[type].count += 1;
      if (report.classification === 'POTENTIALLY FRAUDULENT') {
        acc[type].fraudulent += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const claimTypesData = Object.values(claimTypeGroups).map((item: any, index) => ({
      ...item,
      value: Math.round((item.count / reports.length) * 100),
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
    }));

    // Generate risk score distribution from fraud indicators
    const riskScoreDistribution = [
      { 
        range: '0-20', 
        count: reports.filter(r => r.classification === 'VALID').length, 
        color: '#10B981' 
      },
      { 
        range: '21-40', 
        count: reports.filter(r => r.classification === 'INSUFFICIENT EVIDENCE' && r.fraud_indicators.length <= 2).length, 
        color: '#84CC16' 
      },
      { 
        range: '41-60', 
        count: reports.filter(r => r.classification === 'INSUFFICIENT EVIDENCE' && r.fraud_indicators.length > 2).length, 
        color: '#F59E0B' 
      },
      { 
        range: '61-80', 
        count: reports.filter(r => r.classification === 'POTENTIALLY FRAUDULENT' && r.fraud_indicators.length <= 3).length, 
        color: '#F97316' 
      },
      { 
        range: '81-100', 
        count: reports.filter(r => r.classification === 'POTENTIALLY FRAUDULENT' && r.fraud_indicators.length > 3).length, 
        color: '#EF4444' 
      }
    ];

    return { fraudTrendsData, claimTypesData, processingTimeData, riskScoreDistribution };
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analytics</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selection */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Fraud detection insights and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.total_reports || 0}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <FileText className="h-3 w-3 mr-1" />
                  From backend API
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.avg_processing_time || 'N/A'}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  System performance
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.high_risk_reports || 0}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires attention
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reports Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.reports_today || 0}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Daily activity
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Fraud Trends</TabsTrigger>
          <TabsTrigger value="types">Claim Types</TabsTrigger>
          <TabsTrigger value="processing">Processing Time</TabsTrigger>
          <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData.fraudTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="detected" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Fraud Detected"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="false_positives" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="False Positives"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Total Claims"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Claims by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.claimTypesData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {chartData.claimTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraud by Claim Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.claimTypesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Average Processing Time by Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={processingTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="avg_time" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    name="Avg Time (hours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={riskScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}