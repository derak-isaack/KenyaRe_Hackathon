# src/outlook_reader.py
from office365.graph_client import GraphClient
from office365.runtime.auth.user_credential import UserCredential
import os
from pathlib import Path 
import extract_msg
from pypdf import PdfReader
from office365.runtime.auth.entra.authentication_context import AuthenticationContext
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np 

# --- Authenticate with Microsoft Graph ---
# TENANT_ID = os.getenv("MS_TENANT_ID")
# CLIENT_ID = os.getenv("MS_CLIENT_ID")
# CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET")   # Or use username/password


# def get_graph_client():
#     # Build an AuthenticationContext using client secret flow
#     ctx = AuthenticationContext(tenant=TENANT_ID)
#     ctx = ctx.with_client_secret(CLIENT_ID, CLIENT_SECRET)

#     client = GraphClient(ctx.acquire_token)
#     return client


# def read_outlook_emails():
#     """Fetch Outlook emails with PDF attachments via Microsoft Graph."""
#     client = get_graph_client()
#     messages = client.me.messages.top(10).get().execute_query()

#     docs = []
#     for msg in messages:
#         if msg.has_attachments:
#             attachments = client.me.messages[msg.id].attachments.get().execute_query()
#             for att in attachments:
#                 if att.name.endswith(".pdf"):
#                     # Save PDF temporarily
#                     with open(att.name, "wb") as f:
#                         f.write(att.contentBytes)

#                     # Extract PDF text
#                     with open(att.name, "rb") as f:
#                         reader = PdfReader(f)
#                         text = " ".join([page.extract_text() for page in reader.pages])

#                     docs.append({
#                         "source": "outlook",
#                         "subject": msg.subject,
#                         "text": text
#                     })
#     return docs

# Import enhanced vector store and document classifier
from .vector_store import EnhancedVectorStore, init_enhanced_vector_store, cross_validate_with_ground_truth
from .document_classifier import DocumentClassifier
from typing import Dict
from datetime import datetime

# Global enhanced vector store instance
enhanced_vector_store = None
document_classifier = DocumentClassifier()

def get_enhanced_vector_store():
    """Get or initialize the enhanced vector store."""
    global enhanced_vector_store
    if enhanced_vector_store is None:
        enhanced_vector_store = init_enhanced_vector_store()
    return enhanced_vector_store

def classify_and_vectorize_pdf(pdf_path: str, filename: str) -> Dict:
    """
    Enhanced PDF classification and vectorization with compliance checking.
    
    Returns:
        Dict containing classification results, vector ID, and compliance analysis
    """
    try:
        # Use enhanced document classifier
        classification = document_classifier.classify_pdf(pdf_path)
        
        # Get enhanced vector store
        vector_store = get_enhanced_vector_store()
        
        # Add document to vector store
        vector_id = vector_store.add_document(
            text=classification.financial_data.confidence_score > 0 and len(classification.financial_data.amounts) > 0 
                 and f"Financial Data: {classification.financial_data.amounts}" or "",
            doc_type=classification.doc_type,
            filename=filename,
            financial_data=classification.financial_data.__dict__,
            classification_confidence=classification.confidence
        )
        
        # Cross-validate with ground truth
        compliance_analysis = cross_validate_with_ground_truth(
            vector_store,
            classification.financial_data.confidence_score > 0 and len(classification.financial_data.amounts) > 0 
            and f"Financial Data: {classification.financial_data.amounts}" or "",
            classification.doc_type,
            classification.financial_data.__dict__
        )
        
        return {
            "vector_id": vector_id,
            "classification": {
                "doc_type": classification.doc_type,
                "confidence": classification.confidence,
                "quality_score": classification.quality_score,
                "extraction_errors": classification.extraction_errors
            },
            "financial_data": classification.financial_data.__dict__,
            "compliance_analysis": compliance_analysis,
            "text_preview": classification.financial_data.confidence_score > 0 and len(classification.financial_data.amounts) > 0 
                           and f"Financial Data: {classification.financial_data.amounts}"[:200] or "No extractable text"
        }
        
    except Exception as e:
        print(f"⚠️ Error processing PDF {pdf_path}: {e}")
        return {
            "vector_id": -1,
            "classification": {
                "doc_type": "unknown",
                "confidence": 0.0,
                "quality_score": 0.0,
                "extraction_errors": [str(e)]
            },
            "financial_data": {},
            "compliance_analysis": {"error": str(e)},
            "text_preview": "Error processing document"
        }


