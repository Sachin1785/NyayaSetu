import os
import shutil
from langchain_chroma import Chroma
from chromadb.config import Settings
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
import time
# from embeddings import get_embedding_function


CHROMA_PATH = "chroma"
DATA_PATH = "data"
CHROMA_SETTINGS = Settings(allow_reset=True)

# start_model = time.time()
# embedding_fn = get_embedding_function()
# end_model = time.time()
# print(f"loaded, time {end_model-start_model}")


def load_documents():
    documents = []
    for file_name in os.listdir(DATA_PATH):
        file_path = os.path.join(DATA_PATH, file_name)
        name_lower = file_name.lower()
        if name_lower.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif name_lower.endswith(".txt"):
            loader = TextLoader(file_path, encoding='utf-8')
        elif name_lower.endswith(".docx"):
            loader = Docx2txtLoader(file_path)
        else:
            print(f" Unsupported file: {file_name}")
            continue
        docs = loader.load()
        print(f"Loaded {len(docs)} pages from {file_name}")
        documents.extend(docs)
    return documents


def split_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200)
    # print(splitter.split_documents(documents))
    return splitter.split_documents(documents)


def cal_chunk_ids(chunks):
    prev_page_id = None
    inc = 0

    # To handle chunks on the same page
    for chunk in chunks:
        # print(chunk.metadata)
        source = chunk.metadata.get("source", "unknown_source")
        page = chunk.metadata.get("page")
        page_id = f"{source}:{page}"
        print(page_id)
        if page_id == prev_page_id:
            inc += 1
        else:
            inc = 0

        chunk.metadata["id"] = f"{page_id}:{inc}"
        prev_page_id = page_id

    return chunks


def add_to_chroma(chunks, embedding_fn):

    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding_fn,
        client_settings=CHROMA_SETTINGS,
    )

    chunks_with_ids = cal_chunk_ids(chunks)

    # Checking existing Docs
    existing_items = db.get(include=[])
    existing_ids = set(existing_items["ids"])
    print(existing_ids)
    print(f"docs in DB: {len(existing_ids)}")

    new_chunks = []
    for chunk in chunks_with_ids:
        if chunk.metadata["id"] not in existing_ids:
            new_chunks.append(chunk)
    print(f"New_chunks :- {len(new_chunks)}")
    if new_chunks:
        print(f"Adding {len(new_chunks)} new chunks")
        new_chunk_ids = []
        for c in new_chunks:
            new_chunk_ids.append(c.metadata["id"])

        db.add_documents(new_chunks, ids=new_chunk_ids)
        # db.persist()
        print("db updated")
    else:
        print("no new documents")

    return len(new_chunks)


def clear_database(embedding_fn):
    """Logically clear the Chroma database without deleting files on disk.

    Using the underlying Chroma client reset avoids Windows file-lock issues
    that happen when trying to rmtree() the SQLite files while the server
    still has active connections.
    """
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding_fn,
        client_settings=CHROMA_SETTINGS,
    )
    # Reset all collections in this persistent Chroma DB.
    db._client.reset()
    print("cleared existing database.")


def main(id, embedding_fn, reset_db=False):
    response = {'id': id, 'data': '', 'error': ''}
    try:
        if reset_db:
            clear_database(embedding_fn)
        print("Hello from main")
        st = time.time()
        documents = load_documents()
        chunks = split_documents(documents)
        n = add_to_chroma(chunks, embedding_fn)
        end = time.time()
        print(end-st)
        response["data"] = f"{n} chunks ingested successfully"
        return response
    except Exception as e:
        response["error"] = str(e)
        return response


if __name__ == "__main__":
    main()
    # main(reset_db=True, uploader="cli_user")
    # start = time.time()
    # main()
    # end = time.time()
    # print(end-start)
    # docs = load_documents()
    # print(docs)
    # for d in docs[66:68]:
    #     print(d)
    # chunks = split_documents(docs)
    # print(chunks)
    # inv = 0
    # for c in chunks[66:]:
    #     inv+=1
    #     print(c.page_content)
    #     print(" ")
    # print(f"Len :- {inv}")
    # chunks = chunks[-1]
    # chunks_ids = cal_chunk_ids(chunks)
    # uploader = "anonymous"
    # now = datetime.utcnow().isoformat() # Updating Metadata
    # for chunk in chunks_ids:
    #     chunk.metadata.update({
    #         "uploader": uploader,
    #         "ingested_at": now
    #     })
    # print("After")
    # for c in chunks_ids[:1]:
    #     for k in c.metadata:
    #         print(f"{k} : {c.metadata[k]}")
    # docs = db.get(include=["documents"])
    # print(docs)
