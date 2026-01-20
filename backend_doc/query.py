from langchain_chroma import Chroma
from embeddings import get_embedding_function
import time
from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import os
load_dotenv()

# api_key = os.environ.get("GOOGLE_API_KEY")
# if not api_key:
#     raise ValueError("GOOGLE_API_KEY not set in .env file")

# llm = ChatGoogleGenerativeAI(model="models/gemini-2.0-flash", temperature=0.2, google_api_key=api_key)

CHROMA_PATH = "chroma"
# start_model = time.time()
# embedding_fn = get_embedding_function()
# end_model = time.time()
# print(f"loaded, time {end_model-start_model}")
# # db = Chroma(
#     persist_directory=CHROMA_PATH,
#     embedding_function=embedding_fn
# )


def search_docs(query, embedding_fn):
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding_fn
    )
    start_model = time.time()
    result = db.similarity_search(query, k=15)
    # print(results)
    # for d in results:
    #     print(f"{d.page_content}")

    retriever = db.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 15,
            "fetch_k": 40,
            "lambda_mult": 0.75
        }
    )
    # result = retriever.invoke(query)
    end_model = time.time()
    print(f"Searching Time, time {end_model-start_model}")
    # print(results)

    # print("")

    # print(result)

    for i, doc in enumerate(result):
        print(f"----Document[{i}]---------")
        print(doc.page_content)
    return result


def ask_llm(query, context, llm):
    print("Hello")
    template = """
    You are an intelligent and helpful assistant specialized in answering user questions using both retrieved context and your own knowledge.

    - Always prioritize information from the context below when it is relevant and clear.
    - If the context is insufficient or unclear, you may use your own knowledge to provide a useful, accurate answer.
    - Do NOT mention the word 'context' or explain that you are using context — just answer naturally.
    - Be concise, but include details when they help understanding.
    - If the question cannot be answered truthfully, just say please try again.
    - Respond in plain text without any formatting symbols or markdown.
    - Provide response in numbered format or bullet format.

    Context:
    {context}

    Question:
    {question}

    Answer:"""

    final_prompt = template.format(context=context, question=query)
    response = llm.invoke(final_prompt)
    return response.content


def main(id, query, llm, embedding_fn):
    response = {'ID': id, 'data': '', 'error': ''}
    try:
        docs = search_docs(query, embedding_fn)
        context = "\n\n".join([doc.page_content for doc in docs])
        result = ask_llm(query, context, llm)
        response["data"] = result
        return response
    except Exception as e:
        response["error"] = str(e)
        return response


if __name__ == '__main__':
    # print("Hello world")
    # query="Explain the Objective of the E-Commerce Sales Chatbot?"
    while (True):
        query = input()
        if query == "abort":
            break
        ans = main(query)
        print(ans)
