// Compact comparison summary component for displaying key metrics
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  Target
} from 'lucide-react';
import type { ComplianceAnalysis } from '../types';

interface ComparisonSummaryProps {
  complianceAnalysis: ComplianceAnalysis;
  className?: string;
  compact?: boolean;
}

export function ComparisonSummary({ 
  complianceAnalysis, 
  className = '',
  compact = false 
}: ComparisonSummaryProps) {
  const {
    date_comparison,
    financial_comparison,
    ground_truth_comparison,
    validation_metrics
  } = complianceAnalysis;

  // Helper functions
  const getStatusIcon = (isValid: boolean, isWarning?: boolean) => {
    if (isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isWarning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (isValid: boolean, isWarning?: boolean) => {
    if (isValid) return 'bg-green-100 text-green-800 border-green-200';
    if (isWarning) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (compact) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
        {/* Trust Score */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Shield className={`h-5 w-5 ${
            (validation_metrics?.trust_score || 0) >= 80 ? 'text-green-600' :
            (validation_metrics?.trust_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`} />
          <div>
            <p className="text-xs text-gray-600">Trust</p>
            <p className="font-semibold">{validation_metrics?.trust_score?.toFixed(0) || 'N/A'}</p>
          </div>
        </div>

        {/* Claims Match */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Target className={`h-5 w-5 ${
            ground_truth_comparison?.total_claims_comparison?.match ? 'text-green-600' : 'text-red-600'
          }`} />
          <div>
            <p className="text-xs text-gray-600">Claims</p>
            <p className="font-semibold">
              {ground_truth_comparison?.total_claims_comparison?.match ? 'Match' : 'Mismatch'}
            </p>
          </div>
        </div>

        {/* Date Consistency */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Calendar className={`h-5 w-5 ${
            (date_comparison?.match_percentage || 0) >= 90 ? 'text-green-600' :
            (date_comparison?.match_percentage || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`} />
          <div>
            <p className="text-xs text-gray-600">Dates</p>
            <p className="font-semibold">{formatPercentage(date_comparison?.match_percentage || 0)}</p>
          </div>
        </div>

        {/* Financial Check */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <DollarSign className={`h-5 w-5 ${
            financial_comparison?.cash_loss_limit?.within_limits ? 'text-green-600' : 'text-red-600'
          }`} />
          <div>
            <p className="text-xs text-gray-600">Limits</p>
            <p className="font-semibold">
              {financial_comparison?.cash_loss_limit?.within_limits ? 'OK' : 'Exceeded'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Key Metrics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Trust Score */}
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Shield className={`h-8 w-8 ${
                  (validation_metrics?.trust_score || 0) >= 80 ? 'text-green-600' :
                  (validation_metrics?.trust_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <p className="text-sm text-gray-600 mb-1">Overall Trust Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {validation_metrics?.trust_score?.toFixed(0) || 'N/A'}
                <span className="text-sm text-gray-500">/100</span>
              </p>
              <Progress 
                value={validation_metrics?.trust_score || 0} 
                className="mt-2 h-2"
              />
            </div>

            {/* Claims Verification */}
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(ground_truth_comparison?.total_claims_comparison?.match || false)}
              </div>
              <p className="text-sm text-gray-600 mb-1">Claims Count</p>
              <p className="text-lg font-bold text-gray-900">
                {ground_truth_comparison?.total_claims_comparison?.statement_claims || 0} vs{' '}
                {ground_truth_comparison?.total_claims_comparison?.ground_truth_claims || 0}
              </p>
              <Badge className={getStatusColor(ground_truth_comparison?.total_claims_comparison?.match || false)}>
                {ground_truth_comparison?.total_claims_comparison?.match ? 'VERIFIED' : 'MISMATCH'}
              </Badge>
            </div>

            {/* Date Consistency */}
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calendar className={`h-8 w-8 ${
                  (date_comparison?.match_percentage || 0) >= 90 ? 'text-green-600' :
                  (date_comparison?.match_percentage || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              <p className="text-sm text-gray-600 mb-1">Date Consistency</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(date_comparison?.match_percentage || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {date_comparison?.discrepancies?.length || 0} discrepancies
              </p>
            </div>

            {/* Financial Validation */}
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(
                  financial_comparison?.cash_loss_limit?.within_limits || false,
                  financial_comparison?.cash_loss_limit?.risk_flag
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">Financial Limits</p>
              <p className="text-lg font-bold text-gray-900">
                {financial_comparison?.cash_loss_limit?.within_limits ? 'COMPLIANT' : 'EXCEEDED'}
              </p>
              {financial_comparison?.cash_loss_limit?.risk_flag && (
                <Badge className="bg-red-100 text-red-800 text-xs">
                  🚨 RISK FLAGGED
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Numbers for Trust and Reliability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Key Comparison Numbers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Financial Comparison */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Financial Validation</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Treaty Cash Loss Limit:</span>
                  <span className="font-semibold">
                    {formatCurrency(financial_comparison?.cash_loss_limit?.treaty_slip_amount || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Statement Surplus:</span>
                  <span className="font-semibold">
                    {formatCurrency(financial_comparison?.cash_loss_limit?.statement_surplus_amount || 0)}
                  </span>
                </div>
                
                <div className={`flex justify-between items-center p-2 rounded border ${
                  financial_comparison?.cash_loss_limit?.within_limits 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <span>Variance:</span>
                  <span className="font-semibold">
                    {formatPercentage(Math.abs(financial_comparison?.cash_loss_limit?.variance_percentage || 0))}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Commission Match:</span>
                  <span className={`font-semibold ${
                    financial_comparison?.commissions?.match ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {financial_comparison?.commissions?.match ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Claims and Date Validation */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">Data Validation</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Statement Claims:</span>
                  <span className="font-semibold">
                    {ground_truth_comparison?.total_claims_comparison?.statement_claims || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Ground Truth Claims:</span>
                  <span className="font-semibold">
                    {ground_truth_comparison?.total_claims_comparison?.ground_truth_claims || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Date Matches:</span>
                  <span className="font-semibold">
                    {date_comparison?.matches?.statement_gt_matches || 0} / {date_comparison?.ground_truth_dates?.length || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>Data Integrity:</span>
                  <span className="font-semibold">
                    {ground_truth_comparison?.data_integrity?.reliability_rating || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Suspicious Patterns Alert */}
          {financial_comparison?.claim_amounts?.suspicious_patterns && 
           financial_comparison.claim_amounts.suspicious_patterns.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Suspicious Patterns Detected
              </h5>
              <ul className="space-y-1">
                {financial_comparison.claim_amounts.suspicious_patterns.map((pattern, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    • {pattern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}