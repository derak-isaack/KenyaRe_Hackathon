# src/main.py
import schedule
import time
from .outlook_reader import read_msg_files_with_pdfs, get_document_similarity_analysis
from .vector_store import init_vector_store, search_ground_truth, init_enhanced_vector_store
from .report_generator import generate_report
from .report_logger import save_report
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple


def load_prompt(path="fraud_detection_prompt.txt"):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

fraud_prompt_template = load_prompt()


def pair_documents(docs):
    """
    Enhanced document pairing with similarity scoring and compliance analysis.
    Returns a list of tuples: (statement_doc, treaty_slip_doc, pairing_confidence)
    """
    statements = []
    treaty_slips = []

    for doc in docs:
        for att in doc.get("attachments", []):
            if att["type"] == "statement":
                statements.append(att)
            elif att["type"] == "treaty_slip":
                treaty_slips.append(att)

    # Enhanced pairing with similarity scoring
    pairs = []
    for stmt in statements:
        best_match = None
        best_confidence = 0.0
        
        # Try to find matching treaty slip
        for slip in treaty_slips:
            # Simple filename matching
            filename_match = stmt["filename"].split("_")[1] in slip["filename"] if "_" in stmt["filename"] else False
            
            # Financial data matching if available
            financial_match = False
            if (stmt.get("financial_data", {}).get("amounts") and 
                slip.get("financial_data", {}).get("amounts")):
                
                stmt_amounts = list(stmt["financial_data"]["amounts"].values())
                slip_amounts = list(slip["financial_data"]["amounts"].values())
                
                if stmt_amounts and slip_amounts:
                    # Check if amounts are similar (within 10% tolerance)
                    max_stmt = max(stmt_amounts)
                    max_slip = max(slip_amounts)
                    if abs(max_stmt - max_slip) / max(max_stmt, max_slip) < 0.1:
                        financial_match = True
            
            # Calculate pairing confidence
            confidence = 0.0
            if filename_match:
                confidence += 0.6
            if financial_match:
                confidence += 0.4
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_match = slip
        
        pairs.append((stmt, best_match, best_confidence))
    
    return pairs

def analyze_document_compliance(attachment: Dict) -> Dict:
    """
    Analyze document compliance and generate detailed compliance report.
    
    Args:
        attachment: Document attachment with compliance analysis
        
    Returns:
        Dict containing detailed compliance analysis
    """
    compliance_analysis = attachment.get("compliance_analysis", {})
    
    analysis_report = {
        "document_info": {
            "filename": attachment.get("filename", ""),
            "type": attachment.get("type", "unknown"),
            "classification_confidence": attachment.get("classification_confidence", 0.0),
            "quality_score": attachment.get("quality_score", 0.0)
        },
        "compliance_score": compliance_analysis.get("compliance_score", 0.0),
        "risk_level": "low",
        "risk_indicators": compliance_analysis.get("risk_indicators", []),
        "ground_truth_analysis": {
            "matches_found": len(compliance_analysis.get("ground_truth_matches", [])),
            "avg_similarity": 0.0,
            "max_similarity": 0.0
        },
        "financial_validation": compliance_analysis.get("validation_results", {}),
        "recommendations": []
    }
    
    # Calculate ground truth analysis
    ground_truth_matches = compliance_analysis.get("ground_truth_matches", [])
    if ground_truth_matches:
        similarities = [match.get("similarity_score", 0.0) for match in ground_truth_matches]
        analysis_report["ground_truth_analysis"]["avg_similarity"] = np.mean(similarities)
        analysis_report["ground_truth_analysis"]["max_similarity"] = max(similarities)
    
    # Determine risk level
    compliance_score = analysis_report["compliance_score"]
    risk_indicators = analysis_report["risk_indicators"]
    
    if compliance_score < 0.3 or len(risk_indicators) >= 3:
        analysis_report["risk_level"] = "high"
        analysis_report["recommendations"].append("REQUIRES_MANUAL_REVIEW")
        analysis_report["recommendations"].append("INVESTIGATE_UNUSUAL_PATTERNS")
    elif compliance_score < 0.6 or len(risk_indicators) >= 1:
        analysis_report["risk_level"] = "medium"
        analysis_report["recommendations"].append("ADDITIONAL_VERIFICATION_RECOMMENDED")
    else:
        analysis_report["risk_level"] = "low"
        analysis_report["recommendations"].append("STANDARD_PROCESSING_APPROVED")
    
    return analysis_report


