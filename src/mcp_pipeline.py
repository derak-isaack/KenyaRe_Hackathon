# src/mcp_pipeline.py
from fastmcp import MCPApp, tool
from outlook_reader import read_outlook_emails, read_msg_files
from vector_store import init_vector_store, search_ground_truth
from report_generator import generate_report

app = MCPApp("fraud-rag-mcp")

@tool
def fetch_emails():
    """Fetch new Outlook emails with PDF attachments."""
    return read_outlook_emails()

@tool
def fetch_msg_files():
    """Fetch local .msg email files."""
    return read_msg_files()

@tool
def check_claims(docs: list, ground_truth_csv: str, prompt: str):
    """Run fraud detection on claims against ground truth data."""
    vectordb = init_vector_store(ground_truth_csv)
    results = []
    for doc in docs:
        matches = search_ground_truth(vectordb, doc)
        report = generate_report(doc, matches, prompt)
        results.append(report)
    return results

if __name__ == "__main__":
    app.run()
