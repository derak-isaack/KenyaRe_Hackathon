
export interface UserData {
  name: string;
  email: string;
  role?: string;
}

export interface DateComparison {
  statement_dates: string[];
  treaty_slip_dates: string[];
  ground_truth_dates: string[];
  matches: {
    statement_gt_matches: number;
    treaty_gt_matches: number;
    statement_treaty_matches: number;
  };
  discrepancies: string[];
  match_percentage: number;
}

export interface FinancialComparison {
  cash_loss_limit: {
    treaty_slip_amount: number;
    statement_surplus_amount: number;
    within_limits: boolean;
    variance_percentage: number;
    risk_flag: boolean;
  };
  commissions: {
    treaty_slip_commission: number;
    statement_commission: number;
    match: boolean;
    variance_amount: number;
    variance_percentage: number;
  };
  claim_amounts: {
    total_claims_statement: number;
    total_claims_ground_truth: number;
    variance: number;
    variance_percentage: number;
    suspicious_patterns: string[];
  };
}

export interface GroundTruthComparison {
  total_claims_comparison: {
    statement_claims: number;
    ground_truth_claims: number;
    match: boolean;
    variance: number;
    variance_percentage: number;
    missing_claims: string[];
    extra_claims: string[];
  };
  data_integrity: {
    completeness_score: number;
    accuracy_score: number;
    consistency_score: number;
    reliability_rating: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface ValidationMetrics {
  trust_score: number;
  reliability_indicators: {
    data_consistency: number;
    cross_reference_accuracy: number;
    financial_alignment: number;
    temporal_consistency: number;
  };
  verification_status: {
    dates_verified: boolean;
    amounts_verified: boolean;
    commissions_verified: boolean;
    claims_count_verified: boolean;
  };
}

export interface ComplianceAnalysis {
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
  // Enhanced comparison metrics
  date_comparison?: DateComparison;
  financial_comparison?: FinancialComparison;
  ground_truth_comparison?: GroundTruthComparison;
  validation_metrics?: ValidationMetrics;
}

export interface Attachment {
  filename: string;
  type: 'statement' | 'treaty_slip' | 'unknown';
  text: string;
  vector_id: number;
  classification_confidence?: number;
  quality_score?: number;
  compliance_analysis?: any;
  financial_data?: {
    amounts?: Record<string, number>;
    percentages?: Record<string, number>;
    dates?: Record<string, string>;
    parties?: Record<string, string>;
    confidence_score?: number;
  };
}

export interface Report {
  id: string;
  claim_id: string;
  timestamp: string;
  classification: 'VALID' | 'POTENTIALLY FRAUDULENT' | 'INSUFFICIENT EVIDENCE';
  summary: string;
  file_path: string;
  company: string;
  claim_amount?: string;
  claim_type: string;
  source: 'msg' | 'outlook';
  ground_truth_matches: number;
  report_text: string;
  attachments: Attachment[];
  fraud_indicators: string[];
  compliance_analysis?: ComplianceAnalysis;
}

export interface SystemStats {
  total_reports: number;
  high_risk_reports: number;
  medium_risk_reports: number;
  low_risk_reports: number;
  reports_today: number;
  reports_this_week: number;
  avg_processing_time: string;
  system_uptime: string;
}

export interface PipelineStatus {
  is_running: boolean;
  progress: number;
  current_step: string;
  estimated_completion: string;
  error?: string;
  last_run: string;
  reports_generated: number;
}

export interface Ticket {
  id: string;
  source: 'Email' | 'Portal';
  subject: string;
  company: string;
  processed_time: string;
  status: 'Auto Approved' | 'Flagged' | 'Rejected' | 'Pending Review';
  attachments: Attachment[];
  body_text: string;
  classification?: 'VALID' | 'POTENTIALLY FRAUDULENT' | 'INSUFFICIENT EVIDENCE';
}

export interface CompanyProfile {
  name: string;
  total_claims: number;
  valid_claims: number;
  flagged_claims: number;
  insufficient_evidence: number;
  risk_score: number;
  recent_activity: string[];
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
  };
}