def read_msg_files_with_pdfs(paths=None):
    """
    Enhanced function to read .msg files, extract PDFs, classify, vectorize, 
    and cross-validate against ground truth data.
    """
    docs = []
    if paths is None:
        paths = ["Claims datasets/set1", "Claims datasets/set2", "Claims datasets/set3"]
    if isinstance(paths, str):
        paths = [paths]

    print("🔍 Starting enhanced PDF processing with vectorization and compliance checking...")

    for path in paths:
        if not os.path.exists(path):
            print(f"⚠️ Skipping missing directory: {path}")
            continue

        print(f"📁 Processing directory: {path}")
        
        for file in os.listdir(path):
            if not file.endswith(".msg"):
                continue

            msg_path = os.path.join(path, file)
            try:
                msg = extract_msg.Message(msg_path)
                attachments = []

                print(f"📧 Processing email: {file}")

                for att in msg.attachments:
                    if not att.longFilename.lower().endswith(".pdf"):
                        continue

                    pdf_path = os.path.join(path, att.longFilename)
                    
                    # Save PDF attachment
                    with open(pdf_path, "wb") as f:
                        f.write(att.data)

                    print(f"📄 Processing PDF: {att.longFilename}")
                    
                    # Enhanced classification and vectorization
                    pdf_analysis = classify_and_vectorize_pdf(pdf_path, att.longFilename)
                    
                    # Create enhanced attachment object
                    attachment = {
                        "filename": att.longFilename,
                        "path": pdf_path,
                        "type": pdf_analysis["classification"]["doc_type"],
                        "text": pdf_analysis["text_preview"],
                        "vector_id": pdf_analysis["vector_id"],
                        "classification_confidence": pdf_analysis["classification"]["confidence"],
                        "quality_score": pdf_analysis["classification"]["quality_score"],
                        "financial_data": pdf_analysis["financial_data"],
                        "compliance_analysis": pdf_analysis["compliance_analysis"],
                        "extraction_errors": pdf_analysis["classification"]["extraction_errors"]
                    }
                    
                    attachments.append(attachment)
                    
                    # Log compliance results
                    compliance_score = pdf_analysis["compliance_analysis"].get("compliance_score", 0.0)
                    risk_indicators = pdf_analysis["compliance_analysis"].get("risk_indicators", [])
                    
                    print(f"   ✅ Classification: {pdf_analysis['classification']['doc_type']} "
                          f"(confidence: {pdf_analysis['classification']['confidence']:.2f})")
                    print(f"   📊 Compliance Score: {compliance_score:.2f}")
                    
                    if risk_indicators:
                        print(f"   ⚠️ Risk Indicators: {', '.join(risk_indicators)}")

                # Create enhanced document object
                doc = {
                    "source": "msg",
                    "filename": file,
                    "subject": msg.subject,
                    "text": msg.body,
                    "attachments": attachments,
                    "processing_timestamp": datetime.now().isoformat(),
                    "total_attachments": len(attachments),
                    "treaty_slips": len([a for a in attachments if a["type"] == "treaty_slip"]),
                    "statements": len([a for a in attachments if a["type"] == "statement"]),
                    "unknown_docs": len([a for a in attachments if a["type"] == "unknown"])
                }
                
                docs.append(doc)

            except Exception as e:
                print(f"❌ Error reading {file}: {e}")

    print(f"✅ Processed {len(docs)} emails with enhanced vectorization and compliance checking")
    return docs

def get_document_similarity_analysis(vector_id: int) -> Dict:
    """
    Get detailed similarity analysis for a specific document.
    
    Args:
        vector_id: Vector ID of the document
        
    Returns:
        Dict containing similarity analysis results
    """
    vector_store = get_enhanced_vector_store()
    
    if vector_id not in vector_store.document_metadata:
        return {"error": "Document not found"}
    
    doc_metadata = vector_store.document_metadata[vector_id]
    
    # Find similar documents in the store
    similar_docs = vector_store.search_similar_documents(
        doc_metadata["text"], 
        k=5, 
        doc_type_filter=doc_metadata["doc_type"]
    )
    
    # Remove self from results
    similar_docs = [doc for doc in similar_docs if doc["vector_id"] != vector_id]
    
    return {
        "document": doc_metadata,
        "similar_documents": similar_docs,
        "analysis_timestamp": datetime.now().isoformat()
    }