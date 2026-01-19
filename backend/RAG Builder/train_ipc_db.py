import json
import os
import shutil
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# --- CONFIGURATION ---
DB_DIRECTORY = "./legal_db"
JSON_FILE = "ipc_data.json"

# UPGRADE: Switching to BGE (Best for Retrieval) or MiniLM (Fastest)
# Use "sentence-transformers/all-MiniLM-L6-v2" if BGE is too slow for you
MODEL_NAME = "BAAI/bge-small-en-v1.5"

def process_data():
    if not os.path.exists(JSON_FILE):
        print(f"❌ Error: {JSON_FILE} not found!")
        return []

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    docs = []
    print(f"   ...Processing {len(data)} legal sections...")

    for entry in data:
        # --- IMPROVEMENT 1: Context Stuffing ---
        # We put the Chapter Title IN the text. 
        # So searching for "Offenses against human body" finds Section 302.
        
        section_num = str(entry.get("Section", "")).strip()
        sec_title = str(entry.get("section_title", "")).strip()
        sec_desc = str(entry.get("section_desc", "")).strip()
        chap_title = str(entry.get("chapter_title", "")).strip()

        # The "Blob" the AI reads:
        page_content = (
            f"Law: Indian Penal Code (IPC)\n"
            f"Context: Chapter on {chap_title}\n"
            f"Section: {section_num} - {sec_title}\n"
            f"Definition: {sec_desc}"
        )

        # Metadata for the UI later
        meta = {
            "section_id": section_num,
            "title": sec_title,
            "chapter": chap_title,
            "source": "IPC"
        }
        
        docs.append(Document(page_content=page_content, metadata=meta))
        
    return docs

if __name__ == "__main__":
    # Clear old DB to prevent duplicates
    if os.path.exists(DB_DIRECTORY):
        shutil.rmtree(DB_DIRECTORY)
        print("🧹 Cleared old database.")

    print(f"1. Loading Model: {MODEL_NAME}...")
    # encode_kwargs ensures we normalize vectors for better cosine similarity
    embedding_function = HuggingFaceEmbeddings(
        model_name=MODEL_NAME,
        model_kwargs={'device': 'cpu'}, # Change to 'cuda' if you have GPU
        encode_kwargs={'normalize_embeddings': True} 
    )
    
    documents = process_data()
    
    if documents:
        print(f"3. Building Vector DB in '{DB_DIRECTORY}'...")
        db = Chroma.from_documents(
            documents=documents, 
            embedding=embedding_function, 
            persist_directory=DB_DIRECTORY
        )
        print(f"✅ Success! Indexed {len(documents)} laws.")
    else:
        print("❌ No documents to index.")