def run_pipeline():
    print("🔍 Running Enhanced RAG fraud detection pipeline with vectorized compliance checking...")

    # Step 1: Read Outlook .msg files and PDFs with enhanced vectorization
    msgs = read_msg_files_with_pdfs()
    all_docs = msgs

    # Step 2: Load ground truth vector store
    vectordb = init_vector_store()

    # Step 3: Enhanced document pairing with confidence scoring
    doc_pairs = pair_documents(all_docs)

    print(f"📊 Processing {len(doc_pairs)} document pairs...")

    for i, (statement, treaty_slip, pairing_confidence) in enumerate(doc_pairs, start=1):
        print(f"\n🔍 Processing claim pair {i}/{len(doc_pairs)}")
        print(f"   📄 Statement: {statement.get('filename', 'Unknown')}")
        print(f"   📋 Treaty Slip: {treaty_slip.get('filename', 'None') if treaty_slip else 'None'}")
        print(f"   🤝 Pairing Confidence: {pairing_confidence:.2f}")

        # Step 4: Analyze individual document compliance
        statement_compliance = analyze_document_compliance(statement)
        treaty_slip_compliance = analyze_document_compliance(treaty_slip) if treaty_slip else None

        # Step 5: Combine text for AI audit with enhanced structure
        combined_text = f"""
STATEMENT DOCUMENT:
Filename: {statement.get('filename', 'Unknown')}
Type: {statement.get('type', 'Unknown')}
Classification Confidence: {statement.get('classification_confidence', 0.0):.2f}
Compliance Score: {statement_compliance['compliance_score']:.2f}
Risk Level: {statement_compliance['risk_level']}
Text: {statement.get('text', 'No text available')}

FINANCIAL DATA:
{statement.get('financial_data', {})}
"""

        if treaty_slip:
            combined_text += f"""

TREATY SLIP DOCUMENT:
Filename: {treaty_slip.get('filename', 'Unknown')}
Type: {treaty_slip.get('type', 'Unknown')}
Classification Confidence: {treaty_slip.get('classification_confidence', 0.0):.2f}
Compliance Score: {treaty_slip_compliance['compliance_score']:.2f}
Risk Level: {treaty_slip_compliance['risk_level']}
Text: {treaty_slip.get('text', 'No text available')}

FINANCIAL DATA:
{treaty_slip.get('financial_data', {})}
"""

        # Step 6: Retrieve relevant ground truth rows via FAISS with similarity scores
        matches = search_ground_truth(vectordb, combined_text, k=5)

        # Step 7: Build enhanced fraud detection prompt with compliance data
        prompt = f"""{fraud_prompt_template}

VECTORIZED COMPLIANCE ANALYSIS:

STATEMENT COMPLIANCE:
- Compliance Score: {statement_compliance['compliance_score']:.3f}
- Risk Level: {statement_compliance['risk_level']}
- Risk Indicators: {', '.join(statement_compliance['risk_indicators']) if statement_compliance['risk_indicators'] else 'None'}
- Ground Truth Matches: {statement_compliance['ground_truth_analysis']['matches_found']}
- Average Similarity: {statement_compliance['ground_truth_analysis']['avg_similarity']:.3f}

"""

        if treaty_slip_compliance:
            prompt += f"""
TREATY SLIP COMPLIANCE:
- Compliance Score: {treaty_slip_compliance['compliance_score']:.3f}
- Risk Level: {treaty_slip_compliance['risk_level']}
- Risk Indicators: {', '.join(treaty_slip_compliance['risk_indicators']) if treaty_slip_compliance['risk_indicators'] else 'None'}
- Ground Truth Matches: {treaty_slip_compliance['ground_truth_analysis']['matches_found']}
- Average Similarity: {treaty_slip_compliance['ground_truth_analysis']['avg_similarity']:.3f}
"""

        prompt += f"""
DOCUMENT PAIRING:
- Pairing Confidence: {pairing_confidence:.3f}
- Documents Matched: {'Yes' if treaty_slip else 'No'}

CLAIM DATA:
{combined_text}

GROUND TRUTH MATCHES WITH SIMILARITY SCORES:
"""
        for j, match in enumerate(matches, 1):
            prompt += f"""
Match {j} (Similarity: {match.get('similarity_score', 0):.3f}, Distance: {match.get('distance', 0):.3f}):
{match}

"""

        # Step 8: Generate enhanced report with compliance analysis
        report = generate_report(combined_text, matches, prompt)

        # Step 9: Save report with enhanced metadata
        claim_id = statement.get("filename", f"claim_{i}").replace('.pdf', '')
        
        enhanced_metadata = {
            "statement": statement,
            "treaty_slip": treaty_slip,
            "pairing_confidence": pairing_confidence,
            "statement_compliance": statement_compliance,
            "treaty_slip_compliance": treaty_slip_compliance,
            "ground_truth_matches": matches,
            "processing_timestamp": datetime.now().isoformat(),
            "pipeline_version": "enhanced_v2.0"
        }
        
        save_report(claim_id, report, enhanced_metadata, matches)
        
        print(f"   ✅ Report generated for {claim_id}")
        print(f"   📊 Overall Risk Assessment: {max(statement_compliance['risk_level'], treaty_slip_compliance['risk_level'] if treaty_slip_compliance else 'low')}")

    print(f"\n🎉 Enhanced pipeline completed! Processed {len(doc_pairs)} claim pairs with vectorized compliance checking.")


# Schedule the pipeline
schedule.every(4).hours.do(run_pipeline)

if __name__ == "__main__":
    run_pipeline()
    while True:
        schedule.run_pending()
        time.sleep(60)
