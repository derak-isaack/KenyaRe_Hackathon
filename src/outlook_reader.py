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

embedder = SentenceTransformer("all-MiniLM-L6-v2")
dimension = embedder.get_sentence_embedding_dimension()
faiss_index = faiss.IndexFlatL2(dimension)
metadata_store = {}
vector_id_counter = 0


def classify_pdf(file_path: str) -> str:
    """
    Classify PDF as 'treaty_slip', 'statement', or 'unknown'.
    - Treaty slip: contains 'cover note' on first page.
    - Statement: filename begins with 'MARINE'.
    """
    filename = Path(file_path).name.lower()
    if filename.startswith("marine"):
        return "statement"

    try:
        reader = PdfReader(file_path)
        first_page = reader.pages[0].extract_text() or ""
        if "cover note" in first_page.lower():
            return "treaty_slip"
    except Exception as e:
        print(f"⚠️ Could not read {file_path}: {e}")

    return "unknown"


def vectorize_pdf(pdf_path: str, filename: str) -> int:
    """Vectorize PDF text and store in FAISS index."""
    global vector_id_counter

    # Extract full text
    try:
        reader = PdfReader(pdf_path)
        text = " ".join([page.extract_text() or "" for page in reader.pages])
    except Exception as e:
        print(f"⚠️ Failed to read {pdf_path}: {e}")
        text = ""

    # Encode and add to FAISS
    embedding = embedder.encode([text])[0]
    faiss_index.add(np.array([embedding], dtype="float32"))

    # Save metadata
    metadata_store[vector_id_counter] = {
        "filename": filename,
        "path": pdf_path,
        "text": text,
        "type": classify_pdf(pdf_path)
    }

    vector_id = vector_id_counter
    vector_id_counter += 1
    return vector_id


def read_msg_files_with_pdfs(paths=None):
    """
    Read local .msg files, extract subjects, bodies, and attached PDFs.
    Classify and vectorize each PDF independently.
    """
    docs = []
    if paths is None:
        paths = ["Claims datasets/set1", "Claims datasets/set2", "Claims datasets/set3"]
    if isinstance(paths, str):
        paths = [paths]

    for path in paths:
        if not os.path.exists(path):
            print(f"Skipping missing directory: {path}")
            continue

        for file in os.listdir(path):
            if not file.endswith(".msg"):
                continue

            msg_path = os.path.join(path, file)
            try:
                msg = extract_msg.Message(msg_path)
                attachments = []

                for att in msg.attachments:
                    if not att.longFilename.lower().endswith(".pdf"):
                        continue

                    pdf_path = os.path.join(path, att.longFilename)
                    with open(pdf_path, "wb") as f:
                        f.write(att.data)  # save attachment

                    pdf_type = classify_pdf(pdf_path)
                    pdf_text = ""
                    vector_id = vectorize_pdf(pdf_path, att.longFilename)

                    attachments.append({
                        "filename": att.longFilename,
                        "path": pdf_path,
                        "type": pdf_type,
                        "text": pdf_text,
                        "vector_id": vector_id
                    })

                docs.append({
                    "source": "msg",
                    "filename": file,
                    "subject": msg.subject,
                    "text": msg.body,
                    "attachments": attachments
                })

            except Exception as e:
                print(f"Error reading {file}: {e}")

    return docs