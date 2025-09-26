import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ReportViewer } from './ReportViewer';
import { ComparisonMetrics } from './ComparisonMetrics';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Database, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit,
  Upload
} from 'lucide-react';

const timelineSteps = [
  { step: 'Submitted', status: 'completed', time: '12:30 PM', icon: FileText },
  { step: 'Analysis', status: 'completed', time: '12:32 PM', icon: Database },
  { step: 'Human Review', status: 'active', time: '2:00 PM', icon: MessageSquare },
  { step: 'Final Decision', status: 'pending', time: 'TBD', icon: CheckCircle }
];

const analysisReport = {
  decision: 'FLAGGED',
  confidence: 87,
  reasons: [
    'Claim pattern significantly differs from historical averages for similar marine incidents',
    'Multiple similar claims submitted by the same company within 30 days',
    'Vessel location data inconsistent with reported incident coordinates',
    'Documentation timestamps show suspicious patterns'
  ],
  sqlFindings: [
    'Company has 3 claims totaling $4.2M in past 30 days (avg: $800K/month)',
    'Vessel GPS data shows 2.3km discrepancy from reported location',
    'Similar claim patterns detected across 4 different policies'
  ],
  documents: [
    'Marine Survey Report - Inconsistencies found',
    'Insurance Policy Terms - Coverage limits exceeded',
    'Vessel Registry - Registration status questionable',
    'Weather Report - Conditions not matching claim description'
  ]
};

