# src/report_generator.py
import google.generativeai as genai
import os
from dotenv import load_dotenv 

load_dotenv()

# Get API key
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("Missing GOOGLE_API_KEY in .env file")

# Configure Gemini
genai.configure(api_key=api_key)

def generate_report(claim_doc, matches, prompt_template):
    model = genai.GenerativeModel("gemini-2.5-pro")
    response = model.generate_content(
        f"{prompt_template}\n\nClaim Data:\n{claim_doc}\n\nGround Truth Matches:\n{matches}"
    )
    return response.text
