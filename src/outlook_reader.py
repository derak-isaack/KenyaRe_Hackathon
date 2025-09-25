# src/outlook_reader.py
from office365.graph_client import GraphClient
from office365.runtime.auth.user_credential import UserCredential
import os
import extract_msg
from pypdf import PdfReader
from office365.runtime.auth.entra.authentication_context import AuthenticationContext

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

def read_msg_files(paths=None):
    """
    Read local .msg files from one or more directories.

    Args:
        paths (list or str): Either a single directory path (str) or 
                             a list of directory paths.
    Returns:
        list: A list of dicts containing subject and body text.
    """
    docs = []
    if paths is None:
        paths = ["Claims datasets/set1", "Claims datasets/set2", "Claims datasets/set3"]

    # Ensure it's a list
    if isinstance(paths, str):
        paths = [paths]

    for path in paths:
        if not os.path.exists(path):
            print(f"Skipping missing directory: {path}")
            continue
        for file in os.listdir(path):
            if file.endswith(".msg"):
                msg_path = os.path.join(path, file)
                try:
                    msg = extract_msg.Message(msg_path)
                    docs.append({
                        "source": "msg",
                        "filename": file,
                        "subject": msg.subject,
                        "text": msg.body
                    })
                except Exception as e:
                    print(f"Error reading {file}: {e}")
    return docs

