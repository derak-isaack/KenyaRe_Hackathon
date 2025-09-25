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
    Load ground truth Excel file and build FAISS index.
    """
    file_path = r"Claims datasets\CASH CALLS PROCESSED SINCE NOVEMBER 2021 .xlsx"

    df = pd.read_excel(file_path)

    texts = df.astype(str).agg(" ".join, axis=1).tolist()

    vectors = _model.encode(texts, convert_to_numpy=True)

    # Build FAISS index
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
