import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import ComplianceAnalysis from './ComplianceAnalysis';
import { ComparisonSummary } from './ComparisonSummary';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Building2, 
  Calendar, 
  FileText, 
  Shield,
  Eye,
  Flag,
  BarChart3
} from 'lucide-react';

interface ComplianceData {
  overall_compliance_score: number;
  overall_risk_level: string;
  pairing_confidence: number;
  statement_compliance: {
    compliance_score: number;
    risk_level: string;
    risk_indicators: string[];
    ground_truth_analysis: {
      matches_found: number;
      avg_similarity: number;
      max_similarity: number;
    };
  };
  treaty_slip_compliance?: {
    compliance_score: number;
    risk_level: string;
    risk_indicators: string[];
    ground_truth_analysis: {
      matches_found: number;
      avg_similarity: number;
      max_similarity: number;
    };
  };
  ground_truth_analysis: {
    matches_count: number;
    avg_similarity: number;
    max_similarity: number;
  };
}

interface ReportViewerProps {
  ticket: {
    id: string;
    classification: string;
    summary: string;
    reportText: string;
    fraudIndicators: string[];
    company: string;
    claimType: string;
    submittedDate: string;
    status: string;
    fraudScore: number;
    compliance_analysis?: ComplianceData;
    attachments?: Array<{
      filename: string;
      type: string;
      vector_id: number;
      classification_confidence?: number;
      quality_score?: number;
      compliance_analysis?: any;
      financial_data?: any;
    }>;
  };
}

export function ReportViewer({ ticket }: ReportViewerProps) {
  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'VALID':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'POTENTIALLY FRAUDULENT':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'INSUFFICIENT EVIDENCE':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Eye className="h-5 w-5 text-gray-600" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'VALID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'POTENTIALLY FRAUDULENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'INSUFFICIENT EVIDENCE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatReportText = (text: string) => {
    if (!text) return 'No report text available';
    
    // Split by common section headers and format
    const sections = text.split(/(?=### |## |\*\*[A-Z])/);
    
    return sections.map((section, index) => {
      if (section.trim().startsWith('###')) {
        const [header, ...content] = section.split('\n');
        return (
          <div key={index} className="mb-4">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {header.replace(/###\s*\*?\*?/, '').replace(/\*?\*?$/, '')}
            </h4>
            <div className="text-gray-700 whitespace-pre-wrap">
              {content.join('\n').trim()}
            </div>
          </div>
        );
      } else if (section.trim().startsWith('**')) {
        const [header, ...content] = section.split('\n');
        return (
          <div key={index} className="mb-3">
            <h5 className="font-medium text-gray-900 mb-1">
              {header.replace(/\*\*/g, '')}
            </h5>
            <div className="text-gray-700 whitespace-pre-wrap">
              {content.join('\n').trim()}
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="mb-3 text-gray-700 whitespace-pre-wrap">
            {section.trim()}
          </div>
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Fraud Detection Report - {ticket.id}
            </CardTitle>
            <Badge className={`${getClassificationColor(ticket.classification)} border`}>
              <div className="flex items-center gap-1">
                {getClassificationIcon(ticket.classification)}
                {ticket.classification}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium">{ticket.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Claim Type</p>
                <p className="font-medium">{ticket.claimType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Submitted Date</p>
                <p className="font-medium">{ticket.submittedDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{ticket.summary}</p>
        </CardContent>
      </Card>

      {/* Comparison Summary - Key Validation Metrics */}
      {ticket.compliance_analysis && (
        <ComparisonSummary 
          complianceAnalysis={ticket.compliance_analysis}
          compact={false}
        />
      )}

      {/* Fraud Indicators */}
      {ticket.fraudIndicators && ticket.fraudIndicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-600" />
              Fraud Risk Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ticket.fraudIndicators.map((indicator, index) => (
                <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {indicator}
                </Badge>
              ))}
            </div>
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Fraud Score: {ticket.fraudScore}%</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {ticket.fraudScore >= 80 
                  ? 'High risk - Immediate investigation recommended'
                  : ticket.fraudScore >= 50 
                  ? 'Medium risk - Additional review required'
                  : 'Low risk - Standard processing'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vectorized Compliance Analysis */}
      {ticket.compliance_analysis && (
        <ComplianceAnalysis 
          reportId={ticket.id} 
          complianceData={ticket.compliance_analysis} 
        />
      )}

      {/* Document Analysis */}
      {ticket.attachments && ticket.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Document Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticket.attachments.map((attachment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{attachment.filename}</h4>
                    <Badge variant="outline" className={
                      attachment.type === 'statement' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      attachment.type === 'treaty_slip' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }>
                      {attachment.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {attachment.classification_confidence !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Classification Confidence:</span>
                        <span className="font-medium">
                          {(attachment.classification_confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    {attachment.quality_score !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality Score:</span>
                        <span className="font-medium">
                          {(attachment.quality_score * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vector ID:</span>
                      <span className="font-medium">{attachment.vector_id}</span>
                    </div>
                    
                    {attachment.financial_data && Object.keys(attachment.financial_data).length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600 mb-1">Financial Data Extracted:</div>
                        <div className="text-xs text-gray-800">
                          {Object.keys(attachment.financial_data).length} fields detected
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {formatReportText(ticket.reportText)}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ticket.classification === 'POTENTIALLY FRAUDULENT' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">⚠️ High Risk - Action Required</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Immediately flag this claim for manual investigation</li>
                  <li>• Contact the claimant for additional documentation</li>
                  <li>• Review similar claims from this company</li>
                  <li>• Consider involving fraud investigation team</li>
                </ul>
              </div>
            )}
            
            {ticket.classification === 'INSUFFICIENT EVIDENCE' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Insufficient Evidence - Review Required</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Request additional documentation from claimant</li>
                  <li>• Verify claim details against policy terms</li>
                  <li>• Consider requesting expert assessment</li>
                  <li>• Schedule follow-up review in 48 hours</li>
                </ul>
              </div>
            )}
            
            {ticket.classification === 'VALID' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">✅ Valid Claim - Proceed with Processing</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Claim appears legitimate based on available evidence</li>
                  <li>• Proceed with standard claim processing workflow</li>
                  <li>• Ensure all required documentation is complete</li>
                  <li>• Process payment according to policy terms</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}