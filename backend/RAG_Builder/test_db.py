import sys
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from deep_translator import GoogleTranslator
import json
# --- CONFIGURATION ---
DB_DIRECTORY = "./legal_db"
MODEL_NAME = "BAAI/bge-small-en-v1.5"
CONFIDENCE_THRESHOLD = 0.35  # Tune this (0.0 to 1.0). 

def translate_query(text):
    try:
        # Only translate if characters are non-ASCII (likely Hindi/Indic)
        if not text.isascii():
            translated = GoogleTranslator(source='auto', target='en').translate(text)
            return translated
        return text
    except Exception as e:
        print(f"⚠️ Translation Error: {e}")
        return text

def main():
    print("⏳ Loading Legal Brain...")
    embedding_function = HuggingFaceEmbeddings(
        model_name=MODEL_NAME,
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    
    db = Chroma(persist_directory=DB_DIRECTORY, embedding_function=embedding_function)
    print("✅ System Ready. Ask about IPC/BNS.\n")
    
    while True:
        user_input = input("⚖️  Ask a legal question: ")
        if user_input.lower() in ['exit', 'quit']: break
        
        # 1. Translate
        english_query = translate_query(user_input)
        if user_input != english_query:
            print(f"   (Interpreting as: '{english_query}')")

        # 2. Search with Scores
        # chroma returns distance (0 is perfect, 1 is opposite)
        # We convert distance to similarity score
        results = db.similarity_search_with_relevance_scores(english_query, k=10)

        if not results:
            print("❌ No relevant laws found.")
            continue

        print(f"\n--- Top Matches ---")
        found_relevant = False
        
        for doc, score in results:
            # Score filtering (BGE scores range approx 0 to 1)
            if score < CONFIDENCE_THRESHOLD:
                continue # Skip low quality matches

            found_relevant = True
            meta = doc.metadata

            print(f"📌 Section {meta.get('section_id')} | Score: {round(score*100, 1)}%")
            print(f"   Title: {meta.get('title')}")
            print(f"   Chapter: {meta.get('chapter')}")
            print(f"   --- FULL METADATA ---\n{json.dumps(meta, ensure_ascii=False, indent=2)}")
            print(f"   --- FULL CONTENT ---\n{doc.page_content}")
            print("-" * 50)

        if not found_relevant:
            print("⚠️ Found some results, but they didn't match closely enough.")
            print("   Try rephrasing your question (e.g., 'punishment for theft').")
        
        print("\n")

if __name__ == "__main__":
    main()