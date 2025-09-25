# src/vector_store.py
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

_model = SentenceTransformer("all-MiniLM-L6-v2")

class VectorStore:
    def __init__(self, index, vectors, texts, df):
        self.index = index
        self.vectors = vectors
        self.texts = texts
        self.df = df

    @property
    def embeddings(self):
        return self.index, self.vectors, self.texts

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

    # df = df[df["Main Class of Business"].str.lower() == "Marine"] & df[[df"Responsible Partner Name"].str.lower() != "GA Insurance Limited"]]
    df = df[
    (df["Main Class of Business"].str.lower() == "marine") &
    (df["Responsible Partner Name"].str.lower() == "ga insurance limited")
]
    

    texts = df.astype(str).agg(" ".join, axis=1).tolist()

    vectors = _model.encode(texts, convert_to_numpy=True)

    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)

    return VectorStore(index, vectors, texts, df)

def search_ground_truth(vectordb: VectorStore, query: str, k: int = 3):
    """Search ground truth data for most similar rows."""
    index, vectors, texts = vectordb.embeddings
    query_vec = _model.encode([query], convert_to_numpy=True)
    D, I = index.search(query_vec, k)
    results = []
    for idx in I[0]:
        if idx < len(texts):
            results.append(vectordb.df.iloc[idx].to_dict())
    return results
