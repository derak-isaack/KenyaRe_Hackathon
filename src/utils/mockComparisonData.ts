// Mock data generator for comparison metrics
import type { ComplianceAnalysis, DateComparison, FinancialComparison, GroundTruthComparison, ValidationMetrics } from '../types';

export function generateMockComparisonData(reportId: string, classification: string): ComplianceAnalysis {
  const isHighRisk = classification === 'POTENTIALLY FRAUDULENT';
  const isMediumRisk = classification === 'INSUFFICIENT EVIDENCE';
  
  // Generate realistic dates
  const baseDate = new Date('2024-09-15');
  const statementDates = [
    '2024-09-15',
    '2024-09-16',
    '2024-09-17'
  ];
  const treatyDates = [
    '2024-09-15',
    '2024-09-16',
    isHighRisk ? '2024-09-20' : '2024-09-17' // Discrepancy for high risk
  ];
  const groundTruthDates = [
    '2024-09-15',
    '2024-09-16',
    '2024-09-17'
  ];

  // Calculate date matches
  const statementGtMatches = statementDates.filter(d => groundTruthDates.includes(d)).length;
  const treatyGtMatches = treatyDates.filter(d => groundTruthDates.includes(d)).length;
  const statementTreatyMatches = statementDates.filter(d => treatyDates.includes(d)).length;
  
  const totalPossibleMatches = Math.max(statementDates.length, treatyDates.length, groundTruthDates.length);
  const matchPercentage = ((statementGtMatches + treatyGtMatches + statementTreatyMatches) / (totalPossibleMatches * 3)) * 100;

  const date_comparison: DateComparison = {
    statement_dates: statementDates,
    treaty_slip_dates: treatyDates,
    ground_truth_dates: groundTruthDates,
    matches: {
      statement_gt_matches: statementGtMatches,
      treaty_gt_matches: treatyGtMatches,
      statement_treaty_matches: statementTreatyMatches
    },
    discrepancies: isHighRisk ? [
      'Treaty slip date 2024-09-20 not found in ground truth data',
      'Statement processing date differs from treaty slip by 3 days'
    ] : [],
    match_percentage: matchPercentage
  };

  // Generate financial comparison data
  const treatySlipAmount = isHighRisk ? 2800000 : 1200000; // Higher for fraud cases
  const statementSurplus = 2500000;
  const withinLimits = treatySlipAmount <= statementSurplus;
  const variance = ((treatySlipAmount - statementSurplus) / statementSurplus) * 100;

  const treatyCommission = isHighRisk ? 125000 : 120000;
  const statementCommission = 120000;
  const commissionMatch = Math.abs(treatyCommission - statementCommission) < 5000;
  const commissionVariance = treatyCommission - statementCommission;
  const commissionVariancePercentage = (commissionVariance / statementCommission) * 100;

  const financial_comparison: FinancialComparison = {
    cash_loss_limit: {
      treaty_slip_amount: treatySlipAmount,
      statement_surplus_amount: statementSurplus,
      within_limits: withinLimits,
      variance_percentage: Math.abs(variance),
      risk_flag: !withinLimits
    },
    commissions: {
      treaty_slip_commission: treatyCommission,
      statement_commission: statementCommission,
      match: commissionMatch,
      variance_amount: commissionVariance,
      variance_percentage: Math.abs(commissionVariancePercentage)
    },
    claim_amounts: {
      total_claims_statement: isHighRisk ? 4200000 : 3800000,
      total_claims_ground_truth: 3800000,
      variance: isHighRisk ? 400000 : 0,
      variance_percentage: isHighRisk ? 10.5 : 0,
      suspicious_patterns: isHighRisk ? [
        'Multiple claims submitted within 48 hours',
        'Claim amounts follow suspicious round number pattern',
        'Similar incident descriptions across multiple claims'
      ] : []
    }
  };

  // Generate ground truth comparison
  const statementClaims = isHighRisk ? 15 : 12;
  const groundTruthClaims = 12;
  const claimsMatch = statementClaims === groundTruthClaims;
  const claimsVariance = statementClaims - groundTruthClaims;
  const claimsVariancePercentage = (claimsVariance / groundTruthClaims) * 100;

  const ground_truth_comparison: GroundTruthComparison = {
    total_claims_comparison: {
      statement_claims: statementClaims,
      ground_truth_claims: groundTruthClaims,
      match: claimsMatch,
      variance: claimsVariance,
      variance_percentage: claimsVariancePercentage,
      missing_claims: isHighRisk ? [] : [],
      extra_claims: isHighRisk ? [
        'Claim #2024-0918-001 - Not found in ground truth',
        'Claim #2024-0918-002 - Duplicate entry detected',
        'Claim #2024-0919-001 - Suspicious timing pattern'
      ] : []
    },
    data_integrity: {
      completeness_score: isHighRisk ? 75 : 95,
      accuracy_score: isHighRisk ? 68 : 92,
      consistency_score: isHighRisk ? 72 : 88,
      reliability_rating: isHighRisk ? 'LOW' : isMediumRisk ? 'MEDIUM' : 'HIGH'
    }
  };

  // Generate validation metrics
  const validation_metrics: ValidationMetrics = {
    trust_score: isHighRisk ? 45 : isMediumRisk ? 72 : 89,
    reliability_indicators: {
      data_consistency: isHighRisk ? 60 : isMediumRisk ? 75 : 90,
      cross_reference_accuracy: isHighRisk ? 55 : isMediumRisk ? 78 : 88,
      financial_alignment: isHighRisk ? 40 : isMediumRisk ? 70 : 92,
      temporal_consistency: matchPercentage
    },
    verification_status: {
      dates_verified: matchPercentage > 80,
      amounts_verified: !financial_comparison.cash_loss_limit.risk_flag,
      commissions_verified: financial_comparison.commissions.match,
      claims_count_verified: ground_truth_comparison.total_claims_comparison.match
    }
  };

  // Return enhanced compliance analysis
  return {
    overall_compliance_score: isHighRisk ? 35 : isMediumRisk ? 65 : 85,
    overall_risk_level: isHighRisk ? 'HIGH' : isMediumRisk ? 'MEDIUM' : 'LOW',
    pairing_confidence: isHighRisk ? 0.6 : isMediumRisk ? 0.75 : 0.9,
    statement_compliance: {
      compliance_score: isHighRisk ? 40 : isMediumRisk ? 70 : 88,
      risk_level: isHighRisk ? 'HIGH' : isMediumRisk ? 'MEDIUM' : 'LOW',
      risk_indicators: isHighRisk ? [
        'Cash loss limit exceeded',
        'Commission discrepancies detected',
        'Date inconsistencies found'
      ] : [],
      ground_truth_analysis: {
        matches_found: statementGtMatches,
        avg_similarity: isHighRisk ? 0.65 : 0.85,
        max_similarity: isHighRisk ? 0.78 : 0.92
      }
    },
    treaty_slip_compliance: {
      compliance_score: isHighRisk ? 38 : isMediumRisk ? 68 : 86,
      risk_level: isHighRisk ? 'HIGH' : isMediumRisk ? 'MEDIUM' : 'LOW',
      risk_indicators: isHighRisk ? [
        'Amount exceeds surplus limits',
        'Date discrepancies with ground truth'
      ] : [],
      ground_truth_analysis: {
        matches_found: treatyGtMatches,
        avg_similarity: isHighRisk ? 0.62 : 0.83,
        max_similarity: isHighRisk ? 0.75 : 0.90
      }
    },
    ground_truth_analysis: {
      matches_count: Math.min(statementGtMatches, treatyGtMatches),
      avg_similarity: isHighRisk ? 0.63 : 0.84,
      max_similarity: isHighRisk ? 0.76 : 0.91
    },
    // Enhanced comparison metrics
    date_comparison,
    financial_comparison,
    ground_truth_comparison,
    validation_metrics
  };
}

// Helper function to enhance existing reports with comparison data
export function enhanceReportWithComparison(report: any, realComparisonData?: any) {
  if (realComparisonData && realComparisonData.status === 'success') {
    // Use real comparison data from document analysis
    const realData = realComparisonData.data;
    
    report.compliance_analysis = {
      ...report.compliance_analysis,
      date_comparison: realData.date_comparison,
      financial_comparison: realData.financial_comparison,
      ground_truth_comparison: realData.ground_truth_comparison,
      validation_metrics: realData.validation_metrics
    };
  } else {
    // Fallback to mock data
    if (!report.compliance_analysis) {
      report.compliance_analysis = generateMockComparisonData(report.id, report.classification);
    } else {
      // Enhance existing compliance analysis with mock comparison data
      const mockData = generateMockComparisonData(report.id, report.classification);
      report.compliance_analysis = {
        ...report.compliance_analysis,
        date_comparison: mockData.date_comparison,
        financial_comparison: mockData.financial_comparison,
        ground_truth_comparison: mockData.ground_truth_comparison,
        validation_metrics: mockData.validation_metrics
      };
    }
  }
  return report;
}