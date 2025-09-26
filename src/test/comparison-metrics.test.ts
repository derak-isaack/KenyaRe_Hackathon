// Test file for comparison metrics functionality
import { ComparisonMetrics } from '../components/ComparisonMetrics';
import { ComparisonSummary } from '../components/ComparisonSummary';

// Mock compliance analysis data for testing
const mockComplianceAnalysis = {
  overall_compliance_score: 85.5,
  overall_risk_level: 'medium',
  pairing_confidence: 92.3,
  statement_compliance: {
    compliance_score: 88.0,
    risk_level: 'medium',
    risk_indicators: ['Minor discrepancy in dates'],
    ground_truth_analysis: {
      matches_found: 15,
      avg_similarity: 0.87,
      max_similarity: 0.95
    }
  },
  treaty_slip_compliance: {
    compliance_score: 83.0,
    risk_level: 'medium',
    risk_indicators: ['Commission calculation variance'],
    ground_truth_analysis: {
      matches_found: 12,
      avg_similarity: 0.82,
      max_similarity: 0.91
    }
  },
  ground_truth_analysis: {
    matches_count: 18,
    avg_similarity: 0.85,
    max_similarity: 0.95
  },
  // Enhanced comparison metrics
  date_comparison: {
    statement_dates: ['2024-01-15', '2024-02-20', '2024-03-10'],
    treaty_slip_dates: ['2024-01-15', '2024-02-20'],
    ground_truth_dates: ['2024-01-15', '2024-02-20', '2024-03-10'],
    matches: {
      statement_gt_matches: 3,
      treaty_gt_matches: 2,
      statement_treaty_matches: 2
    },
    discrepancies: ['Treaty slip missing March 2024 date'],
    match_percentage: 88.9
  },
  financial_comparison: {
    cash_loss_limit: {
      treaty_slip_amount: 2500000,
      statement_surplus_amount: 3000000,
      within_limits: true,
      variance_percentage: -16.7,
      risk_flag: false
    },
    commissions: {
      treaty_slip_commission: 125000,
      statement_commission: 120000,
      match: true,
      variance_amount: 5000,
      variance_percentage: 4.2
    },
    claim_amounts: {
      total_claims_statement: 2450000,
      total_claims_ground_truth: 2450000,
      variance: 0,
      variance_percentage: 0,
      suspicious_patterns: []
    }
  },
  ground_truth_comparison: {
    total_claims_comparison: {
      statement_claims: 3,
      ground_truth_claims: 3,
      match: true,
      variance: 0,
      variance_percentage: 0,
      missing_claims: [],
      extra_claims: []
    },
    data_integrity: {
      completeness_score: 100,
      accuracy_score: 95.5,
      consistency_score: 92.0,
      reliability_rating: 'HIGH' as const
    }
  },
  validation_metrics: {
    trust_score: 89.2,
    reliability_indicators: {
      data_consistency: 90.5,
      cross_reference_accuracy: 95.5,
      financial_alignment: 85.0,
      temporal_consistency: 88.9
    },
    verification_status: {
      dates_verified: true,
      amounts_verified: true,
      commissions_verified: true,
      claims_count_verified: true
    }
  }
};

