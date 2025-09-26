import os
import json
from datetime import datetime
import re

REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)

def sanitize_filename(name: str) -> str:
    """Replace invalid Windows filename characters with underscore."""
    return re.sub(r'[<>:"/\\|?*]', '_', name)

def save_report(claim_id: str, report_text: str, claim_data: dict, matches: list):
    """Save fraud detection report as both .txt and .json, handling datetime serialization."""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    safe_claim_id = sanitize_filename(claim_id)
    base_name = f"{timestamp}_{safe_claim_id}"

    # Save TXT (for auditors)
    txt_path = os.path.join(REPORT_DIR, f"{base_name}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    # Save JSON (for structured use)
    def default_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    json_path = os.path.join(REPORT_DIR, f"{base_name}.json")
    payload = {
        "timestamp": timestamp,
        "claim_id": claim_id,
        "report_text": report_text,
        "claim_data": claim_data,
        "ground_truth_matches": matches,
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, default=default_serializer)

    print(f"📂 Report saved: {txt_path}, {json_path}")
    return {"txt": txt_path, "json": json_path}
