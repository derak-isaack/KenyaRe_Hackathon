# src/main.py
import schedule
import time
from outlook_reader import read_msg_files
from vector_store import init_vector_store, search_ground_truth
from report_generator import generate_report
from report_logger import save_report


def load_prompt(path="fraud_detection_prompt.txt"):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

fraud_prompt = load_prompt()

def run_pipeline():
    print("🔍 Running RAG fraud detection pipeline...")

    # Step 1: Read Outlook emails and .msg files
    # emails = read_outlook_emails()
    msgs = read_msg_files()
    all_docs = msgs

    vectordb = init_vector_store()

    for i, doc in enumerate(all_docs, start=1):
        matches = search_ground_truth(vectordb, doc["text"])
        report = generate_report(doc["text"], matches, fraud_prompt)

        claim_id = doc.get("subject", f"claim_{i}")
        save_report(claim_id, report, doc, matches)

schedule.every(4).hours.do(run_pipeline)

if __name__ == "__main__":
    run_pipeline()  
    while True:
        schedule.run_pending()
        time.sleep(60)
