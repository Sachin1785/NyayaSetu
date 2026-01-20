import json
import os
import shutil
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

# --- CONFIGURATION ---
DB_DIRECTORY = "./legal_db"
JSON_FILE = "IT_Act.json"

# Use the same model as IPC for consistency
MODEL_NAME = "BAAI/bge-small-en-v1.5"

def process_data():
	if not os.path.exists(JSON_FILE):
		print(f"❌ Error: {JSON_FILE} not found!")
		return []

	with open(JSON_FILE, 'r', encoding='utf-8') as f:
		data = json.load(f)
    
	docs = []
	print(f"   ...Processing {len(data)} IT Act sections...")

	for entry in data:
		section_num = str(entry.get("Section", "")).strip()
		sec_title = str(entry.get("section_title", "")).strip()
		sec_desc = str(entry.get("section_desc", "")).strip()
		chap_title = str(entry.get("chapter_title", "")).strip()
		law_type = str(entry.get("law_type", "IT Act, 2000")).strip()

		page_content = (
			f"Law: {law_type}\n"
			f"Context: Chapter on {chap_title}\n"
			f"Section: {section_num} - {sec_title}\n"
			f"Definition: {sec_desc}"
		)

		meta = {
			"section_id": section_num,
			"title": sec_title,
			"chapter": chap_title,
			"source": "IT Act, 2000"
		}
		docs.append(Document(page_content=page_content, metadata=meta))
	return docs

if __name__ == "__main__":

	print(f"1. Loading Model: {MODEL_NAME}...")
	embedding_function = HuggingFaceEmbeddings(
		model_name=MODEL_NAME,
		model_kwargs={'device': 'cpu'},
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
		print(f"✅ Success! Indexed {len(documents)} IT Act sections.")
	else:
		print("❌ No documents to index.")
