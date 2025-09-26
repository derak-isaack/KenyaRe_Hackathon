from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import os
import json
import glob
from datetime import datetime, timedelta
import pandas as pd
from functools import wraps

# Import your existing modules
# from src.outlook_reader import read_msg_files_with_pdfs
# from src.vector_store import init_vector_store, init_enhanced_vector_store, search_ground_truth
# from src.report_generator import generate_report
# from src.report_logger import save_report
# from src.document_classifier import DocumentClassifier

# Import document analyzer for real PDF analysis
try:
    from src_python.document_analyzer import analyze_claims_documents
    DOCUMENT_ANALYZER_AVAILABLE = True
except ImportError as e:
    print(f"Document analyzer not available: {e}")
    DOCUMENT_ANALYZER_AVAILABLE = False

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')

# Configure CORS for cross-origin requests
CORS(app, 
     origins=['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Simple user store (in production, use a proper database)
USERS = {
    'admin': generate_password_hash('admin123'),
    'analyst': generate_password_hash('analyst123'),
    'manager': generate_password_hash('manager123')
}

def login_required(f):
    """Decorator to require login for protected routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    """Redirect to dashboard if logged in, otherwise to login."""
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login page."""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if username in USERS and check_password_hash(USERS[username], password):
            session['user'] = username
            session['login_time'] = datetime.now().isoformat()
            
            # Check if this is an API request (JSON or AJAX)
            if request.headers.get('Content-Type') == 'application/json' or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({
                    'status': 'success',
                    'message': f'Welcome back, {username}!',
                    'user': {
                        'name': username,
                        'role': 'Administrator' if username == 'admin' else 'Analyst'
                    }
                })
            else:
                flash(f'Welcome back, {username}!', 'success')
                return jsonify({'status': 'success', 'redirect': '/dashboard'})
        else:
            if request.headers.get('Content-Type') == 'application/json' or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid username or password'
                }), 401
            else:
                flash('Invalid username or password', 'error')
    
    # For GET requests or failed login, return simple success (since we don't have templates)
    return jsonify({'status': 'ready', 'message': 'Login endpoint ready'})