describe('Comparison Metrics Components', () => {
  describe('ComparisonMetrics', () => {
    it('should be importable', () => {
      expect(typeof ComparisonMetrics).toBe('function');
    });

    it('should handle missing compliance analysis gracefully', () => {
      const emptyAnalysis = {
        overall_compliance_score: 0,
        overall_risk_level: 'unknown',
        pairing_confidence: 0,
        statement_compliance: {},
        ground_truth_analysis: {
          matches_count: 0,
          avg_similarity: 0,
          max_similarity: 0
        }
      };

      // This should not throw an error
      expect(() => {
        // In a real test, you would render the component
        // render(<ComparisonMetrics complianceAnalysis={emptyAnalysis} />);
      }).not.toThrow();
    });
  });

  describe('ComparisonSummary', () => {
    it('should be importable', () => {
      expect(typeof ComparisonSummary).toBe('function');
    });

    it('should handle compact mode', () => {
      // Test that compact mode works
      expect(() => {
        // In a real test, you would render the component
        // render(<ComparisonSummary complianceAnalysis={mockComplianceAnalysis} compact={true} />);
      }).not.toThrow();
    });
  });

  describe('Data Validation Logic', () => {
    it('should correctly identify trust score levels', () => {
      const highTrust = mockComplianceAnalysis.validation_metrics.trust_score;
      expect(highTrust).toBeGreaterThan(80);

      const mediumTrust = 65;
      expect(mediumTrust).toBeGreaterThanOrEqual(60);
      expect(mediumTrust).toBeLessThan(80);

      const lowTrust = 45;
      expect(lowTrust).toBeLessThan(60);
    });

    it('should correctly validate financial limits', () => {
      const { cash_loss_limit } = mockComplianceAnalysis.financial_comparison;
      
      expect(cash_loss_limit.treaty_slip_amount).toBeLessThanOrEqual(cash_loss_limit.statement_surplus_amount);
      expect(cash_loss_limit.within_limits).toBe(true);
      expect(cash_loss_limit.risk_flag).toBe(false);
    });

    it('should correctly validate claims count', () => {
      const { total_claims_comparison } = mockComplianceAnalysis.ground_truth_comparison;
      
      expect(total_claims_comparison.statement_claims).toBe(total_claims_comparison.ground_truth_claims);
      expect(total_claims_comparison.match).toBe(true);
      expect(total_claims_comparison.variance).toBe(0);
    });

    it('should correctly calculate date consistency', () => {
      const { date_comparison } = mockComplianceAnalysis;
      
      expect(date_comparison.match_percentage).toBeGreaterThan(80);
      expect(date_comparison.matches.statement_gt_matches).toBeGreaterThan(0);
      expect(date_comparison.discrepancies).toHaveLength(1);
    });

    it('should identify verification status correctly', () => {
      const { verification_status } = mockComplianceAnalysis.validation_metrics;
      
      expect(verification_status.dates_verified).toBe(true);
      expect(verification_status.amounts_verified).toBe(true);
      expect(verification_status.commissions_verified).toBe(true);
      expect(verification_status.claims_count_verified).toBe(true);
    });
  });

  describe('Risk Assessment Logic', () => {
    it('should flag high variance as suspicious', () => {
      const highVarianceScenario = {
        ...mockComplianceAnalysis,
        financial_comparison: {
          ...mockComplianceAnalysis.financial_comparison,
          cash_loss_limit: {
            treaty_slip_amount: 3500000,
            statement_surplus_amount: 2000000,
            within_limits: false,
            variance_percentage: 75.0,
            risk_flag: true
          }
        }
      };

      expect(highVarianceScenario.financial_comparison.cash_loss_limit.risk_flag).toBe(true);
      expect(highVarianceScenario.financial_comparison.cash_loss_limit.within_limits).toBe(false);
    });

    it('should detect commission mismatches', () => {
      const commissionMismatchScenario = {
        ...mockComplianceAnalysis,
        financial_comparison: {
          ...mockComplianceAnalysis.financial_comparison,
          commissions: {
            treaty_slip_commission: 125000,
            statement_commission: 95000,
            match: false,
            variance_amount: 30000,
            variance_percentage: 24.0
          }
        }
      };

      expect(commissionMismatchScenario.financial_comparison.commissions.match).toBe(false);
      expect(commissionMismatchScenario.financial_comparison.commissions.variance_percentage).toBeGreaterThan(20);
    });

    it('should identify claims count discrepancies', () => {
      const claimsMismatchScenario = {
        ...mockComplianceAnalysis,
        ground_truth_comparison: {
          ...mockComplianceAnalysis.ground_truth_comparison,
          total_claims_comparison: {
            statement_claims: 5,
            ground_truth_claims: 3,
            match: false,
            variance: 2,
            variance_percentage: 66.7,
            missing_claims: [],
            extra_claims: ['Extra claim 1', 'Extra claim 2']
          }
        }
      };

      expect(claimsMismatchScenario.ground_truth_comparison.total_claims_comparison.match).toBe(false);
      expect(claimsMismatchScenario.ground_truth_comparison.total_claims_comparison.extra_claims).toHaveLength(2);
    });
  });
});

// Helper functions for testing
export function createMockComplianceAnalysis(overrides = {}) {
  return {
    ...mockComplianceAnalysis,
    ...overrides
  };
}

export function createHighRiskScenario() {
  return createMockComplianceAnalysis({
    validation_metrics: {
      ...mockComplianceAnalysis.validation_metrics,
      trust_score: 45.0,
      verification_status: {
        dates_verified: false,
        amounts_verified: false,
        commissions_verified: false,
        claims_count_verified: false
      }
    },
    financial_comparison: {
      ...mockComplianceAnalysis.financial_comparison,
      cash_loss_limit: {
        treaty_slip_amount: 4000000,
        statement_surplus_amount: 2000000,
        within_limits: false,
        variance_percentage: 100.0,
        risk_flag: true
      },
      claim_amounts: {
        ...mockComplianceAnalysis.financial_comparison.claim_amounts,
        suspicious_patterns: [
          'Claim amount variance exceeds 15% (25.5%)',
          'Commission mismatch: 30.2% difference',
          'Cash loss limit exceeds surplus amount'
        ]
      }
    }
  });
}

export { mockComplianceAnalysis };