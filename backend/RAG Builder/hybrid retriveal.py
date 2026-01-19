import json
import os
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from deep_translator import GoogleTranslator

# --- CONFIGURATION ---
DB_DIRECTORY = "./legal_db"
JSON_FILE = "ipc_data.json"
MODEL_NAME = "BAAI/bge-small-en-v1.5"

# --- 1. SETUP: LOAD DATA FOR KEYWORD SEARCH (BM25) ---
def load_bm25_retriever():
    docs = []
    
    # List of all your data files
    files = ["ipc_data.json", "bns_data.json"]
    
    for filename in files:
        if not os.path.exists(filename):
            continue
            
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for entry in data:
            # Handle both IPC and BNS formats
            law_name = "BNS" if "BNS" in entry.get('source', '') else "IPC"
            
            content = (
                f"Law: {law_name}\n"
                f"Section: {entry.get('Section', '')}\n"
                f"Title: {entry.get('section_title', '')}\n"
                f"Definition: {entry.get('section_desc', '')}"
            )
            meta = {
                "section_id": str(entry.get("Section", "")),
                "title": str(entry.get("section_title", ""))
            }
            docs.append(Document(page_content=content, metadata=meta))
    
    if not docs:
        return None
        
    retriever = BM25Retriever.from_documents(docs)
    retriever.k = 4
    return retriever

# --- 2. HELPER: TRANSLATION ---
def translate_query(text):
    try:
        if not text.isascii():
            return GoogleTranslator(source='auto', target='en').translate(text)
        return text
    except:
        return text

# --- 3. THE CUSTOM HYBRID LOGIC (RRF Algorithm) ---
def perform_hybrid_search(query, vector_db, bm25_retriever):
    """
    Manually combines Vector Search and Keyword Search.
    Uses 'Reciprocal Rank Fusion' (RRF) to sort results.
    """
    # A. Get Results from both "Brains"
    # 1. Vector Search (Semantic)
    vector_results = vector_db.similarity_search(query, k=4)
    
    # 2. Keyword Search (Exact Match)
    keyword_results = bm25_retriever.invoke(query)
    
    # B. Combine Results using RRF
    # Logic: We assign a score based on rank. 
    # If a doc is #1 in Vector and #1 in Keyword, it gets a huge score.
    
    combined_scores = {}
    
    # Helper to calculate score: 1 / (rank + k)
    # k is a smoothing constant (usually 60)
    def add_to_scores(results, weight=1.0):
        for rank, doc in enumerate(results):
            doc_id = doc.metadata.get('section_id') # Unique Key
            if not doc_id: continue
            
            # RRF Formula
            score = 1 / (rank + 60)
            
            if doc_id in combined_scores:
                combined_scores[doc_id]['score'] += score * weight
            else:
                combined_scores[doc_id] = {
                    'doc': doc,
                    'score': score * weight
                }

    # Apply scores
    add_to_scores(vector_results, weight=1.0) # Vector Weight
    add_to_scores(keyword_results, weight=1.0) # Keyword Weight
    
    # C. Sort by Final Score (Highest first)
    sorted_results = sorted(
        combined_scores.values(), 
        key=lambda x: x['score'], 
        reverse=True
    )
    
    # Return just the document objects
    return [item['doc'] for item in sorted_results[:4]]

# --- MAIN EXECUTION ---
def main():
    print("🚀 Initializing Custom Hybrid Engine...")
    
    # Setup Vector DB
    embedding_function = HuggingFaceEmbeddings(
        model_name=MODEL_NAME,
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    vector_db = Chroma(persist_directory=DB_DIRECTORY, embedding_function=embedding_function)
    
    # Setup Keyword DB
    bm25 = load_bm25_retriever()
    if not bm25:
        print("❌ Error: Could not load BM25 data.")
        return

    print("✅ Ready. (Running manually without LangChain Ensemble)")

    while True:
        user_query = input("\n⚖️  Query (or 'exit'): ")
        if user_query.lower() in ['exit', 'quit']: break
        
        # Translate
        processed_query = translate_query(user_query)
        if processed_query != user_query:
            print(f"   (Translated: {processed_query})")

        # --- RUN HYBRID SEARCH ---
        results = perform_hybrid_search(processed_query, vector_db, bm25)
        
        print(f"\n--- Top Hybrid Matches ---")
        for i, doc in enumerate(results):
            print(f"[{i+1}] Section {doc.metadata.get('section_id')} - {doc.metadata.get('title')}")
            # Clean up newlines for display
            clean_content = doc.page_content.replace('\n', ' ')
            print(f"    Snippet: {clean_content}")
        print("-" * 40)

if __name__ == "__main__":
    main()