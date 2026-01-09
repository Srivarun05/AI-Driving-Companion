# AI Driving Companion

An AI-powered driving assistant that answers car manual queries using
semantic search and voice interaction.

## Features
- Voice input
- Semantic search using FAISS vector database
- Car manual understanding using sentence embeddings
- FastAPI backend
- Interactive animated frontend

## Tech Stack
**Frontend**
- HTML, CSS, JavaScript
- Canvas animation

**Backend**
- Python
- FastAPI
- FAISS
- Sentence Transformers

## Use Case

- Ask questions like:

- "What does engine warning light mean?"

- "Oil pressure warning"

- "Brake system alert"

## How to Run

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
open index.html using Live Server or localhost
