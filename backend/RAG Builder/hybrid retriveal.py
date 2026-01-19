import json
import os
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from deep_translator import GoogleTranslator
import numpy as np

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
    Manually combines Vector Search and Keyword Search (hybrid), then applies MMR for diversity.
    """
    # --- A. Get Results from both "Brains" (increase k for more candidates) ---
    vector_k = 15
    keyword_k = 15
    mmr_k = 6  # Final number of results to return

    # 1. Vector Search (Semantic)
    vector_results = vector_db.similarity_search(query, k=vector_k)

    # 2. Keyword Search (Exact Match)
    keyword_results = bm25_retriever.invoke(query)[:keyword_k]

    # --- B. Combine Results using RRF (Reciprocal Rank Fusion) ---
    combined_scores = {}
    def add_to_scores(results, weight=1.0):
        for rank, doc in enumerate(results):
            doc_id = doc.metadata.get('section_id')
            if not doc_id:
                continue
            score = 1 / (rank + 60)
            if doc_id in combined_scores:
                combined_scores[doc_id]['score'] += score * weight
            else:
                combined_scores[doc_id] = {'doc': doc, 'score': score * weight}
    add_to_scores(vector_results, weight=1.0)
    add_to_scores(keyword_results, weight=1.0)

    # --- C. Sort by Final Score (Highest first) ---
    sorted_results = sorted(combined_scores.values(), key=lambda x: x['score'], reverse=True)
    candidate_docs = [item['doc'] for item in sorted_results]

    # --- D. Apply MMR (Maximal Marginal Relevance) to candidates ---
    def cosine_similarity(a, b):
        # Simple cosine similarity for text embeddings
        import numpy as np
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

    def get_embedding(text):
        # Use the same embedding function as vector_db
        return vector_db._embedding_function.embed_query(text)

    # Get embeddings for query and all candidate docs
    query_emb = get_embedding(query)
    doc_embs = [get_embedding(doc.page_content) for doc in candidate_docs]

    # MMR selection
    selected = []
    selected_indices = []
    lambda_mult = 0.5  # Balance between relevance and diversity
    for _ in range(min(mmr_k, len(candidate_docs))):
        if not selected:
            # First: pick the most relevant (highest similarity to query)
            sims = [cosine_similarity(query_emb, emb) for emb in doc_embs]
            idx = int(np.argmax(sims))
            selected.append(candidate_docs[idx])
            selected_indices.append(idx)
        else:
            max_score = -float('inf')
            max_idx = -1
            for i, emb in enumerate(doc_embs):
                if i in selected_indices:
                    continue
                relevance = cosine_similarity(query_emb, emb)
                diversity = min([1 - cosine_similarity(emb, doc_embs[j]) for j in selected_indices])
                mmr_score = lambda_mult * relevance + (1 - lambda_mult) * diversity
                if mmr_score > max_score:
                    max_score = mmr_score
                    max_idx = i
            if max_idx == -1:
                break
            selected.append(candidate_docs[max_idx])
            selected_indices.append(max_idx)
    return selected

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