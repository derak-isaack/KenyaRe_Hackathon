import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
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
  AreaChart,
  Area
} from 'recharts';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  DollarSign,
  FileText,
  Calendar,
  Users
} from 'lucide-react';

// Mock trend data for the company
const getTrendData = (companyName) => {
  const baseData = [
    { month: 'Jan', suspicionScore: 65, claimsCount: 8, claimsValue: 1200000 },
    { month: 'Feb', suspicionScore: 72, claimsCount: 6, claimsValue: 980000 },
    { month: 'Mar', suspicionScore: 78, claimsCount: 9, claimsValue: 1450000 },
    { month: 'Apr', suspicionScore: 85, claimsCount: 11, claimsValue: 1780000 },
    { month: 'May', suspicionScore: 89, claimsCount: 8, claimsValue: 1340000 },
    { month: 'Jun', suspicionScore: 87, claimsCount: 10, claimsValue: 1620000 }
  ];

  // Adjust data based on company risk level
  if (companyName.includes('Maritime Solutions')) {
    return baseData.map(item => ({
      ...item,
      suspicionScore: item.suspicionScore + 5,
      claimsCount: item.claimsCount + 2
    }));
  } else if (companyName.includes('Global Shipping')) {
    return baseData.map(item => ({
      ...item,
      suspicionScore: Math.max(item.suspicionScore - 25, 10),
      claimsCount: Math.max(item.claimsCount - 3, 1)
    }));
  }
  
  return baseData;
};

const claimTypesData = [
  { type: 'Marine Hull', count: 12, flagged: 8, percentage: 67 },
  { type: 'Cargo', count: 8, flagged: 3, percentage: 38 },
  { type: 'Liability', count: 4, flagged: 2, percentage: 50 },
  { type: 'Equipment', count: 6, flagged: 1, percentage: 17 }
];

const recentActivity = [
  { date: '2024-09-24', action: 'Claim Submitted', status: 'Flagged' },
  { date: '2024-09-22', action: 'Review Completed', status: 'Approved' },
  { date: '2024-09-20', action: 'Claim Submitted', status: 'Rejected' },
  { date: '2024-09-18', action: 'Policy Updated', status: 'Info' },
  { date: '2024-09-15', action: 'Claim Submitted', status: 'Under Review' }
];

export function CompanyProfile({ company, onClose }) {
  const trendData = getTrendData(company.name);
  
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Flagged': return 'bg-red-100 text-red-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Under Review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            {company.name}
          </h1>
          <p className="text-gray-600 mt-1">{company.industry} Insurance</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close Profile
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <Badge className={getRiskColor(company.riskLevel)}>
                  {company.riskLevel}
                </Badge>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trust Score</p>
                <p className="text-2xl font-semibold">{company.trustScore}/5</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Claims</p>
                <p className="text-2xl font-semibold">{company.totalClaims}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Claims Value</p>
                <p className="text-2xl font-semibold">{company.totalClaimsValue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Suspicion Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="suspicionScore" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Suspicion Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Claims Volume Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="claimsCount" fill="#3B82F6" name="Claims Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Claims Value Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Claims Value Trend Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${(value/1000000).toFixed(1)}M`, 'Claims Value']} />
              <Area 
                type="monotone" 
                dataKey="claimsValue" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.3}
                name="Claims Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Claims Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Claims by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claimTypesData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-gray-600">{item.count} total, {item.flagged} flagged</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.percentage}%</p>
                    <p className="text-sm text-gray-600">flagged</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-600">{activity.date}</p>
                  </div>
                  <div className="text-right">

                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}