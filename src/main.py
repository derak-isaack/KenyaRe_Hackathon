# src/main.py
import schedule
import time
from .outlook_reader import read_msg_files_with_pdfs
from .vector_store import init_vector_store, search_ground_truth
from .report_generator import generate_report
from .report_logger import save_report
import numpy as np


def load_prompt(path="fraud_detection_prompt.txt"):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

fraud_prompt_template = load_prompt()


def pair_documents(docs):
    """
    Pair statements with corresponding treaty slips (if available) based on metadata.
    Returns a list of tuples: (statement_doc, treaty_slip_doc)
    """
    statements = []
    treaty_slips = []

    for doc in docs:
        for att in doc.get("attachments", []):
            if att["type"] == "statement":
                statements.append(att)
            elif att["type"] == "treaty_slip":
                treaty_slips.append(att)

    # Simple pairing by nearest filename match (can be improved)
    pairs = []
    for stmt in statements:
        matched_slip = next((slip for slip in treaty_slips if stmt["filename"].split("_")[1] in slip["filename"]), None)
        pairs.append((stmt, matched_slip))
    return pairs


def run_pipeline():
    print("🔍 Running RAG fraud detection pipeline...")

    # Step 1: Read Outlook .msg files and PDFs
    msgs = read_msg_files_with_pdfs()
    all_docs = msgs

    # Step 2: Load ground truth vector store
    vectordb = init_vector_store()

    # Step 3: Pair statements with treaty slips
    doc_pairs = pair_documents(all_docs)

    for i, (statement, treaty_slip) in enumerate(doc_pairs, start=1):
        # Combine text for AI audit (include both docs if available)
        combined_text = statement["text"]
        if treaty_slip:
            combined_text += "\n\nTREATY SLIP TEXT:\n" + treaty_slip["text"]

        # Step 4: Retrieve relevant ground truth rows via FAISS
        matches = search_ground_truth(vectordb, combined_text, k=5)

        # Step 5: Build fraud detection prompt dynamically
        prompt = f"{fraud_prompt_template}\n\nCLAIM DATA:\n{combined_text}\n\nGROUND TRUTH:\n"
        for match in matches:
            prompt += str(match) + "\n"

        # Step 6: Generate report via your LLM / report generator
        report = generate_report(combined_text, matches, prompt)

        claim_id = statement.get("filename", f"claim_{i}")
        save_report(claim_id, report, {"statement": statement, "treaty_slip": treaty_slip}, matches)


# Schedule the pipeline
schedule.every(4).hours.do(run_pipeline)

if __name__ == "__main__":
    run_pipeline()
    while True:
        schedule.run_pending()
        time.sleep(60)
