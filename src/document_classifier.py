# src/document_classifier.py
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from pypdf import PdfReader
import logging

logger = logging.getLogger(__name__)

@dataclass
class FinancialData:
    """Structured financial data extracted from documents."""
    amounts: Dict[str, float]  # {'total': 100000, 'commission': 5000, 'net': 95000}
    percentages: Dict[str, float]  # {'commission_rate': 5.0, 'share': 25.0}
    dates: Dict[str, str]  # {'claim_date': '2024-01-15', 'policy_start': '2023-12-01'}
    parties: Dict[str, str]  # {'insurer': 'Company A', 'broker': 'Broker B'}
    confidence_score: float  # Overall confidence in extraction quality

@dataclass
class DocumentClassification:
    """Result of document classification and analysis."""
    doc_type: str  # 'treaty_slip', 'statement', 'unknown'
    confidence: float  # Classification confidence (0.0 to 1.0)
    financial_data: FinancialData
    quality_score: float  # Overall document quality (0.0 to 1.0)
    extraction_errors: List[str]  # Any errors during processing

class DocumentClassifier:
    """Enhanced PDF classifier with financial data extraction capabilities."""
    
    def __init__(self):
        self.amount_patterns = [
            r'(?:USD|GBP|EUR|£|\$)\s*([0-9,]+\.?[0-9]*)',  # Currency prefixed amounts
            r'([0-9,]+\.?[0-9]*)\s*(?:USD|GBP|EUR|£|\$)',  # Currency suffixed amounts
            r'(?:amount|total|sum|value)[\s:]*(?:USD|GBP|EUR|£|\$)?\s*([0-9,]+\.?[0-9]*)',  # Labeled amounts
            r'([0-9,]+\.?[0-9]*)\s*(?:million|thousand|k|m)',  # Scaled amounts
        ]
        
        self.percentage_patterns = [
            r'([0-9]+\.?[0-9]*)\s*%',  # Standard percentage
            r'([0-9]+\.?[0-9]*)\s*percent',  # Written percent
            r'(?:commission|share|rate)[\s:]*([0-9]+\.?[0-9]*)\s*%',  # Labeled percentages
        ]
        
        self.date_patterns = [
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',  # MM/DD/YYYY or DD/MM/YYYY
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',  # YYYY/MM/DD
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})',  # DD Mon YYYY
        ]
        
        # Enhanced classification patterns
        self.treaty_slip_patterns = [
            r'cover\s+note',
            r'treaty\s+slip',
            r'placing\s+slip',
            r'risk\s+details',
            r'underwriting\s+slip',
        ]
        
        self.statement_patterns = [
            r'^MARINE',  # Filename starts with MARINE
            r'statement\s+of\s+account',
            r'premium\s+statement',
            r'settlement\s+statement',
            r'account\s+statement',
        ]

    def classify_pdf(self, file_path: str) -> DocumentClassification:
        """
        Classify PDF and extract financial data with confidence scoring.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            DocumentClassification with type, confidence, and extracted data
        """
        filename = Path(file_path).name.lower()
        extraction_errors = []
        
        try:
            # Extract text from PDF
            reader = PdfReader(file_path)
            full_text = ""
            for page in reader.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"
            
            if not full_text.strip():
                extraction_errors.append("No text could be extracted from PDF")
                return DocumentClassification(
                    doc_type="unknown",
                    confidence=0.0,
                    financial_data=FinancialData({}, {}, {}, {}, 0.0),
                    quality_score=0.0,
                    extraction_errors=extraction_errors
                )
            
            # Classify document type
            doc_type, classification_confidence = self._classify_document_type(filename, full_text)
            
            # Extract financial data
            financial_data = self.extract_financial_data(full_text)
            
            # Calculate overall quality score
            quality_score = self._calculate_quality_score(full_text, financial_data)
            
            return DocumentClassification(
                doc_type=doc_type,
                confidence=classification_confidence,
                financial_data=financial_data,
                quality_score=quality_score,
                extraction_errors=extraction_errors
            )
            
        except Exception as e:
            error_msg = f"Error processing PDF {file_path}: {str(e)}"
            logger.error(error_msg)
            extraction_errors.append(error_msg)
            
            return DocumentClassification(
                doc_type="unknown",
                confidence=0.0,
                financial_data=FinancialData({}, {}, {}, {}, 0.0),
                quality_score=0.0,
                extraction_errors=extraction_errors
            )

    def _classify_document_type(self, filename: str, text: str) -> Tuple[str, float]:
        """
        Classify document type based on filename and content patterns.
        
        Returns:
            Tuple of (document_type, confidence_score)
        """
        text_lower = text.lower()
        
        # Check filename patterns first (high confidence)
        if filename.startswith("marine"):
            return "statement", 0.9
        
        # Check content patterns
        treaty_score = 0.0
        statement_score = 0.0
        
        # Score treaty slip patterns
        for pattern in self.treaty_slip_patterns:
            matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
            treaty_score += matches * 0.2
        
        # Score statement patterns  
        for pattern in self.statement_patterns:
            matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
            statement_score += matches * 0.2
        
        # Determine classification
        if treaty_score > statement_score and treaty_score > 0.1:
            return "treaty_slip", min(treaty_score, 1.0)
        elif statement_score > treaty_score and statement_score > 0.1:
            return "statement", min(statement_score, 1.0)
        else:
            return "unknown", 0.0

    def extract_financial_data(self, text: str) -> FinancialData:
        """
        Extract financial data including amounts, percentages, dates, and parties.
        
        Args:
            text: Full text content of the document
            
        Returns:
            FinancialData object with extracted information
        """
        amounts = self._extract_amounts(text)
        percentages = self._extract_percentages(text)
        dates = self._extract_dates(text)
        parties = self._extract_parties(text)
        
        # Calculate confidence based on extraction success
        confidence_factors = [
            len(amounts) > 0,
            len(percentages) > 0,
            len(dates) > 0,
            len(parties) > 0
        ]
        confidence = sum(confidence_factors) / len(confidence_factors)
        
        return FinancialData(
            amounts=amounts,
            percentages=percentages,
            dates=dates,
            parties=parties,
            confidence_score=confidence
        )

    def _extract_amounts(self, text: str) -> Dict[str, float]:
        """Extract monetary amounts from text."""
        amounts = {}
        
        for pattern in self.amount_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Get the last group (the amount) since patterns may have different group structures
                amount_str = match.groups()[-1].replace(',', '')
                try:
                    amount = float(amount_str)
                    
                    # Determine amount type based on context (look before the match)
                    context_before = text[max(0, match.start()-30):match.start()].lower()
                    
                    # Skip if we already have this type and amount
                    amount_type = None
                    if 'commission' in context_before:
                        amount_type = 'commission'
                    elif 'total' in context_before:
                        amount_type = 'total'
                    elif 'net' in context_before:
                        amount_type = 'net'
                    elif 'premium' in context_before:
                        amount_type = 'premium'
                    else:
                        amount_type = f'amount_{len(amounts)}'
                    
                    # Only add if we don't already have this type or if the new amount is different
                    if amount_type not in amounts or amounts[amount_type] != amount:
                        amounts[amount_type] = amount
                        
                except ValueError:
                    continue
        
        return amounts

    def _extract_percentages(self, text: str) -> Dict[str, float]:
        """Extract percentage values from text."""
        percentages = {}
        
        for pattern in self.percentage_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    percentage = float(match.group(1))
                    
                    # Determine percentage type based on context before the match
                    context_before = text[max(0, match.start()-30):match.start()].lower()
                    
                    percentage_type = None
                    if 'commission' in context_before:
                        percentage_type = 'commission_rate'
                    elif 'share' in context_before:
                        percentage_type = 'share'
                    elif 'rate' in context_before and 'commission' not in context_before:
                        percentage_type = 'rate'
                    else:
                        percentage_type = f'percentage_{len(percentages)}'
                    
                    # Only add if we don't already have this type
                    if percentage_type not in percentages:
                        percentages[percentage_type] = percentage
                        
                except ValueError:
                    continue
        
        return percentages

    def _extract_dates(self, text: str) -> Dict[str, str]:
        """Extract dates from text."""
        dates = {}
        
        for pattern in self.date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                date_str = match.group(1)
                
                # Determine date type based on context before the match
                context_before = text[max(0, match.start()-30):match.start()].lower()
                
                if 'claim' in context_before or 'loss' in context_before:
                    dates['claim_date'] = date_str
                elif 'policy' in context_before or 'effective' in context_before:
                    dates['policy_date'] = date_str
                else:
                    dates[f'date_{len(dates)}'] = date_str
        
        return dates

    def _extract_parties(self, text: str) -> Dict[str, str]:
        """Extract party information (insurers, brokers, etc.) from text."""
        parties = {}
        
        # Common patterns for party identification
        party_patterns = [
            r'(?:insurer|underwriter)[\s:]+([A-Z][A-Za-z\s&\']+(?:Ltd|Limited|Inc|Corporation|Company))',
            r'(?:broker|agent)[\s:]+([A-Z][A-Za-z\s&\']+(?:Ltd|Limited|Inc|Corporation|Company))',
            r'(?:assured|insured)[\s:]+([A-Z][A-Za-z\s&\']+(?:Ltd|Limited|Inc|Corporation|Company))',
        ]
        
        for pattern in party_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                party_name = match.group(1).strip()
                # The pattern already captures the context, so we can determine type from the full match
                full_match = match.group(0).lower()
                
                if 'insurer' in full_match or 'underwriter' in full_match:
                    parties['insurer'] = party_name
                elif 'broker' in full_match or 'agent' in full_match:
                    parties['broker'] = party_name
                elif 'assured' in full_match or 'insured' in full_match:
                    parties['insured'] = party_name
        
        return parties

    def _calculate_quality_score(self, text: str, financial_data: FinancialData) -> float:
        """
        Calculate overall document quality score based on text and extraction success.
        
        Args:
            text: Full document text
            financial_data: Extracted financial data
            
        Returns:
            Quality score between 0.0 and 1.0
        """
        factors = []
        
        # Text quality factors
        factors.append(min(len(text) / 1000, 1.0))  # Text length (normalized to 1000 chars)
        factors.append(1.0 if text.count('\n') > 5 else 0.5)  # Document structure
        
        # Financial data extraction factors
        factors.append(1.0 if financial_data.amounts else 0.0)
        factors.append(1.0 if financial_data.percentages else 0.0)
        factors.append(1.0 if financial_data.dates else 0.0)
        factors.append(1.0 if financial_data.parties else 0.0)
        
        # Overall confidence
        factors.append(financial_data.confidence_score)
        
        return sum(factors) / len(factors)

    def validate_extraction_quality(self, classification: DocumentClassification) -> bool:
        """
        Validate if the extraction quality meets minimum standards.
        
        Args:
            classification: Document classification result
            
        Returns:
            True if quality is acceptable, False otherwise
        """
        return (
            classification.quality_score >= 0.5 and
            classification.confidence >= 0.3 and
            len(classification.extraction_errors) == 0
        )