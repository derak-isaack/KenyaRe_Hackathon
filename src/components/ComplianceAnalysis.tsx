import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

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

interface ComplianceAnalysisProps {
  reportId: string;
  complianceData?: ComplianceData;
}

const ComplianceAnalysis: React.FC<ComplianceAnalysisProps> = ({ reportId, complianceData }) => {
  const [detailedCompliance, setDetailedCompliance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailedCompliance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get(`/api/reports/${reportId}/compliance`);
      if (response.status === 'success') {
        setDetailedCompliance(response.data);
      } else {
        setError(response.message || 'Failed to fetch compliance data');
      }
    } catch (err) {
      setError('Error fetching compliance analysis');
      console.error('Compliance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceScoreColor = (score: number | undefined) => {
    if (score === undefined || score === null || isNaN(score)) {
      return 'text-gray-600';
    }
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatScore = (score: number | undefined) => {
    if (score === undefined || score === null || isNaN(score)) {
      return '0.0%';
    }
    return (score * 100).toFixed(1) + '%';
  };

  if (!complianceData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance Analysis</h3>
        <p className="text-gray-500">No compliance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Vectorized Compliance Analysis</h3>
        <button
          onClick={fetchDetailedCompliance}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'View Details'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Overall Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Overall Compliance</h4>
          <div className={`text-2xl font-bold ${getComplianceScoreColor(complianceData.overall_compliance_score || 0)}`}>
            {formatScore(complianceData.overall_compliance_score || 0)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Risk Level</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(complianceData.overall_risk_level)}`}>
            {complianceData.overall_risk_level?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Document Pairing</h4>
          <div className={`text-2xl font-bold ${getComplianceScoreColor(complianceData.pairing_confidence || 0)}`}>
            {formatScore(complianceData.pairing_confidence || 0)}
          </div>
        </div>
      </div>

      {/* Ground Truth Analysis */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Ground Truth Similarity Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Historical Matches</div>
            <div className="text-xl font-semibold text-blue-600">
              {complianceData.ground_truth_analysis?.matches_count || 0}
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Average Similarity</div>
            <div className="text-xl font-semibold text-blue-600">
              {formatScore(complianceData.ground_truth_analysis?.avg_similarity || 0)}
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Max Similarity</div>
            <div className="text-xl font-semibold text-blue-600">
              {formatScore(complianceData.ground_truth_analysis?.max_similarity || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Document-Specific Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statement Analysis */}
        {complianceData.statement_compliance && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">Statement Document</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Compliance Score:</span>
                <span className={`font-medium ${getComplianceScoreColor(complianceData.statement_compliance.compliance_score || 0)}`}>
                  {formatScore(complianceData.statement_compliance.compliance_score || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(complianceData.statement_compliance.risk_level)}`}>
                  {complianceData.statement_compliance.risk_level?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Historical Matches:</span>
                <span className="font-medium">
                  {complianceData.statement_compliance?.ground_truth_analysis?.matches_found || 0}
                </span>
              </div>
              
              {complianceData.statement_compliance.risk_indicators && complianceData.statement_compliance.risk_indicators.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-1">Risk Indicators:</div>
                  <div className="space-y-1">
                    {complianceData.statement_compliance.risk_indicators.map((indicator, index) => (
                      <div key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        {indicator.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Treaty Slip Analysis */}
        {complianceData.treaty_slip_compliance && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">Treaty Slip Document</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Compliance Score:</span>
                <span className={`font-medium ${getComplianceScoreColor(complianceData.treaty_slip_compliance.compliance_score || 0)}`}>
                  {formatScore(complianceData.treaty_slip_compliance.compliance_score || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Risk Level:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(complianceData.treaty_slip_compliance.risk_level)}`}>
                  {complianceData.treaty_slip_compliance.risk_level?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Historical Matches:</span>
                <span className="font-medium">
                  {complianceData.treaty_slip_compliance?.ground_truth_analysis?.matches_found || 0}
                </span>
              </div>
              
              {complianceData.treaty_slip_compliance.risk_indicators && complianceData.treaty_slip_compliance.risk_indicators.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-1">Risk Indicators:</div>
                  <div className="space-y-1">
                    {complianceData.treaty_slip_compliance.risk_indicators.map((indicator, index) => (
                      <div key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        {indicator.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show placeholder if no statement compliance data */}
        {!complianceData.statement_compliance && !complianceData.treaty_slip_compliance && (
          <div className="col-span-2 border rounded-lg p-4 text-center text-gray-500">
            <p>No document-specific compliance data available</p>
          </div>
        )}
      </div>

      {/* Detailed Compliance Data */}
      {detailedCompliance && (
        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium text-gray-700 mb-3">Detailed Analysis</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(detailedCompliance, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceAnalysis;