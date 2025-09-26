import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { TicketDetail } from './TicketDetail';
import { apiService } from '../services/api';
import { enhanceReportWithComparison } from '../utils/mockComparisonData';
import type { Report } from '../types';

const mockTickets = [
  {
    id: '#23343',
    source: 'Email',
    claimType: 'Marine',
    processedTime: '2:00 PM',
    status: 'Flagged',
    fraudScore: 87,
    company: 'Maritime Solutions Ltd',

    submittedDate: '2024-09-24'
  },
  {
    id: '#23342',
    source: 'Portal',
    claimType: 'Health',
    processedTime: '1:45 PM',
    status: 'Auto Approved',
    fraudScore: 12,
    company: 'HealthCare Plus',

    submittedDate: '2024-09-24'
  },
  {
    id: '#23341',
    source: 'Email',
    claimType: 'Motor',
    processedTime: '1:30 PM',
    status: 'Rejected',
    fraudScore: 94,
    company: 'FastTrack Motors',

    submittedDate: '2024-09-24'
  },
  {
    id: '#23340',
    source: 'Portal',
    claimType: 'Marine',
    processedTime: '1:15 PM',
    status: 'Pending Review',
    fraudScore: 65,
    company: 'Ocean Freight Co',

    submittedDate: '2024-09-24'
  },
  {
    id: '#23339',
    source: 'Email',
    claimType: 'Health',
    processedTime: '12:50 PM',
    status: 'Auto Approved',
    fraudScore: 8,
    company: 'MedCare Insurance',

    submittedDate: '2024-09-24'
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Auto Approved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'Flagged':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'Rejected':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'Pending Review':
      return <Clock className="h-4 w-4 text-blue-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Auto Approved':
      return 'bg-green-100 text-green-800';
    case 'Flagged':
      return 'bg-yellow-100 text-yellow-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Pending Review':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getFraudScoreColor = (score: number) => {
  if (score >= 80) return 'text-red-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-green-600';
};

export function TicketFeed() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports data on component mount
  useEffect(() => {
    fetchReports();
    
    // Listen for refresh events from pipeline completion
    const handleRefreshData = () => {
      fetchReports();
    };
    
    window.addEventListener('refreshData', handleRefreshData);
    
    return () => {
      window.removeEventListener('refreshData', handleRefreshData);
    };
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getReports();
      
      if (response.status === 'success' && response.data) {
        setReports(response.data);
      } else {
        setError(response.message || 'Failed to fetch reports');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert reports to ticket format for display
  const convertReportsToTickets = (reports: Report[]) => {
    return reports.map(report => {
      // Enhance report with comparison data
      const enhancedReport = enhanceReportWithComparison(report);
      
      return {
        id: `#${enhancedReport.id}`,
        source: enhancedReport.source === 'msg' ? 'Email' : 'Portal',
        claimType: enhancedReport.claim_type,
        processedTime: new Date(enhancedReport.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: getStatusFromClassification(enhancedReport.classification),
        fraudScore: getFraudScore(enhancedReport.classification, enhancedReport.fraud_indicators),
        company: enhancedReport.company,

        submittedDate: new Date(enhancedReport.timestamp).toISOString().split('T')[0],
        classification: enhancedReport.classification,
        summary: enhancedReport.summary,
        reportText: enhancedReport.report_text,
        fraudIndicators: enhancedReport.fraud_indicators,
        compliance_analysis: enhancedReport.compliance_analysis,
        attachments: enhancedReport.attachments
      };
    });
  };

  const getStatusFromClassification = (classification: string) => {
    switch (classification) {
      case 'VALID':
        return 'Auto Approved';
      case 'POTENTIALLY FRAUDULENT':
        return 'Flagged';
      case 'INSUFFICIENT EVIDENCE':
        return 'Pending Review';
      default:
        return 'Pending Review';
    }
  };

  const getFraudScore = (classification: string, indicators: string[]) => {
    if (classification === 'POTENTIALLY FRAUDULENT') {
      return Math.min(80 + indicators.length * 5, 100);
    } else if (classification === 'INSUFFICIENT EVIDENCE') {
      return Math.min(40 + indicators.length * 10, 70);
    } else {
      return Math.max(5, 20 - indicators.length * 5);
    }
  };

  const handleCloseTicket = (ticketId: string) => {
    // Remove the ticket from the display
    const reportId = ticketId.replace('#', '');
    setReports(prevReports => prevReports.filter(report => report.id !== reportId));
    setSelectedTicket(null);
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const tickets = convertReportsToTickets(reports);
  
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesType = typeFilter === 'all' || ticket.claimType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading reports...</span>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-semibold">{tickets.length}</p>
                <p className="text-xs text-gray-500">From backend API</p>
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
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-semibold">{tickets.filter(t => t.status === 'Flagged').length}</p>
                <p className="text-xs text-gray-500">High fraud risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Report Management</CardTitle>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Auto Approved">Auto Approved</SelectItem>
                <SelectItem value="Flagged">Flagged</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Pending Review">Pending Review</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Marine">Marine</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Motor">Motor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Company</TableHead>

                  <TableHead>Processed Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fraud Score</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{ticket.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.source}</Badge>
                    </TableCell>
                    <TableCell>{ticket.claimType}</TableCell>
                    <TableCell>{ticket.company}</TableCell>

                    <TableCell>{ticket.processedTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <Badge 
                          className={`${getStatusColor(ticket.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${getFraudScoreColor(ticket.fraudScore)}`}>
                          {ticket.fraudScore}%
                        </span>
                        <Progress 
                          value={ticket.fraudScore} 
                          className="w-16 h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details - {selectedTicket?.id}</DialogTitle>
          </DialogHeader>
          {selectedTicket && <TicketDetail ticket={selectedTicket} onCloseTicket={handleCloseTicket} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}