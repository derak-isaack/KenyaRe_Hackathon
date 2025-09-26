import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Search, Building2, AlertTriangle, TrendingUp, TrendingDown, Star, Eye } from 'lucide-react';
import { CompanyProfile } from './CompanyProfile';

const mockCompanies = [
  {
    id: 1,
    name: 'Maritime Solutions Ltd',
    flaggedClaims: 8,
    totalClaims: 24,
    suspicionScore: 87,
    trustScore: 2,
    riskLevel: 'High',
    industry: 'Marine',
    totalClaimsValue: '$4.2M',
    flaggedValue: '$2.8M',
    trend: 'increasing'
  },
  {
    id: 2,
    name: 'Global Shipping Inc',
    flaggedClaims: 3,
    totalClaims: 45,
    suspicionScore: 32,
    trustScore: 4,
    riskLevel: 'Low',
    industry: 'Marine',
    totalClaimsValue: '$8.1M',
    flaggedValue: '$890K',
    trend: 'stable'
  },
  {
    id: 3,
    name: 'FastTrack Motors',
    flaggedClaims: 12,
    totalClaims: 28,
    suspicionScore: 94,
    trustScore: 1,
    riskLevel: 'High',
    industry: 'Motor',
    totalClaimsValue: '$3.2M',
    flaggedValue: '$2.4M',
    trend: 'increasing'
  },
  {
    id: 4,
    name: 'HealthCare Plus',
    flaggedClaims: 2,
    totalClaims: 67,
    suspicionScore: 18,
    trustScore: 5,
    riskLevel: 'Low',
    industry: 'Health',
    totalClaimsValue: '$2.8M',
    flaggedValue: '$145K',
    trend: 'decreasing'
  },
  {
    id: 5,
    name: 'AutoCare Services',
    flaggedClaims: 6,
    totalClaims: 22,
    suspicionScore: 65,
    trustScore: 3,
    riskLevel: 'Medium',
    industry: 'Motor',
    totalClaimsValue: '$1.8M',
    flaggedValue: '$950K',
    trend: 'stable'
  }
];



const getRiskColor = (risk) => {
  switch (risk) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTrendIcon = (trend) => {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    case 'decreasing':
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    case 'stable':
      return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    default:
      return null;
  }
};

const renderStars = (score) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < score ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
    />
  ));
};

export function CompanyRisk() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showProfile, setShowProfile] = useState(false);

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || company.riskLevel === riskFilter;
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    
    return matchesSearch && matchesRisk && matchesIndustry;
  });

  if (showProfile && selectedCompany) {
    return (
      <CompanyProfile 
        company={selectedCompany} 
        onClose={() => {
          setShowProfile(false);
          setSelectedCompany(null);
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-2xl font-semibold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-semibold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Increasing Risk</p>
                <p className="text-2xl font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Improving</p>
                <p className="text-2xl font-semibold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Company Risk Assessment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="High">High Risk</SelectItem>
                <SelectItem value="Medium">Medium Risk</SelectItem>
                <SelectItem value="Low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Marine">Marine</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Flagged Claims</TableHead>
                  <TableHead>Total Claims</TableHead>
                  <TableHead>Suspicion Score</TableHead>
                  <TableHead>Trust Rating</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.industry}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        {company.flaggedClaims}
                      </span>
                    </TableCell>
                    <TableCell>{company.totalClaims}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          company.suspicionScore >= 80 ? 'text-red-600' :
                          company.suspicionScore >= 50 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {company.suspicionScore}%
                        </span>
                        <Progress 
                          value={company.suspicionScore} 
                          className="w-16 h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(company.trustScore)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskColor(company.riskLevel)}>
                        {company.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(company.trend)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowProfile(true);
                        }}
                      >
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}