import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain.tools import tool
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from deep_translator import GoogleTranslator

# IMPORT YOUR NEW LIBRARY
import indian_kanoon_lib as ik_api

# --- CONFIGURATION ---
DB_DIRECTORY = os.path.join(os.path.dirname(__file__), "RAG Builder", "legal_db")
MODEL_NAME = "BAAI/bge-small-en-v1.5"
CONFIDENCE_THRESHOLD = 0.35

print(f"⏳ Loading components...")
embedding_function = HuggingFaceEmbeddings(
    model_name=MODEL_NAME,
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

if os.path.exists(DB_DIRECTORY):
    db = Chroma(persist_directory=DB_DIRECTORY, embedding_function=embedding_function)
    print(f"✅ Connected to ChromaDB")
else:
    print(f"❌ Database not found. RAG tool will fail.")
    db = None

def translate_query_internal(text: str) -> str:
    try:
        if not text.isascii():
            return GoogleTranslator(source='auto', target='en').translate(text)
        return text
    except:
        return text

# --- TOOLS ---

@tool
def search_legal_database(query: str) -> str:
    """
    Use this to find DEFINITIONS, PUNISHMENTS, or STATUTE TEXT for IPC/BNS.
    Example inputs: "punishment for theft", "Section 302 definition".
    """
    if db is None: return "Error: DB down."
    results = db.similarity_search_with_relevance_scores(translate_query_internal(query), k=3)
    if not results: return "No sections found."
    
    output = []
    for doc, score in results:
        if score > CONFIDENCE_THRESHOLD:
            output.append(f"Title: {doc.metadata.get('title')}\nText: {doc.page_content}")
    return "\n---\n".join(output) if output else "Low relevance results."

@tool
def find_case_law(topic: str, court: str = "supremecourt") -> str:
    """
    Use this to find REAL COURT CASES or PRECEDENTS. 
    Inputs:
    - topic: Legal issue (e.g. "defamation on social media", "bail in murder case")
    - court: "supremecourt", "highcourts", "delhi", or "bombay".
    Returns: A list of relevant cases with Document IDs.
    """
    print(f"🔎 Searching Indian Kanoon for: {topic} in {court}")
    results = ik_api.search_legal_cases(query=topic, court=court)
    
    if not results or 'docs' not in results:
        return "No cases found."
        
    output = []
    for doc in results['docs'][:5]:
        output.append(f"ID: {doc['tid']} | Case: {doc['title']} | Date: {doc['publishdate']}")
    return "\n".join(output)

@tool
def read_full_judgment(doc_id: int) -> str:
    """
    Use this to READ the text of a specific case using its ID.
    Use 'find_case_law' first to get the ID.
    """
    print(f"📖 Reading Document ID: {doc_id}")
    text = ik_api.get_clean_verdict_text(doc_id)
    return text[:15000] # Truncate to avoid token limits

@tool
def check_statute_usage(section: str, act: str) -> str:
    """
    Use this to see how a specific Section is applied in courts.
    Example: section="302", act="Indian Penal Code"
    """
    print(f"⚖️ Checking usage of Section {section} of {act}")
    results = ik_api.search_by_section(section, act)
    if not results or 'docs' not in results:
        return "No citations found."
    
    output = []
    for doc in results['docs'][:3]:
        output.append(f"ID: {doc['tid']} | Cited In: {doc['title']}")
    return "\n".join(output)

# --- AGENT SETUP ---
def main():
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")
    
    llm = ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile", 
        groq_api_key=api_key
    )

    # REGISTER ALL TOOLS HERE
    tools = [search_legal_database, find_case_law, read_full_judgment, check_statute_usage]

    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are **NyayaSetu**, a high-precision Legal AI. You do not just provide snippets; you investigate like a lawyer.\n\n"
         "**CORE OPERATING DIRECTIVES:**\n"
         "1. **Multi-Query Investigation:** For case law queries, don't rely on one search. Execute multiple `find_case_law` calls with variations (e.g., broad topic vs. specific legal test) to find the best precedents.\n"
         "2. **Mandatory Deep Read:** Never explain a case's ruling based only on the 'snippet' from a search. You MUST call `read_full_judgment` for the top 1-2 most relevant cases before finalizing your answer.\n"
         "3. **Statutory Anchoring:** If a search mentions a Section (IPC/BNS), always verify its current text using `search_legal_database` to ensure you aren't citing outdated law.\n"
         "4. **Conflict Resolution:** If a High Court case contradicts a Supreme Court case, prioritize the Supreme Court but mention the High Court's stance as a local variation.\n\n"
         "**RESPONSE STRUCTURE:**\n"
         "- **Statutory Position:** Cite the Section and Act first.\n"
         "- **Judicial Interpretation:** Summarize the core 'Ratio Decidendi' (reason for the decision) from the full judgments you read.\n"
         "- **Procedural Status:** Mention if the offense is Bailable/Cognizable if the tool data allows.\n"
         "- **Conclusion:** Give a final synthesis and the mandatory legal disclaimer."
        ),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    print("\n⚖️ NyayaSetu Agent Online.\n")
    
    while True:
        try:
            user_input = input("\n👤 User: ")
            if user_input.lower() in ["quit", "exit"]: break
            
            response = agent_executor.invoke({"input": user_input})
            print(f"\n🤖 NyayaSetu: {response['output']}")
            
        except Exception as e:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()