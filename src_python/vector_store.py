# src/vector_store.py
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import Dict, List, Tuple, Optional
import json
from datetime import datetime

_model = SentenceTransformer("all-MiniLM-L6-v2")

class VectorStore:
    def __init__(self, index, vectors, texts, df, metadata=None):
        self.index = index
        self.vectors = vectors
        self.texts = texts
        self.df = df
        self.metadata = metadata or {}

    @property
    def embeddings(self):
        return self.index, self.vectors, self.texts

class EnhancedVectorStore:
    """Enhanced vector store for separate PDF document vectorization with similarity scoring."""
    
    def __init__(self):
        self.ground_truth_store = None
        self.document_index = faiss.IndexFlatL2(384)  # all-MiniLM-L6-v2 dimension
        self.document_metadata = {}
        self.document_vectors = []
        self.vector_id_counter = 0
        self.model = _model
        
    def add_document(self, text: str, doc_type: str, filename: str, 
                    financial_data: Dict = None, classification_confidence: float = 0.0) -> int:
        """Add a document to the vector store with metadata."""
        
        # Generate embedding
        embedding = self.model.encode([text])[0]
        self.document_index.add(np.array([embedding], dtype="float32"))
        
        # Store metadata
        vector_id = self.vector_id_counter
        self.document_metadata[vector_id] = {
            "filename": filename,
            "doc_type": doc_type,
            "text": text,
            "financial_data": financial_data or {},
            "classification_confidence": classification_confidence,
            "timestamp": datetime.now().isoformat(),
            "vector_id": vector_id
        }
        
        self.document_vectors.append(embedding)
        self.vector_id_counter += 1
        
        return vector_id
    
    def search_similar_documents(self, query_text: str, k: int = 5, 
                               doc_type_filter: str = None) -> List[Dict]:
        """Search for similar documents with similarity scores."""
        
        if self.document_index.ntotal == 0:
            return []
            
        query_embedding = self.model.encode([query_text])
        distances, indices = self.document_index.search(query_embedding, min(k * 2, self.document_index.ntotal))
        
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx == -1:  # Invalid index
                continue
                
            metadata = self.document_metadata.get(idx, {})
            
            # Apply document type filter if specified
            if doc_type_filter and metadata.get("doc_type") != doc_type_filter:
                continue
                
            # Convert distance to similarity score (0-1, higher is more similar)
            similarity_score = 1 / (1 + distance)
            
            result = {
                **metadata,
                "similarity_score": float(similarity_score),
                "distance": float(distance),
                "rank": len(results) + 1
            }
            
            results.append(result)
            
            if len(results) >= k:
                break
                
        return results

def init_vector_store():
    """
    Load ground truth Excel file, filter to marine claims, 
    and build FAISS index focusing on key fields.
    """
    file_path = r"Claims datasets\CASH CALLS PROCESSED SINCE NOVEMBER 2021 .xlsx"

    df = pd.read_excel(file_path, header=3)
    df.columns = df.columns.str.strip()

    required_cols = [
        "Responsible Partner Name", 
        "Amount (Original)", 
        "Business Title", 
        "Main Class of Business", 
        "Claim Name", 
        "Date of Loss"
    ]
    df = df[required_cols].copy()
    df["Amount (Original)"] = df["Amount (Original)"].abs()

    # Filter for marine claims from GA Insurance Limited
    df = df[
        (df["Main Class of Business"].str.lower() == "marine") &
        (df["Responsible Partner Name"].str.lower() == "ga insurance limited")
    ]
    
    # Create structured text representations for better vectorization
    texts = []
    for _, row in df.iterrows():
        structured_text = f"""
        Partner: {row['Responsible Partner Name']}
        Amount: {row['Amount (Original)']}
        Business: {row['Business Title']} - {row['Main Class of Business']}
        Claim: {row['Claim Name']}
        Loss Date: {row['Date of Loss']}
        """
        texts.append(structured_text.strip())

    vectors = _model.encode(texts, convert_to_numpy=True)

    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)

    return VectorStore(index, vectors, texts, df)

def init_enhanced_vector_store():
    """Initialize enhanced vector store with ground truth data."""
    enhanced_store = EnhancedVectorStore()
    
    # Load ground truth data
    ground_truth_store = init_vector_store()
    enhanced_store.ground_truth_store = ground_truth_store
    
    return enhanced_store

def search_ground_truth(vectordb: VectorStore, query: str, k: int = 3):
    """Search ground truth data for most similar rows with similarity scores."""
    index, vectors, texts = vectordb.embeddings
    query_vec = _model.encode([query], convert_to_numpy=True)
    D, I = index.search(query_vec, k)
    
    results = []
    for i, idx in enumerate(I[0]):
        if idx < len(texts):
            # Convert distance to similarity score
            similarity_score = 1 / (1 + D[0][i])
            
            result = vectordb.df.iloc[idx].to_dict()
            result['similarity_score'] = float(similarity_score)
            result['distance'] = float(D[0][i])
            result['rank'] = i + 1
            
            results.append(result)
    
    return results

def cross_validate_with_ground_truth(enhanced_store: EnhancedVectorStore, 
                                   document_text: str, doc_type: str, 
                                   financial_data: Dict = None) -> Dict:
    """
    Cross-validate document against ground truth data and return compliance analysis.
    """
    if not enhanced_store.ground_truth_store:
        return {"error": "Ground truth data not available"}
    
    # Search ground truth for similar claims
    ground_truth_matches = search_ground_truth(
        enhanced_store.ground_truth_store, 
        document_text, 
        k=5
    )
    
    # Analyze compliance based on similarity scores and financial data
    compliance_analysis = {
        "ground_truth_matches": ground_truth_matches,
        "compliance_score": 0.0,
        "risk_indicators": [],
        "validation_results": {}
    }
    
    if ground_truth_matches:
        # Calculate average similarity score
        avg_similarity = np.mean([match['similarity_score'] for match in ground_truth_matches])
        compliance_analysis["compliance_score"] = float(avg_similarity)
        
        # Check for risk indicators based on similarity patterns
        max_similarity = max([match['similarity_score'] for match in ground_truth_matches])
        
        if max_similarity < 0.3:
            compliance_analysis["risk_indicators"].append("LOW_SIMILARITY_TO_HISTORICAL_CLAIMS")
        
        if avg_similarity < 0.2:
            compliance_analysis["risk_indicators"].append("UNUSUAL_CLAIM_PATTERN")
        
        # Financial validation if data is available
        if financial_data and financial_data.get("amounts"):
            claim_amounts = list(financial_data["amounts"].values())
            historical_amounts = [match.get("Amount (Original)", 0) for match in ground_truth_matches]
            
            if claim_amounts and historical_amounts:
                claim_amount = max(claim_amounts)  # Use largest amount
                avg_historical = np.mean(historical_amounts)
                
                # Flag if claim amount is significantly different from historical average
                if claim_amount > avg_historical * 3:
                    compliance_analysis["risk_indicators"].append("AMOUNT_SIGNIFICANTLY_ABOVE_HISTORICAL")
                elif claim_amount < avg_historical * 0.1:
                    compliance_analysis["risk_indicators"].append("AMOUNT_SIGNIFICANTLY_BELOW_HISTORICAL")
                
                compliance_analysis["validation_results"]["amount_comparison"] = {
                    "claim_amount": claim_amount,
                    "historical_average": float(avg_historical),
                    "deviation_ratio": float(claim_amount / avg_historical) if avg_historical > 0 else 0
                }
    
    return compliance_analysis