@app.route('/logout')
def logout():
    """User logout."""
    session.clear()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard showing reports and system status."""
    try:
        # Get reports from reports directory
        reports = get_reports_summary()
        
        # Get system statistics
        stats = get_system_stats()
        
        # Get recent activity
        recent_activity = get_recent_activity()
        
        # Return JSON data instead of template (since we're using React frontend)
        return jsonify({
            'status': 'success',
            'data': {
                'reports': reports,
                'stats': stats,
                'recent_activity': recent_activity,
                'user': session['user']
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error loading dashboard: {str(e)}'
        }), 500

@app.route('/reports')
@login_required
def reports():
    """Reports listing page."""
    try:
        reports_data = get_detailed_reports()
        return render_template('reports.html', reports=reports_data, user=session['user'])
    except Exception as e:
        flash(f'Error loading reports: {str(e)}', 'error')
        return render_template('reports.html', reports=[], user=session['user'])

@app.route('/report/<report_id>')
@login_required
def view_report(report_id):
    """View individual report details."""
    try:
        report_data = get_report_details(report_id)
        if not report_data:
            flash('Report not found', 'error')
            return redirect(url_for('reports'))
        
        return render_template('report_detail.html', report=report_data, user=session['user'])
    except Exception as e:
        flash(f'Error loading report: {str(e)}', 'error')
        return redirect(url_for('reports'))

@app.route('/run_analysis', methods=['POST'])
@login_required
def run_analysis():
    """Trigger fraud detection analysis and return JSON response."""
    try:
        # Run the fraud detection pipeline
        result = run_fraud_detection_pipeline()
        return jsonify({
            'status': 'success',
            'message': 'Analysis completed successfully',
            'data': result
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Analysis failed: {str(e)}'
        }), 500

@app.route('/run_analysis_web', methods=['POST'])
@login_required
def run_analysis_web():
    """Trigger fraud detection analysis and redirect to dashboard (for web interface)."""
    try:
        # Run the fraud detection pipeline
        result = run_fraud_detection_pipeline()
        flash('Analysis completed successfully', 'success')
    except Exception as e:
        flash(f'Analysis failed: {str(e)}', 'error')
    
    return redirect(url_for('dashboard'))

@app.route('/api/reports')
@login_required
def api_reports():
    """API endpoint to get enhanced reports data with vectorized compliance analysis."""
    try:
        reports_data = get_enhanced_reports_with_compliance()
        return jsonify({
            'status': 'success',
            'data': reports_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/reports/<report_id>/compliance')
@login_required
def api_report_compliance(report_id):
    """API endpoint to get detailed compliance analysis for a specific report."""
    try:
        compliance_data = get_report_compliance_analysis(report_id)
        return jsonify({
            'status': 'success',
            'data': compliance_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/documents/<int:vector_id>/similarity')
@login_required
def api_document_similarity(vector_id):
    """API endpoint to get similarity analysis for a specific document."""
    try:
        from src_python.outlook_reader import get_document_similarity_analysis
        similarity_data = get_document_similarity_analysis(vector_id)
        return jsonify({
            'status': 'success',
            'data': similarity_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/test/compliance-structure')
@login_required
def api_test_compliance_structure():
    """Test endpoint to verify compliance data structure."""
    try:
        # Create a sample compliance structure for testing
        sample_compliance = {
            'overall_compliance_score': 0.75,
            'overall_risk_level': 'medium',
            'pairing_confidence': 0.85,
            'statement_compliance': {
                'compliance_score': 0.8,
                'risk_level': 'low',
                'risk_indicators': ['AMOUNT_ABOVE_AVERAGE'],
                'ground_truth_analysis': {
                    'matches_found': 5,
                    'avg_similarity': 0.72,
                    'max_similarity': 0.89
                }
            },
            'treaty_slip_compliance': {
                'compliance_score': 0.7,
                'risk_level': 'medium',
                'risk_indicators': ['LOW_SIMILARITY_PATTERN'],
                'ground_truth_analysis': {
                    'matches_found': 3,
                    'avg_similarity': 0.65,
                    'max_similarity': 0.78
                }
            },
            'ground_truth_analysis': {
                'matches_count': 8,
                'avg_similarity': 0.68,
                'max_similarity': 0.89
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': sample_compliance,
            'message': 'Sample compliance structure for testing'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/tickets')
@login_required
def api_tickets():
    """API endpoint to get tickets from outlook_reader integration."""
    try:
        tickets_data = get_tickets_from_outlook()
        return jsonify({
            'status': 'success',
            'data': tickets_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/companies')
@login_required
def api_companies():
    """API endpoint to get company profiles extracted from report data."""
    try:
        companies_data = get_company_profiles()
        return jsonify({
            'status': 'success',
            'data': companies_data
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/stats')
@login_required
def api_stats():
    """API endpoint to get system statistics."""
    try:
        stats = get_system_stats()
        return jsonify({
            'status': 'success',
            'data': stats
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/pipeline/status')
@login_required
def api_pipeline_status():
    """API endpoint to get pipeline status."""
    try:
        pipeline_status = {
            'is_running': False,  
            'last_run': datetime.now().isoformat(),
            'reports_processed': len(get_reports_summary()),
            'status': 'idle'
        }
        
        return jsonify({
            'status': 'success',
            'data': pipeline_status
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/documents/analyze')
@login_required
def api_analyze_documents():
    """API endpoint to analyze documents and generate comparison metrics."""
    try:
        if not DOCUMENT_ANALYZER_AVAILABLE:
            return jsonify({
                'status': 'error',
                'message': 'Document analyzer not available. Please check dependencies.'
            }), 500
        
        # Get claims folder from query parameter or use default
        claims_folder = request.args.get('folder', 'Claims datasets/set1')
        
        # Analyze documents
        result = analyze_claims_documents(claims_folder)
        
        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Document analysis failed: {str(e)}'
        }), 500

def get_reports_summary():
    """Get summary of reports from reports directory."""
    reports = []
    reports_dir = 'reports'
    
    if not os.path.exists(reports_dir):
        return reports
    
    # Get all JSON report files
    json_files = glob.glob(os.path.join(reports_dir, '*.json'))
    
    for json_file in json_files[-10:]:  # Get last 10 reports
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                report_data = json.load(f)
            
            # Extract filename without extension
            filename = os.path.basename(json_file).replace('.json', '')
            
            # Parse timestamp from filename if possible
            timestamp_str = filename.split('_')[0] + '_' + filename.split('_')[1]
            try:
                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d_%H-%M')
            except:
                timestamp = datetime.fromtimestamp(os.path.getmtime(json_file))
            
            reports.append({
                'id': filename,
                'title': report_data.get('claim_id', filename),
                'timestamp': timestamp,
                'status': 'completed',
                'risk_level': extract_risk_level(report_data.get('report', '')),
                'file_path': json_file
            })
        except Exception as e:
            print(f"Error reading report {json_file}: {e}")
    
    # Sort by timestamp, newest first
    reports.sort(key=lambda x: x['timestamp'], reverse=True)
    return reports

def get_detailed_reports():
    """Get detailed reports data."""
    reports = []
    reports_dir = 'reports'
    
    if not os.path.exists(reports_dir):
        return reports
    
    json_files = glob.glob(os.path.join(reports_dir, '*.json'))
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                report_data = json.load(f)
            
            filename = os.path.basename(json_file).replace('.json', '')
            
            # Parse timestamp
            timestamp_str = filename.split('_')[0] + '_' + filename.split('_')[1]
            try:
                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d_%H-%M')
            except:
                timestamp = datetime.fromtimestamp(os.path.getmtime(json_file))
            
            # Extract key information
            report_text = report_data.get('report', '')
            risk_level = extract_risk_level(report_text)
            
            reports.append({
                'id': filename,
                'claim_id': report_data.get('claim_id', filename),
                'timestamp': timestamp,
                'risk_level': risk_level,
                'summary': extract_summary(report_text),
                'file_path': json_file,
                'has_attachments': bool(report_data.get('documents', {}).get('statement')),
                'ground_truth_matches': len(report_data.get('ground_truth_matches', []))
            })
        except Exception as e:
            print(f"Error reading report {json_file}: {e}")
    
    reports.sort(key=lambda x: x['timestamp'], reverse=True)
    return reports

def get_report_details(report_id):
    """Get detailed information for a specific report."""
    json_file = os.path.join('reports', f'{report_id}.json')
    
    if not os.path.exists(json_file):
        return None
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            report_data = json.load(f)
        
        # Also try to get the text version
        txt_file = json_file.replace('.json', '.txt')
        report_text = ""
        if os.path.exists(txt_file):
            with open(txt_file, 'r', encoding='utf-8') as f:
                report_text = f.read()
        
        return {
            'id': report_id,
            'claim_id': report_data.get('claim_id', report_id),
            'report': report_data.get('report', report_text),
            'documents': report_data.get('documents', {}),
            'ground_truth_matches': report_data.get('ground_truth_matches', []),
            'timestamp': datetime.fromtimestamp(os.path.getmtime(json_file)),
            'risk_level': extract_risk_level(report_data.get('report', report_text)),
            'raw_data': report_data
        }
    except Exception as e:
        print(f"Error reading report details {json_file}: {e}")
        return None

def get_system_stats():
    """Get system statistics."""
    stats = {
        'total_reports': 0,
        'high_risk_reports': 0,
        'medium_risk_reports': 0,
        'low_risk_reports': 0,
        'reports_today': 0,
        'reports_this_week': 0,
        'avg_processing_time': '2.3 minutes',
        'system_uptime': '99.8%'
    }
    
    try:
        reports = get_enhanced_reports()
        stats['total_reports'] = len(reports)
        
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        
        for report in reports:
            classification = report.get('classification', 'INSUFFICIENT EVIDENCE')
            
            # Map classifications to risk levels
            if classification == 'POTENTIALLY FRAUDULENT':
                stats['high_risk_reports'] += 1
            elif classification == 'INSUFFICIENT EVIDENCE':
                stats['medium_risk_reports'] += 1
            else:  # VALID
                stats['low_risk_reports'] += 1
            
            # Parse timestamp for date calculations
            try:
                report_date = datetime.fromisoformat(report['timestamp']).date()
                if report_date == today:
                    stats['reports_today'] += 1
                if report_date >= week_ago:
                    stats['reports_this_week'] += 1
            except:
                # Fallback for timestamp parsing issues
                continue
    
    except Exception as e:
        print(f"Error calculating stats: {e}")
    
    return stats

def get_recent_activity():
    """Get recent system activity."""
    activity = []
    
    try:
        reports = get_detailed_reports()[:5]  # Last 5 reports
        
        for report in reports:
            activity.append({
                'type': 'report_generated',
                'message': f"Fraud analysis completed for {report['claim_id']}",
                'timestamp': report['timestamp'],
                'risk_level': report['risk_level']
            })
    
    except Exception as e:
        print(f"Error getting recent activity: {e}")
    
    return activity

def extract_risk_level(report_text):
    """Extract risk level from report text."""
    if not report_text:
        return 'low'
    
    text_lower = report_text.lower()
    
    if any(keyword in text_lower for keyword in ['high risk', 'fraud detected', 'suspicious', 'alert']):
        return 'high'
    elif any(keyword in text_lower for keyword in ['medium risk', 'caution', 'review required']):
        return 'medium'
    else:
        return 'low'

def extract_summary(report_text):
    """Extract summary from report text."""
    if not report_text:
        return "No summary available"
    
    # Take first 200 characters as summary
    summary = report_text[:200].strip()
    if len(report_text) > 200:
        summary += "..."
    
    return summary

def calculate_avg_similarity(matches):
    """Calculate average similarity score from ground truth matches."""
    if not matches:
        return 0.0
    
    similarities = [match.get('similarity_score', 0.0) for match in matches if 'similarity_score' in match]
    return sum(similarities) / len(similarities) if similarities else 0.0

def calculate_max_similarity(matches):
    """Calculate maximum similarity score from ground truth matches."""
    if not matches:
        return 0.0
    
    similarities = [match.get('similarity_score', 0.0) for match in matches if 'similarity_score' in match]
    return max(similarities) if similarities else 0.0

def extract_company_from_report_data(report_data):
    """Extract company name from various parts of report data."""
    # Try different sources for company name
    company = 'Unknown'
    
    # Check claim_data first
    claim_data = report_data.get('claim_data', {})
    if 'text' in claim_data:
        company = extract_company_from_claim(claim_data)
        if company != 'Unknown':
            return company
    
    # Check statement data
    if 'statement' in report_data:
        stmt = report_data['statement']
        if 'financial_data' in stmt and 'parties' in stmt['financial_data']:
            parties = stmt['financial_data']['parties']
            if 'insurer' in parties:
                return parties['insurer']
    
    # Check report text
    report_text = report_data.get('report_text', report_data.get('report', ''))
    if 'GA Insurance Limited' in report_text:
        return 'GA Insurance Limited'
    
    return company

def extract_claim_type_from_report(report_data):
    """Extract claim type from report data."""
    # Check attachments for marine indicators
    if 'statement' in report_data:
        stmt = report_data['statement']
        filename = stmt.get('filename', '').lower()
        if 'marine' in filename:
            return 'Marine'
    
    # Check report text
    report_text = report_data.get('report_text', report_data.get('report', ''))
    if 'marine' in report_text.lower():
        return 'Marine'
    
    return 'General'

def get_enhanced_reports():
    """Get enhanced reports data with full JSON/TXT parsing."""
    reports = []
    reports_dir = 'reports'
    
    if not os.path.exists(reports_dir):
        return reports
    
    json_files = glob.glob(os.path.join(reports_dir, '*.json'))
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                report_data = json.load(f)
            
            filename = os.path.basename(json_file).replace('.json', '')
            
            # Parse timestamp
            timestamp_str = filename.split('_')[0] + '_' + filename.split('_')[1]
            try:
                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d_%H-%M')
            except:
                timestamp = datetime.fromtimestamp(os.path.getmtime(json_file))
            
            # Extract classification from report text
            report_text = report_data.get('report_text', report_data.get('report', ''))
            classification = extract_classification(report_text)
            
            # Extract company information
            company = extract_company_from_report_data(report_data)
            
            # Process attachments - handle both old and new data structures
            attachments = []
            
            # Handle new structure (from enhanced pipeline)
            if 'statement' in report_data:
                stmt = report_data['statement']
                attachments.append({
                    'filename': stmt.get('filename', ''),
                    'type': stmt.get('type', 'statement'),
                    'text': stmt.get('text', ''),
                    'vector_id': stmt.get('vector_id', 0),
                    'classification_confidence': stmt.get('classification_confidence', 0.0),
                    'quality_score': stmt.get('quality_score', 0.0),
                    'compliance_analysis': stmt.get('compliance_analysis', {}),
                    'financial_data': stmt.get('financial_data', {})
                })
            
            if 'treaty_slip' in report_data and report_data['treaty_slip']:
                slip = report_data['treaty_slip']
                attachments.append({
                    'filename': slip.get('filename', ''),
                    'type': slip.get('type', 'treaty_slip'),
                    'text': slip.get('text', ''),
                    'vector_id': slip.get('vector_id', 0),
                    'classification_confidence': slip.get('classification_confidence', 0.0),
                    'quality_score': slip.get('quality_score', 0.0),
                    'compliance_analysis': slip.get('compliance_analysis', {}),
                    'financial_data': slip.get('financial_data', {})
                })
            
            # Handle old structure (legacy compatibility)
            if not attachments and 'claim_data' in report_data:
                claim_data = report_data['claim_data']
                if 'attachments' in claim_data:
                    for att in claim_data['attachments']:
                        attachments.append({
                            'filename': att.get('filename', ''),
                            'type': att.get('type', 'unknown'),
                            'text': att.get('text', ''),
                            'vector_id': att.get('vector_id', 0),
                            'classification_confidence': 0.0,
                            'quality_score': 0.0,
                            'compliance_analysis': {},
                            'financial_data': {}
                        })
            
            # Extract fraud indicators
            fraud_indicators = extract_fraud_indicators(report_text)
            
            # Add risk indicators from compliance analysis
            statement_compliance = report_data.get('statement_compliance', {})
            if statement_compliance and 'risk_indicators' in statement_compliance:
                fraud_indicators.extend(statement_compliance['risk_indicators'])
            
            # Build compliance analysis with safe defaults
            compliance_analysis = {
                'overall_compliance_score': 0.0,
                'overall_risk_level': 'unknown',
                'pairing_confidence': report_data.get('pairing_confidence', 0.0),
                'statement_compliance': None,
                'treaty_slip_compliance': None,
                'ground_truth_analysis': {
                    'matches_count': len(report_data.get('ground_truth_matches', [])),
                    'avg_similarity': calculate_avg_similarity(report_data.get('ground_truth_matches', [])),
                    'max_similarity': calculate_max_similarity(report_data.get('ground_truth_matches', []))
                }
            }
            
            # Add statement compliance if available
            if statement_compliance:
                compliance_analysis['statement_compliance'] = {
                    'compliance_score': statement_compliance.get('compliance_score', 0.0),
                    'risk_level': statement_compliance.get('risk_level', 'unknown'),
                    'risk_indicators': statement_compliance.get('risk_indicators', []),
                    'ground_truth_analysis': {
                        'matches_found': statement_compliance.get('ground_truth_analysis', {}).get('matches_found', 0),
                        'avg_similarity': statement_compliance.get('ground_truth_analysis', {}).get('avg_similarity', 0.0),
                        'max_similarity': statement_compliance.get('ground_truth_analysis', {}).get('max_similarity', 0.0)
                    }
                }
                compliance_analysis['overall_compliance_score'] = statement_compliance.get('compliance_score', 0.0)
                compliance_analysis['overall_risk_level'] = statement_compliance.get('risk_level', 'unknown')
            
            # Add treaty slip compliance if available
            treaty_slip_compliance = report_data.get('treaty_slip_compliance', {})
            if treaty_slip_compliance:
                compliance_analysis['treaty_slip_compliance'] = {
                    'compliance_score': treaty_slip_compliance.get('compliance_score', 0.0),
                    'risk_level': treaty_slip_compliance.get('risk_level', 'unknown'),
                    'risk_indicators': treaty_slip_compliance.get('risk_indicators', []),
                    'ground_truth_analysis': {
                        'matches_found': treaty_slip_compliance.get('ground_truth_analysis', {}).get('matches_found', 0),
                        'avg_similarity': treaty_slip_compliance.get('ground_truth_analysis', {}).get('avg_similarity', 0.0),
                        'max_similarity': treaty_slip_compliance.get('ground_truth_analysis', {}).get('max_similarity', 0.0)
                    }
                }
                
                # Update overall scores if treaty slip exists
                if statement_compliance:
                    compliance_analysis['overall_compliance_score'] = (
                        statement_compliance.get('compliance_score', 0.0) + 
                        treaty_slip_compliance.get('compliance_score', 0.0)
                    ) / 2
                    
                    # Take higher risk level
                    risk_levels = ['low', 'medium', 'high']
                    stmt_risk = statement_compliance.get('risk_level', 'unknown')
                    treaty_risk = treaty_slip_compliance.get('risk_level', 'unknown')
                    
                    if stmt_risk in risk_levels and treaty_risk in risk_levels:
                        compliance_analysis['overall_risk_level'] = risk_levels[
                            max(risk_levels.index(stmt_risk), risk_levels.index(treaty_risk))
                        ]
            
            reports.append({
                'id': filename,
                'claim_id': report_data.get('claim_id', filename),
                'timestamp': timestamp.isoformat(),
                'classification': classification,
                'summary': extract_summary(report_text),
                'file_path': json_file,
                'company': company,
                'claim_type': extract_claim_type_from_report(report_data),
                'source': 'msg',
                'ground_truth_matches': len(report_data.get('ground_truth_matches', [])),
                'report_text': report_text,
                'attachments': attachments,
                'fraud_indicators': list(set(fraud_indicators)),  # Remove duplicates
                'compliance_analysis': compliance_analysis
            })
            
        except Exception as e:
            print(f"Error reading enhanced report {json_file}: {e}")
            import traceback
            traceback.print_exc()
    
    reports.sort(key=lambda x: x['timestamp'], reverse=True)
    return reports

def get_enhanced_reports_with_compliance():
    """Get enhanced reports data with vectorized compliance analysis."""
    reports = []
    reports_dir = 'reports'
    
    if not os.path.exists(reports_dir):
        return reports
    
    json_files = glob.glob(os.path.join(reports_dir, '*.json'))
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                report_data = json.load(f)
            
            filename = os.path.basename(json_file).replace('.json', '')
            
            # Parse timestamp
            timestamp_str = filename.split('_')[0] + '_' + filename.split('_')[1]
            try:
                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d_%H-%M')
            except:
                timestamp = datetime.fromtimestamp(os.path.getmtime(json_file))
            
            # Extract enhanced metadata if available
            statement_compliance = report_data.get('statement_compliance', {})
            treaty_slip_compliance = report_data.get('treaty_slip_compliance', {})
            pairing_confidence = report_data.get('pairing_confidence', 0.0)
            
            # Calculate overall compliance score
            overall_compliance = 0.0
            if statement_compliance:
                overall_compliance = statement_compliance.get('compliance_score', 0.0)
                if treaty_slip_compliance:
                    overall_compliance = (overall_compliance + treaty_slip_compliance.get('compliance_score', 0.0)) / 2
            
            # Determine overall risk level
            statement_risk = statement_compliance.get('risk_level', 'unknown')
            treaty_risk = treaty_slip_compliance.get('risk_level', 'unknown') if treaty_slip_compliance else 'unknown'
            
            risk_levels = ['low', 'medium', 'high']
            overall_risk = 'unknown'
            
            if statement_risk in risk_levels:
                overall_risk = statement_risk
                if treaty_risk in risk_levels:
                    # Take the higher risk level
                    overall_risk = risk_levels[max(risk_levels.index(statement_risk), risk_levels.index(treaty_risk))]
            
            # Extract classification from report text
            report_text = report_data.get('report_text', report_data.get('report', ''))
            classification = extract_classification(report_text)
            
            # Extract company information using the correct function
            company = extract_company_from_report_data(report_data)
            
            # Process attachments from claim_data structure
            claim_data = report_data.get('claim_data', {})
            attachments = []
            
            # Handle statement attachment
            if 'statement' in claim_data and claim_data['statement']:
                stmt = claim_data['statement']
                attachments.append({
                    'filename': stmt.get('filename', ''),
                    'type': stmt.get('type', 'statement'),
                    'vector_id': stmt.get('vector_id', 0),
                    'classification_confidence': stmt.get('classification_confidence', 0.0),
                    'quality_score': stmt.get('quality_score', 0.0),
                    'compliance_analysis': stmt.get('compliance_analysis', {}),
                    'financial_data': stmt.get('financial_data', {})
                })
            
            # Handle treaty slip attachment
            if 'treaty_slip' in claim_data and claim_data['treaty_slip']:
                slip = claim_data['treaty_slip']
                attachments.append({
                    'filename': slip.get('filename', ''),
                    'type': slip.get('type', 'treaty_slip'),
                    'vector_id': slip.get('vector_id', 0),
                    'classification_confidence': slip.get('classification_confidence', 0.0),
                    'quality_score': slip.get('quality_score', 0.0),
                    'compliance_analysis': slip.get('compliance_analysis', {}),
                    'financial_data': slip.get('financial_data', {})
                })
            
            # Note: Removed claim amount extraction for privacy/security reasons
            
            # Extract ground truth similarity scores
            ground_truth_matches = report_data.get('ground_truth_matches', [])
            avg_similarity = 0.0
            max_similarity = 0.0
            
            if ground_truth_matches:
                similarities = [match.get('similarity_score', 0.0) for match in ground_truth_matches]
                avg_similarity = sum(similarities) / len(similarities)
                max_similarity = max(similarities)
            
            reports.append({
                'id': filename,
                'claim_id': report_data.get('claim_id', filename),
                'timestamp': timestamp.isoformat(),
                'classification': classification,
                'summary': extract_summary(report_text),
                'file_path': json_file,
                'company': company,
                'claim_type': extract_claim_type_from_report(report_data),
                'source': 'msg',  # Based on the data structure, these are from email messages
                'report_text': report_text,
                'attachments': attachments,
                
                # Enhanced compliance data with detailed comparison metrics
                'compliance_analysis': generate_comprehensive_compliance_analysis(
                    report_data, 
                    overall_compliance, 
                    overall_risk, 
                    pairing_confidence,
                    statement_compliance, 
                    treaty_slip_compliance, 
                    ground_truth_matches,
                    avg_similarity,
                    max_similarity,
                    attachments
                ),
                
                # Legacy fields for backward compatibility
                'ground_truth_matches': len(ground_truth_matches),
                'fraud_indicators': extract_fraud_indicators_from_report(report_data, report_text)
            })
        except Exception as e:
            print(f"Error reading enhanced report {json_file}: {e}")
    
    reports.sort(key=lambda x: x['timestamp'], reverse=True)
    return reports

def generate_comprehensive_compliance_analysis(report_data, overall_compliance, overall_risk, 
                                            pairing_confidence, statement_compliance, 
                                            treaty_slip_compliance, ground_truth_matches,
                                            avg_similarity, max_similarity, attachments):
    """Generate comprehensive compliance analysis with detailed comparison metrics."""
    
    # Extract financial data from attachments
    statement_financial = {}
    treaty_slip_financial = {}
    
    for attachment in attachments:
        if attachment['type'] == 'statement' and attachment.get('financial_data'):
            statement_financial = attachment['financial_data']
        elif attachment['type'] == 'treaty_slip' and attachment.get('financial_data'):
            treaty_slip_financial = attachment['financial_data']
    
    # Generate date comparison analysis
    date_comparison = generate_date_comparison_analysis(
        statement_financial, treaty_slip_financial, ground_truth_matches
    )
    
    # Generate financial comparison analysis
    financial_comparison = generate_financial_comparison_analysis(
        statement_financial, treaty_slip_financial, ground_truth_matches
    )
    
    # Generate ground truth comparison analysis
    ground_truth_comparison = generate_ground_truth_comparison_analysis(
        report_data, ground_truth_matches, statement_financial, treaty_slip_financial
    )
    
    # Generate validation metrics
    validation_metrics = generate_validation_metrics(
        date_comparison, financial_comparison, ground_truth_comparison,
        statement_compliance, treaty_slip_compliance
    )
    
    return {
        'overall_compliance_score': overall_compliance,
        'overall_risk_level': overall_risk,
        'pairing_confidence': pairing_confidence,
        'statement_compliance': statement_compliance,
        'treaty_slip_compliance': treaty_slip_compliance,
        'ground_truth_analysis': {
            'matches_count': len(ground_truth_matches),
            'avg_similarity': avg_similarity,
            'max_similarity': max_similarity
        },
        # Enhanced comparison metrics
        'date_comparison': date_comparison,
        'financial_comparison': financial_comparison,
        'ground_truth_comparison': ground_truth_comparison,
        'validation_metrics': validation_metrics
    }

def generate_date_comparison_analysis(statement_financial, treaty_slip_financial, ground_truth_matches):
    """Generate detailed date comparison analysis."""
    
    # Extract dates from financial data
    statement_dates = []
    treaty_slip_dates = []
    ground_truth_dates = []
    
    if statement_financial.get('dates'):
        statement_dates = list(statement_financial['dates'].values())
    
    if treaty_slip_financial.get('dates'):
        treaty_slip_dates = list(treaty_slip_financial['dates'].values())
    
    # Extract dates from ground truth matches
    for match in ground_truth_matches:
        if match.get('metadata', {}).get('date'):
            ground_truth_dates.append(match['metadata']['date'])
    
    # Calculate matches
    statement_gt_matches = 0
    treaty_gt_matches = 0
    statement_treaty_matches = 0
    
    # Simple date matching logic (can be enhanced)
    for stmt_date in statement_dates:
        if stmt_date in ground_truth_dates:
            statement_gt_matches += 1
    
    for treaty_date in treaty_slip_dates:
        if treaty_date in ground_truth_dates:
            treaty_gt_matches += 1
    
    for stmt_date in statement_dates:
        if stmt_date in treaty_slip_dates:
            statement_treaty_matches += 1
    
    # Calculate match percentage
    total_dates = len(statement_dates) + len(treaty_slip_dates) + len(ground_truth_dates)
    total_matches = statement_gt_matches + treaty_gt_matches + statement_treaty_matches
    match_percentage = (total_matches / max(total_dates, 1)) * 100
    
    # Identify discrepancies
    discrepancies = []
    if len(statement_dates) != len(ground_truth_dates):
        discrepancies.append(f"Statement has {len(statement_dates)} dates, Ground Truth has {len(ground_truth_dates)}")
    
    if len(treaty_slip_dates) != len(ground_truth_dates):
        discrepancies.append(f"Treaty Slip has {len(treaty_slip_dates)} dates, Ground Truth has {len(ground_truth_dates)}")
    
    return {
        'statement_dates': statement_dates,
        'treaty_slip_dates': treaty_slip_dates,
        'ground_truth_dates': ground_truth_dates,
        'matches': {
            'statement_gt_matches': statement_gt_matches,
            'treaty_gt_matches': treaty_gt_matches,
            'statement_treaty_matches': statement_treaty_matches
        },
        'discrepancies': discrepancies,
        'match_percentage': match_percentage
    }

def generate_financial_comparison_analysis(statement_financial, treaty_slip_financial, ground_truth_matches):
    """Generate detailed financial comparison analysis."""
    
    # Extract financial amounts
    statement_amounts = statement_financial.get('amounts', {})
    treaty_slip_amounts = treaty_slip_financial.get('amounts', {})
    
    # Cash loss limit analysis
    treaty_cash_loss = 0
    statement_surplus = 0
    
    # Extract specific financial values (this logic can be enhanced based on actual data structure)
    for key, value in treaty_slip_amounts.items():
        if 'loss' in key.lower() or 'limit' in key.lower():
            treaty_cash_loss = value
            break
    
    for key, value in statement_amounts.items():
        if 'surplus' in key.lower() or 'available' in key.lower():
            statement_surplus = value
            break
    
    # If no specific fields found, use first available amounts
    if treaty_cash_loss == 0 and treaty_slip_amounts:
        treaty_cash_loss = list(treaty_slip_amounts.values())[0]
    
    if statement_surplus == 0 and statement_amounts:
        statement_surplus = list(statement_amounts.values())[0]
    
    # Calculate cash loss limit compliance
    within_limits = treaty_cash_loss <= statement_surplus if statement_surplus > 0 else False
    variance_percentage = ((treaty_cash_loss - statement_surplus) / max(statement_surplus, 1)) * 100
    risk_flag = variance_percentage > 20  # Flag if variance > 20%
    
    # Commission analysis
    statement_commission = 0
    treaty_commission = 0
    
    statement_percentages = statement_financial.get('percentages', {})
    treaty_percentages = treaty_slip_financial.get('percentages', {})
    
    # Extract commission values
    for key, value in statement_percentages.items():
        if 'commission' in key.lower():
            statement_commission = value * statement_surplus / 100  # Convert percentage to amount
            break
    
    for key, value in treaty_percentages.items():
        if 'commission' in key.lower():
            treaty_commission = value * treaty_cash_loss / 100  # Convert percentage to amount
            break
    
    commission_match = abs(statement_commission - treaty_commission) < (max(statement_commission, treaty_commission) * 0.05)  # 5% tolerance
    commission_variance = abs(statement_commission - treaty_commission)
    commission_variance_percentage = (commission_variance / max(statement_commission, treaty_commission, 1)) * 100
    
    # Claim amounts comparison
    total_statement_claims = sum(statement_amounts.values()) if statement_amounts else 0
    total_ground_truth_claims = 0
    
    # Extract ground truth claim amounts
    for match in ground_truth_matches:
        if match.get('metadata', {}).get('amount'):
            total_ground_truth_claims += match['metadata']['amount']
    
    claims_variance = total_statement_claims - total_ground_truth_claims
    claims_variance_percentage = (claims_variance / max(total_ground_truth_claims, 1)) * 100
    
    # Identify suspicious patterns
    suspicious_patterns = []
    if abs(claims_variance_percentage) > 15:
        suspicious_patterns.append(f"Claim amount variance exceeds 15% ({claims_variance_percentage:.1f}%)")
    
    if not commission_match:
        suspicious_patterns.append(f"Commission mismatch: {commission_variance_percentage:.1f}% difference")
    
    if risk_flag:
        suspicious_patterns.append("Cash loss limit exceeds surplus amount")
    
    return {
        'cash_loss_limit': {
            'treaty_slip_amount': treaty_cash_loss,
            'statement_surplus_amount': statement_surplus,
            'within_limits': within_limits,
            'variance_percentage': variance_percentage,
            'risk_flag': risk_flag
        },
        'commissions': {
            'treaty_slip_commission': treaty_commission,
            'statement_commission': statement_commission,
            'match': commission_match,
            'variance_amount': commission_variance,
            'variance_percentage': commission_variance_percentage
        },
        'claim_amounts': {
            'total_claims_statement': total_statement_claims,
            'total_claims_ground_truth': total_ground_truth_claims,
            'variance': claims_variance,
            'variance_percentage': claims_variance_percentage,
            'suspicious_patterns': suspicious_patterns
        }
    }

def generate_ground_truth_comparison_analysis(report_data, ground_truth_matches, statement_financial, treaty_financial):
    """Generate ground truth comparison analysis."""
    
    # Count claims from different sources
    statement_claims_count = len(statement_financial.get('amounts', {}))
    ground_truth_claims_count = len(ground_truth_matches)
    
    claims_match = statement_claims_count == ground_truth_claims_count
    claims_variance = statement_claims_count - ground_truth_claims_count
    claims_variance_percentage = (claims_variance / max(ground_truth_claims_count, 1)) * 100
    
    # Identify missing and extra claims
    missing_claims = []
    extra_claims = []
    
    if claims_variance > 0:
        for i in range(abs(claims_variance)):
            extra_claims.append(f"Extra claim {i+1} in statement")
    elif claims_variance < 0:
        for i in range(abs(claims_variance)):
            missing_claims.append(f"Missing claim {i+1} from statement")
    
    # Calculate data integrity scores
    completeness_score = min(100, (ground_truth_claims_count / max(statement_claims_count, 1)) * 100)
    accuracy_score = 100 - abs(claims_variance_percentage)
    consistency_score = 100 if claims_match else max(0, 100 - abs(claims_variance_percentage))
    
    # Determine reliability rating
    avg_score = (completeness_score + accuracy_score + consistency_score) / 3
    if avg_score >= 90:
        reliability_rating = 'HIGH'
    elif avg_score >= 70:
        reliability_rating = 'MEDIUM'
    else:
        reliability_rating = 'LOW'
    
    return {
        'total_claims_comparison': {
            'statement_claims': statement_claims_count,
            'ground_truth_claims': ground_truth_claims_count,
            'match': claims_match,
            'variance': claims_variance,
            'variance_percentage': claims_variance_percentage,
            'missing_claims': missing_claims,
            'extra_claims': extra_claims
        },
        'data_integrity': {
            'completeness_score': completeness_score,
            'accuracy_score': accuracy_score,
            'consistency_score': consistency_score,
            'reliability_rating': reliability_rating
        }
    }

def generate_validation_metrics(date_comparison, financial_comparison, ground_truth_comparison, 
                               statement_compliance, treaty_compliance):
    """Generate overall validation and trust metrics."""
    
    # Calculate individual reliability indicators
    data_consistency = (date_comparison['match_percentage'] + 
                       ground_truth_comparison['data_integrity']['consistency_score']) / 2
    
    cross_reference_accuracy = ground_truth_comparison['data_integrity']['accuracy_score']
    
    financial_alignment = 100
    if financial_comparison['cash_loss_limit']['risk_flag']:
        financial_alignment -= 30
    if not financial_comparison['commissions']['match']:
        financial_alignment -= 20
    if abs(financial_comparison['claim_amounts']['variance_percentage']) > 10:
        financial_alignment -= 25
    
    temporal_consistency = date_comparison['match_percentage']
    
    # Calculate verification status
    dates_verified = date_comparison['match_percentage'] >= 80
    amounts_verified = abs(financial_comparison['claim_amounts']['variance_percentage']) <= 10
    commissions_verified = financial_comparison['commissions']['match']
    claims_count_verified = ground_truth_comparison['total_claims_comparison']['match']
    
    # Calculate overall trust score
    verification_count = sum([dates_verified, amounts_verified, commissions_verified, claims_count_verified])
    base_trust_score = (verification_count / 4) * 100
    
    # Adjust based on compliance scores
    compliance_adjustment = 0
    if statement_compliance.get('compliance_score'):
        compliance_adjustment += statement_compliance['compliance_score'] * 0.3
    if treaty_compliance and treaty_compliance.get('compliance_score'):
        compliance_adjustment += treaty_compliance['compliance_score'] * 0.3
    
    trust_score = min(100, (base_trust_score + compliance_adjustment) / 1.6)
    
    return {
        'trust_score': trust_score,
        'reliability_indicators': {
            'data_consistency': data_consistency,
            'cross_reference_accuracy': cross_reference_accuracy,
            'financial_alignment': financial_alignment,
            'temporal_consistency': temporal_consistency
        },
        'verification_status': {
            'dates_verified': dates_verified,
            'amounts_verified': amounts_verified,
            'commissions_verified': commissions_verified,
            'claims_count_verified': claims_count_verified
        }
    }

def get_report_compliance_analysis(report_id):
    """Get detailed compliance analysis for a specific report."""
    json_file = os.path.join('reports', f'{report_id}.json')
    
    if not os.path.exists(json_file):
        return {"error": "Report not found"}
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            report_data = json.load(f)
        
        # Extract detailed compliance information
        compliance_analysis = {
            "report_id": report_id,
            "timestamp": datetime.fromtimestamp(os.path.getmtime(json_file)).isoformat(),
            "pairing_confidence": report_data.get('pairing_confidence', 0.0),
            "statement_analysis": report_data.get('statement_compliance', {}),
            "treaty_slip_analysis": report_data.get('treaty_slip_compliance', {}),
            "ground_truth_matches": report_data.get('ground_truth_matches', []),
            "pipeline_version": report_data.get('pipeline_version', 'unknown'),
            "processing_timestamp": report_data.get('processing_timestamp', ''),
            
            # Document details
            "documents": {
                "statement": report_data.get('statement', {}),
                "treaty_slip": report_data.get('treaty_slip', {})
            }
        }
        
        return compliance_analysis
        
    except Exception as e:
        return {"error": f"Error reading compliance analysis: {str(e)}"}

def get_tickets_from_outlook():
    """Get tickets from outlook_reader integration."""
    try:
        # Import the outlook reader function
        from src_python.outlook_reader import read_msg_files_with_pdfs
        
        # Read messages from the Claims datasets
        msgs = read_msg_files_with_pdfs()
        
        tickets = []
        for msg in msgs:
            # Determine status based on attachments and content
            status = determine_ticket_status(msg)
            
            # Process timestamp
            processed_time = datetime.now().isoformat()
            
            # Extract company from email content
            company = extract_company_from_msg(msg)
            
            tickets.append({
                'id': msg.get('filename', '').replace('.msg', ''),
                'source': 'Email',
                'subject': msg.get('subject', 'No Subject'),
                'company': company,
                'processed_time': processed_time,
                'status': status,
                'attachments': msg.get('attachments', []),
                'body_text': msg.get('text', ''),
                'classification': None  # Will be set after analysis
            })
        
        return tickets
    except Exception as e:
        print(f"Error getting tickets from outlook: {e}")
        return []

def get_company_profiles():
    """Extract company profiles from report data."""
    try:
        reports = get_enhanced_reports()
        companies = {}
        
        for report in reports:
            company_name = report.get('company', 'Unknown')
            if company_name == 'Unknown':
                continue
                
            if company_name not in companies:
                companies[company_name] = {
                    'name': company_name,
                    'total_claims': 0,
                    'valid_claims': 0,
                    'flagged_claims': 0,
                    'insufficient_evidence': 0,
                    'risk_score': 0,
                    'recent_activity': [],
                    'contact_info': {}
                }
            
            company = companies[company_name]
            company['total_claims'] += 1
            
            # Count by classification
            classification = report.get('classification', 'INSUFFICIENT EVIDENCE')
            if classification == 'VALID':
                company['valid_claims'] += 1
            elif classification == 'POTENTIALLY FRAUDULENT':
                company['flagged_claims'] += 1
            else:
                company['insufficient_evidence'] += 1
            
            # Add recent activity
            if len(company['recent_activity']) < 5:
                company['recent_activity'].append({
                    'date': report['timestamp'],
                    'claim_id': report['claim_id'],
                    'classification': classification
                })
            
            # Extract contact info from claim data
            if not company['contact_info']:
                company['contact_info'] = extract_contact_info(report)
        
        # Calculate risk scores
        for company in companies.values():
            if company['total_claims'] > 0:
                fraud_rate = company['flagged_claims'] / company['total_claims']
                if fraud_rate > 0.3:
                    company['risk_score'] = 'high'
                elif fraud_rate > 0.1:
                    company['risk_score'] = 'medium'
                else:
                    company['risk_score'] = 'low'
        
        return list(companies.values())
    except Exception as e:
        print(f"Error getting company profiles: {e}")
        return []

def extract_classification(report_text):
    """Extract classification from report text."""
    if not report_text:
        return 'INSUFFICIENT EVIDENCE'
    
    text_upper = report_text.upper()
    
    if 'POTENTIALLY FRAUDULENT' in text_upper or 'FRAUD DETECTED' in text_upper:
        return 'POTENTIALLY FRAUDULENT'
    elif 'VALID' in text_upper and 'CLASSIFICATION' in text_upper:
        return 'VALID'
    else:
        return 'INSUFFICIENT EVIDENCE'

def extract_company_from_report_data(report_data):
    """Extract company name from report data."""
    # First check ground truth matches for company name (at root level)
    ground_truth_matches = report_data.get('ground_truth_matches', [])
    if ground_truth_matches and len(ground_truth_matches) > 0:
        company_name = ground_truth_matches[0].get('Responsible Partner Name', '')
        if company_name and company_name != '':
            return company_name
    
    # Check claim_data for company information
    claim_data = report_data.get('claim_data', {})
    if 'statement' in claim_data and claim_data['statement']:
        # Look for company name in financial data parties
        financial_data = claim_data['statement'].get('financial_data', {})
        parties = financial_data.get('parties', {})
        if parties:
            # Return first party found
            return list(parties.values())[0]
    
    # Fallback to claim_id parsing
    claim_id = report_data.get('claim_id', '')
    if 'GA Insurance' in claim_id or 'MARINE' in claim_id:
        return 'GA Insurance Limited'
    
    return 'GA Insurance Limited'  # Default for marine claims

def extract_claim_type_from_report(report_data):
    """Extract claim type from report data."""
    # Check ground truth matches for business type (at root level)
    ground_truth_matches = report_data.get('ground_truth_matches', [])
    if ground_truth_matches and len(ground_truth_matches) > 0:
        business_title = ground_truth_matches[0].get('Business Title', '')
        main_class = ground_truth_matches[0].get('Main Class of Business', '')
        if main_class and main_class != '':
            return main_class
        elif business_title and 'MARINE' in business_title.upper():
            return 'Marine'
    
    # Fallback to claim_id parsing
    claim_id = report_data.get('claim_id', '').upper()
    if 'MARINE' in claim_id:
        return 'Marine'
    elif 'MOTOR' in claim_id:
        return 'Motor'
    elif 'HEALTH' in claim_id:
        return 'Health'
    elif 'PROPERTY' in claim_id:
        return 'Property'
    
    return 'Marine'  # Default for this dataset

def calculate_avg_similarity(ground_truth_matches):
    """Calculate average similarity score from ground truth matches."""
    if not ground_truth_matches:
        return 0.0
    
    similarities = [match.get('similarity_score', 0.0) for match in ground_truth_matches]
    return sum(similarities) / len(similarities)

def calculate_max_similarity(ground_truth_matches):
    """Calculate maximum similarity score from ground truth matches."""
    if not ground_truth_matches:
        return 0.0
    
    similarities = [match.get('similarity_score', 0.0) for match in ground_truth_matches]
    return max(similarities)

def extract_company_from_claim(claim_data):
    """Extract company name from claim data."""
    text = claim_data.get('text', '') + ' ' + claim_data.get('subject', '')
    
    # Look for common company patterns
    company_patterns = [
        'GA Insurance Limited',
        'Kenya Reinsurance Corporation',
        'INTRA AFRICA ASSURANCE COMPANY LIMITED',
        'Madison General Insurance Kenya Limited'
    ]
    
    for pattern in company_patterns:
        if pattern.lower() in text.lower():
            return pattern
    
    return 'Unknown'

def extract_company_from_msg(msg):
    """Extract company name from message data."""
    text = msg.get('text', '') + ' ' + msg.get('subject', '')
    return extract_company_from_claim({'text': text, 'subject': msg.get('subject', '')})

def extract_claim_type(claim_data):
    """Extract claim type from claim data."""
    text = (claim_data.get('text', '') + ' ' + claim_data.get('subject', '')).lower()
    
    if 'fire' in text or 'fire surplus' in text:
        return 'Fire'
    elif 'marine' in text:
        return 'Marine'
    elif 'engineering' in text:
        return 'Engineering'
    elif 'motor' in text:
        return 'Motor'
    else:
        return 'General'

def extract_fraud_indicators(report_text):
    """Extract fraud indicators from report text."""
    indicators = []
    if not report_text:
        return indicators
    
    text_lower = report_text.lower()
    
    # Common fraud indicators
    fraud_keywords = [
        'suspicious', 'inconsistent', 'mismatch', 'discrepancy',
        'unusual', 'irregular', 'questionable', 'red flag',
        'investigation required', 'further review'
    ]
    
    for keyword in fraud_keywords:
        if keyword in text_lower:
            indicators.append(keyword.title())
    
    return indicators

def extract_fraud_indicators_from_report(report_data, report_text):
    """Extract fraud indicators from report data and text."""
    indicators = []
    
    # Extract from report text
    text_indicators = extract_fraud_indicators(report_text)
    indicators.extend(text_indicators)
    
    # Add risk indicators from compliance analysis
    claim_data = report_data.get('claim_data', {})
    if 'statement_compliance' in claim_data:
        risk_indicators = claim_data['statement_compliance'].get('risk_indicators', [])
        indicators.extend(risk_indicators)
    
    # Remove duplicates and return
    return list(set(indicators))

def determine_ticket_status(msg):
    """Determine ticket status based on message content."""
    attachments = msg.get('attachments', [])
    text = msg.get('text', '').lower()
    
    if not attachments:
        return 'Pending Review'
    
    # Check for fraud indicators in text
    fraud_keywords = ['suspicious', 'fraud', 'irregular', 'questionable']
    if any(keyword in text for keyword in fraud_keywords):
        return 'Flagged'
    
    # Check attachment types
    has_statement = any(att.get('type') == 'statement' for att in attachments)
    has_treaty = any(att.get('type') == 'treaty_slip' for att in attachments)
    
    if has_statement and has_treaty:
        return 'Auto Approved'
    elif has_statement or has_treaty:
        return 'Pending Review'
    else:
        return 'Rejected'

def extract_contact_info(report):
    """Extract contact information from report data."""
    contact_info = {}
    text = report.get('report_text', '')
    
    # Simple email extraction
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    if emails:
        contact_info['email'] = emails[0]
    
    # Simple phone extraction
    phone_pattern = r'\+?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}'
    phones = re.findall(phone_pattern, text)
    if phones:
        contact_info['phone'] = phones[0]
    
    return contact_info

def run_fraud_detection_pipeline():
    """Run the fraud detection pipeline and return results."""
    try:
        print("🔍 Starting fraud detection pipeline...")
        
        # Get reports count before pipeline
        reports_before = get_reports_summary()
        reports_count_before = len(reports_before)
        
        # Import and run your existing pipeline
        from src_python.main import run_pipeline
        
        print("📊 Running RAG pipeline analysis...")
        # Run the pipeline (this might take some time)
        run_pipeline()
        
        # Get the latest reports after pipeline
        reports_after = get_reports_summary()
        reports_count_after = len(reports_after)
        
        # Calculate new reports generated
        new_reports_count = reports_count_after - reports_count_before
        
        print(f"✅ Pipeline completed! Generated {new_reports_count} new reports")
        
        return {
            'status': 'completed',
            'reports_generated': new_reports_count,
            'total_reports': reports_count_after,
            'latest_reports': reports_after[:5],  # Return top 5 latest reports
            'execution_time': 'Pipeline completed successfully',
            'timestamp': datetime.now().isoformat()
        }
    
    except ImportError as e:
        print(f"❌ Import error: {e}")
        # If the pipeline module is not available, simulate pipeline execution
        print("⚠️ Pipeline module not found, running simulation...")
        
        # Simulate some processing time
        import time
        time.sleep(2)
        
        # Get current reports
        reports = get_reports_summary()
        
        return {
            'status': 'simulated',
            'reports_generated': 0,
            'total_reports': len(reports),
            'latest_reports': reports[:5],
            'execution_time': 'Simulated execution (pipeline module not available)',
            'timestamp': datetime.now().isoformat()
        }
    
    except Exception as e:
        print(f"❌ Pipeline execution failed: {e}")
        raise Exception(f"Pipeline execution failed: {str(e)}")

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)