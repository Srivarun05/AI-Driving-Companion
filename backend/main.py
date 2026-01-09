import os
import re

os.environ["TRANSFORMERS_NO_TF"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import faiss, json, numpy as np
from sentence_transformers import SentenceTransformer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load files
index = faiss.read_index("faiss_index.idx")
embeddings = np.load("embeddings.npy")
with open("chunks_meta.json", "r", encoding="utf-8") as f:
    chunks = json.load(f)

# Normalize (important)
faiss.normalize_L2(embeddings)

model = SentenceTransformer("all-mpnet-base-v2")

@app.get("/")
def home():
    return {"status": "AI Driving Companion backend running"}

@app.get("/search")
def search(q: str):
    q_embedding = model.encode([q]).astype("float32")
    faiss.normalize_L2(q_embedding)

    D, I = index.search(q_embedding, 3)

    seen = set()
    results = []

    for idx in I[0]:
        text = chunks[idx]["text"]

        # clean cid text
        text = re.sub(r'\(cid:\d+\)', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

        if text and text not in seen:
            seen.add(text)
            results.append(text[:300])

    return {"query": q, "results": results}
