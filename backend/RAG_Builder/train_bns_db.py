import pandas as pd
import json
import os
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# --- CONFIGURATION ---
CSV_FILE = "bns_sections.csv"        # Your source file
JSON_OUTPUT_FILE = "bns_data.json"   # The file BM25 needs
DB_DIRECTORY = "./legal_db"          # The Vector DB
MODEL_NAME = "BAAI/bge-small-en-v1.5"

def process_bns_pipeline():
    if not os.path.exists(CSV_FILE):
        print(f"❌ Error: {CSV_FILE} not found.")
        return [], []

    print(f"   ...Reading {CSV_FILE}...")
    df = pd.read_csv(CSV_FILE)
    
    # 1. Prepare Lists
    vector_docs = []    # For ChromaDB
    json_entries = []   # For BM25 (Hybrid Search)

    print(f"   ...Processing {len(df)} BNS sections...")

    for _, row in df.iterrows():
        # Clean Data
        section_num = str(row.get('Section', '')).strip()
        title = str(row.get('Section _name', '')).strip() # Note the space in column name
        desc = str(row.get('Description', '')).strip()
        # Decode escape sequences (unicode, newlines, etc.)
        try:
            desc = desc.encode('utf-8').decode('unicode_escape')
        except Exception:
            pass
        chapter = str(row.get('Chapter_name', '')).strip()
        
        # Skip empty rows or 'nan'
        if not desc or desc.lower() == "nan":
            continue

        # --- A. PREPARE FOR JSON (BM25) ---
        # We enforce the keys your Hybrid Search expects
        json_entry = {
            "source": "BNS",
            "Section": section_num,
            "section_title": title,
            "section_desc": desc,
            "chapter_title": chapter,
            "law_type": "New (BNS)"
        }
        json_entries.append(json_entry)

        # --- B. PREPARE FOR VECTOR DB (Chroma) ---
        # Context Stuffing for better retrieval
        page_content = (
            f"Law: Bharatiya Nyaya Sanhita (BNS) - New Indian Criminal Law (2024)\n"
            f"Context: Chapter on {chapter}\n"
            f"Section: {section_num} - {title}\n"
            f"Definition: {desc}"
        )

        meta = {
            "source": "BNS",
            "section_id": section_num,
            "title": title,
            "chapter": chapter
        }
        
        vector_docs.append(Document(page_content=page_content, metadata=meta))

    return vector_docs, json_entries

if __name__ == "__main__":
    # 1. Run Processing
    print("1. Processing BNS Data...")
    docs, json_data = process_bns_pipeline()
    
    if docs:
        # 2. Save JSON for Hybrid Search
        print(f"2. Saving '{JSON_OUTPUT_FILE}' for Hybrid Search...")
        with open(JSON_OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
        print(f"   ✅ Saved {len(json_data)} records to JSON.")

        # 3. Ingest into Vector DB
        print(f"3. Ingesting into ChromaDB ({MODEL_NAME})...")
        embedding_function = HuggingFaceEmbeddings(
            model_name=MODEL_NAME,
            model_kwargs={'device': 'cpu'}, 
            encode_kwargs={'normalize_embeddings': True}
        )
        
        db = Chroma.from_documents(
            documents=docs, 
            embedding=embedding_function, 
            persist_directory=DB_DIRECTORY
        )
        print(f"   ✅ Success! Added BNS laws to '{DB_DIRECTORY}'.")
        
    else:
        print("❌ No valid data found.")