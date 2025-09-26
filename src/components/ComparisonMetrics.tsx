// Comprehensive comparison metrics component for fraud detection reports
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
  Eye,
  EyeOff,
  Info,
  Target,
  BarChart3
} from 'lucide-react';
import type { ComplianceAnalysis, DateComparison, FinancialComparison, GroundTruthComparison, ValidationMetrics } from '../types';

interface ComparisonMetricsProps {
  complianceAnalysis: ComplianceAnalysis;
  className?: string;
  showDetailed?: boolean;
}

export function ComparisonMetrics({ 
  complianceAnalysis, 
  className = '',
  showDetailed = true 
}: ComparisonMetricsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllDetails, setShowAllDetails] = useState(false);

  const {
    date_comparison,
    financial_comparison,
    ground_truth_comparison,
    validation_metrics
  } = complianceAnalysis;

  // Helper functions for status indicators
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

  // Overview Summary Component
  const OverviewSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Trust Score */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trust Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {validation_metrics?.trust_score?.toFixed(0) || 'N/A'}
              </p>
            </div>
            <Shield className={`h-8 w-8 ${
              (validation_metrics?.trust_score || 0) >= 80 ? 'text-green-600' :
              (validation_metrics?.trust_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
          <Progress 
            value={validation_metrics?.trust_score || 0} 
            className="mt-2 h-2"
          />
        </CardContent>
      </Card>

      {/* Claims Comparison */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Claims Match</p>
              <p className="text-lg font-semibold">
                {ground_truth_comparison?.total_claims_comparison?.match ? 'VERIFIED' : 'MISMATCH'}
              </p>
              <p className="text-xs text-gray-500">
                Variance: {formatPercentage(ground_truth_comparison?.total_claims_comparison?.variance_percentage || 0)}
              </p>
            </div>
            {getStatusIcon(ground_truth_comparison?.total_claims_comparison?.match || false)}
          </div>
        </CardContent>
      </Card>

      {/* Date Validation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Date Consistency</p>
              <p className="text-lg font-semibold">
                {formatPercentage(date_comparison?.match_percentage || 0)}
              </p>
              <p className="text-xs text-gray-500">
                {date_comparison?.discrepancies?.length || 0} discrepancies
              </p>
            </div>
            <Calendar className={`h-8 w-8 ${
              (date_comparison?.match_percentage || 0) >= 90 ? 'text-green-600' :
              (date_comparison?.match_percentage || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`} />
          </div>
        </CardContent>
      </Card>

      {/* Financial Validation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Financial Check</p>
              <p className="text-lg font-semibold">
                {financial_comparison?.cash_loss_limit?.within_limits ? 'WITHIN LIMITS' : 'EXCEEDED'}
              </p>
              <p className="text-xs text-gray-500">
                {financial_comparison?.cash_loss_limit?.risk_flag ? 'Risk Flagged' : 'Compliant'}
              </p>
            </div>
            {getStatusIcon(
              financial_comparison?.cash_loss_limit?.within_limits || false,
              financial_comparison?.cash_loss_limit?.risk_flag
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Date Comparison Component
  const DateComparisonTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Validation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Statement Dates</p>
              <p className="text-2xl font-bold text-blue-600">
                {date_comparison?.statement_dates?.length || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Treaty Slip Dates</p>
              <p className="text-2xl font-bold text-green-600">
                {date_comparison?.treaty_slip_dates?.length || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Ground Truth Dates</p>
              <p className="text-2xl font-bold text-purple-600">
                {date_comparison?.ground_truth_dates?.length || 0}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Statement ↔ Ground Truth Matches</span>
              <Badge className={getStatusColor(
                (date_comparison?.matches?.statement_gt_matches || 0) > 0
              )}>
                {date_comparison?.matches?.statement_gt_matches || 0} matches
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Treaty ↔ Ground Truth Matches</span>
              <Badge className={getStatusColor(
                (date_comparison?.matches?.treaty_gt_matches || 0) > 0
              )}>
                {date_comparison?.matches?.treaty_gt_matches || 0} matches
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Statement ↔ Treaty Matches</span>
              <Badge className={getStatusColor(
                (date_comparison?.matches?.statement_treaty_matches || 0) > 0
              )}>
                {date_comparison?.matches?.statement_treaty_matches || 0} matches
              </Badge>
            </div>
          </div>

          {date_comparison?.discrepancies && date_comparison.discrepancies.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-red-600 mb-2">Date Discrepancies Found:</h4>
              <ul className="space-y-1">
                {date_comparison.discrepancies.map((discrepancy, index) => (
                  <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {discrepancy}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Financial Comparison Component
  const FinancialComparisonTab = () => (
    <div className="space-y-6">
      {/* Cash Loss Limit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cash Loss Limit vs Surplus Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Treaty Slip Cash Loss Limit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financial_comparison?.cash_loss_limit?.treaty_slip_amount || 0)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Statement Surplus Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financial_comparison?.cash_loss_limit?.statement_surplus_amount || 0)}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                financial_comparison?.cash_loss_limit?.within_limits 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(financial_comparison?.cash_loss_limit?.within_limits || false)}
                  <span className="font-semibold">
                    {financial_comparison?.cash_loss_limit?.within_limits ? 'WITHIN LIMITS' : 'LIMIT EXCEEDED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Variance: {formatPercentage(financial_comparison?.cash_loss_limit?.variance_percentage || 0)}
                </p>
                {financial_comparison?.cash_loss_limit?.risk_flag && (
                  <Badge className="mt-2 bg-red-100 text-red-800">
                    🚨 FRAUD RISK FLAGGED
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Commission Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Treaty Slip Commission</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(financial_comparison?.commissions?.treaty_slip_commission || 0)}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Statement Commission</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(financial_comparison?.commissions?.statement_commission || 0)}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg text-center border-2 ${
              financial_comparison?.commissions?.match 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {getStatusIcon(financial_comparison?.commissions?.match || false)}
                <span className="font-semibold">
                  {financial_comparison?.commissions?.match ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Variance: {formatCurrency(Math.abs(financial_comparison?.commissions?.variance_amount || 0))}
              </p>
              <p className="text-xs text-gray-500">
                ({formatPercentage(Math.abs(financial_comparison?.commissions?.variance_percentage || 0))})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claim Amounts Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Claim Amounts Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Claims (Statement)</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financial_comparison?.claim_amounts?.total_claims_statement || 0)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Claims (Ground Truth)</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(financial_comparison?.claim_amounts?.total_claims_ground_truth || 0)}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Variance Amount</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(Math.abs(financial_comparison?.claim_amounts?.variance || 0))}
                </p>
                <p className="text-sm text-gray-500">
                  {formatPercentage(Math.abs(financial_comparison?.claim_amounts?.variance_percentage || 0))} difference
                </p>
              </div>
              
              {financial_comparison?.claim_amounts?.suspicious_patterns && 
               financial_comparison.claim_amounts.suspicious_patterns.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-yellow-800 mb-2">Suspicious Patterns:</p>
                  <ul className="space-y-1">
                    {financial_comparison.claim_amounts.suspicious_patterns.map((pattern, index) => (
                      <li key={index} className="text-sm text-yellow-700">
                        • {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Ground Truth Comparison Component
  const GroundTruthTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Claims Count Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Statement Claims</p>
              <p className="text-3xl font-bold text-blue-600">
                {ground_truth_comparison?.total_claims_comparison?.statement_claims || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Ground Truth Claims</p>
              <p className="text-3xl font-bold text-purple-600">
                {ground_truth_comparison?.total_claims_comparison?.ground_truth_claims || 0}
              </p>
            </div>
            <div className={`text-center p-4 rounded-lg border-2 ${
              ground_truth_comparison?.total_claims_comparison?.match 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {getStatusIcon(ground_truth_comparison?.total_claims_comparison?.match || false)}
                <span className="font-bold">
                  {ground_truth_comparison?.total_claims_comparison?.match ? 'VERIFIED' : 'MISMATCH'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Variance: {ground_truth_comparison?.total_claims_comparison?.variance || 0}
              </p>
            </div>
          </div>

          {/* Data Integrity Scores */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Completeness</p>
              <p className="text-lg font-bold">
                {formatPercentage(ground_truth_comparison?.data_integrity?.completeness_score || 0)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Accuracy</p>
              <p className="text-lg font-bold">
                {formatPercentage(ground_truth_comparison?.data_integrity?.accuracy_score || 0)}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Consistency</p>
              <p className="text-lg font-bold">
                {formatPercentage(ground_truth_comparison?.data_integrity?.consistency_score || 0)}
              </p>
            </div>
            <div className={`text-center p-3 rounded-lg border ${
              ground_truth_comparison?.data_integrity?.reliability_rating === 'HIGH' 
                ? 'bg-green-50 border-green-200' 
                : ground_truth_comparison?.data_integrity?.reliability_rating === 'MEDIUM'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs text-gray-600">Reliability</p>
              <p className="text-lg font-bold">
                {ground_truth_comparison?.data_integrity?.reliability_rating || 'N/A'}
              </p>
            </div>
          </div>

          {/* Missing and Extra Claims */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ground_truth_comparison?.total_claims_comparison?.missing_claims && 
             ground_truth_comparison.total_claims_comparison.missing_claims.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Missing Claims:</h4>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {ground_truth_comparison.total_claims_comparison.missing_claims.map((claim, index) => (
                    <li key={index} className="text-sm text-red-700">
                      • {claim}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ground_truth_comparison?.total_claims_comparison?.extra_claims && 
             ground_truth_comparison.total_claims_comparison.extra_claims.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Extra Claims:</h4>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {ground_truth_comparison.total_claims_comparison.extra_claims.map((claim, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      • {claim}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Validation Metrics Component
  const ValidationTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust & Reliability Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trust Score Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold">Reliability Indicators</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Consistency</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={validation_metrics?.reliability_indicators?.data_consistency || 0} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium">
                      {formatPercentage(validation_metrics?.reliability_indicators?.data_consistency || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cross-Reference Accuracy</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={validation_metrics?.reliability_indicators?.cross_reference_accuracy || 0} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium">
                      {formatPercentage(validation_metrics?.reliability_indicators?.cross_reference_accuracy || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Financial Alignment</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={validation_metrics?.reliability_indicators?.financial_alignment || 0} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium">
                      {formatPercentage(validation_metrics?.reliability_indicators?.financial_alignment || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Temporal Consistency</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={validation_metrics?.reliability_indicators?.temporal_consistency || 0} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium">
                      {formatPercentage(validation_metrics?.reliability_indicators?.temporal_consistency || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="space-y-4">
              <h4 className="font-semibold">Verification Status</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Dates Verified</span>
                  {getStatusIcon(validation_metrics?.verification_status?.dates_verified || false)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Amounts Verified</span>
                  {getStatusIcon(validation_metrics?.verification_status?.amounts_verified || false)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Commissions Verified</span>
                  {getStatusIcon(validation_metrics?.verification_status?.commissions_verified || false)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Claims Count Verified</span>
                  {getStatusIcon(validation_metrics?.verification_status?.claims_count_verified || false)}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Trust Score */}
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Overall Trust Score</h3>
              <div className="text-4xl font-bold mb-2">
                {validation_metrics?.trust_score?.toFixed(0) || 'N/A'}
                <span className="text-lg text-gray-500">/100</span>
              </div>
              <Progress 
                value={validation_metrics?.trust_score || 0} 
                className="w-full h-3 mb-2"
              />
              <p className="text-sm text-gray-600">
                {(validation_metrics?.trust_score || 0) >= 80 ? 'High Trust - Data is reliable and consistent' :
                 (validation_metrics?.trust_score || 0) >= 60 ? 'Medium Trust - Some discrepancies found' :
                 'Low Trust - Significant issues detected'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!showDetailed) {
    return (
      <div className={className}>
        <OverviewSummary />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Summary */}
      <OverviewSummary />

      {/* Detailed Comparison Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Comparison Analysis
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllDetails(!showAllDetails)}
              className="flex items-center gap-2"
            >
              {showAllDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAllDetails ? 'Hide Details' : 'Show All Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dates">Date Analysis</TabsTrigger>
              <TabsTrigger value="financial">Financial Check</TabsTrigger>
              <TabsTrigger value="claims">Claims Verification</TabsTrigger>
              <TabsTrigger value="validation">Trust Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="dates" className="mt-6">
              <DateComparisonTab />
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <FinancialComparisonTab />
            </TabsContent>

            <TabsContent value="claims" className="mt-6">
              <GroundTruthTab />
            </TabsContent>

            <TabsContent value="validation" className="mt-6">
              <ValidationTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}