export function TicketDetail({ ticket, onCloseTicket }) {
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDecision, setReviewDecision] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleReviewAction = (action) => {
    setReviewDecision(action);
    // Update status based on decision
    if (action === 'approve') {
      setCurrentStatus('Approved');
    } else if (action === 'reject') {
      setCurrentStatus('Rejected');
    } else if (action === 'reclaim') {
      setCurrentStatus('Reclaimed');
    }
    setIsEditingStatus(false);
    // In a real app, this would submit to backend
    console.log(`Review decision: ${action}`, { comment: reviewComment, newStatus: currentStatus });
  };

  const handleCloseTicket = () => {
    if (reviewDecision && reviewComment.trim() && onCloseTicket) {
      // Only allow closing if a decision has been made AND comment provided
      const reviewData = {
        ticketId: ticket.id,
        decision: reviewDecision,
        comment: reviewComment,
        status: currentStatus,
        uploadedFiles: uploadedFiles,
        timestamp: new Date().toISOString()
      };
      console.log('Submitting review and closing ticket:', reviewData);
      setTimeout(() => {
        onCloseTicket(ticket.id);
      }, 1000); // Brief delay to show the action
    }
  };



  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    console.log('Files uploaded:', newFiles);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmitReview = () => {
    if (reviewDecision && reviewComment.trim()) {
      const reviewData = {
        ticketId: ticket.id,
        decision: reviewDecision,
        comment: reviewComment,
        status: currentStatus,
        uploadedFiles: uploadedFiles,
        timestamp: new Date().toISOString()
      };
      console.log('Submitting review:', reviewData);
      // In real app, this would be an API call
      alert(`Review submitted successfully! Ticket status changed to ${currentStatus}`);
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      ticketId: ticket.id,
      comment: reviewComment,
      uploadedFiles: uploadedFiles,
      timestamp: new Date().toISOString()
    };
    console.log('Saving draft:', draftData);
    alert('Draft saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Ticket Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {ticket.id}
                {!isEditingStatus ? (
                  <div className="flex items-center gap-2">
                    <Badge className={
                      currentStatus === 'Auto Approved' ? 'bg-green-100 text-green-800' :
                      currentStatus === 'Flagged' ? 'bg-yellow-100 text-yellow-800' :
                      currentStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {currentStatus}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setIsEditingStatus(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Select value={currentStatus} onValueChange={setCurrentStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto Approved">Auto Approved</SelectItem>
                        <SelectItem value="Flagged">Flagged</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Pending Review">Pending Review</SelectItem>
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
                        setCurrentStatus(ticket.status);
                        setIsEditingStatus(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
              <p className="text-gray-600">{ticket.company} • {ticket.claimType} Claim</p>
            </div>
            <div className="text-right">

              <p className="text-sm text-gray-600">Submitted: {ticket.submittedDate}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Source</p>
              <p className="font-medium">{ticket.source}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Processed Time</p>
              <p className="font-medium">{ticket.processedTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fraud Score</p>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${
                  ticket.fraudScore >= 80 ? 'text-red-600' :
                  ticket.fraudScore >= 50 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {ticket.fraudScore}%
                </span>
                <Progress value={ticket.fraudScore} className="w-20 h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200"></div>
            <div className="absolute top-6 left-0 h-0.5 bg-blue-600" style={{ width: '75%' }}></div>
            
            {timelineSteps.map((item, index) => (
              <div key={index} className="flex flex-col items-center relative z-10">
                <div className={`p-3 rounded-full border-2 ${
                  item.status === 'completed' ? 'bg-blue-600 border-blue-600 text-white' :
                  item.status === 'active' ? 'bg-white border-blue-600 text-blue-600' :
                  'bg-white border-gray-300 text-gray-400'
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium">{item.step}</p>
                  <p className="text-xs text-gray-600">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis & Human Review Tabs */}
    <Tabs defaultValue="analysis" className="w-full">
  <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
    <TabsTrigger className="text-center" value="analysis">
      Analysis Report
    </TabsTrigger>
    <TabsTrigger className="text-center" value="comparison">
      Comparison Metrics
    </TabsTrigger>
    <TabsTrigger className="text-center" value="human-review">
      Human Review
    </TabsTrigger>
  </TabsList>

  <TabsContent value="analysis" className="space-y-4">
    <ReportViewer ticket={ticket} />
  </TabsContent>

  <TabsContent value="comparison" className="space-y-4">
    <ComparisonMetrics
      complianceAnalysis={ticket.compliance_analysis}
      showDetailed={true}
    />
  </TabsContent>

  <TabsContent value="human-review" className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Human Review & Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Actions */}
        <div>
          <h4 className="font-semibold mb-3">Review Decision</h4>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={reviewDecision === 'approve' ? 'default' : 'outline'}
              className={reviewDecision === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => handleReviewAction('approve')}
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              Approve Claim
            </Button>
            <Button
              variant={reviewDecision === 'reject' ? 'default' : 'outline'}
              className={reviewDecision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => handleReviewAction('reject')}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              Reject Claim
            </Button>
            <Button
              variant={reviewDecision === 'reclaim' ? 'default' : 'outline'}
              className={reviewDecision === 'reclaim' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => handleReviewAction('reclaim')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Mark for Reclaim
            </Button>
          </div>

          {reviewDecision && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                Decision Made: {reviewDecision === 'approve' ? 'Claim Approved' :
                  reviewDecision === 'reject' ? 'Claim Rejected' :
                  'Marked for Reclaim'}
              </p>
            </div>
          )}
        </div>

        {/* Review Comments */}
        <div>
          <h4 className="font-semibold mb-3">Review Comments</h4>
          <Textarea
            placeholder="Add your review comments, reasoning, and any additional notes..."
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            className="min-h-32"
          />
        </div>

        {/* File Upload Section */}
        <div>
          <h4 className="font-semibold mb-3">Additional Documentation</h4>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload additional documents (PDFs, Images, etc.)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Support for PDF, DOC, DOCX, JPG, PNG files
              </p>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium mb-2">Uploaded Files:</h5>
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile(file.id)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button
            className="bg-gray-600 hover:bg-gray-700"
            disabled={!reviewDecision || !reviewComment.trim()}
            onClick={handleCloseTicket}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Close Ticket
          </Button>
        </div>

        {/* Review History */}
        <div>
          <h4 className="font-semibold mb-3">Review History</h4>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">System Analysis</span>
                <span className="text-sm text-gray-600">2:00 PM</span>
              </div>
              <p className="text-sm text-gray-700">
                Automated analysis flagged this claim due to multiple risk indicators.
                Requires human review for final decision.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
    </div>
  );
}