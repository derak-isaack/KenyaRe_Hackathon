// API service layer for backend communication
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:5000';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Import types from the main types file
import type { Report, Attachment, ComplianceAnalysis, SystemStats } from '../types';

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
  risk_score: string;
  recent_activity: Array<{
    date: string;
    claim_id: string;
    classification: string;
  }>;
  contact_info: {
    email?: string;
    phone?: string;
  };
}

// Remove duplicate interfaces - they're now imported from types.ts

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Include cookies for session management
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<ApiResponse<any>> {
    return this.request('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    });
  }

  async logout(): Promise<ApiResponse<any>> {
    return this.request('/logout', {
      method: 'GET',
    });
  }

  // Data fetching methods
  async getReports(): Promise<ApiResponse<Report[]>> {
    return this.request<Report[]>('/api/reports');
  }

  async getTickets(): Promise<ApiResponse<Ticket[]>> {
    return this.request<Ticket[]>('/api/tickets');
  }

  async getCompanies(): Promise<ApiResponse<CompanyProfile[]>> {
    return this.request<CompanyProfile[]>('/api/companies');
  }

  async getStats(): Promise<ApiResponse<SystemStats>> {
    return this.request<SystemStats>('/api/stats');
  }

  // Compliance and similarity analysis methods
  async getReportCompliance(reportId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/${reportId}/compliance`);
  }

  async getDocumentSimilarity(vectorId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/documents/${vectorId}/similarity`);
  }

  // Generic GET method for additional endpoints
  async get(endpoint: string): Promise<ApiResponse<any>> {
    return this.request(endpoint);
  }

  // Pipeline control
  async runAnalysis(): Promise<ApiResponse<any>> {
    return this.request('/run_analysis', {
      method: 'POST',
    });
  }

  async getPipelineStatus(): Promise<ApiResponse<any>> {
    return this.request('/api/pipeline/status');
  }

  // Document analysis
  async analyzeDocuments(folder?: string): Promise<ApiResponse<any>> {
    const params = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    return this.request(`/api/documents/analyze${params}`);
  }
}

export const apiService = new ApiService();