import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Search, RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';

const mockReclaimedClaims = [
  {
    id: '#RC-001',
    claimId: '#23335',
    claimantName: 'Global Shipping Inc',
    claimType: 'Marine',

    reasonForReclaim: 'System incorrectly flagged due to GPS data processing error',
    submittedDate: '2024-09-23',
    status: 'Under Review',
    originalFraudScore: 78,
    priority: 'High',
    assignedReviewer: 'Sarah Chen'
  },
  {
    id: '#RC-002',
    claimId: '#23331',
    claimantName: 'HealthFirst Medical',
    claimType: 'Health',

    reasonForReclaim: 'Documentation was submitted after initial review deadline',
    submittedDate: '2024-09-22',
    status: 'Accepted',
    originalFraudScore: 45,
    priority: 'Medium',
    assignedReviewer: 'Mike Johnson'
  },
  {
    id: '#RC-003',
    claimId: '#23328',
    claimantName: 'AutoCare Services',
    claimType: 'Motor',

    reasonForReclaim: 'Additional evidence provided showing legitimate repair costs',
    submittedDate: '2024-09-21',
    status: 'Rejected',
    originalFraudScore: 89,
    priority: 'Low',
    assignedReviewer: 'David Park'
  },
  {
    id: '#RC-004',
    claimId: '#23325',
    claimantName: 'Maritime Solutions Ltd',
    claimType: 'Marine',

    reasonForReclaim: 'Weather data correlation error in original analysis',
    submittedDate: '2024-09-20',
    status: 'Under Review',
    originalFraudScore: 72,
    priority: 'High',
    assignedReviewer: 'Sarah Chen'
  },
  {
    id: '#RC-005',
    claimId: '#23322',
    claimantName: 'QuickFix Motors',
    claimType: 'Motor',

    reasonForReclaim: 'Customer provided missing insurance documentation',
    submittedDate: '2024-09-19',
    status: 'Under Review',
    originalFraudScore: 65,
    priority: 'Medium',
    assignedReviewer: 'Mike Johnson'
  }
];

const getStatusIcon = (status) => {
  switch (status) {
    case 'Accepted':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'Under Review':
      return <Clock className="h-4 w-4 text-blue-600" />;
    case 'Rejected':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Accepted':
      return 'bg-green-100 text-green-800';
    case 'Under Review':
      return 'bg-blue-100 text-blue-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
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

export function ReclaimedClaims() {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const filteredClaims = mockReclaimedClaims.filter(claim => {
    const matchesSearch = claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.claimantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleFinalizeReview = () => {
    if (reviewDecision && reviewComment.trim()) {
      console.log('Finalizing review:', { 
        claimId: selectedClaim.id, 
        decision: reviewDecision, 
        comment: reviewComment 
      });
      setSelectedClaim(null);
      setReviewDecision('');
      setReviewComment('');
      setCurrentStatus('');
      setIsEditingStatus(false);
    }
  };

  // Set current status when claim is selected
  React.useEffect(() => {
    if (selectedClaim) {
      setCurrentStatus(selectedClaim.status);
    }
  }, [selectedClaim]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RotateCcw className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reclaims</p>
                <p className="text-2xl font-semibold">27</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-semibold">15</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reclaimed Claims Review</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search claims or companies..."
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
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            

          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reclaim ID</TableHead>
                  <TableHead>Original Claim</TableHead>
                  <TableHead>Claimant</TableHead>
                  <TableHead>Type</TableHead>

                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{claim.id}</TableCell>
                    <TableCell>{claim.claimId}</TableCell>
                    <TableCell>{claim.claimantName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{claim.claimType}</Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(claim.status)}
                        <Badge 
                          className={`${getStatusColor(claim.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => setSelectedClaim(claim)}
                        >
                          {claim.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Review Modal */}
      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reclaim Review - {selectedClaim?.id}</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-6">
              {/* Claim Overview with Editable Status */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedClaim.id}
                        {!isEditingStatus ? (
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(currentStatus)}>
                              {currentStatus}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setIsEditingStatus(true)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select value={currentStatus} onValueChange={setCurrentStatus}>
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Under Review">Under Review</SelectItem>
                                <SelectItem value="Accepted">Accepted</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              onClick={() => setIsEditingStatus(false)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setCurrentStatus(selectedClaim.status);
                                setIsEditingStatus(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardTitle>
                      <p className="text-gray-600">{selectedClaim.claimantName} • {selectedClaim.claimType} Claim</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Original Claim ID</p>
                      <p className="font-medium">{selectedClaim.claimId}</p>
                    </div>
                    <div>

                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Original Fraud Score</p>
                      <p className="font-medium text-red-600">{selectedClaim.originalFraudScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <Badge className={getPriorityColor(selectedClaim.priority)}>
                        {selectedClaim.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                    Analysis Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Reclaim Assessment</h4>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">{selectedClaim.reasonForReclaim}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Original Decision Factors</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">High fraud score of {selectedClaim.originalFraudScore}% flagged for suspicious patterns</p>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">Document verification issues detected during initial processing</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Reclaim Evidence</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">Additional documentation provided validates claim legitimacy</p>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">Third-party verification confirms claim details accuracy</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Human Review Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Final Decision</h4>
                    <div className="flex gap-3">
                      <Button
                        variant={reviewDecision === 'approve' ? 'default' : 'outline'}
                        className={reviewDecision === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setReviewDecision('approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Reclaim
                      </Button>
                      <Button
                        variant={reviewDecision === 'reject' ? 'default' : 'outline'}
                        className={reviewDecision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => setReviewDecision('reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Reclaim
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Review Comments</h4>
                    <Textarea
                      placeholder="Provide detailed reasoning for your decision..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="min-h-24"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedClaim(null)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleFinalizeReview}
                      disabled={!reviewDecision || !reviewComment.trim()}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}